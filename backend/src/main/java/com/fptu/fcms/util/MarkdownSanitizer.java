package com.fptu.fcms.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

/**
 * Khử độc nội dung Markdown/HTML: xoá <script>, chặn javascript: trong link.
 * Dùng jsoup — KHÔNG tự viết regex sanitizer.
 * Đầu vào: Chuỗi văn bản Markdown (hoặc HTML) nguyên thủy.
 * Đầu ra: Trả về chuỗi an toàn đã được xử lý (XSS protection), có thể lưu trữ và hiển thị an toàn trên Frontend.
 */
@Component
public class MarkdownSanitizer {

    /**
     * Safelist cho phép các thẻ Markdown phổ biến nhưng chặn script và javascript:.
     */
    private static final Safelist SAFELIST = Safelist.relaxed()
            .removeTags("script", "style", "iframe", "object", "embed", "form", "input")
            .removeProtocols("a", "href", "javascript")
            .removeProtocols("img", "src", "javascript");

    /**
     * Sanitize nội dung Markdown/HTML. Xoá script, chặn javascript: trong link.
     *
     * @param content nội dung Markdown gốc (có thể chứa HTML nhúng)
     * @return nội dung đã được sanitize
     */
    public String sanitize(String content) {
        if (content == null || content.isBlank()) {
            return content;
        }
        return Jsoup.clean(content, SAFELIST);
    }
}
