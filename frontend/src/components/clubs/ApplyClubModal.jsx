import { useState, useRef } from "react";
import { X, Send, FileText, Upload, Trash2 } from "lucide-react";
import applicationApi from "../../services/api/member/applicationApi";

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;

const inputStyle = {
  width: "100%", padding: "0.625rem 0.875rem", borderRadius: 8,
  border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};

/**
 * Popup form đăng ký ứng tuyển vào một CLB cụ thể.
 * Gọi API thật qua callback onSubmitted do trang cha (vd: ClubDetailPage) cung cấp.
 */
export default function ApplyClubModal({ club, clubId, onClose, onSubmitted }) {
  const [introduction, setIntroduction] = useState("");
  const [cvFile, setCvFile]             = useState(null);
  const [error, setError]               = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const fileInputRef                    = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    // Cho phép chọn lại cùng một file sau khi đã gỡ
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Chỉ chấp nhận file PDF.");
      return;
    }
    if (file.size > MAX_CV_SIZE_BYTES) {
      setError("File CV không được vượt quá 10MB.");
      return;
    }
    setError("");
    setCvFile(file);
  };

  const handleSubmit = async () => {
    if (!introduction.trim()) {
      setError("Vui lòng giới thiệu bản thân.");
      return;
    }
    setSubmitting(true);
    let uploadedCvUrl = "";
    if (cvFile) {
      try {
        const res = await applicationApi.uploadCv(cvFile);
        const data = res?.data ?? res;
        uploadedCvUrl = data?.url ?? "";
      } catch (err) {
        setError(err?.response?.data?.message || "Không thể tải CV lên. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }
    }
    onSubmitted({
      clubId: clubId ?? club.abbr ?? club.id,
      clubName: club.name,
      clubEmoji: club.emoji,
      clubColor: club.color,
      introduction,
      cvUrl: uploadedCvUrl,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-[16px] font-bold text-[#0D1B3E] m-0 mb-0.5">Nộp đơn ứng tuyển</h3>
            <p className="text-[13px] text-gray-500 m-0 flex items-center gap-1.5">
              <span>{club.emoji}</span> {club.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-none border-none cursor-pointer text-gray-400 hover:text-gray-600 p-1"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              Giới thiệu bản thân <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={introduction}
              onChange={(e) => { setIntroduction(e.target.value); setError(""); }}
              rows={4}
              placeholder="Hãy giới thiệu về bản thân, kinh nghiệm và lý do muốn tham gia CLB..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              CV / Portfolio (PDF)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {cvFile ? (
              <div className="flex items-center gap-2.5 rounded-lg border-[1.5px] border-gray-200 bg-gray-50 px-3 py-2.5">
                <FileText size={18} className="text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 m-0 truncate">{cvFile.name}</p>
                  <p className="text-[11.5px] text-gray-400 m-0">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => setCvFile(null)}
                  disabled={submitting}
                  className="bg-none border-none cursor-pointer text-gray-400 hover:text-red-500 p-1"
                  title="Gỡ file"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-gray-300 bg-gray-50 px-3 py-5 cursor-pointer hover:border-[#E6430A] hover:bg-orange-50 transition-colors font-[inherit]"
              >
                <Upload size={18} className="text-gray-400" />
                <span className="text-[13px] font-medium text-gray-600">Nhấn để chọn file PDF</span>
                <span className="text-[11.5px] text-gray-400">Tối đa 10MB</span>
              </button>
            )}
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 12.5, margin: 0 }}>{error}</p>}

          <div className="flex justify-end gap-2.5 mt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border-[1.5px] border-gray-200 bg-white text-gray-600 text-[13px] font-semibold cursor-pointer hover:bg-gray-50 font-[inherit]"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]"
              style={{ background: submitting ? "#f87171" : "#E6430A", opacity: submitting ? 0.75 : 1 }}
            >
              <Send size={14} /> {submitting ? "Đang nộp..." : "Nộp đơn"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
