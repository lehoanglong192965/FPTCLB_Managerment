package com.fptu.fcms.enums;

import com.fptu.fcms.config.CloudinaryFolders;

import java.util.Arrays;

public enum ImageUploadPurpose {
    CLUB_LOGO("club-logo", CloudinaryFolders.CLUB_LOGOS),
    CLUB_REGISTRATION("club-registration", CloudinaryFolders.CLUB_REGISTRATION_IMAGES),
    MEMBER_CARD("member-card", CloudinaryFolders.MEMBER_CARD_EVIDENCE),
    EVENT_BANNER("event-banner", CloudinaryFolders.EVENT_BANNERS);

    private final String apiValue;
    private final String folder;

    ImageUploadPurpose(String apiValue, String folder) {
        this.apiValue = apiValue;
        this.folder = folder;
    }

    public String getApiValue() {
        return apiValue;
    }

    public String getFolder() {
        return folder;
    }

    public static ImageUploadPurpose fromApiValue(String value) {
        if (value == null || value.isBlank()) {
            return CLUB_REGISTRATION;
        }
        return Arrays.stream(values())
                .filter(purpose -> purpose.apiValue.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid image upload purpose."));
    }
}
