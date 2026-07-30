package com.fptu.fcms.scheduler;

import com.fptu.fcms.service.impl.SePayReconciliationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SePayReconciliationScheduler {

    private final SePayReconciliationService sePayReconciliationService;

    @Scheduled(cron = "${fcms.payment.sepay.reconcile-cron:0 */2 * * * ?}")
    public void reconcileBankTransactions() {
        if (!sePayReconciliationService.isEnabled()) {
            return;
        }
        try {
            int dispatched = sePayReconciliationService.reconcileRecentTransactions();
            if (dispatched > 0) {
                log.debug("SePay reconciliation swept {} incoming transactions", dispatched);
            }
        } catch (RuntimeException exception) {
            log.warn("SePay reconciliation sweep failed", exception);
        }
    }
}
