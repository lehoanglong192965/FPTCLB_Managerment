package com.fptu.fcms.util;

public class EmailMaskingUtil {
    
    private EmailMaskingUtil() {
        // Hide constructor for utility class
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + domain;
        }
        
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}
