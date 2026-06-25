package com.fptu.fcms.service;

import java.math.BigDecimal;

public interface ContributionService {
    void calculateEventContributions(Integer eventId, BigDecimal multiplier);
}
