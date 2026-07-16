package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ImageUploadResponse {
    private final boolean success;
    private final String message;
    private final String url;
    private final String publicId;
    private final ImageUploadData data;

    public static ImageUploadResponse from(CloudinaryUploadResult result) {
        ImageUploadData data = new ImageUploadData(
                result.getSecureUrl(),
                result.getPublicId(),
                result.getResourceType(),
                result.getFormat(),
                result.getWidth(),
                result.getHeight(),
                result.getBytes()
        );
        return new ImageUploadResponse(
                true,
                "Upload image successfully",
                result.getSecureUrl(),
                result.getPublicId(),
                data
        );
    }

    @Getter
    @AllArgsConstructor
    public static class ImageUploadData {
        private final String secureUrl;
        private final String publicId;
        private final String resourceType;
        private final String format;
        private final Integer width;
        private final Integer height;
        private final Long bytes;

        public String getUrl() {
            return secureUrl;
        }
    }
}
