package com.accounting.modules.zatca.service;

import com.accounting.modules.tenant.entity.Tenant;
import com.accounting.modules.tenant.repository.TenantRepository;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequestBuilder;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.UUID;

/**
 * ZATCA Phase 2 Certificate Service
 *
 * Handles:
 * 1. ECDSA key pair generation (secp256k1 curve - ZATCA requirement)
 * 2. CSR generation with ZATCA-specific OIDs
 * 3. Certificate storage (private key AES-256-GCM encrypted at rest)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ZatcaCertificateService {

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private final TenantRepository tenantRepository;

    /**
     * Generate ECDSA key pair and CSR for ZATCA onboarding.
     * Returns Base64-encoded CSR to submit to ZATCA portal.
     */
    public String generateCsr(String subdomain, String otp) throws Exception {
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new BusinessException("Tenant not found"));

        // Generate ECDSA key pair on secp256k1 (ZATCA requirement)
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC", "BC");
        keyGen.initialize(new ECGenParameterSpec("secp256k1"), new SecureRandom());
        KeyPair keyPair = keyGen.generateKeyPair();

        // Build CSR with ZATCA-required fields
        X500Name subject = new X500NameBuilder(BCStyle.INSTANCE)
                .addRDN(BCStyle.CN, tenant.getCompanyNameAr())
                .addRDN(BCStyle.OU, "1.3.6.1.4.1.311.20.2=" + otp)  // ZATCA OTP OID
                .addRDN(BCStyle.O, tenant.getCompanyNameAr())
                .addRDN(BCStyle.C, "SA")
                .addRDN(BCStyle.SERIALNUMBER, "1-Test|2-Test|3-" + tenant.getVatNumber())
                .build();

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withECDSA")
                .setProvider("BC")
                .build(keyPair.getPrivate());

        PKCS10CertificationRequest csr = new JcaPKCS10CertificationRequestBuilder(
                subject, keyPair.getPublic())
                .build(signer);

        // Encrypt and store private key
        String encryptedPrivateKey = encryptPrivateKey(keyPair.getPrivate());
        tenant.setZatcaPrivateKeyEnc(encryptedPrivateKey);
        tenantRepository.save(tenant);

        // Return PEM-encoded CSR
        StringWriter writer = new StringWriter();
        try (JcaPEMWriter pemWriter = new JcaPEMWriter(writer)) {
            pemWriter.writeObject(csr);
        }
        return writer.toString();
    }

    /**
     * Store the certificate received from ZATCA after onboarding.
     */
    public void storeCertificate(String subdomain, String certificatePem, String serialNumber) {
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new BusinessException("Tenant not found"));

        tenant.setZatcaCertPem(certificatePem);
        tenant.setZatcaCertSerial(serialNumber);
        tenant.setZatcaOnboardedAt(java.time.Instant.now());
        tenantRepository.save(tenant);
        log.info("ZATCA certificate stored for tenant: {}", subdomain);
    }

    /**
     * Get public key from stored certificate as Base64.
     */
    public String getPublicKeyBase64(UUID tenantId) throws Exception {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException("Tenant not found"));

        if (tenant.getZatcaCertPem() == null) {
            throw new BusinessException("Tenant has no ZATCA certificate. Run onboarding first.");
        }

        byte[] certBytes = org.bouncycastle.util.encoders.Base64.decode(
                tenant.getZatcaCertPem()
                        .replace("-----BEGIN CERTIFICATE-----", "")
                        .replace("-----END CERTIFICATE-----", "")
                        .replaceAll("\\s", "")
        );

        X509CertificateHolder certHolder = new X509CertificateHolder(certBytes);
        SubjectPublicKeyInfo publicKeyInfo = certHolder.getSubjectPublicKeyInfo();
        return Base64.getEncoder().encodeToString(publicKeyInfo.getEncoded());
    }

    /**
     * Encrypt private key with AES-256-GCM for storage.
     * In production: use KMS (AWS/Azure/ZATCA HSM).
     */
    private String encryptPrivateKey(PrivateKey privateKey) throws Exception {
        String rawKey = System.getenv("PRIVATE_KEY_ENCRYPTION_KEY");
        if (rawKey == null || rawKey.length() < 32) {
            throw new SecurityException("PRIVATE_KEY_ENCRYPTION_KEY env var must be at least 32 chars");
        }

        SecretKey secretKey = new SecretKeySpec(
                rawKey.substring(0, 32).getBytes(StandardCharsets.UTF_8), "AES");

        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));

        byte[] encrypted = cipher.doFinal(privateKey.getEncoded());

        // Prepend IV to ciphertext
        byte[] result = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, result, 0, iv.length);
        System.arraycopy(encrypted, 0, result, iv.length, encrypted.length);

        return Base64.getEncoder().encodeToString(result);
    }
}
