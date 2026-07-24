package com.fptu.fcms.repository;

import com.fptu.fcms.entity.BankPaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankPaymentTransactionRepository extends JpaRepository<BankPaymentTransaction, Long> {
    Optional<BankPaymentTransaction> findByProviderAndProviderTransactionId(String provider, String providerTransactionId);
}
