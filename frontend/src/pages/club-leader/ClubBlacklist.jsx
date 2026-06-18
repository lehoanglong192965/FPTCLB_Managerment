import { useState } from "react";
import { Ban, Search, ShieldOff, Calendar, Hash, BookOpen, X, Info } from "lucide-react";
import { Avatar, RoleBadge } from "./ClubMemberMgmt";
import { useClubData } from "../../contexts/ClubDataContext";

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ entry, onClose, onRemove }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(13,27,62,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 0" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Chi tiết cấm tham gia</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar + tên */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <Avatar name={entry.fullName} size={64} />
          <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "12px 0 6px" }}>{entry.fullName}</p>
          <RoleBadge role={entry.clubRoleName} />
        </div>

        {/* Chi tiết */}
        <div style={{ padding: "8px 20px" }}>
          {[
            { Icon: Hash,     label: "MSSV",     value: entry.studentCode },
            { Icon: BookOpen, label: "Ngành",    value: entry.major },
            { Icon: Calendar, label: "Ngày cấm", value: entry.bannedDate },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <Icon size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 90 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#1f2937", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <div style={{ padding: "10px 0" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Lý do cấm</p>
            <p style={{ fontSize: 13, color: "#1f2937", margin: 0, lineHeight: 1.6 }}>{entry.reason}</p>
          </div>
        </div>

        {/* Gỡ cấm */}
        <div style={{ padding: "8px 20px 20px" }}>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 10,
                border: "1.5px solid #d1fae5", background: "#fff",
                color: "#059669", fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
              }}
            >
              <ShieldOff size={14} /> Xóa khỏi danh sách đen
            </button>
          ) : (
            <div style={{ borderRadius: 12, border: "1.5px solid #d1fae5", background: "#f0fdf4", padding: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#059669", margin: "0 0 12px" }}>
                Xác nhận gỡ cấm cho {entry.fullName}?
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => onRemove(entry)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                    background: "#059669", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                    background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClubBlacklist() {
  const { blacklist, removeFromBlacklist } = useClubData();
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = (entry) => {
    removeFromBlacklist(entry.blacklistID);
    setSelected(null);
    showToast(`Đã gỡ cấm cho ${entry.fullName}.`);
  };

  const filtered = blacklist.filter((b) => {
    const q = search.toLowerCase();
    return b.fullName?.toLowerCase().includes(q) || b.reason?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Danh Sách Đen</h1>
        <p className="page-subtitle">Thành viên bị cấm tham gia câu lạc bộ</p>
      </div>

      {toast && <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Hướng dẫn */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: 10, marginBottom: 16,
        background: "#fffbeb", border: "1.5px solid #fde68a",
        fontSize: 13, color: "#92400e",
      }}>
        <Info size={15} style={{ flexShrink: 0 }} />
        Để thêm thành viên vào danh sách đen, vào{" "}
        <strong>Quản Lý Thành Viên</strong> → chọn thành viên → bấm
        {" "}<strong>Thêm vào danh sách đen</strong>.
      </div>

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, lý do..."
              style={{
                width: "100%", paddingLeft: 32, paddingRight: 12,
                paddingTop: 7, paddingBottom: 7,
                borderRadius: 8, border: "1.5px solid #e5e7eb",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            {filtered.length} / {blacklist.length} người bị cấm
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="page-placeholder">
            <ShieldOff size={48} className="page-placeholder-icon" />
            <p className="page-placeholder-label">
              {blacklist.length === 0 ? "Danh sách đen trống." : "Không tìm thấy kết quả."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {filtered.map((entry) => (
              <div
                key={entry.blacklistID}
                onClick={() => setSelected(entry)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  padding: "0.75rem 1rem", borderRadius: 12,
                  border: "1.5px solid #fee2e2", background: "#fff5f5",
                  cursor: "pointer", transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(239,68,68,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={entry.fullName} size={38} />
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fff5f5",
                  }}>
                    <Ban size={8} color="#fff" />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{entry.fullName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.reason}
                  </p>
                </div>

                <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{entry.bannedDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          entry={selected}
          onClose={() => setSelected(null)}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
