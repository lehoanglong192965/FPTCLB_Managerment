package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.MembershipUpdateRequest;
import com.fptu.fcms.dto.response.ClubLeadershipResponse;
import com.fptu.fcms.dto.response.LeadershipChangeResponse;

public interface ClubMembershipService {

    /**
     * Thay đổi Ban điều hành CLB (Bổ nhiệm / Bãi nhiệm) — atomic @Transactional.
     *
     * @param request  Thông tin hành động (APPOINT / DISMISS)
     * @param actorID  userID của người thực hiện (phải là ICPDP)
     */
    LeadershipChangeResponse changeLeadership(MembershipUpdateRequest request, Integer actorID);

    /**
     * Lấy danh sách Ban điều hành hiện tại của CLB trong học kỳ đang active.
     */
    ClubLeadershipResponse getCurrentLeadership(Integer clubID);
}
