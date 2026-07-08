import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Check,
  Send, CalendarDays, FileText, CheckCircle2, ImagePlus, UploadCloud, Globe, Lock, X,
} from "lucide-react";
import eventService from "../../services/api/events/eventService";
import semesterApi from "../../services/api/admin/semesterApi";
import { TokenService, getServerOrigin } from "../../services/api/axiosClient";
import clubRegistrationApi from "../../services/api/clubs/clubRegistrationApi";
import { useToast } from "../../contexts/ToastContext";

/* ─── Constants ─────────────────────────────────────────────── */

const STEPS = [
  { id: 1, label: "Thông tin cơ bản"     },
  { id: 2, label: "Thời gian & Địa điểm" },
  { id: 3, label: "Xác nhận & Gửi"       },
];

const EMPTY_FORM = {
  name: "", desc: "", budget: "", banner: null,
  isInternal: false, maxParticipants: "",
  date: "", startTime: "", endTime: "", location: "",
};

const BUDGET_LIMIT = 5_000_000;
const fmtVND = (val) => {
  const n = Number(String(val).replace(/\D/g, ""));
  return isNaN(n) ? "" : n.toLocaleString("vi-VN");
};

/* ─── Shared UI helpers ──────────────────────────────────────── */

function Label({ children, required }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "#e11d48", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
      <span>⚠</span> {msg}
    </p>
  );
}

function inputStyle(error) {
  return {
    width: "100%", padding: "9px 12px", fontSize: 13.5, color: "#111827",
    border: `1.5px solid ${error ? "#f87171" : "#e5e7eb"}`,
    borderRadius: 10, outline: "none", background: error ? "#fff5f5" : "#fff",
    boxSizing: "border-box", transition: "border-color .15s",
  };
}

/* ─── Step bar ───────────────────────────────────────────────── */

function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const done   = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14,
                border: `2px solid ${done ? "#059669" : active ? "#E6430A" : "#d1d5db"}`,
                background: done ? "#059669" : active ? "#E6430A" : "#fff",
                color: done || active ? "#fff" : "#9ca3af",
                transition: "all .25s",
              }}>
                {done ? <Check size={16} strokeWidth={3} /> : s.id}
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                color: done ? "#059669" : active ? "#E6430A" : "#9ca3af",
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 12px", marginBottom: 26,
                background: done ? "#059669" : "#e5e7eb", transition: "background .25s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Banner upload ──────────────────────────────────────────── */

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

