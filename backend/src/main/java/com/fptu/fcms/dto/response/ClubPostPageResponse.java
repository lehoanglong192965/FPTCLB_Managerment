package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ClubPostPageResponse {
    private List<ClubPostResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
