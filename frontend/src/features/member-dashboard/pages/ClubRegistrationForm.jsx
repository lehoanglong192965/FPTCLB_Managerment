import { useState, useEffect } from "react";
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
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import clubRegistrationApi from "../../../services/api/clubRegistrationApi";
import axiosClient from "../../../services/api/axiosClient";
import "../../../assets/css/clubRegistration.css";

const CATEGORIES = ["IT", "Music", "Sports", "Art", "Culture", "Kỹ thuật", "Ngôn ngữ", "Học thuật", "Cộng đồng", "Khác"];

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const origin = apiBase.replace(/\/api\/?$/, ""); // strip /api
  return `${origin}${url}`;
};

export default function ClubRegistrationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clubCode: "",
    clubName: "",
    clubNameEn: "",
    category: "Academic",
    description: "",
    mission: "",
    uniqueness: "",
    orgStructure: "",
    meetingFrequency: "1 lần / tuần",
    meetingLocation: "Phòng học trống của trường",
    financialPlan: "Thu quỹ thành viên",
  });

  // Founding Members (At least 5 required)
  const [foundingMembers, setFoundingMembers] = useState([
    { proposedRole: "Leader", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "" },
    { proposedRole: "ViceLeader", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "" },
    { proposedRole: "Member", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "" },
    { proposedRole: "Member", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "" },
    { proposedRole: "Member", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "" },
  ]);

  // Validation messages for student IDs
  const [validationErrors, setValidationErrors] = useState({});
  const [validationSuccess, setValidationSuccess] = useState({});

  // Helper to update basic form fields
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Helper to validate and auto-complete user profile by Student ID
  const checkStudentId = async (studentId, memberIndex) => {
    const trimmedId = studentId.trim();
    const key = `member_${memberIndex}`;

    if (trimmedId.length < 8) {
      setValidationErrors((prev) => ({ ...prev, [key]: "" }));
      setValidationSuccess((prev) => ({ ...prev, [key]: "" }));
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

      setValidationSuccess((prev) => ({ ...prev, [key]: `Đã tìm thấy: ${user.fullName}` }));
      setValidationErrors((prev) => ({ ...prev, [key]: "" }));
    } catch (err) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "MSSV chưa đăng ký tài khoản trên hệ thống.",
      }));
      setValidationSuccess((prev) => ({ ...prev, [key]: "" }));
    }
  };

  // Handle student card image upload
  const handleImageUpload = async (e, memberIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const res = await clubRegistrationApi.uploadCardImage(file);
      const url = res.url;

      setFoundingMembers((prev) => {
        const next = [...prev];
        next[memberIndex].cardImage = url;
        return next;
      });
    } catch (err) {
      setError("Không thể tải lên ảnh thẻ sinh viên. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Add founding member slot
  const addMember = () => {
    setFoundingMembers((prev) => [
      ...prev,
      { proposedRole: "Member", studentId: "", fullName: "", email: "", phoneNumber: "", cohort: "", clazz: "", facebookLink: "", cardImage: "" },
    ]);
  };

  // Remove founding member slot
  const removeMember = (index) => {
    if (foundingMembers.length <= 5) {
      alert("Đơn đăng ký yêu cầu tối thiểu 5 nhân sự (1 Chủ nhiệm, 1 Phó chủ nhiệm, 3 Thành viên sáng lập).");
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

  // Edit founding member field
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

  // Form submission
  const handleSubmit = async () => {
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
      setError(err.response?.data?.error || err.response?.data?.message || "Nộp đơn đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role, idx) => {
    if (role === "Leader") return "Chủ nhiệm CLB (Leader)";
    if (role === "ViceLeader") return "Phó chủ nhiệm CLB (Vice Leader)";
    return `Thành viên sáng lập #${idx - 1}`;
  };

  if (success) {
    return (
      <div className="cr-container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="cr-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <CheckCircle size={64} color="#10b981" />
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a" }}>Nộp Đơn Đăng Ký Thành Công!</h2>
          <p style={{ color: "#64748b", maxWidth: "500px", lineHeight: "1.6" }}>
            Đơn thành lập câu lạc bộ **{formData.clubName}** đã được gửi thành công đến phòng ICPDP.
            Chúng tôi sẽ tiến hành kiểm định và phản hồi sớm nhất qua hòm thư của bạn.
          </p>
          <button
            className="cr-btn-next"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/member/clubs")}
          >
            Về trang danh sách CLB
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-container">
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <h1 className="page-title">Đăng Ký Thành Lập CLB</h1>
        <p className="page-subtitle">Nộp đơn đăng ký thành lập câu lạc bộ mới trực tiếp lên ban quản lý ICPDP</p>
      </div>

      {/* Progress Wizard */}
      <div className="cr-steps">
        <div className={`cr-step-item ${step === 1 ? "active" : step > 1 ? "completed" : ""}`} onClick={() => setStep(1)}>
          <div className="cr-step-circle">
            <Compass size={18} />
          </div>
          <span className="cr-step-label">Thông tin chung</span>
        </div>

        <div className={`cr-step-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`} onClick={() => step > 1 && setStep(2)}>
          <div className="cr-step-circle">
            <Users size={18} />
          </div>
          <span className="cr-step-label">Đội ngũ sáng lập</span>
        </div>

        <div className={`cr-step-item ${step === 3 ? "active" : ""}`} onClick={() => step > 2 && setStep(3)}>
          <div className="cr-step-circle">
            <FileText size={18} />
          </div>
          <span className="cr-step-label">Phương án hoạt động</span>
        </div>
      </div>

      {error && (
        <div className="cr-validation-card invalid" style={{ marginBottom: "20px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── BƯỚC 1: THÔNG TIN CHUNG CỦA CLB ── */}
      {step === 1 && (
        <div className="cr-card">
          <h2 className="cr-section-title">
            <Compass size={18} />
            PHẦN 1: THÔNG TIN CHUNG VỀ CÂU LẠC BỘ
          </h2>

          <div className="cr-form-grid">
            <div className="cr-form-field">
              <label className="pr-label">Tên Câu lạc bộ (Tiếng Việt) <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                className="cm-input"
                placeholder="Ví dụ: CLB Lập Trình F-Code"
                value={formData.clubName}
                onChange={handleChange("clubName")}
              />
            </div>

            <div className="cr-form-field">
              <label className="pr-label">Mã Câu lạc bộ (Viết tắt) <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                className="cm-input"
                placeholder="Ví dụ: FCODE"
                value={formData.clubCode}
                onChange={handleChange("clubCode")}
              />
              <p className="cr-field-hint">Mã viết tắt viết hoa dùng trên hệ thống, không chứa khoảng trắng</p>
            </div>

            <div className="cr-form-field">
              <label className="pr-label">Tên Câu lạc bộ (Tiếng Anh/Phụ) </label>
              <input
                className="cm-input"
                placeholder="Ví dụ: F-Code Programming Club"
                value={formData.clubNameEn}
                onChange={handleChange("clubNameEn")}
              />
            </div>

            <div className="cr-form-field">
              <label className="pr-label">Lĩnh vực hoạt động <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                className="cm-filter-select"
                style={{ width: "100%", height: "42px", padding: "0 12px" }}
                value={formData.category}
                onChange={handleChange("category")}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="cr-form-field cr-full-width">
              <label className="pr-label">Mô tả ngắn về CLB</label>
              <textarea
                className="pr-textarea"
                rows={2}
                placeholder="Mô tả ngắn gọn về CLB dùng để hiển thị trên danh sách tìm kiếm..."
                value={formData.description}
                onChange={handleChange("description")}
              />
            </div>

            <div className="cr-form-field cr-full-width">
              <label className="pr-label">Sứ mệnh & Mục tiêu hoạt động <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                className="pr-textarea"
                rows={3}
                placeholder="Mô tả chi tiết các giá trị mang lại cho sinh viên trường Đại học FPT..."
                value={formData.mission}
                onChange={handleChange("mission")}
              />
            </div>

            <div className="cr-form-field cr-full-width">
              <label className="pr-label">Điểm khác biệt / Lý do trường cần CLB này <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                className="pr-textarea"
                rows={3}
                placeholder="Làm rõ tính độc nhất so với các CLB học thuật, nghệ thuật hiện có tại FPTU..."
                value={formData.uniqueness}
                onChange={handleChange("uniqueness")}
              />
            </div>
          </div>

          <div className="cr-actions" style={{ justifyContent: "flex-end" }}>
            <button
              className="cr-btn-next"
              onClick={() => {
                if (!formData.clubName || !formData.clubCode || !formData.mission || !formData.uniqueness) {
                  setError("Vui lòng điền đầy đủ các mục thông tin bắt buộc (*).");
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

      {/* ── BƯỚC 2: BAN ĐIỀU HÀNH & NHÂN SỰ SÁNG LẬP ── */}
      {step === 2 && (
        <div className="cr-card">
          <h2 className="cr-section-title">
            <Users size={18} />
            PHẦN 2: ĐỘI NGŨ SÁNG LẬP & XÁC THỰC NHÂN SỰ
          </h2>

          <div className="cr-validation-card valid" style={{ marginBottom: "20px" }}>
            <ShieldCheck size={18} />
            <span>
              <strong>Lưu ý quan trọng:</strong> Hệ thống tự động kiểm định xem MSSV nhập vào có tồn tại hay không, và kiểm tra giới hạn tham gia quá 4 CLB trong kỳ.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              Danh sách nhân sự sáng lập
            </h3>
            <button type="button" className="cr-btn-add" onClick={addMember}>
              <Plus size={14} /> Thêm thành viên
            </button>
          </div>

          {foundingMembers.map((member, idx) => (
            <div key={idx} className="cr-member-card" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "24px", marginBottom: "24px" }}>
              <div className="cr-member-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ background: "#2563eb", color: "#fff", width: "22px", height: "22px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", textAlign: "center" }}>{idx + 1}</span>
                  {getRoleLabel(member.proposedRole, idx)}
                </h3>
                {member.proposedRole === "Member" && (
                  <button type="button" className="cr-btn-remove-member" onClick={() => removeMember(idx)}>
                    <Trash2 size={14} /> Xóa
                  </button>
                )}
              </div>

              <div className="cr-form-grid">
                <div className="cr-form-field">
                  <label className="pr-label">Mã số sinh viên (MSSV) <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="cm-input"
                    placeholder="Ví dụ: SE170001"
                    value={member.studentId}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      handleMemberChange(idx, "studentId")({ target: { value: val }});
                    }}
                  />
                  {validationErrors[`member_${idx}`] && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{validationErrors[`member_${idx}`]}</p>}
                  {validationSuccess[`member_${idx}`] && <p style={{ color: "#10b981", fontSize: "12px", marginTop: "4px" }}>{validationSuccess[`member_${idx}`]}</p>}
                </div>

                <div className="cr-form-field">
                  <label className="pr-label">Họ và tên <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="cm-input"
                    placeholder="Tên tự động điền"
                    value={member.fullName}
                    disabled
                  />
                </div>

                <div className="cr-form-field">
                  <label className="pr-label">Số điện thoại liên hệ <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="cm-input"
                    placeholder="Nhập số điện thoại"
                    value={member.phoneNumber}
                    onChange={handleMemberChange(idx, "phoneNumber")}
                  />
                </div>

                <div className="cr-form-field">
                  <label className="pr-label">Email trường <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    className="cm-input"
                    placeholder="Email tự động điền"
                    value={member.email}
                    disabled
                  />
                </div>

                <div className="cr-form-field">
                  <label className="pr-label">Khóa & Lớp</label>
                  <input
                    className="cm-input"
                    placeholder="Ví dụ: K17 - SE"
                    value={`${member.cohort ? "K" + member.cohort : ""} - ${member.clazz || ""}`}
                    disabled
                  />
                </div>

                <div className="cr-form-field">
                  <label className="pr-label">Link Facebook cá nhân</label>
                  <input
                    className="cm-input"
                    placeholder="Ví dụ: facebook.com/profile"
                    value={member.facebookLink}
                    onChange={handleMemberChange(idx, "facebookLink")}
                  />
                </div>

                <div className="cr-form-field cr-full-width">
                  <label className="pr-label">Minh chứng thẻ sinh viên (Mặt trước) {member.proposedRole !== "Member" && <span style={{ color: "#ef4444" }}>*</span>}</label>
                  {member.cardImage ? (
                    <div style={{ position: "relative", width: "100%", maxWidth: "350px" }}>
                      <img src={getImageUrl(member.cardImage)} alt="Thẻ SV" className="cr-upload-preview" />
                      <button type="button" className="cr-upload-remove" onClick={() => handleMemberChange(idx, "cardImage")({ target: { value: "" }})}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="cr-upload-zone">
                      <Upload size={24} style={{ color: "#64748b", marginBottom: "8px" }} />
                      <span style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>Chọn file ảnh để tải lên (.jpg, .png)</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleImageUpload(e, idx)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="cr-actions">
            <button className="cr-btn-prev" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button
              className="cr-btn-next"
              onClick={() => {
                // Check all members
                for (let i = 0; i < foundingMembers.length; i++) {
                  const m = foundingMembers[i];
                  if (!m.studentId || !m.fullName || !m.phoneNumber || !m.email) {
                    setError(`Thành viên số ${i + 1} chưa điền đầy đủ thông tin bắt buộc.`);
                    return;
                  }
                  if (m.proposedRole !== "Member" && !m.cardImage) {
                    setError(`Chủ nhiệm/Phó chủ nhiệm (Thành viên ${i + 1}) phải có ảnh minh chứng thẻ sinh viên.`);
                    return;
                  }
                }

                // Check phone formats
                const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
                for (let i = 0; i < foundingMembers.length; i++) {
                  const m = foundingMembers[i];
                  if (!phoneRegex.test(m.phoneNumber)) {
                    setError(`Số điện thoại thành viên số ${i + 1} không hợp lệ (phải gồm 10 chữ số).`);
                    return;
                  }
                }

                // Check validation errors
                const hasErrors = Object.values(validationErrors).some((err) => !!err);
                if (hasErrors) {
                  setError("Có lỗi xác thực MSSV. Vui lòng kiểm tra lại danh sách mã sinh viên.");
                  return;
                }

                setError("");
                setStep(3);
              }}
            >
              Tiếp tục <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3: CƠ CẤU HOẠT ĐỘNG & TÀI CHÍNH ── */}
      {step === 3 && (
        <div className="cr-card">
          <h2 className="cr-section-title">
            <FileText size={18} />
            PHẦN 3: CƠ CẤU TỔ CHỨC & KẾ HOẠCH HOẠT ĐỘNG
          </h2>

          <div className="cr-form-grid">
            <div className="cr-form-field cr-full-width">
              <label className="pr-label">Sơ đồ tổ chức & Dự kiến nhân sự <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                className="pr-textarea"
                rows={4}
                placeholder="Ví dụ: Ban chuyên môn gồm Ban Truyền thông (dự kiến 5 người), Ban Nội dung (dự kiến 5 người), Hậu cần (4 người)..."
                value={formData.orgStructure}
                onChange={handleChange("orgStructure")}
              />
            </div>

            <div className="cr-form-field">
              <label className="pr-label">Tần suất sinh hoạt định kỳ <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                className="cm-filter-select"
                style={{ width: "100%", height: "42px", padding: "0 12px" }}
                value={formData.meetingFrequency}
                onChange={handleChange("meetingFrequency")}
              >
                <option value="1 lần / tuần">1 lần / tuần</option>
                <option value="2 lần / tuần">2 lần / tuần</option>
                <option value="1 lần / tháng">1 lần / tháng</option>
                <option value="Khác">Khác (Liên hệ cụ thể)</option>
              </select>
            </div>

            <div className="cr-form-field">
              <label className="pr-label">Địa điểm sinh hoạt dự kiến <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                className="cm-filter-select"
                style={{ width: "100%", height: "42px", padding: "0 12px" }}
                value={formData.meetingLocation}
                onChange={handleChange("meetingLocation")}
              >
                <option value="Phòng học trống của trường">Phòng học trống của trường (Đăng ký theo lịch)</option>
                <option value="Sân trường / Khu vực chung">Sân trường / Khu vực chung</option>
                <option value="Online qua MS Teams / Zoom">Online qua các nền tảng (MS Teams, Zoom...)</option>
                <option value="Khác">Khác (Địa điểm ngoài trường)</option>
              </select>
            </div>

            <div className="cr-form-field cr-full-width">
              <label className="pr-label">Phương án tài chính dự kiến <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                className="pr-textarea"
                rows={2}
                placeholder="Mô tả nguồn quỹ hoạt động: Thu quỹ thành viên, Tài trợ ngoài, Hỗ trợ từ nhà trường..."
                value={formData.financialPlan}
                onChange={handleChange("financialPlan")}
              />
            </div>
          </div>

          <div className="cr-actions">
            <button className="cr-btn-prev" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button
              className="cr-btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Đang gửi đơn..." : "Gửi đơn đăng ký"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
