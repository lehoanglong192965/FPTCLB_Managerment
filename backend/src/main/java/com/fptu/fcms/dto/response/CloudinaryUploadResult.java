package com.fptu.fcms.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CloudinaryUploadResult {
    private final String secureUrl;
    private final String publicId;
    private final String resourceType;
    private final String format;
    private final Integer width;
    private final Integer height;
    private final Long bytes;
}
