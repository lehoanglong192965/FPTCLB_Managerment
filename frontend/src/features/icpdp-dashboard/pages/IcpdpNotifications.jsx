import { useState } from "react";
import { Send } from "lucide-react";
import "../../../assets/css/icpdpNotifications.css";

const AUDIENCE_OPTIONS = [
  { value: "all_members",   label: "Toàn bộ sinh viên tham gia CLB" },
  { value: "all_leaders",   label: "Toàn bộ Trưởng CLB" },
  { value: "all_clubs",     label: "Toàn bộ Ban điều hành CLB" },
  { value: "all_students",  label: "Toàn bộ sinh viên hệ thống" },
];

const TYPE_OPTIONS = [
  { value: "general",    label: "Thông báo chung" },
  { value: "urgent",     label: "Thông báo khẩn" },
  { value: "deadline",   label: "Nhắc hạn nộp" },
  { value: "event",      label: "Thông báo sự kiện" },
];

const INITIAL = { audience: "all_members", type: "general", title: "", content: "" };

export default function IcpdpNotifications() {
  const [form, setForm]     = useState(INITIAL);
  const [sending, setSending] = useState(false);
  const [toast, setToast]   = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ type: "error", msg: "Vui lòng nhập tiêu đề và nội dung thông báo." });
      return;
    }
    setSending(true);
    setToast(null);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setToast({ type: "success", msg: "Thông báo đã được phát sóng thành công!" });
      setForm(INITIAL);
    } catch {
      setToast({ type: "error", msg: "Có lỗi xảy ra, vui lòng thử lại." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
      <div className="page-header" style={{ textAlign: "center", width: "100%" }}>
        <h1 className="page-title">Thông Báo Toàn Hệ Thống</h1>
      </div>

      <div className="notif-compose-card">
        <p className="notif-compose-title">Soạn thông báo IC-PDP</p>

        <div className="notif-row">
          <div className="notif-field" style={{ marginBottom: 0 }}>
            <label className="notif-label">Nhóm đối tượng</label>
            <select className="notif-select" value={form.audience} onChange={set("audience")}>
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="notif-field" style={{ marginBottom: 0 }}>
            <label className="notif-label">Loại thông báo</label>
            <select className="notif-select" value={form.type} onChange={set("type")}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="notif-field" style={{ marginTop: 18 }}>
          <label className="notif-label">Tiêu đề</label>
          <input
            className="notif-input"
            type="text"
            placeholder="VD: Hướng dẫn quy trình nộp kế hoạch học kỳ"
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="notif-field">
          <label className="notif-label">Nội dung</label>
          <textarea
            className="notif-textarea"
            placeholder="Nội dung thông báo..."
            value={form.content}
            onChange={set("content")}
          />
        </div>

        {toast && (
          <div className={`notif-toast notif-toast-${toast.type}`}>{toast.msg}</div>
        )}

        <div className="notif-actions">
          <button className="notif-broadcast-btn" onClick={handleBroadcast} disabled={sending}>
            <Send size={16} />
            {sending ? "Đang gửi..." : "Phát sóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
