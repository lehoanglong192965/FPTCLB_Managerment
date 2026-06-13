import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle2, XCircle, ChevronRight, AlertCircle, FileText, User } from "lucide-react";
import clubRegistrationApi from "../../../services/api/clubRegistrationApi";
import "../../../assets/css/clubRegistration.css";

const STATUS_MAP = {
  PENDING:  { label: "Chờ duyệt",      cls: "cr-status-pending"  },
  APPROVED: { label: "Đã kích hoạt",  cls: "cr-status-approved" },
  REJECTED: { label: "Bị từ chối",    cls: "cr-status-rejected" },
};

export default function MemberRegistrationHistory() {
  const [registrations, setRegistrations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMyRegistrations = async () => {
    setLoading(true);
    try {
      const data = await clubRegistrationApi.getMyRegistrations();
      setRegistrations(data || []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError("Không thể tải danh sách đơn đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRegistrations();
  }, []);

  return (
    <div className="cr-container">
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <h1 className="page-title">Lịch Sử Thành Lập CLB</h1>
        <p className="page-subtitle">Xem trạng thái phê duyệt các đơn đề xuất thành lập câu lạc bộ của bạn</p>
      </div>

      {loading ? (
        <p className="approval-empty" style={{ textAlign: "center", padding: "40px" }}>Đang tải...</p>
      ) : error ? (
        <div className="cr-validation-card invalid">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : registrations.length === 0 ? (
        <div className="cr-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <FileText size={48} style={{ color: "#94a3b8", marginBottom: "12px" }} />
          <p style={{ color: "#64748b" }}>Bạn chưa có đơn đề xuất thành lập câu lạc bộ nào.</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Left Side: List */}
          <div style={{ flex: selected ? "1.2" : "1", display: "flex", flexDirection: "column", gap: "16px" }}>
            {registrations.map((reg) => {
              const status = STATUS_MAP[reg.status] || STATUS_MAP.PENDING;
              const isSelected = selected?.registrationID === reg.registrationID;
              const date = new Date(reg.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <div
                  key={reg.registrationID}
                  className={`cr-history-item ${isSelected ? "selected" : ""}`}
                  style={{ borderLeft: isSelected ? "4px solid #2563eb" : "1px solid #e2e8f0" }}
                  onClick={() => setSelected(reg)}
                >
                  <div className="cr-history-header">
                    <div>
                      <span className="cr-history-name">{reg.clubName}</span>
                      <span className="cr-history-code">{reg.clubCode}</span>
                    </div>
                    <span className={`cr-status ${status.cls}`}>{status.label}</span>
                  </div>

                  <div className="cr-history-meta">
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={13} /> {date}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} /> Lĩnh vực: {reg.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Timeline & Details */}
          {selected && (
            <div className="cr-card" style={{ flex: "1", alignSelf: "flex-start", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Chi Tiết Đơn Đăng Ký</h3>
                <button
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "13px" }}
                  onClick={() => setSelected(null)}
                >
                  Đóng
                </button>
              </div>

              {/* Timeline */}
              <div className="cr-timeline">
                {/* Node 1: Submitted */}
                <div className="cr-timeline-node success">
                  <p className="cr-timeline-title">Đơn đã được nộp</p>
                  <p className="cr-timeline-desc">
                    Sinh viên **{selected.creatorName || "Thành viên"}** đã gửi đơn đề xuất thành lập câu lạc bộ.
                  </p>
                  <p className="cr-timeline-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                {/* Node 2: ICPDP review */}
                {selected.status === "PENDING" ? (
                  <div className="cr-timeline-node active">
                    <p className="cr-timeline-title">Đang chờ ICPDP kiểm định</p>
                    <p className="cr-timeline-desc">
                      Cán bộ ban cá nhân ICPDP đang đối chiếu thông tin nhân sự và cơ cấu kế hoạch.
                    </p>
                  </div>
                ) : selected.status === "APPROVED" ? (
                  <div className="cr-timeline-node success">
                    <p className="cr-timeline-title">ICPDP đã phê duyệt & kích hoạt</p>
                    <p className="cr-timeline-desc">
                      Đơn đăng ký được duyệt thông qua. Câu lạc bộ **{selected.clubName}** chính thức hoạt động trên hệ thống.
                    </p>
                    {selected.icpdpComment && (
                      <p className="cr-timeline-comment">Góp ý từ ICPDP: "{selected.icpdpComment}"</p>
                    )}
                    <p className="cr-timeline-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                ) : (
                  <div className="cr-timeline-node danger">
                    <p className="cr-timeline-title">Đơn bị ICPDP từ chối</p>
                    <p className="cr-timeline-desc">
                      Yêu cầu thành lập không được phê duyệt.
                    </p>
                    {selected.icpdpComment && (
                      <p className="cr-timeline-comment rejected">Lý do từ chối: "{selected.icpdpComment}"</p>
                    )}
                    <p className="cr-timeline-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* General Details Summary */}
              <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "12px" }}>Nhân sự ban sáng lập</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Chủ nhiệm (Leader):</span>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>{selected.leaderName} ({selected.leaderStudentId})</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Phó chủ nhiệm (Vice Leader):</span>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>{selected.viceLeaderName} ({selected.viceLeaderStudentId})</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Thành viên sáng lập:</span>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>{selected.foundingMembers?.length} thành viên</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
