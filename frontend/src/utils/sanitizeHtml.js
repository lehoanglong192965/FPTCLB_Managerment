import DOMPurify from "dompurify";

// Dùng chung cho mọi nơi hiển thị mô tả sự kiện (được soạn bằng RichTextEditor) —
// bắt buộc phải sanitize trước khi render bằng dangerouslySetInnerHTML để tránh XSS lưu trữ.
const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li"];
const ALLOWED_ATTR = ["style", "href", "target", "rel", "class"];

export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

// Dùng để đếm từ / kiểm tra độ dài nội dung thực tế (bỏ qua thẻ HTML), tránh
// đếm nhầm do markup của RichTextEditor.
export function stripHtml(html) {
  if (!html) return "";
  return sanitizeHtml(html)
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}
