import { useState } from "react";
import { Users, Mail, Search, X, Phone, BookOpen, Calendar, Hash, ShieldOff, ChevronRight } from "lucide-react";

const ROLE_BADGE = {
  Leader:     { label: "Trưởng CLB",    color: "#E6430A", bg: "#FFF3EE" },
  ViceLeader: { label: "Phó Trưởng",    color: "#7c3aed", bg: "#f5f3ff" },
  CoreTeam:   { label: "Ban Điều Hành", color: "#0284c7", bg: "#e0f2fe" },
  Member:     { label: "Thành viên",    color: "#059669", bg: "#ecfdf5" },
};

const MOCK_MEMBERS = [
  {
    membershipID: 1, userID: 101, fullName: "Nguyễn Văn A",
    email: "aNV@fpt.edu.vn", phone: "0901234567",
    studentCode: "SE180001", major: "Software Engineering",
    clubRoleName: "Leader", semesterCode: "SU26", joinedDate: "2025-09-01",
  },
  {
    membershipID: 2, userID: 102, fullName: "Trần Thị Bình",
    email: "binhTT@fpt.edu.vn", phone: "0912345678",
    studentCode: "SE180002", major: "Artificial Intelligence",
    clubRoleName: "ViceLeader", semesterCode: "SU26", joinedDate: "2025-09-01",
  },
  {
    membershipID: 3, userID: 103, fullName: "Lê Hoàng Cường",
    email: "cuongLH@fpt.edu.vn", phone: "0923456789",
    studentCode: "SE180003", major: "Information Security",
    clubRoleName: "CoreTeam", semesterCode: "SU26", joinedDate: "2025-09-05",
  },
  {
    membershipID: 4, userID: 104, fullName: "Phạm Ngọc Dung",
    email: "dungPN@fpt.edu.vn", phone: "0934567890",
    studentCode: "SE180004", major: "Software Engineering",
    clubRoleName: "Member", semesterCode: "SU26", joinedDate: "2025-09-10",
  },
  {
    membershipID: 5, userID: 105, fullName: "Hoàng Minh Đức",
    email: "ducHM@fpt.edu.vn", phone: "0945678901",
    studentCode: "SE180005", major: "Business IT",
    clubRoleName: "Member", semesterCode: "SU26", joinedDate: "2025-09-10",
  },
  {
    membershipID: 6, userID: 106, fullName: "Vũ Thị Lan",
    email: "lanVT@fpt.edu.vn", phone: "0956789012",
    studentCode: "SE180006", major: "Digital Art & Design",
    clubRoleName: "Member", semesterCode: "SU26", joinedDate: "2025-09-12",
  },
  {
    membershipID: 7, userID: 107, fullName: "Đặng Quốc Hùng",
    email: "hungDQ@fpt.edu.vn", phone: "0967890123",
    studentCode: "SE180007", major: "Software Engineering",
    clubRoleName: "Member", semesterCode: "SU26", joinedDate: "2025-09-15",
  },
  {
    membershipID: 8, userID: 108, fullName: "Ngô Thị Mai",
    email: "maiNT@fpt.edu.vn", phone: "0978901234",
    studentCode: "SE180008", major: "Information Technology",
    clubRoleName: "Member", semesterCode: "SU26", joinedDate: "2025-09-18",
  },
];

function RoleBadge({ role }) {
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

function Avatar({ name, size = 38 }) {
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

function MemberModal({ member, onClose, onExpel }) {
  const [showExpel, setShowExpel]   = useState(false);
  const [reason, setReason]         = useState("");
  const [reasonError, setReasonError] = useState("");

  const canExpel = member.clubRoleName !== "Leader";

  const handleExpelConfirm = () => {
    if (!reason.trim()) {
      setReasonError("Vui lòng nhập lý do khai trừ.");
      return;
    }
    onExpel(member, reason.trim());
  };

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
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
          >
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
          <InfoRow icon={Mail}     label="Email"      value={member.email} />
          <InfoRow icon={Phone}    label="Điện thoại" value={member.phone} />
          <InfoRow icon={Hash}     label="MSSV"       value={member.studentCode} />
          <InfoRow icon={BookOpen} label="Ngành"      value={member.major} />
          <InfoRow icon={Calendar} label="Ngày tham gia" value={formatDate(member.joinedDate)} />
          <InfoRow icon={Calendar} label="Học kỳ"    value={member.semesterCode} />
        </div>

        {/* Khai trừ */}
        {canExpel && (
          <div style={{ padding: "12px 20px 20px" }}>
            {!showExpel ? (
              <button
                onClick={() => setShowExpel(true)}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 10,
                  border: "1.5px solid #fee2e2", background: "#fff",
                  color: "#ef4444", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <ShieldOff size={14} /> Khai trừ thành viên
              </button>
            ) : (
              <div style={{ borderRadius: 12, border: "1.5px solid #fee2e2", background: "#fff5f5", padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldOff size={14} /> Xác nhận khai trừ {member.fullName}?
                </p>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>
                  Lý do khai trừ <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                  rows={3}
                  placeholder="Nhập lý do khai trừ thành viên..."
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8, fontFamily: "inherit",
                    border: `1.5px solid ${reasonError ? "#ef4444" : "#fca5a5"}`,
                    fontSize: 13, outline: "none", resize: "vertical",
                    boxSizing: "border-box", background: "#fff",
                  }}
                />
                {reasonError && (
                  <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{reasonError}</p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={handleExpelConfirm}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                      background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Xác nhận khai trừ
                  </button>
                  <button
                    onClick={() => { setShowExpel(false); setReason(""); setReasonError(""); }}
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
        )}

        {!canExpel && <div style={{ height: 20 }} />}
      </div>
    </div>
  );
}

export default function ClubMemberMgmt() {
  const [members, setMembers]     = useState(MOCK_MEMBERS);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExpel = (member, reason) => {
    setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));
    setSelected(null);
    showToast(`Đã khai trừ ${member.fullName}.`);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return m.fullName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Thành Viên</h1>
        <p className="page-subtitle">Danh sách thành viên câu lạc bộ</p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

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
          onClose={() => setSelected(null)}
          onExpel={handleExpel}
        />
      )}
    </div>
  );
}
