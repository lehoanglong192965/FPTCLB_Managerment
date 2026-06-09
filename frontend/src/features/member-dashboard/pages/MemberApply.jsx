import { useState, useEffect } from "react";
import { FileText, AlertTriangle, CheckCircle, Send, X, RotateCcw } from "lucide-react";
import recruitmentApi from "../../icpdp-dashboard/api/recruitmentApi";
import applicationApi from "../api/applicationApi";
import withdrawLogApi from "../../icpdp-dashboard/api/withdrawLogApi";
import semesterApi from "../../admin-dashboard/api/semesterApi";
import { useAuth } from "../../auth/context/AuthContext";

const INIT_FORM = { clubID: "", cvUrl: "", introduction: "", answersJson: "" };

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      padding: "0.75rem 1.25rem", borderRadius: 10,
      background: isErr ? "#fee2e2" : "#dcfce7",
      color: isErr ? "#991b1b" : "#166534",
      fontWeight: 600, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,.15)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {isErr ? <X size={14} /> : <CheckCircle size={14} />}
      {toast.msg}
    </div>
  );
}

export default function MemberApply() {
  const { profile } = useAuth();
  const [openCycles, setOpenCycles]       = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [form, setForm]                   = useState(INIT_FORM);
  const [submitting, setSubmitting]       = useState(false);
  const [toast, setToast]                 = useState(null);
  const [withdrawCount, setWithdrawCount] = useState(null);
  const [appliedId, setAppliedId]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [cycles, semesters] = await Promise.all([
          recruitmentApi.getAll(),
          semesterApi.getAll(),
        ]);
        const open = Array.isArray(cycles) ? cycles.filter((c) => c.status === "Open") : [];
        setOpenCycles(open);
        if (open.length > 0) setSelectedCycle(open[0]);

        const active = Array.isArray(semesters) ? semesters.find((s) => s.isActive) : null;
        setActiveSemester(active);

        if (profile?.studentId && active?.semesterID) {
          try {
            const cnt = await withdrawLogApi.getCount(profile.studentId, active.semesterID);
            setWithdrawCount(typeof cnt === "number" ? cnt : (cnt?.count ?? 0));
          } catch { /* ignore */ }
        }
      } catch {
        showToast("Không thể tải thông tin tuyển dụng.", "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [profile]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleApply = async () => {
    if (!form.clubID || !form.introduction.trim()) {
      showToast("Vui lòng nhập ID CLB và giới thiệu bản thân.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const semesterID = activeSemester?.semesterID ?? 1;
      const res = await applicationApi.apply({
        clubID:       Number(form.clubID),
        cvUrl:        form.cvUrl,
        introduction: form.introduction,
        answersJson:  form.answersJson || "{}",
      }, semesterID);
      setAppliedId(res?.applicationId ?? res?.id ?? null);
      setForm(INIT_FORM);
      showToast("Nộp đơn thành công!");
    } catch (e) {
      showToast(e?.response?.data?.message ?? "Nộp đơn thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!appliedId) return;
    setSubmitting(true);
    try {
      await applicationApi.withdraw(appliedId);
      setAppliedId(null);
      showToast("Rút đơn thành công.");
    } catch (e) {
      showToast(e?.response?.data?.message ?? "Rút đơn thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "0.625rem 0.875rem", borderRadius: 8,
    border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div>
      <Toast toast={toast} />

      <div className="page-header">
        <h1 className="page-title">Nộp Đơn Ứng Tuyển</h1>
        <p className="page-subtitle">Ứng tuyển vào câu lạc bộ trong đợt tuyển dụng hiện tại</p>
      </div>

      {/* Warning: nhiều lần rút đơn */}
      {withdrawCount !== null && withdrawCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0.75rem 1.25rem", borderRadius: 10, marginBottom: "1rem",
          background: "#fffbeb", border: "1.5px solid #fde68a",
        }}>
          <AlertTriangle size={16} color="#d97706" />
          <span style={{ fontSize: 13, color: "#92400e" }}>
            Bạn đã rút đơn <strong>{withdrawCount}</strong> lần trong học kỳ này.
            {withdrawCount >= 2 && " Chú ý: rút đơn quá nhiều có thể ảnh hưởng đến quyền tuyển dụng."}
          </span>
        </div>
      )}

      {/* Thông báo đã nộp đơn */}
      {appliedId && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0.75rem 1.25rem", borderRadius: 10, marginBottom: "1rem",
          background: "#dcfce7", border: "1.5px solid #86efac",
        }}>
          <CheckCircle size={16} color="#16a34a" />
          <span style={{ fontSize: 13, color: "#166534", flex: 1 }}>
            Đơn ứng tuyển đã được gửi. Mã đơn: <strong>#{appliedId}</strong>
          </span>
          <button
            onClick={handleWithdraw}
            disabled={submitting}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 12px", borderRadius: 6,
              border: "1.5px solid #86efac", background: "#fff",
              color: "#dc2626", fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            <RotateCcw size={12} /> Rút đơn
          </button>
        </div>
      )}

      {loading ? (
        <div className="content-card" style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
          Đang tải...
        </div>
      ) : openCycles.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "3rem" }}>
          <FileText size={48} strokeWidth={1.2} color="#d1d5db" />
          <p style={{ color: "#9ca3af", fontSize: 14, marginTop: "0.75rem" }}>
            Hiện tại không có đợt tuyển dụng nào đang mở.
          </p>
          <p style={{ color: "#d1d5db", fontSize: 12 }}>Vui lòng quay lại sau khi có thông báo tuyển dụng.</p>
        </div>
      ) : (
        <>
          {/* Thông tin đợt tuyển dụng */}
          <div style={{
            background: "#FFF3EE", border: "1.5px solid #FFCBB3", borderRadius: 12,
            padding: "1rem 1.25rem", marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <FileText size={18} color="#E6430A" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#E6430A", margin: 0 }}>
                {selectedCycle?.title ?? "Đợt tuyển dụng đang mở"}
              </p>
              <p style={{ fontSize: 12, color: "#9a3412", margin: "2px 0 0" }}>
                Học kỳ: {activeSemester?.semesterCode ?? "—"}
                {selectedCycle?.startDate && ` · Bắt đầu: ${selectedCycle.startDate}`}
              </p>
            </div>
          </div>

          {/* Form nộp đơn */}
          <div className="content-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 1.25rem" }}>
              Điền thông tin ứng tuyển
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  ID Câu Lạc Bộ <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.clubID}
                  onChange={set("clubID")}
                  placeholder="Nhập ID CLB muốn ứng tuyển"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Link CV / Portfolio
                </label>
                <input
                  type="url"
                  value={form.cvUrl}
                  onChange={set("cvUrl")}
                  placeholder="https://drive.google.com/..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Giới thiệu bản thân <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={form.introduction}
                  onChange={set("introduction")}
                  rows={4}
                  placeholder="Hãy giới thiệu về bản thân, kinh nghiệm và lý do muốn tham gia CLB..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {selectedCycle?.questionsJson && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    Câu hỏi tuyển dụng
                  </label>
                  <pre style={{
                    padding: "0.75rem 1rem", background: "#f9fafb", borderRadius: 8,
                    border: "1.5px solid #e5e7eb", fontSize: 12, color: "#6b7280",
                    whiteSpace: "pre-wrap", fontFamily: "monospace", margin: "0 0 0.5rem",
                  }}>
                    {selectedCycle.questionsJson}
                  </pre>
                  <textarea
                    value={form.answersJson}
                    onChange={set("answersJson")}
                    rows={4}
                    placeholder={'Trả lời các câu hỏi, ví dụ: {"q1": "Câu trả lời 1", "q2": "..."}'}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  onClick={handleApply}
                  disabled={submitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "0.625rem 1.5rem", borderRadius: 8,
                    background: submitting ? "#f87171" : "#E6430A",
                    color: "#fff", border: "none",
                    fontWeight: 600, fontSize: 13,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  <Send size={14} />
                  {submitting ? "Đang nộp..." : "Nộp đơn"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
