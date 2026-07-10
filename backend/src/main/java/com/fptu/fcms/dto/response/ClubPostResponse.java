package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ClubPostResponse {
    private Integer postID;
    private Integer clubID;
    private Integer authorUserID;
    private String authorName;
    private String authorRoleName;
    private String content;
    private LocalDateTime createdAt;
}
