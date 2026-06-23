import { useState } from "react";
import { X, Send } from "lucide-react";

const inputStyle = {
  width: "100%", padding: "0.625rem 0.875rem", borderRadius: 8,
  border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};

/**
 * Popup form đăng ký ứng tuyển vào một CLB cụ thể.
 * Không gọi API thật — tạo đơn qua ApplicationsContext (mock).
 */
export default function ApplyClubModal({ club, clubId, onClose, onSubmitted }) {
  const [introduction, setIntroduction] = useState("");
  const [cvUrl, setCvUrl]               = useState("");
  const [error, setError]               = useState("");
  const [submitting, setSubmitting]     = useState(false);

  const handleSubmit = () => {
    if (!introduction.trim()) {
      setError("Vui lòng giới thiệu bản thân.");
      return;
    }
    setSubmitting(true);
    onSubmitted({
      clubId: clubId ?? club.abbr ?? club.id,
      clubName: club.name,
      clubEmoji: club.emoji,
      clubColor: club.color,
      introduction,
      cvUrl,
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
              Link CV / Portfolio
            </label>
            <input
              type="url"
              value={cvUrl}
              onChange={(e) => setCvUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={inputStyle}
            />
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
              <Send size={14} /> Nộp đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
