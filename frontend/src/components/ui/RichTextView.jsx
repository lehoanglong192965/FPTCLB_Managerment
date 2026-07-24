import { sanitizeHtml } from "../../utils/sanitizeHtml";

/* Hiển thị mô tả đã soạn bằng RichTextEditor — luôn sanitize trước khi render
   để chặn XSS lưu trữ (không tự ý dùng dangerouslySetInnerHTML với HTML gốc). */
export default function RichTextView({ html, className, style, emptyText = "Chưa có mô tả." }) {
  const clean = sanitizeHtml(html);
  if (!clean || !clean.trim()) {
    return <p className={className} style={{ color: "#9ca3af", fontStyle: "italic", ...style }}>{emptyText}</p>;
  }
  return (
    <>
      <div
        className={className}
        style={{ lineHeight: 1.8, wordBreak: "break-word", overflowWrap: "anywhere", ...style }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {/* Quill chỉ định nghĩa font theo class (ql-font-serif/monospace) trong phạm vi .ql-editor
          — cần khai báo lại ở đây để phông chữ hiển thị đúng ngoài trình soạn thảo. */}
      <style>{`
        .ql-font-serif { font-family: Georgia, "Times New Roman", serif; }
        .ql-font-monospace { font-family: Monaco, "Courier New", monospace; }
      `}</style>
    </>
  );
}
