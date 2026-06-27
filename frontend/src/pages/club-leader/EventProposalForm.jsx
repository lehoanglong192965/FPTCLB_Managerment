import { useState, useRef, useEffect } from "react";
import {
  X, ChevronLeft, ChevronRight, Check,
  Send, CalendarDays, FileText, CheckCircle2, ImagePlus, UploadCloud, Globe, Lock,
} from "lucide-react";
import eventService from "../../services/api/events/eventService";
import semesterApi from "../../services/api/admin/semesterApi";
import { TokenService } from "../../services/api/axiosClient";
import clubRegistrationApi from "../../services/api/clubs/clubRegistrationApi";

/* ─── Constants ─────────────────────────────────────────────── */

const STEPS = [
  { id: 1, label: "Thông tin cơ bản"     },
  { id: 2, label: "Thời gian & Địa điểm" },
  { id: 3, label: "Xác nhận & Gửi"       },
];

const EMPTY_FORM = {
  name: "", desc: "", budget: "", banner: null,
  isInternal: false,
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
  return <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
    <span>⚠</span> {msg}
  </p>;
}


function inputStyle(error) {
  return {
    width: "100%", padding: "9px 12px", fontSize: 13.5, color: "#111827",
    border: `1.5px solid ${error ? "#f87171" : "#e5e7eb"}`,
    borderRadius: 10, outline: "none", background: error ? "#fff5f5" : "#fff",
    boxSizing: "border-box", transition: "border-color .15s",
  };
}

/* ─── Step progress bar ─────────────────────────────────────── */

