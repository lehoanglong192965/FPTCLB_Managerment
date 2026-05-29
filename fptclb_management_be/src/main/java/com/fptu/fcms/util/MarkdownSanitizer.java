package com.fptu.fcms.util;

public class MarkdownSanitizer {
    
    /**
     * Sanitizes Markdown content by removing potentially dangerous HTML tags (like <script>, <iframe>, etc.)
     * to satisfy security guardrails (BR-AI05).
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // Remove dangerous tags and attribute-based injections
        return input.replaceAll("(?i)<script.*?>.*?</script>", "")
                    .replaceAll("(?i)<iframe.*?>.*?</iframe>", "")
                    .replaceAll("(?i)javascript:", "");
    }
}
