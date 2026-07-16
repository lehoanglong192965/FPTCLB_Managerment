package com.fptu.fcms.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC2-01, TC2-02: Unit tests cho MarkdownSanitizer.
 */
class MarkdownSanitizerTest {

    private final MarkdownSanitizer sanitizer = new MarkdownSanitizer();

    @Test
    @DisplayName("TC2-01: Sanitizer xoá thẻ <script> khỏi nội dung Markdown")
    void tc2_01_removesScriptTags() {
        String dirty = "# Hello World\n\n<script>alert('xss')</script>\n\nSafe content here.";
        String result = sanitizer.sanitize(dirty);

        assertThat(result).doesNotContain("<script>");
        assertThat(result).doesNotContain("alert('xss')");
        assertThat(result).contains("Safe content here.");
    }

    @Test
    @DisplayName("TC2-01 (variant): Sanitizer xoá thẻ <style>, <iframe>, <form>")
    void tc2_01_removesOtherDangerousTags() {
        String dirty = "<style>body{display:none}</style><iframe src='evil'></iframe><form><input type='text'></form>OK";
        String result = sanitizer.sanitize(dirty);

        assertThat(result).doesNotContain("<style>");
        assertThat(result).doesNotContain("<iframe>");
        assertThat(result).doesNotContain("<form>");
        assertThat(result).doesNotContain("<input>");
        assertThat(result).contains("OK");
    }

    @Test
    @DisplayName("TC2-02: Sanitizer chặn javascript: trong href của link")
    void tc2_02_blocksJavascriptProtocol() {
        String dirty = "<a href=\"javascript:alert('xss')\">Click me</a>";
        String result = sanitizer.sanitize(dirty);

        assertThat(result).doesNotContain("javascript:");
        // Link vẫn giữ lại nhưng href bị xoá
        assertThat(result).contains("Click me");
    }

    @Test
    @DisplayName("TC2-02 (variant): Sanitizer giữ nguyên link http/https bình thường")
    void tc2_02_keepsNormalLinks() {
        String safe = "<a href=\"https://fpt.edu.vn\">FPT</a>";
        String result = sanitizer.sanitize(safe);

        assertThat(result).contains("https://fpt.edu.vn");
        assertThat(result).contains("FPT");
    }

    @Test
    @DisplayName("TC2-01/02: Sanitizer xử lý null/blank gracefully")
    void sanitizerHandlesNullAndBlank() {
        assertThat(sanitizer.sanitize(null)).isNull();
        assertThat(sanitizer.sanitize("")).isEmpty();
        assertThat(sanitizer.sanitize("   ")).isEqualTo("   ");
    }
}
