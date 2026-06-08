package com.fptu.fcms.dto.request;

import lombok.Data;

@Data
public class ClubBlacklistRequest {

    // ID sinh viên bị blacklist
    private Long userID;

    // Lý do blacklist
    private String reason;
}