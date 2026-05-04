package com.accounting.modules.zatca.service;

import com.accounting.modules.tenant.entity.Tenant;
import com.accounting.modules.tenant.repository.TenantRepository;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

/**
 * ZATCA Phase 2 Digital Signature Service
 *
 * Signs invoice hash using ECDSA SHA-256 with the tenant's private key.
 * ZATCA requires: SHA256withECDSA on secp256k1 curve.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ZatcaSignatureService {

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private final TenantRepository tenantRepository;

    /**
     * Sign the invoice XML hash with the tenant's ECDSA private key.
     * @param tenantId - the tenant
     * @param dataToSign - the invoice XML bytes (canonicalized)
     * @return Base64-encoded ECDSA signature
     */
    public String sign(String subdomain, byte[] dataToSign) throws Exception {
        PrivateKey privateKey = loadPrivateKey(subdomain);

        Signature signature = Signature.getInstance("SHA256withECDSA", "BC");
        signature.initSign(privateKey, new SecureRandom());
        signature.update(dataToSign);

        byte[] signatureBytes = signature.sign();
        return Base64.getEncoder().encodeToString(signatureBytes);
    }

    /**
     * Compute SHA-256 hash of the canonical XML content.
     * @return Base64-encoded SHA-256 hash
     */
    public String computeHash(String xmlContent) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(xmlContent.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hashBytes);
    }

    private PrivateKey loadPrivateKey(String subdomain) throws Exception {
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new BusinessException("Tenant not found"));

        if (tenant.getZatcaPrivateKeyEnc() == null) {
            throw new BusinessException("Tenant has no ZATCA private key. Run CSR generation first.");
        }

        byte[] decrypted = decryptPrivateKey(tenant.getZatcaPrivateKeyEnc());
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decrypted);
        KeyFactory keyFactory = KeyFactory.getInstance("EC", "BC");
        return keyFactory.generatePrivate(keySpec);
    }

    private byte[] decryptPrivateKey(String encryptedBase64) throws Exception {
        String rawKey = System.getenv("PRIVATE_KEY_ENCRYPTION_KEY");
        if (rawKey == null || rawKey.length() < 32) {
            throw new SecurityException("PRIVATE_KEY_ENCRYPTION_KEY env var is not set");
        }

        byte[] encryptedData = Base64.getDecoder().decode(encryptedBase64);
        SecretKeySpec secretKey = new SecretKeySpec(
                rawKey.substring(0, 32).getBytes(StandardCharsets.UTF_8), "AES");

        // Extract IV (first 12 bytes) and ciphertext
        byte[] iv = new byte[12];
        byte[] ciphertext = new byte[encryptedData.length - 12];
        System.arraycopy(encryptedData, 0, iv, 0, 12);
        System.arraycopy(encryptedData, 12, ciphertext, 0, ciphertext.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));
        return cipher.doFinal(ciphertext);
    }
}
