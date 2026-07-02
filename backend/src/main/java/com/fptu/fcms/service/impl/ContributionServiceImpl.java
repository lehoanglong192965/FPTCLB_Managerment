package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.ContributionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ContributionServiceImpl implements ContributionService {

    @Override
    public void calculateEventContributions(Integer eventId, BigDecimal multiplier) {
        throw new UnsupportedOperationException("Legacy contribution calculation is disabled. Use ContributionBatchService workflow: approve report, score, open appeal, resolve appeals, finalize.");
    }
}
