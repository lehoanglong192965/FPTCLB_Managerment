package com.fptu.fcms.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;

public class SecurityUtils {

    /**
     * Gets the currently authenticated OAuth2 user.
     */
    public static OAuth2User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            return (OAuth2User) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * Gets the email address of the currently authenticated user.
     */
    public static String getCurrentUserEmail() {
        OAuth2User user = getCurrentUser();
        return user != null ? user.getAttribute("email") : null;
    }
}
