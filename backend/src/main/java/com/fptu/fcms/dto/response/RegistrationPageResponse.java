package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class RegistrationPageResponse {
    private List<RegistrationListItemResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