function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "20px 32px 0" }}>
      {STEPS.map((s, i) => {
        const done   = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            {/* Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13,
                border: `2px solid ${done ? "#059669" : active ? "#E6430A" : "#d1d5db"}`,
                background: done ? "#059669" : active ? "#E6430A" : "#fff",
                color: done || active ? "#fff" : "#9ca3af",
                transition: "all .25s",
              }}>
                {done ? <Check size={14} strokeWidth={3} /> : s.id}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                color: done ? "#059669" : active ? "#E6430A" : "#9ca3af",
              }}>
                {s.label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 8px", marginBottom: 22,
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
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  return apiBase.replace(/\/api\/?$/, "") + url;
};

function BannerUpload({ value, onChange }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    console.log("[BannerUpload] handleFile called:", file?.name, file?.type, file?.size);
    if (!file || !file.type.startsWith("image/")) { console.log("[BannerUpload] invalid file"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Ảnh không được vượt quá 5MB."); return; }
    setUploading(true);
    console.log("[BannerUpload] uploading...");
    try {
      const res = await clubRegistrationApi.uploadCardImage(file);
      console.log("[BannerUpload] upload result:", res);
      onChange(res.url || res);
    } catch (err) {
      console.error("[BannerUpload] Upload thất bại:", err);
      alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>Banner sự kiện</Label>
      {uploading ? (
        <div style={{ borderRadius: 12, border: "1.5px solid #e5e7eb", height: 168, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", flexDirection: "column", gap: 8 }}>
          <UploadCloud size={24} style={{ color: "#E6430A" }} />
          <span style={{ fontSize: 13, color: "#6b7280" }}>Đang tải ảnh lên...</span>
        </div>
      ) : value ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
          <img src={getImageUrl(value)} alt="Banner" style={{ width: "100%", height: 168, objectFit: "cover", display: "block" }} />
          <button
            type="button"
            onClick={() => { onChange(null); if (fileRef.current) fileRef.current.value = ""; }}
            style={{
              position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
              border: "none", background: "rgba(0,0,0,0.55)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
            padding: "8px 12px", display: "flex", alignItems: "center", gap: 6,
          }}>
            <ImagePlus size={13} color="#fff" />
            <span style={{ fontSize: 12, color: "#fff" }}>Nhấn × để xóa và chọn ảnh khác</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#E6430A" : "#d1d5db"}`,
            borderRadius: 12, padding: "32px 20px", textAlign: "center",
            background: dragging ? "#FFF3EE" : "#fafafa",
            cursor: "pointer", transition: "all .15s",
          }}
        >
          <UploadCloud size={28} style={{ color: dragging ? "#E6430A" : "#9ca3af", margin: "0 auto 10px", display: "block" }} />
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: dragging ? "#E6430A" : "#374151" }}>
            Kéo & thả hoặc <span style={{ color: "#E6430A", textDecoration: "underline" }}>chọn file</span>
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>PNG, JPG, WEBP — tối đa 5MB</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { console.log("[BannerUpload] input onChange:", e.target.files); handleFile(e.target.files[0]); }} />
    </div>
  );
}

/* ─── Internal toggle ───────────────────────────────────────── */

function InternalToggle({ value, onChange }) {
  return (
    <div>
      <Label>Phạm vi sự kiện</Label>
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { val: false, label: "Công khai", icon: <Globe size={13} />, desc: "Mở cho tất cả sinh viên" },
          { val: true,  label: "Nội bộ",    icon: <Lock  size={13} />, desc: "Chỉ dành cho thành viên CLB" },
        ].map(({ val, label, icon, desc }) => {
          const active = value === val;
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange("isInternal", val)}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                border: `1.5px solid ${active ? "#E6430A" : "#e5e7eb"}`,
                background: active ? "#FFF3EE" : "#fff",
                color: active ? "#E6430A" : "#6b7280",
                transition: "all .15s", textAlign: "left",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 11.5, color: active ? "#c2410c" : "#9ca3af", marginTop: 1 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 1: Thông tin cơ bản ──────────────────────────────── */

function Step1({ form, onChange, errors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          style={{ ...inputStyle(errors.desc), resize: "vertical", lineHeight: 1.6 }}
          placeholder="Giới thiệu mục tiêu, đối tượng tham gia, nội dung chính của sự kiện..."
          rows={4}
          value={form.desc}
          onChange={(e) => onChange("desc", e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <FieldError msg={errors.desc} />
          <span style={{ fontSize: 11.5, color: form.desc.length >= 30 ? "#059669" : "#9ca3af", marginLeft: "auto" }}>
            {form.desc.length} / 30+ ký tự
          </span>
        </div>
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
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              ⚠ Vượt giới hạn 5.000.000 đ — cần ICPDP xem xét thêm
            </span>
          ) : form.budget && Number(form.budget) > 0 ? (
            <span style={{ fontSize: 12, color: "#059669", marginLeft: "auto" }}>
              ≈ {fmtVND(form.budget)} đ
            </span>
          ) : null}
        </div>
      </div>

      <InternalToggle value={form.isInternal} onChange={onChange} />
    </div>
  );
}

/* ─── Step 2: Thời gian & Địa điểm ─────────────────────────── */

function Step2({ form, onChange, errors }) {
  // Ngày tối thiểu = hôm nay + 3 ngày
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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


/* ─── Step 3: Xác nhận & Gửi ────────────────────────────────── */

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

      {/* Banner preview */}
      {form.banner && (
        <SummaryCard icon={<ImagePlus size={15} color="#E6430A" />} title="Banner sự kiện">
          <div style={{ padding: "10px 0" }}>
            <img src={getImageUrl(form.banner)} alt="Banner" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" }} />
          </div>
        </SummaryCard>
      )}

      {/* Section: Basic info */}
      <SummaryCard icon={<FileText size={15} color="#E6430A" />} title="Thông tin cơ bản">
        <SummaryRow label="Tên sự kiện" value={form.name} />
        <SummaryRow label="Mô tả"       value={form.desc} />
        <SummaryRow label="Phạm vi"     value={form.isInternal ? "Nội bộ CLB" : "Công khai"} />
        <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: "#6b7280", minWidth: 130, flexShrink: 0 }}>Ngân sách</span>
          <span style={{ fontSize: 13, color: Number(form.budget) > BUDGET_LIMIT ? "#dc2626" : "#111827", fontWeight: 600 }}>
            {fmtVND(form.budget)} đ
            {Number(form.budget) > BUDGET_LIMIT && (
              <span style={{ fontSize: 11.5, fontWeight: 600, marginLeft: 8, color: "#dc2626" }}>
                ⚠ Vượt giới hạn
              </span>
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
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #f9fafb" }}>
      <span style={{ fontSize: 12.5, color: "#6b7280", minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{value}</span>
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
  }

  if (step === 2) {
    // Ngày tổ chức
    if (!form.date) {
      e.date = "Vui lòng chọn ngày tổ chức.";
    } else {
      const today     = new Date(); today.setHours(0, 0, 0, 0);
      const minDate   = new Date(today); minDate.setDate(minDate.getDate() + 14);
      const eventDate = new Date(form.date);
      if (eventDate <= today)
        e.date = "Ngày tổ chức phải là ngày trong tương lai.";
      else if (eventDate < minDate)
        e.date = "Đề xuất phải được gửi trước ít nhất 14 ngày so với ngày tổ chức.";
    }

    // Giờ bắt đầu / kết thúc
    if (!form.startTime) e.startTime = "Vui lòng chọn giờ bắt đầu.";
    if (!form.endTime)   e.endTime   = "Vui lòng chọn giờ kết thúc.";
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu.";

    if (!form.location.trim())
      e.location = "Vui lòng nhập địa điểm tổ chức.";
  }

  return e;
}

/* ─── Main component ─────────────────────────────────────────── */

export default function EventProposalForm({ onClose, onSubmit }) {
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [semesterId, setSemesterId] = useState(null);

  const clubId = TokenService.getClubId();

  useEffect(() => {
    semesterApi.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
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
      const startDate = `${form.date}T${form.startTime}:00`;
      const endDate   = `${form.date}T${form.endTime}:00`;
      const eventCode = `EVT-${clubId}-${Date.now()}`;

      await eventService.propose({
        clubID:        clubId,
        semesterID:    semesterId,
        eventCode,
        eventName:     form.name,
        description:   form.desc,
        location:      form.location || null,
        budget:        Number(form.budget) || 0,
        startDate,
        endDate,
        isResubmitted: false,
        isInternal:    form.isInternal,
        bannerUrl:     form.banner || null,
        assignments:   null,
      });

      setSubmitted(true);
      onSubmit?.({ ...form, status: "pending", submittedAt: new Date().toISOString() });
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Gửi đề xuất thất bại.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(13,27,62,0.48)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680,
          maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", borderBottom: "1.5px solid #f3f4f6" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827" }}>
              Đề xuất sự kiện mới
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6b7280" }}>
              Bước {step} / 3 · {STEPS[step - 1].label}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "#f3f4f6", color: "#6b7280", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Body */}
        {submitted ? (
          /* Success state */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={36} color="#16a34a" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Đề xuất đã được gửi!</h3>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#6b7280", lineHeight: 1.6 }}>
                Đề xuất sự kiện <strong>"{form.name}"</strong> đã được gửi đến<br />
                ICPDP để phê duyệt. Bạn sẽ nhận thông báo sớm nhất.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 8, padding: "10px 32px", borderRadius: 10,
                background: "#E6430A", color: "#fff", border: "none",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
              {step === 1 && <Step1 form={form} onChange={onChange} errors={errors} />}
              {step === 2 && <Step2 form={form} onChange={onChange} errors={errors} />}
              {step === 3 && <Step3 form={form} />}
            </div>

            {/* Error message */}
            {submitError && (
              <div style={{ margin: "0 32px", padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1.5px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
                ⚠ {submitError}
              </div>
            )}

            {/* Footer navigation */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 32px", borderTop: "1.5px solid #f3f4f6",
              background: "#fafafa",
            }}>
              <button
                onClick={step === 1 ? onClose : goBack}
                disabled={submitting}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                  border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151",
                  cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1,
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <ChevronLeft size={16} />
                {step === 1 ? "Hủy" : "Quay lại"}
              </button>

              {step < 3 ? (
                <button
                  onClick={goNext}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 24px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                    border: "none", background: "#E6430A", color: "#fff",
                    cursor: "pointer", transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#c73a08"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#E6430A"; }}
                >
                  Tiếp theo <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 28px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                    border: "none", background: submitting ? "#6ee7b7" : "#059669", color: "#fff",
                    cursor: submitting ? "not-allowed" : "pointer", transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#047857"; }}
                  onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#059669"; }}
                >
                  <Send size={15} /> {submitting ? "Đang gửi..." : "Gửi đề xuất"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
