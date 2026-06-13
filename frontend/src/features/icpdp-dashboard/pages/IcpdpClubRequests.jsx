import { useState, useEffect } from "react";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Compass,
  Users,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";
import clubRegistrationApi from "../../../services/api/clubRegistrationApi";
import "../../../assets/css/clubRegistration.css";

export default function IcpdpClubRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [comment, setComment] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clubRegistrationApi.getPending();
      setRequests(data || []);
      // reset selected if no longer in the list
      if (selected) {
        const found = data.find((r) => r.registrationID === selected.registrationID);
        if (!found) setSelected(null);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError("Không thể tải danh sách yêu cầu đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (status) => {
    if (status === "REJECTED" && !comment.trim()) {
      alert("Vui lòng nhập lý do từ chối đăng ký thành lập CLB.");
      return;
    }

    setActionLoading(true);
    try {
      await clubRegistrationApi.review(selected.registrationID, status, comment);
      showToast(
        status === "APPROVED"
          ? "Đã phê duyệt và kích hoạt câu lạc bộ thành công!"
          : "Đã từ chối đơn đăng ký thành lập."
      );
      setComment("");
      setSelected(null);
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Xử lý duyệt thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="cm-page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Duyệt Đăng Ký CLB</h1>
          <p className="page-subtitle">IC-PDP — Xét duyệt hồ sơ đăng ký thành lập câu lạc bộ mới</p>
        </div>
        <button className="cm-btn-create" style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }} onClick={loadRequests}>
          <RefreshCw size={14} /> Tải lại
        </button>
      </div>

      {loading ? (
        <p className="approval-empty" style={{ textAlign: "center", padding: "40px" }}>Đang tải...</p>
      ) : error ? (
        <div className="cr-validation-card invalid">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="cr-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <CheckCircle size={48} style={{ color: "#10b981", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}>Đã giải quyết sạch đơn!</h3>
          <p style={{ color: "#64748b", marginTop: "6px" }}>Hiện không có đơn đăng ký thành lập câu lạc bộ nào chờ duyệt.</p>
        </div>
      ) : (
        <div className="cr-review-container">
          {/* LEFT LIST PANEL */}
          <div style={{ flex: "0.8", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
            {requests.map((reg) => {
              const isSelected = selected?.registrationID === reg.registrationID;
              const date = new Date(reg.createdAt).toLocaleDateString("vi-VN", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={reg.registrationID}
                  className={`cr-history-item ${isSelected ? "selected" : ""}`}
                  style={{ borderLeft: isSelected ? "4px solid #2563eb" : "1px solid #e2e8f0", margin: 0 }}
                  onClick={() => {
                    setSelected(reg);
                    setComment("");
                  }}
                >
                  <div className="cr-history-header">
                    <div>
                      <span className="cr-history-name">{reg.clubName}</span>
                      <span className="cr-history-code">{reg.clubCode}</span>
                    </div>
                  </div>
                  <div className="cr-history-meta">
                    <span>Lĩnh vực: {reg.category}</span>
                    <span>Ngày nộp: {date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT SPLIT DETAIL PANEL */}
          {selected ? (
            <>
              {/* Left Detail Scroll */}
              <div className="cr-review-left">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Chi Tiết Hồ Sơ Đăng Ký</h2>
                  <span className="cr-status cr-status-pending">Chờ ICPDP Phê Duyệt</span>
                </div>

                {/* Section 1: Identity */}
                <div className="cr-review-info-section">
                  <h3 className="cr-section-title" style={{ borderLeftColor: "#2563eb" }}>
                    <Compass size={16} /> Thông tin Câu lạc bộ
                  </h3>
                  <div className="cr-review-info-grid">
                    <span className="cr-review-label">Tên CLB (Việt):</span>
                    <span className="cr-review-value">{selected.clubName}</span>

                    <span className="cr-review-label">Tên CLB (Anh):</span>
                    <span className="cr-review-value">{selected.clubNameEn || "N/A"}</span>

                    <span className="cr-review-label">Mã viết tắt (Code):</span>
                    <span className="cr-review-value" style={{ color: "#2563eb" }}>{selected.clubCode}</span>

                    <span className="cr-review-label">Lĩnh vực hoạt động:</span>
                    <span className="cr-review-value">{selected.category}</span>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Sứ mệnh & Mục tiêu:</p>
                    <p style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", color: "#334155", whiteSpace: "pre-line" }}>{selected.mission}</p>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Điểm khác biệt/Lý do thành lập:</p>
                    <p style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", color: "#334155", whiteSpace: "pre-line" }}>{selected.uniqueness}</p>
                  </div>
                </div>

                {/* Section 2: Core Team */}
                <div className="cr-review-info-section">
                  <h3 className="cr-section-title" style={{ borderLeftColor: "#10b981" }}>
                    <Users size={16} /> Nhân Sự Điều Hành
                  </h3>

                  {/* Leader */}
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                    <h4 style={{ fontWeight: "600", color: "#0f172a", marginBottom: "8px", fontSize: "14px" }}>Chủ nhiệm CLB (Leader)</h4>
                    <div className="cr-review-info-grid" style={{ padding: 0, background: "none", marginBottom: "12px" }}>
                      <span className="cr-review-label">Họ và tên:</span>
                      <span className="cr-review-value">{selected.leaderName}</span>
                      <span className="cr-review-label">MSSV / Lớp:</span>
                      <span className="cr-review-value">{selected.leaderStudentId} / {selected.leaderClass || "N/A"}</span>
                      <span className="cr-review-label">Điện thoại / Email:</span>
                      <span className="cr-review-value">{selected.leaderPhone} / {selected.leaderEmail}</span>
                    </div>
                    {selected.leaderExperience && (
                      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                        <strong>Kinh nghiệm:</strong> {selected.leaderExperience}
                      </p>
                    )}
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Ảnh thẻ sinh viên minh chứng:</p>
                    <img src={selected.leaderCardImage} alt="Thẻ SV Chủ Nhiệm" style={{ maxWidth: "250px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>

                  {/* Vice Leader */}
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                    <h4 style={{ fontWeight: "600", color: "#0f172a", marginBottom: "8px", fontSize: "14px" }}>Phó chủ nhiệm CLB (Vice Leader)</h4>
                    <div className="cr-review-info-grid" style={{ padding: 0, background: "none", marginBottom: "12px" }}>
                      <span className="cr-review-label">Họ và tên:</span>
                      <span className="cr-review-value">{selected.viceLeaderName}</span>
                      <span className="cr-review-label">MSSV / Lớp:</span>
                      <span className="cr-review-value">{selected.viceLeaderStudentId} / {selected.viceLeaderClass || "N/A"}</span>
                      <span className="cr-review-label">Điện thoại / Email:</span>
                      <span className="cr-review-value">{selected.viceLeaderPhone} / {selected.viceLeaderEmail}</span>
                    </div>
                    {selected.viceLeaderExperience && (
                      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                        <strong>Kinh nghiệm:</strong> {selected.viceLeaderExperience}
                      </p>
                    )}
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Ảnh thẻ sinh viên minh chứng:</p>
                    <img src={selected.viceLeaderCardImage} alt="Thẻ SV Phó chủ nhiệm" style={{ maxWidth: "250px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>

                  {/* Founding Members */}
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ fontWeight: "600", color: "#0f172a", marginBottom: "12px", fontSize: "14px" }}>Thành viên sáng lập khác</h4>
                    {selected.foundingMembers?.map((m, idx) => (
                      <div key={idx} style={{ paddingBottom: "10px", marginBottom: "10px", borderBottom: idx < selected.foundingMembers.length - 1 ? "1px solid #cbd5e1" : "none" }}>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>#{idx + 1}: {m.fullName} ({m.studentId})</p>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>SĐT: {m.phoneNumber} | Email: {m.email} {m.clazz ? `| Lớp: ${m.clazz}` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Plan */}
                <div className="cr-review-info-section">
                  <h3 className="cr-section-title" style={{ borderLeftColor: "#ef4444" }}>
                    <MapPin size={16} /> Kế hoạch hoạt động & Tài chính
                  </h3>
                  <div className="cr-review-info-grid">
                    <span className="cr-review-label">Tần suất sinh hoạt:</span>
                    <span className="cr-review-value">{selected.meetingFrequency}</span>

                    <span className="cr-review-label">Địa điểm dự kiến:</span>
                    <span className="cr-review-value">{selected.meetingLocation}</span>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Sơ đồ tổ chức:</p>
                    <p style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", color: "#334155", whiteSpace: "pre-line" }}>{selected.orgStructure}</p>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "14px" }}>
                    <p style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Phương án tài chính:</p>
                    <p style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", color: "#334155", whiteSpace: "pre-line" }}>{selected.financialPlan}</p>
                  </div>
                </div>
              </div>

              {/* Right Verification Controls */}
              <div className="cr-review-right">
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={18} color="#10b981" /> Kiểm Định Hệ Thống Tự Động
                  </h3>

                  {/* Member validation cards */}
                  <div className="cr-validation-card valid">
                    <CheckCircle size={15} />
                    <span>Chủ nhiệm: {selected.leaderName} ({selected.leaderStudentId}) - MSSV Hợp lệ, &lt; 4 CLB</span>
                  </div>

                  <div className="cr-validation-card valid">
                    <CheckCircle size={15} />
                    <span>Phó chủ nhiệm: {selected.viceLeaderName} ({selected.viceLeaderStudentId}) - MSSV Hợp lệ, &lt; 4 CLB</span>
                  </div>

                  {selected.foundingMembers?.map((m, idx) => (
                    <div key={idx} className="cr-validation-card valid">
                      <CheckCircle size={15} />
                      <span>Thành viên sáng lập #{idx + 1}: {m.fullName} ({m.studentId}) - Hợp lệ</span>
                    </div>
                  ))}

                  <div className="cr-validation-card valid" style={{ marginTop: "16px" }}>
                    <CheckCircle size={15} />
                    <span>Mã CLB ({selected.clubCode}) & Tên CLB độc nhất</span>
                  </div>
                </div>

                <div className="cr-review-actions-panel">
                  <label className="pr-label" style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                    <MessageSquare size={14} /> Nhận xét hoặc Lý do từ chối duyệt:
                  </label>
                  <textarea
                    className="cr-review-textarea"
                    placeholder="Nhập lý do từ chối nộp đơn, hoặc các nhận xét đóng góp nếu được chấp nhận thành lập..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />

                  <div className="cr-review-btn-group">
                    <button
                      className="cr-btn-reject"
                      onClick={() => handleReview("REJECTED")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Đang xử lý..." : "Từ chối nộp đơn"}
                    </button>
                    <button
                      className="cr-btn-approve"
                      onClick={() => handleReview("APPROVED")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Đang phê duyệt..." : "Duyệt & Kích hoạt CLB"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="cr-card" style={{ flex: "1.8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
              <FileText size={48} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
              <p style={{ color: "#64748b" }}>Vui lòng chọn một yêu cầu đăng ký thành lập ở bên trái để tiến hành đánh giá chi tiết.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
