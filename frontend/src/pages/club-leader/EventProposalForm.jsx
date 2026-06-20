import { useState, useRef } from "react";
import {
  X, ChevronLeft, ChevronRight, Check, Search, Plus, Trash2,
  Send, CalendarDays, Users, FileText, CheckCircle2, ImagePlus, UploadCloud,
} from "lucide-react";

/* ─── Constants ─────────────────────────────────────────────── */

const STEPS = [
  { id: 1, label: "Thông tin cơ bản"     },
  { id: 2, label: "Thời gian & Địa điểm" },
  { id: 3, label: "Phân bổ nhân sự"      },
  { id: 4, label: "Xác nhận & Gửi"       },
];

const CATEGORIES = [
  "Workshop", "Hội thảo", "Giao lưu", "Thi đấu thể thao",
  "Văn nghệ", "Tình nguyện", "Cuộc thi", "Khác",
];

const ORG_ROLES = [
  "Trưởng ban tổ chức",
  "MC / Người dẫn chương trình",
  "Ban kỹ thuật & âm thanh",
  "Ban trang trí & sân khấu",
  "Ban hậu cần & tiếp đón",
  "Ban truyền thông",
  "Ban kế toán",
  "Tình nguyện viên",
];

const MOCK_MEMBERS = [
  { id: 1, name: "Nguyễn Văn An",  clubRole: "Phó Trưởng CLB", color: "#6366f1" },
  { id: 2, name: "Trần Thị Bình",  clubRole: "Ban Điều Hành",  color: "#0891b2" },
  { id: 3, name: "Lê Minh Cường",  clubRole: "Ban Điều Hành",  color: "#059669" },
  { id: 4, name: "Phạm Thu Dung",  clubRole: "Thành viên",     color: "#d97706" },
  { id: 5, name: "Hoàng Văn Em",   clubRole: "Thành viên",     color: "#dc2626" },
  { id: 6, name: "Đỗ Thị Flan",    clubRole: "Thành viên",     color: "#7c3aed" },
  { id: 7, name: "Vũ Đức Giang",   clubRole: "Thành viên",     color: "#b45309" },
  { id: 8, name: "Ngô Thị Hoa",    clubRole: "Thành viên",     color: "#0f766e" },
];

