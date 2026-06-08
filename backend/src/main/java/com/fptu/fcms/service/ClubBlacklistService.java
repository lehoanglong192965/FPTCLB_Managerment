package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.ClubBlacklistRequest;

public interface ClubBlacklistService {

    // Lấy danh sách blacklist
    Object getBlacklist(Long clubID);

    // Thêm user vào blacklist
    Object addToBlacklist(
            Long clubID,
            ClubBlacklistRequest request
    );

    // Cập nhật blacklist
    Object updateBlacklist(
            Long clubID,
            Long blacklistID,
            ClubBlacklistRequest request
    );

    // Xóa mềm blacklist
    void removeBlacklist(
            Long clubID,
            Long blacklistID
    );
}