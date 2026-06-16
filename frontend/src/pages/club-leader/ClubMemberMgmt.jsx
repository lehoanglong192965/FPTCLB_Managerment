import { useState, useEffect } from "react";
import { Users, RefreshCw, Mail, Shield, UserCheck, UserX } from "lucide-react";
import clubBoardApi from "../../services/api/club-leader/clubBoardApi";
import { TokenService } from "../../services/api/axiosClient";

const ROLE_BADGE = {
  Leader:     { label: "Trưởng CLB",    color: "#E6430A", bg: "#FFF3EE" },
  ViceLeader: { label: "Phó Trưởng",    color: "#7c3aed", bg: "#f5f3ff" },
  Member:     { label: "Thành viên",    color: "#059669", bg: "#ecfdf5" },
};

function RoleBadge({ role }) {
  const cfg = ROLE_BADGE[role] ?? { label: role, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

export default function ClubMemberMgmt() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [toast, setToast]       = useState(null);

  const clubId = TokenService.getClubId();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBoard = async () => {
    if (!clubId) {
      setError("Không xác định được CLB của bạn. Vui lòng đăng xuất và đăng nhập lại.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await clubBoardApi.getBoard(clubId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error ?? "Không thể tải danh sách ban điều hành.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBoard(); }, []);

  const handleDismiss = async (member) => {
    if (!window.confirm(`Bãi nhiệm ${member.fullName} khỏi ${member.clubRoleName}?`)) return;
    try {
      await clubBoardApi.changeBoard(clubId, {
        userID: member.userID,
        action: "DISMISS",
        reason: "Bãi nhiệm bởi Trưởng CLB",
      });
      showToast(`Đã bãi nhiệm ${member.fullName}.`);
      loadBoard();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Bãi nhiệm thất bại.", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ban Điều Hành CLB</h1>
        <p className="page-subtitle">Xem danh sách thành viên ban điều hành câu lạc bộ</p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            {members.length > 0 ? `${members.length} thành viên` : ""}
          </p>
          <button
            className="pr-btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
            onClick={loadBoard}
            disabled={loading}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        {loading ? (
          <p className="approval-empty">Đang tải...</p>
        ) : error ? (
          <p className="approval-empty" style={{ color: "#ef4444" }}>{error}</p>
        ) : members.length === 0 ? (
          <div className="page-placeholder">
            <Users size={48} className="page-placeholder-icon" />
            <p className="page-placeholder-label">Chưa có thành viên</p>
            <p className="page-placeholder-desc">Ban điều hành CLB chưa được thiết lập.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {members.map((m) => (
              <div key={m.membershipID} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0.875rem 1rem", borderRadius: 12,
                border: "1.5px solid #f0f0f0", background: "#fff",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#FFF3EE", color: "#E6430A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {m.fullName?.[0]?.toUpperCase() ?? "?"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{m.fullName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <Mail size={11} /> {m.email}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                  <RoleBadge role={m.clubRoleName} />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>HK {m.semesterCode}</span>
                  {m.clubRoleName !== "Member" && (
                    <button
                      title="Bãi nhiệm"
                      onClick={() => handleDismiss(m)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ef4444", padding: "4px",
                      }}
                    >
                      <UserX size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
