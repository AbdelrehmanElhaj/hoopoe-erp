package com.accounting.modules.accounts.repository;

import com.accounting.modules.accounts.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByCode(String code);

    boolean existsByCode(String code);

    List<Account> findByActiveTrue();

    List<Account> findByLeafTrueAndActiveTrue();

    @Query("SELECT a FROM Account a WHERE a.parent IS NULL ORDER BY a.code")
    List<Account> findRootAccounts();

    @Query("SELECT a FROM Account a WHERE a.parent.id = :parentId ORDER BY a.code")
    List<Account> findChildren(UUID parentId);

    @Query("SELECT a FROM Account a WHERE a.accountType = :type AND a.leaf = true AND a.active = true ORDER BY a.code")
    List<Account> findLeafsByType(Account.AccountType type);
}
