import { useState, useEffect, useRef } from "react";
import { Camera, Save, X, Loader2, Pencil } from "lucide-react";
import { TokenService, getServerOrigin } from "../../services/api/axiosClient";
import clubApi from "../../services/api/clubs/clubApi";
import { normalizeClub } from "../../hooks/usePublicClubs";
import { useToast } from "../../contexts/ToastContext";
import { CLUB_CATEGORIES } from "../../constants/clubCategories";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return getServerOrigin() + url;
};

const CATEGORIES = CLUB_CATEGORIES;

const inputCls = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: 8,
  border: "1.5px solid #e5e7eb", fontSize: 14,
  fontFamily: "inherit", outline: "none", background: "#fff",
  transition: "border-color 0.15s",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadonlyValue({ value, link }) {
  if (!value) return <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>Chưa có</p>;
  if (link) return (
    <a href={value} target="_blank" rel="noreferrer"
      style={{ display: "block", fontSize: 14, color: "#1d4ed8", padding: "9px 0", borderBottom: "1px solid #f3f4f6", textDecoration: "none", wordBreak: "break-all" }}>
      {value}
    </a>
  );
  return <p style={{ margin: 0, fontSize: 14, color: "#111827", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>{value}</p>;
}

export default function ClubInfoPage() {
  const toast = useToast();
  const clubId = TokenService.getClubId();

  const [club, setClub]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const [form, setForm] = useState({
    clubName: "", description: "", category: "", clubImage: "",
    contactEmail: "", contactPhone: "", facebookUrl: "",
  });

  const fileInputRef = useRef(null);

  const applyRaw = (raw) => {
    if (!raw) return false;
    const normalized = normalizeClub(raw);
    const img = raw.clubImage ?? "";
    setClub({
      ...normalized,
      rawCategory:  raw.tag          ?? raw.category    ?? "",
      clubStatus:   raw.clubStatus,
      contactEmail: raw.contactEmail ?? null,
      contactPhone: raw.contactPhone ?? null,
      facebookUrl:  raw.facebookUrl  ?? null,
    });
    setForm({
      clubName:     raw.name         ?? raw.clubName    ?? "",
      description:  raw.desc         ?? raw.description ?? "",
      category:     raw.tag          ?? raw.category    ?? "",
      clubImage:    img,
      contactEmail: raw.contactEmail ?? "",
      contactPhone: raw.contactPhone ?? "",
      facebookUrl:  raw.facebookUrl  ?? "",
    });
    setPreviewUrl(img);
    return true;
  };

  useEffect(() => {
    if (!clubId) { setError("Không tìm thấy ID câu lạc bộ."); setLoading(false); return; }
    let cancelled = false;

    clubApi.getById(clubId)
      .then((raw) => { if (!cancelled) applyRaw(raw); })
      .catch(() => {
        if (cancelled) return;
        clubApi.getAllPublic()
          .then((res) => {
            if (cancelled) return;
            const all = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
            const raw = all.find((c) => c.clubID === clubId || c.id === clubId);
            if (!applyRaw(raw)) setError("Không tìm thấy câu lạc bộ.");
          })
          .catch((err) => {
            if (cancelled || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
            setError("Không thể tải thông tin câu lạc bộ.");
          });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [clubId]);

  // Khi user chọn file từ máy
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Preview tạm bằng object URL ngay lập tức
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);
    try {
      const res = await clubApi.uploadImage(file);
      const serverUrl = res?.url ?? res?.fileUrl ?? res?.path;
      if (serverUrl) {
        URL.revokeObjectURL(localUrl);
        setPreviewUrl(serverUrl);
        setForm((f) => ({ ...f, clubImage: serverUrl }));
        toast.success("Đã tải ảnh lên thành công.");
      }
    } catch {
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(form.clubImage ?? "");
      toast.error("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, clubImage: previewUrl };
      const raw = await clubApi.update(clubId, payload);
      applyRaw(raw);
      setEditing(false);
      toast.success("Đã lưu thông tin câu lạc bộ.");
    } catch {
      toast.error("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!club) return;
    setForm({
      clubName:     club.name         ?? "",
      description:  club.desc         ?? "",
      category:     club.rawCategory  ?? "",
      clubImage:    club.clubImage    ?? "",
      contactEmail: club.contactEmail ?? "",
      contactPhone: club.contactPhone ?? "",
      facebookUrl:  club.facebookUrl  ?? "",
    });
    setPreviewUrl(club.clubImage ?? "");
    setEditing(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
      <Loader2 size={28} className="animate-spin" />
      <p className="text-[13px] m-0">Đang tải thông tin câu lạc bộ...</p>
    </div>
  );

  if (error) return (
    <p style={{ color: "#ef4444", textAlign: "center", padding: "4rem 0" }}>{error}</p>
  );

  const bannerColor = club?.color ?? "#1A6FC4";
  const displayImg  = editing ? previewUrl : (club?.clubImage ?? "");

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />


      <div className="page-header">
        <h1 className="page-title">Thông Tin Câu Lạc Bộ</h1>
        <p className="page-subtitle">Xem và chỉnh sửa thông tin câu lạc bộ</p>
      </div>

      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>

        {/* Banner = ảnh đại diện CLB */}
        <div
          onClick={() => editing && !uploading && fileInputRef.current?.click()}
          style={{
            height: 180, position: "relative",
            cursor: editing ? "pointer" : "default",
            background: displayImg ? "#f3f4f6" : `linear-gradient(135deg, ${bannerColor}, ${bannerColor}bb)`,
          }}
        >
          {displayImg ? (
            <img src={getImageUrl(displayImg)} alt="Club" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <>
              <div style={{
                position: "absolute", inset: 0, opacity: 0.2,
                backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1.5px)",
                backgroundSize: "16px 16px",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                <span style={{ userSelect: "none" }}>{club?.emoji ?? "🏛️"}</span>
              </div>
            </>
          )}
          {/* Overlay khi hover/edit */}
          {editing && (
            <div style={{
              position: "absolute", inset: 0,
              background: uploading ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.38)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              {uploading
                ? <Loader2 size={22} color="#fff" className="animate-spin" />
                : <Camera size={22} color="#fff" />
              }
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                {uploading ? "Đang tải..." : "Đổi ảnh"}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 0" }}>
          <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 18, color: "#111827" }}>{club?.name}</p>
          <span style={{
            display: "inline-block", padding: "3px 12px", borderRadius: 99,
            background: "#f3f4f6", fontSize: 12, fontWeight: 600, color: "#6b7280",
          }}>
            {club?.abbr}
          </span>

          {editing && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>
              Click vào ảnh để chọn file từ máy tính (JPG, PNG, WebP)
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0", gap: 8 }}>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 8, border: "none",
              background: "#f04e23", color: "#fff", fontWeight: 600,
              fontSize: 13, cursor: "pointer",
            }}>
              <Pencil size={14} /> Chỉnh sửa
            </button>
          ) : (
            <>
              <button onClick={handleCancel} disabled={saving || uploading} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                border: "1.5px solid #e5e7eb", background: "#fff",
                color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                <X size={14} /> Hủy
              </button>
              <button onClick={handleSave} disabled={saving || uploading} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: "#f04e23", color: "#fff", fontWeight: 600, fontSize: 13,
                cursor: (saving || uploading) ? "not-allowed" : "pointer",
                opacity: (saving || uploading) ? 0.7 : 1,
              }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          )}
        </div>

        {/* Fields */}
        <div style={{ padding: "20px 24px 28px" }}>

          <p style={{ fontSize: 12, fontWeight: 700, color: "#f04e23", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 14px" }}>
            Thông tin cơ bản
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Field label="Tên câu lạc bộ">
              {editing
                ? <input style={inputCls} value={form.clubName}
                    onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value }))}
                    placeholder="Tên câu lạc bộ..."
                    onFocus={(e) => (e.target.style.borderColor = "#f04e23")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                : <ReadonlyValue value={club?.name} />}
            </Field>

            <Field label="Mã CLB">
              <ReadonlyValue value={club?.abbr} />
            </Field>

            <Field label="Thể loại">
              {editing
                ? <select style={inputCls} value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    onFocus={(e) => (e.target.style.borderColor = "#f04e23")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
                    <option value="">-- Chọn thể loại --</option>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                : <ReadonlyValue value={club?.rawCategory} />}
            </Field>

            <Field label="Trạng thái">
              <ReadonlyValue value={club?.clubStatus ?? "Active"} />
            </Field>
          </div>

          <Field label="Mô tả">
            {editing
              ? <textarea style={{ ...inputCls, minHeight: 90, resize: "vertical" }}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả về câu lạc bộ..."
                  onFocus={(e) => (e.target.style.borderColor = "#f04e23")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
              : <ReadonlyValue value={club?.desc} />}
          </Field>

          <div style={{ height: 4 }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f04e23", textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 14px" }}>
            Thông tin liên hệ
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Field label="Email liên hệ">
              {editing
                ? <input type="email" style={inputCls} value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="email@fpt.edu.vn"
                    onFocus={(e) => (e.target.style.borderColor = "#f04e23")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                : <ReadonlyValue value={club?.contactEmail} />}
            </Field>

            <Field label="Số điện thoại">
              {editing
                ? <input type="tel" style={inputCls} value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="0901234567"
                    onFocus={(e) => (e.target.style.borderColor = "#f04e23")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                : <ReadonlyValue value={club?.contactPhone} />}
            </Field>
          </div>

          <Field label="Facebook / Mạng xã hội">
            {editing
              ? <input style={inputCls} value={form.facebookUrl}
                  onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  onFocus={(e) => (e.target.style.borderColor = "#f04e23")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
              : <ReadonlyValue value={club?.facebookUrl} link />}
          </Field>
        </div>
      </div>
    </div>
  );
}
