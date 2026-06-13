package com.fptu.fcms.service;

import com.fptu.fcms.entity.RecruitmentCycle;

public interface NotificationService {
    /**
     * Notify admins (email / push / websocket) that a recruitment cycle needs to be closed or extended.
     * Implementations should also persist an audit record if needed.
     */
    void notifyAdminCloseOrExtend(RecruitmentCycle cycle);
}