const EMPTY_FORM = {
  name: "", desc: "", category: "", expectedCount: "", budget: "", banner: null,
  date: "", startTime: "", endTime: "", location: "", mode: "offline", onlineLink: "",
  personnel: [],
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

function Avatar({ name, color, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color + "22", color, fontWeight: 700,
      fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {name?.[0]?.toUpperCase()}
    </div>
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

function BannerUpload({ value, onChange }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("Ảnh không được vượt quá 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Label>Banner sự kiện</Label>
      {value ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
          <img src={value} alt="Banner" style={{ width: "100%", height: 168, objectFit: "cover", display: "block" }} />
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
        onChange={(e) => handleFile(e.target.files[0])} />
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Label required>Thể loại sự kiện</Label>
          <select
            style={{ ...inputStyle(errors.category), appearance: "none", cursor: "pointer" }}
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option value="">-- Chọn thể loại --</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError msg={errors.category} />
        </div>

        <div>
          <Label required>Số người dự kiến</Label>
          <input
            style={inputStyle(errors.expectedCount)}
            type="number" min="1"
            placeholder="VD: 100"
            value={form.expectedCount}
            onChange={(e) => onChange("expectedCount", e.target.value)}
          />
          <FieldError msg={errors.expectedCount} />
        </div>
      </div>

      {/* Ngân sách */}
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
    </div>
  );
}

/* ─── Step 2: Thời gian & Địa điểm ─────────────────────────── */

function Step2({ form, onChange, errors }) {
  // Ngày tối thiểu = hôm nay + 3 ngày
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
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

      {/* Mode selector */}
      <div>
        <Label>Hình thức tổ chức</Label>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { key: "offline", label: "Offline" },
            { key: "online",  label: "Online"  },
            { key: "hybrid",  label: "Hybrid"  },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange("mode", key)}
              style={{
                padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all .15s", border: "1.5px solid",
                background:   form.mode === key ? "#E6430A"   : "#fff",
                color:        form.mode === key ? "#fff"       : "#6b7280",
                borderColor:  form.mode === key ? "#E6430A"   : "#e5e7eb",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label required={form.mode !== "online"}>
          {form.mode === "online" ? "Địa điểm (nếu có)" : "Địa điểm tổ chức"}
        </Label>
        <input
          style={inputStyle(errors.location)}
          placeholder="VD: Hội trường A, Tòa nhà FPT, Tầng 3"
          value={form.location}
          onChange={(e) => onChange("location", e.target.value)}
        />
        <FieldError msg={errors.location} />
      </div>

      {(form.mode === "online" || form.mode === "hybrid") && (
        <div>
          <Label>Link tham gia trực tuyến</Label>
          <input
            style={inputStyle(false)}
            placeholder="VD: https://meet.google.com/..."
            value={form.onlineLink}
            onChange={(e) => onChange("onlineLink", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Phân bổ nhân sự (BR-E03) ──────────────────────── */

function Step3({ form, onChange, errors }) {
  const [search, setSearch] = useState("");

  const assigned    = form.personnel;
  const assignedIds = new Set(assigned.map((p) => p.id));

  const available = MOCK_MEMBERS.filter(
    (m) => !assignedIds.has(m.id) &&
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const addMember = (member) => {
    onChange("personnel", [...assigned, { ...member, orgRole: "" }]);
  };

  const removeMember = (id) => {
    onChange("personnel", assigned.filter((p) => p.id !== id));
  };

  const setRole = (id, orgRole) => {
    onChange("personnel", assigned.map((p) => p.id === id ? { ...p, orgRole } : p));
  };

  const hasLeader = assigned.some((p) => p.orgRole === "Trưởng ban tổ chức");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Info banner */}
      <div style={{
        padding: "10px 14px", borderRadius: 10, background: "#eff6ff",
        border: "1.5px solid #bfdbfe", fontSize: 12.5, color: "#1d4ed8",
        display: "flex", alignItems: "flex-start", gap: 8,
      }}>
        <Users size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Chọn thành viên và gán vai trò tổ chức (BR-E03). Phải có ít nhất 1 người đảm nhận
          vai trò <strong>Trưởng ban tổ chức</strong>.
        </span>
      </div>

      {/* Available members */}
      <div>
        <Label>Danh sách thành viên CLB</Label>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            style={{ ...inputStyle(false), paddingLeft: 34 }}
            placeholder="Tìm thành viên theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{
          border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
          maxHeight: 220, overflowY: "auto",
        }}>
          {available.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0", margin: 0 }}>
              {search ? "Không tìm thấy thành viên." : "Tất cả thành viên đã được thêm."}
            </p>
          ) : available.map((m, i) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px",
              borderBottom: i < available.length - 1 ? "1px solid #f3f4f6" : "none",
              background: "#fff",
            }}>
              <Avatar name={m.name} color={m.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{m.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{m.clubRole}</p>
              </div>
              <button
                onClick={() => addMember(m)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  border: "1.5px solid #E6430A", color: "#E6430A", background: "#fff",
                  cursor: "pointer", flexShrink: 0, transition: "all .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF3EE"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <Plus size={13} /> Thêm
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned personnel */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Nhân sự đã phân công</Label>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 99,
            background: assigned.length > 0 ? "#FFF3EE" : "#f3f4f6",
            color:      assigned.length > 0 ? "#E6430A" : "#9ca3af",
          }}>
            {assigned.length} người
          </span>
        </div>

        {errors.personnel && <FieldError msg={errors.personnel} />}

        {assigned.length === 0 ? (
          <div style={{
            border: "1.5px dashed #e5e7eb", borderRadius: 12, padding: "28px 20px",
            textAlign: "center", color: "#9ca3af", fontSize: 13,
          }}>
            <Users size={28} style={{ color: "#d1d5db", marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
            Chưa có thành viên nào được thêm vào danh sách nhân sự.
          </div>
        ) : (
          <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 2.5fr 40px",
              padding: "8px 14px", background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb", gap: 10,
            }}>
              {["Thành viên", "Vai trò tổ chức", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {h}
                </span>
              ))}
            </div>

            {assigned.map((p, i) => (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "2fr 2.5fr 40px",
                alignItems: "center", gap: 10, padding: "10px 14px",
                borderBottom: i < assigned.length - 1 ? "1px solid #f3f4f6" : "none",
                background: "#fff",
              }}>
                {/* Member info */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={p.name} color={p.color} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280" }}>{p.clubRole}</p>
                  </div>
                </div>

                {/* Role selector */}
                <select
                  value={p.orgRole}
                  onChange={(e) => setRole(p.id, e.target.value)}
                  style={{
                    width: "100%", padding: "7px 10px", fontSize: 12.5,
                    border: `1.5px solid ${!p.orgRole ? "#fca5a5" : p.orgRole === "Trưởng ban tổ chức" ? "#86efac" : "#e5e7eb"}`,
                    borderRadius: 8, outline: "none", background: "#fff",
                    color: p.orgRole ? "#111827" : "#9ca3af", cursor: "pointer",
                  }}
                >
                  <option value="">-- Chọn vai trò --</option>
                  {ORG_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>

                {/* Remove */}
                <button
                  onClick={() => removeMember(p.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "1.5px solid #fecaca",
                    background: "#fff", color: "#dc2626", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Role coverage indicator */}
        {assigned.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ORG_ROLES.slice(0, 4).map((role) => {
              const filled = assigned.some((p) => p.orgRole === role);
              return (
                <span key={role} style={{
                  fontSize: 11.5, padding: "3px 10px", borderRadius: 99,
                  background: filled ? "#dcfce7" : "#f3f4f6",
                  color:      filled ? "#15803d" : "#9ca3af",
                  fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                }}>
                  {filled ? <Check size={10} strokeWidth={3} /> : null} {role}
                </span>
              );
            })}
            {!hasLeader && (
              <span style={{ fontSize: 11.5, color: "#dc2626", alignSelf: "center", marginLeft: 4 }}>
                ⚠ Chưa có Trưởng ban tổ chức
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 4: Xác nhận & Gửi ────────────────────────────────── */

function Step4({ form }) {
  const modeLabel = { offline: "Offline", online: "Online", hybrid: "Hybrid" }[form.mode];

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
            <img src={form.banner} alt="Banner" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" }} />
          </div>
        </SummaryCard>
      )}

      {/* Section: Basic info */}
      <SummaryCard icon={<FileText size={15} color="#E6430A" />} title="Thông tin cơ bản">
        <SummaryRow label="Tên sự kiện"      value={form.name} />
        <SummaryRow label="Mô tả"            value={form.desc} />
        <SummaryRow label="Thể loại"         value={form.category} />
        <SummaryRow label="Số người dự kiến" value={`${form.expectedCount} người`} />
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

      {/* Section: Time & Location */}
      <SummaryCard icon={<CalendarDays size={15} color="#E6430A" />} title="Thời gian & Địa điểm">
        <SummaryRow label="Ngày"       value={form.date} />
        <SummaryRow label="Thời gian"  value={`${form.startTime} – ${form.endTime}`} />
        <SummaryRow label="Địa điểm"  value={form.location || "—"} />
        <SummaryRow label="Hình thức" value={{ offline: "Offline", online: "Online", hybrid: "Hybrid (kết hợp)" }[form.mode]} />
        {form.onlineLink && <SummaryRow label="Link online" value={form.onlineLink} />}
      </SummaryCard>

      {/* Section: Personnel */}
      <SummaryCard icon={<Users size={15} color="#E6430A" />} title={`Phân bổ nhân sự (${form.personnel.length} người)`}>
        {form.personnel.map((p) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 0", borderBottom: "1px solid #f3f4f6",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: p.color + "22", color: p.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}>
              {p.name[0]}
            </div>
            <span style={{ flex: 1, fontSize: 13, color: "#111827", fontWeight: 500 }}>{p.name}</span>
            <span style={{
              fontSize: 11.5, padding: "2px 9px", borderRadius: 99, fontWeight: 600,
              background: p.orgRole === "Trưởng ban tổ chức" ? "#dcfce7" : "#f0f4ff",
              color:      p.orgRole === "Trưởng ban tổ chức" ? "#15803d" : "#3730a3",
            }}>
              {p.orgRole || "Chưa gán vai trò"}
            </span>
          </div>
        ))}
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
    if (!form.category)
      e.category = "Vui lòng chọn thể loại.";
    if (!form.expectedCount || Number(form.expectedCount) < 1)
      e.expectedCount = "Số người dự kiến phải lớn hơn 0.";
    if (!form.budget || Number(form.budget) < 0)
      e.budget = "Vui lòng nhập ngân sách dự kiến (nhập 0 nếu không có).";
  }

  if (step === 2) {
    // Ngày tổ chức
    if (!form.date) {
      e.date = "Vui lòng chọn ngày tổ chức.";
    } else {
      const today     = new Date(); today.setHours(0, 0, 0, 0);
      const minDate   = new Date(today); minDate.setDate(minDate.getDate() + 3);
      const eventDate = new Date(form.date);
      if (eventDate <= today)
        e.date = "Ngày tổ chức phải là ngày trong tương lai.";
      else if (eventDate < minDate)
        e.date = "Ngày tổ chức phải cách ít nhất 3 ngày (thời gian IC-PDP xét duyệt).";
    }

    // Giờ bắt đầu / kết thúc
    if (!form.startTime) e.startTime = "Vui lòng chọn giờ bắt đầu.";
    if (!form.endTime)   e.endTime   = "Vui lòng chọn giờ kết thúc.";
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu.";

    // Địa điểm
    if (form.mode !== "online" && !form.location.trim())
      e.location = "Vui lòng nhập địa điểm tổ chức.";
  }

  if (step === 3) {
    if (form.personnel.length === 0) {
      e.personnel = "Cần phân công ít nhất 1 thành viên.";
    } else if (form.personnel.some((p) => !p.orgRole)) {
      e.personnel = "Tất cả thành viên đã thêm phải được gán vai trò.";
    } else if (!form.personnel.some((p) => p.orgRole === "Trưởng ban tổ chức")) {
      e.personnel = "Phải có ít nhất 1 người đảm nhận vai trò Trưởng ban tổ chức.";
    }
  }

  return e;
}

/* ─── Main component ─────────────────────────────────────────── */

export default function EventProposalForm({ onClose, onSubmit }) {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.({ ...form, status: "pending", submittedAt: new Date().toISOString() });
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
              Bước {step} / {STEPS.length} · {STEPS[step - 1].label}
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
              {step === 3 && <Step3 form={form} onChange={onChange} errors={errors} />}
              {step === 4 && <Step4 form={form} />}
            </div>

            {/* Footer navigation */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 32px", borderTop: "1.5px solid #f3f4f6",
              background: "#fafafa",
            }}>
              <button
                onClick={step === 1 ? onClose : goBack}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                  border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151",
                  cursor: "pointer", transition: "background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <ChevronLeft size={16} />
                {step === 1 ? "Hủy" : "Quay lại"}
              </button>

              {step < 4 ? (
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
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 28px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                    border: "none", background: "#059669", color: "#fff",
                    cursor: "pointer", transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#047857"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#059669"; }}
                >
                  <Send size={15} /> Gửi đề xuất
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
