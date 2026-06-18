import { useState } from "react";
import { Users, Mail, Search, X, Phone, BookOpen, Calendar, Hash, ShieldOff, ChevronRight, Ban } from "lucide-react";
import { useClubData } from "../../contexts/ClubDataContext";

const ROLE_BADGE = {
  Leader:     { label: "Trưởng CLB",    color: "#E6430A", bg: "#FFF3EE" },
  ViceLeader: { label: "Phó Trưởng",    color: "#7c3aed", bg: "#f5f3ff" },
  CoreTeam:   { label: "Ban Điều Hành", color: "#0284c7", bg: "#e0f2fe" },
  Member:     { label: "Thành viên",    color: "#059669", bg: "#ecfdf5" },
};

export function RoleBadge({ role }) {
  const cfg = ROLE_BADGE[role] ?? { label: role, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

export function Avatar({ name, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "#FFF3EE", color: "#E6430A",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.4,
    }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
      <Icon size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1f2937", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ActionSection({ label, buttonStyle, icon: Icon, confirmTitle, onConfirm }) {
  const [open, setOpen]     = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError]   = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) { setError("Vui lòng nhập lý do."); return; }
    onConfirm(reason.trim());
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "9px 0", borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          ...buttonStyle,
        }}
      >
        <Icon size={14} /> {label}
      </button>
    );
  }

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${buttonStyle.borderColor ?? "#fee2e2"}`, background: buttonStyle.confirmBg ?? "#fff5f5", padding: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: buttonStyle.color, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={14} /> {confirmTitle}
      </p>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>
        Lý do <span style={{ color: "#ef4444" }}>*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => { setReason(e.target.value); setError(""); }}
        rows={3}
        placeholder="Nhập lý do..."
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 8, fontFamily: "inherit",
          border: `1.5px solid ${error ? "#ef4444" : (buttonStyle.borderColor ?? "#fca5a5")}`,
          fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", background: "#fff",
        }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={handleConfirm}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: buttonStyle.confirmColor ?? "#ef4444",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Xác nhận
        </button>
        <button
          onClick={() => { setOpen(false); setReason(""); setError(""); }}
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
  );
}

function MemberModal({ member, isBlacklisted, onClose, onExpel, onBlacklist }) {
  const canAct = member.clubRoleName !== "Leader";

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" }) : "—";

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
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
          maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 0" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Thông tin thành viên</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar + tên */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <Avatar name={member.fullName} size={64} />
          <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "12px 0 6px" }}>{member.fullName}</p>
          <RoleBadge role={member.clubRoleName} />
        </div>

        {/* Chi tiết */}
        <div style={{ padding: "4px 20px 8px" }}>
          <InfoRow icon={Mail}     label="Email"         value={member.email} />
          <InfoRow icon={Phone}    label="Điện thoại"    value={member.phone} />
          <InfoRow icon={Hash}     label="MSSV"          value={member.studentCode} />
          <InfoRow icon={BookOpen} label="Ngành"         value={member.major} />
          <InfoRow icon={Calendar} label="Ngày tham gia" value={formatDate(member.joinedDate)} />
          <InfoRow icon={Calendar} label="Học kỳ"        value={member.semesterCode} />
        </div>

        {/* Hành động */}
        {canAct && (
          <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Khai trừ */}
            <ActionSection
              label="Khai trừ thành viên"
              icon={ShieldOff}
              confirmTitle={`Xác nhận khai trừ ${member.fullName}?`}
              buttonStyle={{
                border: "1.5px solid #fee2e2", background: "#fff", color: "#ef4444",
                borderColor: "#fca5a5", confirmBg: "#fff5f5", confirmColor: "#ef4444",
              }}
              onConfirm={(reason) => onExpel(member, reason)}
            />

            {/* Thêm vào danh sách đen */}
            {isBlacklisted ? (
              <div style={{
                padding: "9px 0", borderRadius: 10, textAlign: "center",
                border: "1.5px solid #e5e7eb", background: "#f9fafb",
                fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Ban size={13} /> Đã trong danh sách đen
              </div>
            ) : (
              <ActionSection
                label="Thêm vào danh sách đen"
                icon={Ban}
                confirmTitle={`Xác nhận cấm ${member.fullName}?`}
                buttonStyle={{
                  border: "1.5px solid #fde68a", background: "#fff", color: "#b45309",
                  borderColor: "#fcd34d", confirmBg: "#fffbeb", confirmColor: "#b45309",
                }}
                onConfirm={(reason) => onBlacklist(member, reason)}
              />
            )}
          </div>
        )}

        {!canAct && <div style={{ height: 20 }} />}
      </div>
    </div>
  );
}

export default function ClubMemberMgmt() {
  const { members, blacklist, expelMember, addToBlacklist } = useClubData();
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExpel = (member, reason) => {
    expelMember(member);
    setSelected(null);
    showToast(`Đã khai trừ ${member.fullName}.`);
  };

  const handleBlacklist = (member, reason) => {
    addToBlacklist(member, reason);
    setSelected(null);
    showToast(`Đã thêm ${member.fullName} vào danh sách đen.`);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return m.fullName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
  });

  const isBlacklisted = (member) =>
    blacklist.some((b) => b.userID === member.userID);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Thành Viên</h1>
        <p className="page-subtitle">Danh sách thành viên câu lạc bộ</p>
      </div>

      {toast && <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email..."
              style={{
                width: "100%", paddingLeft: 32, paddingRight: 12,
                paddingTop: 7, paddingBottom: 7,
                borderRadius: 8, border: "1.5px solid #e5e7eb",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            {filtered.length} / {members.length} thành viên
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="page-placeholder">
            <Users size={48} className="page-placeholder-icon" />
            <p className="page-placeholder-label">Không tìm thấy thành viên</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {filtered.map((m) => (
              <div
                key={m.membershipID}
                onClick={() => setSelected(m)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  padding: "0.75rem 1rem", borderRadius: 12,
                  border: "1.5px solid #f0f0f0", background: "#fff",
                  cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fbd0c0"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(230,67,10,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f0f0f0"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Avatar name={m.fullName} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{m.fullName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Mail size={11} /> {m.email}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                  <RoleBadge role={m.clubRoleName} />
                  <ChevronRight size={15} color="#d1d5db" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <MemberModal
          member={selected}
          isBlacklisted={isBlacklisted(selected)}
          onClose={() => setSelected(null)}
          onExpel={handleExpel}
          onBlacklist={handleBlacklist}
        />
      )}
    </div>
  );
}
