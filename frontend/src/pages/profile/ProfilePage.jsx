import { useState } from "react";
import { Mail, Phone, Monitor, ChevronRight, Edit3, Users, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/api/auth/authService";
import { getInitials } from "../../utils/avatar";

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
  const [form, setForm] = useState({ fullName: current.fullName ?? "", major: current.major ?? "", phoneNumber: current.phoneNumber ?? "" });
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
      await authService.updateProfile({
        fullName: form.fullName.trim(),
        major: form.major ,
        phoneNumber: form.phoneNumber.trim()
      });
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (err) {
      setErrors({ form: err?.response?.data?.message ?? err?.response?.data?.error ?? "Cập nhật thất bại, vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[999]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-[440px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex justify-between items-center mb-6">
          <p className="text-[1.1rem] font-bold text-gray-900 m-0">Chỉnh sửa hồ sơ</p>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[0.82rem] font-semibold text-slate-500">Họ và tên <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-[0.95rem] outline-none transition-colors focus:border-[#f04e23] disabled:opacity-60"
              value={form.fullName}
              onChange={(e) => { setForm((p) => ({ ...p, fullName: e.target.value })); setErrors((p) => ({ ...p, fullName: "" })); }}
              placeholder="Nhập họ và tên"
              disabled={loading}
            />
            {errors.fullName && <span className="text-[0.78rem] text-red-500 mt-0.5">{errors.fullName}</span>}
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[0.82rem] font-semibold text-slate-500">Chuyên ngành</label>
            <select
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-[0.95rem] outline-none transition-colors focus:border-[#f04e23] disabled:opacity-60"
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

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[0.82rem] font-semibold text-slate-500">Số điện thoại</label>
            <input
              type="tel"
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-[0.95rem] outline-none transition-colors focus:border-[#f04e23] disabled:opacity-60"
              value={form.phoneNumber}
              onChange={(e) => {
                setForm((p) => ({ ...p, phoneNumber: e.target.value }));
                setErrors((p) => ({ ...p, phoneNumber: "" }));
              }}
              placeholder="Nhập số điện thoại"
              disabled={loading}
            />
            {errors.phoneNumber && (
              <span className="text-[0.78rem] text-red-500 mt-0.5">{errors.phoneNumber}</span>
            )}
          </div>

          {errors.form && <p className="text-[0.78rem] text-red-500 text-center">{errors.form}</p>}
          {success && <p className="text-[0.85rem] text-emerald-500 text-center mt-2">Cập nhật thành công!</p>}

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-[#e2e8f0] bg-white cursor-pointer text-[0.9rem] disabled:opacity-60"
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#f04e23] text-white border-none cursor-pointer text-[0.9rem] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
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
    phone:     authProfile.phoneNumber ?? "—",
    major:     authProfile.major ?? "—",
    clubs:     [],
    timeline:  MOCK_TIMELINE,
  } : null;

  if (profileLoading) return <div className="loading">Đang tải...</div>;
  if (!profile) return <div className="loading">Không thể tải thông tin tài khoản.</div>;

  const initial = getInitials(profile.name);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      {showEdit && (
        <EditModal
          current={authProfile}
          onClose={() => setShowEdit(false)}
          onSaved={fetchProfile}
        />
      )}

      <div className="grid grid-cols-[280px_1fr] gap-6 max-w-[1000px] mx-auto max-[768px]:grid-cols-1">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-[90px] h-[90px] rounded-full bg-[#f04e23] text-white flex items-center justify-center text-[2rem] font-extrabold mb-4 shadow-[0_4px_10px_rgba(240,78,35,0.2)]">
                {initial}
              </div>
              <div className="text-[1.25rem] font-extrabold text-gray-900">{profile.name}</div>
              <div className="text-[0.85rem] text-slate-500 my-1 mb-3">{profile.studentId} · {profile.faculty}</div>

              {profile.clubs[0] && (
                <div className="bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold flex items-center gap-1.5 mb-6">
                  <Users size={12} /> {profile.clubs[0].name}
                </div>
              )}

              <button
                className="w-full py-2.5 bg-white border border-[#e2e8f0] rounded-lg font-bold text-gray-900 cursor-pointer"
                onClick={() => setShowEdit(true)}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[0.9rem] font-bold mb-3 text-gray-900">CLB đang tham gia</h3>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
              {profile.clubs.length === 0 ? (
                <p style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: 14 }}>
                  Chưa tham gia câu lạc bộ nào.
                </p>
              ) : (
                profile.clubs.map((club) => (
                  <div key={club.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
                      <Monitor size={18} color="#fff" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[0.9rem]">{club.name}</div>
                      <div className="text-[0.75rem] text-slate-500">{club.tag}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-[#f04e23]" />
                <span className="font-extrabold text-[0.95rem]">Thông tin cá nhân</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="info-item">
                <label className="text-[0.85rem] text-slate-500 mb-1.5 flex items-center gap-1.5">Chuyên ngành</label>
                <div className="font-bold text-[1rem] text-gray-900">{profile.major}</div>
              </div>
              <div className="info-item">
                <label className="text-[0.85rem] text-slate-500 mb-1.5 flex items-center gap-1.5">Mã sinh viên</label>
                <div className="font-bold text-[1rem] text-gray-900">{profile.studentId}</div>
              </div>
              <div className="info-item">
                <label className="text-[0.85rem] text-slate-500 mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email</label>
                <div className="font-bold text-[1rem] text-gray-900">{profile.email}</div>
              </div>
              <div className="info-item">
                <label className="text-[0.85rem] text-slate-500 mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Số điện thoại</label>
                <div className="font-bold text-[1rem] text-gray-900">{profile.phone}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <h3 className="font-bold text-[0.95rem] text-gray-900 mb-4">Lịch sử hoạt động</h3>
            <div className="flex flex-col mt-4">
              {profile.timeline.map((item, idx) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${item.status === "active" ? "bg-[#f04e23]" : "bg-slate-300"}`} />
                    {idx < profile.timeline.length - 1 && <div className="w-0.5 bg-slate-100 flex-1 my-1" />}
                  </div>
                  <div>
                    <div className={`text-[0.8rem] font-bold mb-1 ${item.status === "active" ? "text-[#f04e23]" : "text-slate-400"}`}>{item.period}</div>
                    <div className="font-bold text-[0.9rem] mb-0.5">{item.event}</div>
                    <div className="text-[0.8rem] text-slate-500 mb-6">{item.sub}</div>
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