function BannerUpload({ value, onChange }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB."); return; }
    setUploading(true);
    try {
      const res = await clubRegistrationApi.uploadCardImage(file);
      onChange(res.url || res);
    } catch (err) {
      console.error("[BannerUpload] Upload thất bại:", err);
      toast.error("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>Banner sự kiện</Label>
      {uploading ? (
        <div style={{ borderRadius: 12, border: "1.5px solid #e5e7eb", height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", flexDirection: "column", gap: 8 }}>
          <UploadCloud size={24} style={{ color: "#E6430A" }} />
          <span style={{ fontSize: 13, color: "#6b7280" }}>Đang tải ảnh lên...</span>
        </div>
      ) : value ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
          <img src={getImageUrl(value)} alt="Banner" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
          <button
            type="button"
            onClick={() => { onChange(null); if (fileRef.current) fileRef.current.value = ""; }}
            style={{
              position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: "50%",
              border: "none", background: "rgba(0,0,0,0.55)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#E6430A" : "#d1d5db"}`,
            borderRadius: 12, padding: "36px 20px", textAlign: "center",
            background: dragging ? "#FFF3EE" : "#fafafa", cursor: "pointer", transition: "all .15s",
          }}
        >
          <UploadCloud size={30} style={{ color: dragging ? "#E6430A" : "#9ca3af", margin: "0 auto 10px", display: "block" }} />
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: dragging ? "#E6430A" : "#374151" }}>
            Kéo & thả hoặc <span style={{ color: "#E6430A", textDecoration: "underline" }}>chọn file</span>
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>PNG, JPG, WEBP — tối đa 5MB</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}

/* ─── Internal toggle ───────────────────────────────────────── */

function InternalToggle({ value, onChange }) {
  return (
    <div>
      <Label>Phạm vi sự kiện</Label>
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { val: false, label: "Công khai", icon: <Globe size={14} />, desc: "Mở cho tất cả sinh viên" },
          { val: true,  label: "Nội bộ",    icon: <Lock  size={14} />, desc: "Chỉ dành cho thành viên CLB" },
        ].map(({ val, label, icon, desc }) => {
          const active = value === val;
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange("isInternal", val)}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                border: `1.5px solid ${active ? "#E6430A" : "#e5e7eb"}`,
                background: active ? "#FFF3EE" : "#fff",
                color: active ? "#E6430A" : "#6b7280",
                transition: "all .15s", textAlign: "left",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</div>
                <div style={{ fontSize: 12, color: active ? "#c2410c" : "#9ca3af", marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────────── */

function Step1({ form, onChange, errors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <BannerUpload value={form.banner} onChange={(v) => onChange("banner", v)} />

      <div>
        <Label required>Tên sự kiện</Label>
        <input
          style={inputStyle(errors.name)}
          placeholder="VD: Workshop UI/UX Design 2026"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <Label required>Mô tả / Giới thiệu sự kiện</Label>
        <textarea
          style={{ ...inputStyle(errors.desc), resize: "vertical", lineHeight: 1.7 }}
          placeholder="Giới thiệu mục tiêu, đối tượng tham gia, nội dung chính của sự kiện..."
          rows={5}
          value={form.desc}
          onChange={(e) => onChange("desc", e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: form.desc.length >= 30 ? "#059669" : "#9ca3af" }}>
            {form.desc.length} / 30+ ký tự
          </span>
        </div>
        <FieldError msg={errors.desc} />
      </div>

      <div>
        <Label required>Ngân sách dự kiến</Label>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inputStyle(errors.budget), paddingRight: 44 }}
            type="number" min="0" step="100000"
            placeholder="VD: 3000000"
            value={form.budget}
            onChange={(e) => onChange("budget", e.target.value)}
          />
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 13, fontWeight: 600, color: "#9ca3af", pointerEvents: "none",
          }}>đ</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
          <FieldError msg={errors.budget} />
          {form.budget && Number(form.budget) > BUDGET_LIMIT ? (
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
              ⚠ Vượt giới hạn 5.000.000 đ — cần ICPDP xem xét thêm
            </span>
          ) : form.budget && Number(form.budget) > 0 ? (
            <span style={{ fontSize: 12, color: "#059669", marginLeft: "auto" }}>≈ {fmtVND(form.budget)} đ</span>
          ) : null}
        </div>
      </div>

      <div>
        <Label required>Số người tham gia tối đa</Label>
        <input
          style={inputStyle(errors.maxParticipants)}
          type="number" min="1"
          placeholder="VD: 100"
          value={form.maxParticipants}
          onChange={(e) => onChange("maxParticipants", e.target.value)}
        />
        <FieldError msg={errors.maxParticipants} />
      </div>

      <InternalToggle value={form.isInternal} onChange={onChange} />
    </div>
  );
}

/* ─── Step 2 ─────────────────────────────────────────────────── */

function Step2({ form, onChange, errors }) {
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div>
          <Label required>Ngày tổ chức</Label>
          <input type="date" min={minDate} style={inputStyle(errors.date)} value={form.date}
            onChange={(e) => onChange("date", e.target.value)} />
          <FieldError msg={errors.date} />
        </div>
        <div>
          <Label required>Giờ bắt đầu</Label>
          <input type="time" style={inputStyle(errors.startTime)} value={form.startTime}
            onChange={(e) => onChange("startTime", e.target.value)} />
          <FieldError msg={errors.startTime} />
        </div>
        <div>
          <Label required>Giờ kết thúc</Label>
          <input type="time" style={inputStyle(errors.endTime)} value={form.endTime}
            onChange={(e) => onChange("endTime", e.target.value)} />
          <FieldError msg={errors.endTime} />
        </div>
      </div>

      <div>
        <Label required>Địa điểm tổ chức</Label>
        <input
          style={inputStyle(errors.location)}
          placeholder="VD: Hội trường A, Tòa nhà FPT, Tầng 3"
          value={form.location}
          onChange={(e) => onChange("location", e.target.value)}
        />
        <FieldError msg={errors.location} />
      </div>
    </div>
  );
}

/* ─── Step 3 ─────────────────────────────────────────────────── */

function SummaryCard({ icon, title, children }) {
  return (
    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
      }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</span>
      </div>
      <div style={{ padding: "4px 16px 10px" }}>{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
      <span style={{ fontSize: 12.5, color: "#6b7280", minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Step3({ form }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        padding: "14px 18px", borderRadius: 12, background: "#f0fdf4",
        border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", gap: 10,
      }}>
        <CheckCircle2 size={18} color="#16a34a" />
        <span style={{ fontSize: 13.5, color: "#15803d", fontWeight: 600 }}>
          Kiểm tra lại thông tin trước khi gửi đề xuất.
        </span>
      </div>

      {form.banner && (
        <SummaryCard icon={<ImagePlus size={15} color="#E6430A" />} title="Banner sự kiện">
          <div style={{ padding: "10px 0" }}>
            <img src={getImageUrl(form.banner)} alt="Banner" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, display: "block" }} />
          </div>
        </SummaryCard>
      )}

      <SummaryCard icon={<FileText size={15} color="#E6430A" />} title="Thông tin cơ bản">
        <SummaryRow label="Tên sự kiện" value={form.name} />
        <SummaryRow label="Mô tả"       value={form.desc} />
        <SummaryRow label="Phạm vi"     value={form.isInternal ? "Nội bộ CLB" : "Công khai"} />
        <SummaryRow label="Số người tối đa" value={form.maxParticipants ? `${form.maxParticipants} người` : "Không giới hạn"} />
        <div style={{ display: "flex", gap: 12, padding: "8px 0", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: "#6b7280", minWidth: 140, flexShrink: 0 }}>Ngân sách</span>
          <span style={{ fontSize: 13, color: Number(form.budget) > BUDGET_LIMIT ? "#dc2626" : "#111827", fontWeight: 600 }}>
            {fmtVND(form.budget)} đ
            {Number(form.budget) > BUDGET_LIMIT && (
              <span style={{ fontSize: 11.5, marginLeft: 8, color: "#dc2626" }}>⚠ Vượt giới hạn</span>
            )}
          </span>
        </div>
      </SummaryCard>

      <SummaryCard icon={<CalendarDays size={15} color="#E6430A" />} title="Thời gian & Địa điểm">
        <SummaryRow label="Ngày"      value={form.date} />
        <SummaryRow label="Thời gian" value={`${form.startTime} – ${form.endTime}`} />
        <SummaryRow label="Địa điểm" value={form.location || "—"} />
      </SummaryCard>
    </div>
  );
}

/* ─── Validation ─────────────────────────────────────────────── */

function validate(step, form) {
  const e = {};
  if (step === 1) {
    if (!form.name.trim() || form.name.trim().length < 5)
      e.name = "Tên sự kiện phải có ít nhất 5 ký tự.";
    if (!form.desc.trim() || form.desc.trim().length < 30)
      e.desc = "Mô tả phải có ít nhất 30 ký tự.";
    if (!form.budget || Number(form.budget) < 0)
      e.budget = "Vui lòng nhập ngân sách dự kiến (nhập 0 nếu không có).";
    if (!form.maxParticipants || Number(form.maxParticipants) < 1)
      e.maxParticipants = "Vui lòng nhập số người tham gia tối đa (ít nhất 1 người).";
  }
  if (step === 2) {
    if (!form.date) {
      e.date = "Vui lòng chọn ngày tổ chức.";
    } else {
      const today   = new Date(); today.setHours(0, 0, 0, 0);
      const minDate = new Date(today); minDate.setDate(minDate.getDate() + 14);
      const evDate  = new Date(form.date);
      if (evDate <= today)   e.date = "Ngày tổ chức phải là ngày trong tương lai.";
      else if (evDate < minDate) e.date = "Đề xuất phải được gửi trước ít nhất 14 ngày so với ngày tổ chức.";
    }
    if (!form.startTime) e.startTime = "Vui lòng chọn giờ bắt đầu.";
    if (!form.endTime)   e.endTime   = "Vui lòng chọn giờ kết thúc.";
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu.";
    if (!form.location.trim())
      e.location = "Vui lòng nhập địa điểm tổ chức.";
  }
  return e;
}

/* ─── Main page ──────────────────────────────────────────────── */

export default function CreateEventPage() {
  const navigate   = useNavigate();
  const clubId     = TokenService.getClubId();

  const [step, setStep]             = useState(1);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [semesterId, setSemesterId] = useState(null);

  useEffect(() => {
    semesterApi.getAll()
      .then((res) => {
        const list   = Array.isArray(res) ? res : res?.data ?? [];
        const active = list.find((s) => s.isActive) ?? list[list.length - 1];
        if (active) setSemesterId(active.semesterID ?? active.id);
      })
      .catch(() => {});
  }, []);

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const goNext = () => {
    const e = validate(step, form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const goBack = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await eventService.propose({
        clubID:        clubId,
        semesterID:    semesterId,
        eventCode:     `EVT-${clubId}-${Date.now()}`,
        eventName:     form.name,
        description:   form.desc,
        location:      form.location || null,
        budget:        Number(form.budget) || 0,
        startDate:     `${form.date}T${form.startTime}:00`,
        endDate:       `${form.date}T${form.endTime}:00`,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
        isResubmitted: false,
        isInternal:    form.isInternal,
        bannerUrl:     form.banner || null,
        assignments:   null,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? "Gửi đề xuất thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Tạo Sự Kiện</h1>
          <p className="page-subtitle">Đề xuất sự kiện mới cho câu lạc bộ</p>
        </div>
        <div className="content-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 32px", gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={40} color="#16a34a" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Sự kiện đã được lưu!</h3>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              Sự kiện <strong>"{form.name}"</strong> đã được lưu ở trạng thái <strong>Bản nháp</strong>.<br />
              Vào <strong>Quản Lý Sự Kiện</strong> và nhấn <strong>"Gửi đề xuất"</strong> để gửi lên ICPDP phê duyệt.
            </p>
          </div>
          {/* Hướng dẫn bước tiếp theo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 18px", maxWidth: 440 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
              Bước tiếp theo: vào <strong>Quản Lý Sự Kiện</strong> → tìm sự kiện → nhấn <strong>"Gửi đề xuất"</strong> → ICPDP sẽ nhận được yêu cầu.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={() => { setForm(EMPTY_FORM); setStep(1); setSubmitted(false); }}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Tạo sự kiện khác
            </button>
            <button
              onClick={() => navigate("../events", { relative: "path" })}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: "#E6430A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Gửi đề xuất ngay →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tạo Sự Kiện</h1>
        <p className="page-subtitle">Điền thông tin để đề xuất sự kiện mới — ICPDP sẽ xét duyệt trong vòng 3 ngày</p>
      </div>

      <div className="content-card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <StepBar current={step} />

        <div style={{ marginBottom: 28 }}>
          {step === 1 && <Step1 form={form} onChange={onChange} errors={errors} />}
          {step === 2 && <Step2 form={form} onChange={onChange} errors={errors} />}
          {step === 3 && <Step3 form={form} />}
        </div>

        {submitError && (
          <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1.5px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
            ⚠ {submitError}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1.5px solid #f3f4f6" }}>
          <button
            onClick={step === 1 ? () => navigate(-1) : goBack}
            disabled={submitting}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 22px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
              border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151",
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
            {step === 1 ? "Quay lại" : "Bước trước"}
          </button>

          {step < 3 ? (
            <button
              onClick={goNext}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 26px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                border: "none", background: "#E6430A", color: "#fff", cursor: "pointer",
              }}
            >
              Bước tiếp theo <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 30px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                border: "none", background: submitting ? "#6ee7b7" : "#059669", color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              <Send size={15} /> {submitting ? "Đang gửi..." : "Gửi đề xuất"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
