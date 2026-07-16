import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Users,
  Compass,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import clubRegistrationApi from "../../services/api/clubs/clubRegistrationApi";
import axiosClient, { getServerOrigin } from "../../services/api/axiosClient";
import AlertModal from "../../components/ui/AlertModal";
import { CLUB_CATEGORIES } from "../../constants/clubCategories";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

export default function ClubRegistrationForm({ mode = "member" }) {
  const navigate = useNavigate();
  const isStaffMode = mode === "icpdp";
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fail = (msg) => { setError(msg); };

  const [formData, setFormData] = useState({
    clubCode: "",
    clubName: "",
    clubNameEn: "",
    category: CLUB_CATEGORIES[0].value,
    description: "",
    mission: "",
    uniqueness: "",
    clubImage: "",
    clubImagePublicId: "",
    orgStructure: "",
    meetingFrequency: "1 lần / tuần",
    meetingLocation: "Phòng học trống của trường",
    financialPlan: "Thu quỹ thành viên",
  });

  const [foundingMembers, setFoundingMembers] = useState([
    { proposedRole: "Leader",     studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "", cardImagePublicId: "" },
    { proposedRole: "ViceLeader", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "", cardImagePublicId: "" },
    { proposedRole: "Member",     studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "", cardImagePublicId: "" },
    { proposedRole: "Member",     studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "", cardImagePublicId: "" },
    { proposedRole: "Member",     studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "", cardImagePublicId: "" },
  ]);

  const [validationErrors, setValidationErrors] = useState({});
  const [validationSuccess, setValidationSuccess] = useState({});

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const checkStudentId = async (studentId, memberIndex) => {
    const trimmedId = studentId.trim();
    const key = `member_${memberIndex}`;

    // Validate alphanumeric format and length
    const studentIdRegex = /^[a-zA-Z0-9]{8,15}$/;
    if (!studentIdRegex.test(trimmedId)) {
      if (trimmedId.length < 8) {
        setValidationErrors((prev) => ({ ...prev, [key]: "" }));
        setValidationSuccess((prev) => ({ ...prev, [key]: "" }));
      } else {
        setValidationErrors((prev) => ({
          ...prev,
          [key]: "Mã số sinh viên không hợp lệ (chứa ký tự đặc biệt hoặc khoảng trắng).",
        }));
        setValidationSuccess((prev) => ({ ...prev, [key]: "" }));
      }
      return;
    }

    try {
      const res = await axiosClient.get(`/user/by-student-id/${trimmedId}`);
      const user = res;

      setFoundingMembers((prev) => {
        const next = [...prev];
        next[memberIndex].fullName = user.fullName || "";
        next[memberIndex].email = user.email || "";
        next[memberIndex].phoneNumber = user.phoneNumber || "";
        next[memberIndex].cohort = user.studentId ? user.studentId.substring(0, 2) : "";
        next[memberIndex].clazz = user.major || "";
        return next;
      });

      setValidationSuccess((prev) => ({ ...prev, [key]: "" }));
      setValidationErrors((prev) => ({ ...prev, [key]: "" }));
    } catch {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "MSSV chưa đăng ký tài khoản trên hệ thống.",
      }));
      setValidationSuccess((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleClubImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await clubRegistrationApi.uploadCardImage(file, "club-logo");
      setFormData((prev) => ({
        ...prev,
        clubImage: res.url,
        clubImagePublicId: res.publicId ?? res.data?.publicId ?? "",
      }));
    } catch {
      fail("Không thể tải lên ảnh đại diện CLB. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, memberIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const res = await clubRegistrationApi.uploadCardImage(file, "member-card");
      const url = res.url;

      setFoundingMembers((prev) => {
        const next = [...prev];
        next[memberIndex].cardImage = url;
        next[memberIndex].cardImagePublicId = res.publicId ?? res.data?.publicId ?? "";
        return next;
      });
    } catch {
      fail("Không thể tải lên ảnh thẻ sinh viên. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setFoundingMembers((prev) => [
      ...prev,
      { proposedRole: "Member", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "", cardImagePublicId: "" },
    ]);
  };

  const removeMember = (index) => {
    if (foundingMembers.length <= 5) {
      fail("Đơn đăng ký yêu cầu tối thiểu 5 nhân sự (1 Chủ nhiệm, 1 Phó chủ nhiệm, 3 Thành viên sáng lập).");
      return;
    }
    setFoundingMembers((prev) => prev.filter((_, i) => i !== index));
    const key = `member_${index}`;
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleMemberChange = (index, field) => (e) => {
    const val = e.target.value;
    setFoundingMembers((prev) => {
      const next = [...prev];
      next[index][field] = val;
      return next;
    });

    if (field === "studentId") {
      checkStudentId(val, index);
    }
  };

  const handleSubmit = async () => {
    if (!formData.orgStructure.trim()) {
      fail("Vui lòng điền Sơ đồ tổ chức & Dự kiến nhân sự.");
      return;
    }

    setError("");
    setLoading(true);

    const payload = {
      ...formData,
      foundingMembers: foundingMembers,
    };

    try {
      await clubRegistrationApi.submit(payload);
      setSuccess(true);
    } catch (err) {
      let errMsg = err.response?.data?.message || err.response?.data?.error || "Nộp đơn đăng ký thất bại.";
      
      // Translate common backend error messages to friendly Vietnamese
      if (errMsg.includes("Proposed Leader already leads another club in this semester")) {
        errMsg = "Sinh viên được chọn làm Chủ nhiệm đã là Chủ nhiệm của một CLB khác trong học kỳ này.";
      } else if (errMsg.includes("Club code already exists")) {
        errMsg = "Mã câu lạc bộ đã tồn tại trong hệ thống. Vui lòng chọn mã khác.";
      } else if (errMsg.includes("Club name already exists")) {
        errMsg = "Tên câu lạc bộ đã tồn tại trong hệ thống. Vui lòng chọn tên khác.";
      } else if (errMsg.includes("Active semester not found")) {
        errMsg = "Không tìm thấy học kỳ đang hoạt động trong hệ thống.";
      } else if (errMsg.includes("Proposed Vice Leader already leads another club")) {
        errMsg = "Sinh viên được chọn làm Phó chủ nhiệm đã là Chủ nhiệm của một CLB khác.";
      } else if (errMsg.includes("Proposed founding member has too many club memberships")) {
        errMsg = "Có thành viên sáng lập đã tham gia quá giới hạn số lượng CLB (tối đa 4 CLB).";
      } else if (errMsg.includes("Proposed Leader has active discipline log")) {
        errMsg = "Sinh viên được chọn làm Chủ nhiệm đang có biên bản kỷ luật hoạt động.";
      } else if (errMsg.includes("Proposed Vice Leader has active discipline log")) {
        errMsg = "Sinh viên được chọn làm Phó chủ nhiệm đang có biên bản kỷ luật hoạt động.";
      }

      fail(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role, idx) => {
    if (role === "Leader") return "Chủ nhiệm CLB (Leader)";
    if (role === "ViceLeader") return "Phó chủ nhiệm CLB (Vice Leader)";
    return `Thành viên sáng lập #${idx - 1}`;
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none font-[inherit] transition-colors focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  if (success) {
    return (
      <div className="max-w-[1000px] mx-auto px-5 py-10 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-4">
          <CheckCircle size={64} color="#10b981" />
          <h2 className="text-2xl font-bold text-slate-900">
            {isStaffMode ? "Tạo Câu Lạc Bộ Thành Công!" : "Nộp Đơn Đăng Ký Thành Công!"}
          </h2>
          <p className="text-slate-500 max-w-[500px] leading-relaxed">
            {isStaffMode
              ? `CLB ${formData.clubName} đã được tạo và kích hoạt với đội ngũ sáng lập.`
              : `Đơn thành lập câu lạc bộ ${formData.clubName} đã được gửi thành công đến phòng ICPDP.`}
          </p>
          <button
            className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white border-none px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-colors hover:bg-blue-700"
            onClick={() => navigate(isStaffMode ? "/icpdp/club-management" : "/member/clubs")}
          >
            {isStaffMode ? "Về trang quản lý CLB" : "Về trang danh sách CLB"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-2.5">
      <div className="page-header mb-6">
        <h1 className="page-title">{isStaffMode ? "Tạo Câu Lạc Bộ" : "Đăng Ký Thành Lập CLB"}</h1>
        <p className="page-subtitle">
          {isStaffMode
            ? "Tạo CLB mới và gán đội ngũ sáng lập trực tiếp"
            : "Nộp đơn đăng ký thành lập câu lạc bộ mới trực tiếp lên ban quản lý ICPDP"}
        </p>
      </div>

      {/* Progress Wizard */}
      <div className="flex justify-between items-center mb-[30px] relative px-10">
        <div className="absolute top-5 left-[60px] right-[60px] h-0.5 bg-slate-200 z-[1]" />

        {[
          { num: 1, icon: Compass, label: "Thông tin chung" },
          { num: 2, icon: Users,   label: "Đội ngũ sáng lập" },
          { num: 3, icon: FileText,label: "Phương án hoạt động" },
        ].map(({ num, icon: Icon, label }) => {
          const isActive    = step === num;
          const isCompleted = step > num;
          return (
            <div
              key={num}
              className="relative z-[2] flex flex-col items-center cursor-pointer"
              onClick={() => num < step && setStep(num)}
            >
              <div
                className={`w-[42px] h-[42px] rounded-full border-2 flex items-center justify-center font-semibold transition-all shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-500"
                }`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`mt-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "text-slate-900 font-semibold"
                    : isCompleted
                    ? "text-emerald-500"
                    : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <AlertModal
          type="error"
          title="Không thể tiếp tục"
          message={error}
          confirmLabel="Đã hiểu"
          onClose={() => setError("")}
        />
      )}

      {/* BƯỚC 1 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-[30px] mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5 border-l-4 border-blue-600 pl-2.5 flex items-center gap-2">
            <Compass size={18} />
            PHẦN 1: THÔNG TIN CHUNG VỀ CÂU LẠC BỘ
          </h2>

          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label className={labelCls}>Tên Câu lạc bộ (Tiếng Việt) <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="Ví dụ: CLB Lập Trình F-Code" value={formData.clubName} onChange={handleChange("clubName")} />
            </div>

            <div>
              <label className={labelCls}>Mã Câu lạc bộ (Viết tắt) <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="Ví dụ: FCODE" value={formData.clubCode} onChange={handleChange("clubCode")} />
              <p className="text-xs text-slate-500 mt-1">Mã viết tắt viết hoa dùng trên hệ thống, không chứa khoảng trắng</p>
            </div>

            <div>
              <label className={labelCls}>Tên Câu lạc bộ (Tiếng Anh/Phụ)</label>
              <input className={inputCls} placeholder="Ví dụ: F-Code Programming Club" value={formData.clubNameEn} onChange={handleChange("clubNameEn")} />
            </div>

            <div>
              <label className={labelCls}>Lĩnh vực hoạt động <span className="text-red-500">*</span></label>
              <select
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm outline-none font-[inherit] transition-colors focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                value={formData.category}
                onChange={handleChange("category")}
              >
                {CLUB_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Mô tả ngắn về CLB</label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={2}
                placeholder="Mô tả ngắn gọn về CLB dùng để hiển thị trên danh sách tìm kiếm..."
                value={formData.description}
                onChange={handleChange("description")}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Sứ mệnh & Mục tiêu hoạt động <span className="text-red-500">*</span></label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={3}
                placeholder="Mô tả chi tiết các giá trị mang lại cho sinh viên trường Đại học FPT..."
                value={formData.mission}
                onChange={handleChange("mission")}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Điểm khác biệt / Lý do trường cần CLB này <span className="text-red-500">*</span></label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={3}
                placeholder="Làm rõ tính độc nhất so với các CLB học thuật, nghệ thuật hiện có tại FPTU..."
                value={formData.uniqueness}
                onChange={handleChange("uniqueness")}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Ảnh đại diện CLB (Logo) <span className="text-red-500">*</span></label>
              {formData.clubImage ? (
                <div className="relative w-fit">
                  <img
                    src={getImageUrl(formData.clubImage)}
                    alt="Club logo"
                    className="w-[140px] h-[140px] object-cover rounded-xl border border-slate-200 mt-1"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-sm hover:bg-red-600"
                    onClick={() => setFormData((prev) => ({ ...prev, clubImage: "", clubImagePublicId: "" }))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer bg-slate-50 transition-all min-h-[120px] flex flex-col items-center justify-center hover:border-blue-600 hover:bg-slate-100">
                  <Upload size={24} className="text-slate-500 mb-2" />
                  <span className="text-sm font-medium text-slate-700">Chọn ảnh logo CLB (.jpg, .png)</span>
                  <span className="text-xs text-slate-400 mt-1">Khuyến nghị: ảnh vuông, tối thiểu 200×200px</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleClubImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-[30px]">
            <button
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white border-none px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-colors hover:bg-blue-700"
              onClick={() => {
                if (!formData.clubName || !formData.clubCode || !formData.mission || !formData.uniqueness) {
                  fail("Vui lòng điền đầy đủ các mục thông tin bắt buộc (*).");
                  return;
                }
                if (!formData.clubImage) {
                  fail("Vui lòng tải lên ảnh đại diện (logo) cho CLB.");
                  return;
                }
                setError("");
                setStep(2);
              }}
            >
              Tiếp tục <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 2 */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-[30px] mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5 border-l-4 border-blue-600 pl-2.5 flex items-center gap-2">
            <Users size={18} />
            PHẦN 2: ĐỘI NGŨ SÁNG LẬP & XÁC THỰC NHÂN SỰ
          </h2>

          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-emerald-200 bg-green-50 text-green-800 text-[13px] mb-5">
            <ShieldCheck size={18} />
            <span>
              <strong>Lưu ý quan trọng:</strong> Hệ thống tự động kiểm định xem MSSV nhập vào có tồn tại hay không, và kiểm tra giới hạn tham gia quá 4 CLB trong kỳ.
            </span>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
              Danh sách nhân sự sáng lập
            </h3>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all mb-5 hover:bg-slate-200 hover:text-slate-900"
              onClick={addMember}
            >
              <Plus size={14} /> Thêm thành viên
            </button>
          </div>

          {foundingMembers.map((member, idx) => (
            <div
              key={idx}
              className="border border-slate-200 bg-slate-50 rounded-xl p-5 mb-6 relative border-b border-slate-200 pb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="bg-blue-600 text-white w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-xs text-center">
                    {idx + 1}
                  </span>
                  {getRoleLabel(member.proposedRole, idx)}
                </h3>
                {member.proposedRole === "Member" && (
                  <button
                    type="button"
                    className="text-red-500 bg-transparent border-none cursor-pointer text-[13px] font-medium flex items-center gap-1 hover:underline"
                    onClick={() => removeMember(idx)}
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Mã số sinh viên (MSSV) <span className="text-red-500">*</span></label>
                  <input
                    className={inputCls}
                    placeholder="Ví dụ: SE170001"
                    value={member.studentId}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      handleMemberChange(idx, "studentId")({ target: { value: val }});
                    }}
                  />
                  {validationErrors[`member_${idx}`] && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors[`member_${idx}`]}</p>
                  )}
                  {validationSuccess[`member_${idx}`] && (
                    <p className="text-emerald-500 text-xs mt-1">{validationSuccess[`member_${idx}`]}</p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Họ và tên <span className="text-red-500">*</span></label>
                  <input className={`${inputCls} bg-gray-50`} placeholder="Tên tự động điền" value={member.fullName} disabled />
                </div>

                <div>
                  <label className={labelCls}>Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                  <input className={inputCls} placeholder="Nhập số điện thoại" value={member.phoneNumber} onChange={handleMemberChange(idx, "phoneNumber")} />
                </div>

                <div>
                  <label className={labelCls}>Email trường <span className="text-red-500">*</span></label>
                  <input className={`${inputCls} bg-gray-50`} placeholder="Email tự động điền" value={member.email} disabled />
                </div>

                <div>
                  <label className={labelCls}>Khóa & Lớp</label>
                  <input
                    className={`${inputCls} bg-gray-50`}
                    placeholder="Ví dụ: K17 - SE"
                    value={`${member.cohort ? "K" + member.cohort : ""} - ${member.clazz || ""}`}
                    disabled
                  />
                </div>

                <div>
                  <label className={labelCls}>Link Facebook cá nhân</label>
                  <input className={inputCls} placeholder="Ví dụ: facebook.com/profile" value={member.facebookLink} onChange={handleMemberChange(idx, "facebookLink")} />
                </div>

                <div className="col-span-2">
                  <label className={labelCls}>
                    Minh chứng thẻ sinh viên (Mặt trước){" "}
                    {!isStaffMode && member.proposedRole !== "Member" && <span className="text-red-500">*</span>}
                  </label>
                  {member.cardImage ? (
                    <div className="relative w-full max-w-[350px]">
                      <img
                        src={getImageUrl(member.cardImage)}
                        alt="Thẻ SV"
                        className="w-full max-h-[200px] object-contain rounded-lg border border-slate-200 mt-2.5"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-sm transition-transform hover:scale-110 hover:bg-red-600"
                        onClick={() => {
                          setFoundingMembers((prev) => {
                            const next = [...prev];
                            next[idx].cardImage = "";
                            next[idx].cardImagePublicId = "";
                            return next;
                          });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer bg-slate-50 transition-all min-h-[140px] flex flex-col items-center justify-center relative hover:border-blue-600 hover:bg-slate-100">
                      <Upload size={24} className="text-slate-500 mb-2" />
                      <span className="text-sm font-medium text-slate-700">Chọn file ảnh để tải lên (.jpg, .png)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, idx)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-[30px]">
            <button
              className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-400"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white border-none px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-colors hover:bg-blue-700"
              onClick={() => {
                for (let i = 0; i < foundingMembers.length; i++) {
                  const m = foundingMembers[i];
                  if (!m.studentId || !m.fullName || !m.phoneNumber || !m.email) {
                    fail(`Thành viên số ${i + 1} chưa điền đầy đủ thông tin bắt buộc.`);
                    return;
                  }
                  if (!isStaffMode && m.proposedRole !== "Member" && !m.cardImage) {
                    fail(`Chủ nhiệm/Phó chủ nhiệm (Thành viên ${i + 1}) phải có ảnh minh chứng thẻ sinh viên.`);
                    return;
                  }
                }

                const seenStudentIds = new Map();
                for (let i = 0; i < foundingMembers.length; i++) {
                  const id = foundingMembers[i].studentId.trim().toUpperCase();
                  if (seenStudentIds.has(id)) {
                    fail(`Mã số sinh viên "${foundingMembers[i].studentId}" bị trùng giữa thành viên số ${seenStudentIds.get(id) + 1} và số ${i + 1}. Mỗi thành viên sáng lập phải là một sinh viên khác nhau.`);
                    return;
                  }
                  seenStudentIds.set(id, i);
                }

                const phoneRegex = /^(0[35789])[0-9]{8}$/;
                const cleanedPhones = [];
                for (let i = 0; i < foundingMembers.length; i++) {
                  const m = foundingMembers[i];
                  const phoneDigits = m.phoneNumber.replace(/\s+/g, "");
                  if (phoneDigits.length < 10) {
                    fail(`Số điện thoại thành viên số ${i + 1} không hợp lệ (Số điện thoại phải có ít nhất 10 chữ số).`);
                    return;
                  }
                  if (!phoneRegex.test(phoneDigits)) {
                    fail(`Số điện thoại thành viên số ${i + 1} không hợp lệ (Số điện thoại phải bắt đầu bằng 03|05|07|08|09).`);
                    return;
                  }
                  cleanedPhones.push(phoneDigits);
                }
                const hasErrors = Object.values(validationErrors).some((err) => !!err);
                if (hasErrors) {
                  fail("Có lỗi xác thực MSSV. Vui lòng kiểm tra lại danh sách mã sinh viên.");
                  return;
                }

                // Lưu lại số điện thoại đã loại bỏ khoảng trắng — tránh gửi lên backend
                // giá trị chứa khoảng trắng khiến regex phía server luôn từ chối.
                setFoundingMembers((prev) => prev.map((m, i) => ({ ...m, phoneNumber: cleanedPhones[i] })));

                setError("");
                setStep(3);
              }}
            >
              Tiếp tục <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 3 */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-[30px] mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5 border-l-4 border-blue-600 pl-2.5 flex items-center gap-2">
            <FileText size={18} />
            PHẦN 3: CƠ CẤU TỔ CHỨC & KẾ HOẠCH HOẠT ĐỘNG
          </h2>

          <div className="grid grid-cols-2 gap-5 mb-6">
            <div className="col-span-2">
              <label className={labelCls}>Sơ đồ tổ chức & Dự kiến nhân sự <span className="text-red-500">*</span></label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={4}
                placeholder="Ví dụ: Ban chuyên môn gồm Ban Truyền thông (dự kiến 5 người), Ban Nội dung (dự kiến 5 người), Hậu cần (4 người)..."
                value={formData.orgStructure}
                onChange={handleChange("orgStructure")}
              />
            </div>

            <div>
              <label className={labelCls}>Tần suất sinh hoạt định kỳ <span className="text-red-500">*</span></label>
              <select
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm outline-none font-[inherit] transition-colors focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                value={formData.meetingFrequency}
                onChange={handleChange("meetingFrequency")}
              >
                <option value="1 lần / tuần">1 lần / tuần</option>
                <option value="2 lần / tuần">2 lần / tuần</option>
                <option value="1 lần / tháng">1 lần / tháng</option>
                <option value="Khác">Khác (Liên hệ cụ thể)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Địa điểm sinh hoạt dự kiến <span className="text-red-500">*</span></label>
              <select
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm outline-none font-[inherit] transition-colors focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                value={formData.meetingLocation}
                onChange={handleChange("meetingLocation")}
              >
                <option value="Phòng học trống của trường">Phòng học trống của trường (Đăng ký theo lịch)</option>
                <option value="Sân trường / Khu vực chung">Sân trường / Khu vực chung</option>
                <option value="Online qua MS Teams / Zoom">Online qua các nền tảng (MS Teams, Zoom...)</option>
                <option value="Khác">Khác (Địa điểm ngoài trường)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Phương án tài chính dự kiến <span className="text-red-500">*</span></label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={2}
                placeholder="Mô tả nguồn quỹ hoạt động: Thu quỹ thành viên, Tài trợ ngoài, Hỗ trợ từ nhà trường..."
                value={formData.financialPlan}
                onChange={handleChange("financialPlan")}
              />
            </div>
          </div>

          <div className="flex justify-between mt-[30px]">
            <button
              className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-400"
              onClick={() => setStep(2)}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white border-none px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (isStaffMode ? "Đang tạo CLB..." : "Đang gửi đơn...") : (isStaffMode ? "Tạo câu lạc bộ" : "Gửi đơn đăng ký")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
