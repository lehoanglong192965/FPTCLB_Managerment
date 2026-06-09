import { useState } from "react";
import { Mail, Phone, Monitor, ChevronRight, Edit3, Users, X } from "lucide-react";
import "../../../assets/css/profilePage.css";
import { useAuth } from "../../auth/context/AuthContext";
import authService from "../../auth/services/authService";

const MOCK_TIMELINE = [
  { id: 1, status: "active", period: "Hôm nay",       event: "Đăng nhập hệ thống",                    sub: "Xem thông tin CLB"   },
  { id: 2, status: "past",   period: "Tháng 5, 2026", event: 'Tham gia sự kiện "Tech Talk: AI & LLM"', sub: "Đã check-in"         },
  { id: 3, status: "past",   period: "Tháng 9, 2022", event: "Gia nhập IT Club",                       sub: "Vai trò: Thành viên" },
];

const MAJOR_OPTIONS = [
  { group: "Công nghệ thông tin", options: [
    { value: "SE",  label: "Kỹ thuật phần mềm (SE)" },
    { value: "AI",  label: "Trí tuệ nhân tạo (AI)" },
    { value: "IS",  label: "An toàn thông tin (IS)" },
    { value: "IoT", label: "Internet of Things (IoT)" },
    { value: "CS",  label: "Khoa học máy tính (CS)" },
  ]},
  { group: "Kinh tế", options: [
    { value: "BA",  label: "Quản trị kinh doanh (BA)" },
    { value: "IB",  label: "Kinh doanh quốc tế (IB)" },
    { value: "FIN", label: "Tài chính (FIN)" },
    { value: "ACC", label: "Kế toán (ACC)" },
    { value: "MKT", label: "Marketing số (MKT)" },
    { value: "LOG", label: "Logistics & Chuỗi cung ứng (LOG)" },
  ]},
  { group: "Thiết kế", options: [
    { value: "GD", label: "Thiết kế mỹ thuật số (GD)" },
    { value: "ID", label: "Thiết kế nội thất (ID)" },
  ]},
  { group: "Ngôn ngữ", options: [
    { value: "EN", label: "Ngôn ngữ Anh (EN)" },
    { value: "JA", label: "Ngôn ngữ Nhật (JA)" },
    { value: "KO", label: "Ngôn ngữ Hàn (KO)" },
    { value: "CN", label: "Ngôn ngữ Trung (CN)" },
  ]},
  { group: "Khác", options: [
    { value: "HM",  label: "Quản trị khách sạn (HM)" },
    { value: "MC",  label: "Truyền thông đa phương tiện (MC)" },
    { value: "LAW", label: "Luật (LAW)" },
    { value: "AR",  label: "Kiến trúc (AR)" },
  ]},
];

function EditModal({ current, onClose, onSaved }) {
  const [form, setForm] = useState({ fullName: current.fullName ?? "", major: current.major ?? "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Vui lòng nhập họ và tên.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.updateProfile({ fullName: form.fullName.trim(), major: form.major });
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (err) {
      setErrors({ form: err?.response?.data?.error ?? "Cập nhật thất bại, vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ep-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <p className="ep-modal-title" style={{ margin: 0 }}>Chỉnh sửa hồ sơ</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="ep-field">
            <label>Họ và tên <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => { setForm((p) => ({ ...p, fullName: e.target.value })); setErrors((p) => ({ ...p, fullName: "" })); }}
              placeholder="Nhập họ và tên"
              disabled={loading}
            />
            {errors.fullName && <span className="ep-error">{errors.fullName}</span>}
          </div>

          <div className="ep-field">
            <label>Chuyên ngành</label>
            <select
              value={form.major}
              onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
              disabled={loading}
            >
              <option value="">-- Chọn chuyên ngành --</option>
              {MAJOR_OPTIONS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {errors.form && <p className="ep-error" style={{ textAlign: "center" }}>{errors.form}</p>}
          {success && <p className="ep-success">Cập nhật thành công!</p>}

          <div className="ep-actions">
            <button type="button" className="ep-btn-cancel" onClick={onClose} disabled={loading}>Huỷ</button>
            <button type="submit" className="ep-btn-save" disabled={loading || success}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile: authProfile, profileLoading, fetchProfile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  const profile = authProfile ? {
    name:      authProfile.fullName ?? "—",
    studentId: authProfile.studentId ?? "—",
    faculty:   authProfile.major ?? "—",
    email:     authProfile.email ?? "—",
    phone:     authProfile.phone ?? "—",
    major:     authProfile.major ?? "—",
    clubs:     [],
    timeline:  MOCK_TIMELINE,
  } : null;

  if (profileLoading) return <div className="loading">Đang tải...</div>;
  if (!profile) return <div className="loading">Không thể tải thông tin tài khoản.</div>;

  const initial = profile.name.split(" ").pop()[0].toUpperCase();

  return (
    <div className="profile-page">
      {showEdit && (
        <EditModal
          current={authProfile}
          onClose={() => setShowEdit(false)}
          onSaved={fetchProfile}
        />
      )}

      <div className="profile-layout">

        {/* ── LEFT COLUMN ── */}
        <div className="profile-left">
          <div className="side-card">
            <div className="side-body">
              <div className="side-avatar">{initial}</div>
              <div className="side-name">{profile.name}</div>
              <div className="side-sub">{profile.studentId} · {profile.faculty}</div>

              {profile.clubs[0] && (
                <div className="profile-badge-blue">
                  <Users size={12} /> {profile.clubs[0].name}
                </div>
              )}

              <button className="side-edit-btn" onClick={() => setShowEdit(true)}>
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          <div className="clubs-section">
            <h3 className="section-title">CLB đang tham gia</h3>
            <div className="r-card">
              {profile.clubs.length === 0 ? (
                <p style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: 14 }}>
                  Chưa tham gia câu lạc bộ nào.
                </p>
              ) : (
                profile.clubs.map((club) => (
                  <div key={club.id} className="club-item">
                    <div className="club-thumb">
                      <Monitor size={18} color="#fff" />
                    </div>
                    <div className="club-info-text">
                      <div className="club-name">{club.name}</div>
                      <div className="club-tag">{club.tag}</div>
                    </div>
                    <ChevronRight size={16} className="arrow-gray" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="profile-right">
          <div className="info-card">
            <div className="info-card-header">
              <div className="title-with-icon">
                <Edit3 size={18} className="icon-orange" />
                <span className="info-card-title">Thông tin cá nhân</span>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Chuyên ngành</label>
                <div className="info-value">{profile.major}</div>
              </div>
              <div className="info-item">
                <label>Mã sinh viên</label>
                <div className="info-value">{profile.studentId}</div>
              </div>
              <div className="info-item">
                <label><Mail size={14} className="label-icon" /> Email</label>
                <div className="info-value">{profile.email}</div>
              </div>
              <div className="info-item">
                <label><Phone size={14} className="label-icon" /> Số điện thoại</label>
                <div className="info-value">{profile.phone}</div>
              </div>
            </div>
          </div>

          <div className="r-card history-card">
            <h3 className="r-card-title">Lịch sử hoạt động</h3>
            <div className="timeline">
              {profile.timeline.map((item, idx) => (
                <div key={item.id} className="tl-item">
                  <div className="tl-dot-col">
                    <div className={`tl-dot ${item.status}`} />
                    {idx < profile.timeline.length - 1 && <div className="tl-line" />}
                  </div>
                  <div className="tl-content">
                    <div className={`tl-period ${item.status}`}>{item.period}</div>
                    <div className="tl-event">{item.event}</div>
                    <div className="tl-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
