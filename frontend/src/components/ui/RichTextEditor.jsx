import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ color: [] }],
    [{ font: [] }],
    ["clean"],
  ],
};

const FORMATS = ["bold", "italic", "underline", "color", "font"];

/* Ô soạn thảo mô tả có định dạng (in đậm/nghiêng/gạch chân, màu chữ, phông chữ).
   Value/onChange trả về chuỗi HTML — nơi hiển thị lại phải sanitize bằng sanitizeHtml()
   trước khi dangerouslySetInnerHTML để tránh XSS lưu trữ. */
export default function RichTextEditor({ value, onChange, placeholder, error }) {
  return (
    <div className={`rte-wrap${error ? " rte-error" : ""}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={MODULES}
        formats={FORMATS}
        placeholder={placeholder}
      />
      <style>{`
        .rte-wrap .ql-toolbar.ql-snow {
          border-color: #e5e7eb;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          background: #fafafa;
        }
        .rte-wrap .ql-container.ql-snow {
          border-color: #e5e7eb;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          font-size: 13.5px;
          font-family: inherit;
        }
        .rte-wrap .ql-editor {
          min-height: 130px;
          line-height: 1.7;
        }
        .rte-wrap.rte-error .ql-toolbar.ql-snow,
        .rte-wrap.rte-error .ql-container.ql-snow {
          border-color: #f87171;
        }
      `}</style>
    </div>
  );
}
