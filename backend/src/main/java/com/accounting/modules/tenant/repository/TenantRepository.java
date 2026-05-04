package com.accounting.modules.tenant.repository;

import com.accounting.modules.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySubdomain(String subdomain);

    Optional<Tenant> findByVatNumber(String vatNumber);

    boolean existsBySubdomain(String subdomain);

    boolean existsByVatNumber(String vatNumber);
}
