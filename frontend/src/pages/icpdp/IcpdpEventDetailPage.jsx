import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import { getServerOrigin } from "../../services/api/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import LocationPicker from "../../components/events/LocationPicker";
import RichTextView from "../../components/ui/RichTextView";

/* ICPDP chỉ xem thông tin sự kiện ở đây (không quản lý vòng đời) — việc mở/đóng đăng ký,
   bắt đầu/kết thúc/huỷ sự kiện thuộc về club-leader. ICPDP chỉ được sửa số người tham gia
   tối đa sau khi đã duyệt, và có luồng riêng cho duyệt báo cáo/đóng góp (tab "Báo cáo"
   trong Quản Lý Sự Kiện, trang Đóng góp). */

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

const fmtBudget = (val) => {
  const n = Number(val);
  return isNaN(n) || n === 0 ? null : n.toLocaleString("vi-VN") + " đ";
};

const STATUS_CFG = {
  APPROVED: { label: "Đã duyệt", color: "#059669", bg: "#d1fae5" },
  REGISTRATIONOPEN: { label: "Mở đăng ký", color: "#0891b2", bg: "#cffafe" },
  REGISTRATIONCLOSED: { label: "Đóng đăng ký", color: "#0e7490", bg: "#e0f2fe" },
  ONGOING: { label: "Đang diễn ra", color: "#2563eb", bg: "#dbeafe" },
  COMPLETED: { label: "Đã kết thúc", color: "#7c3aed", bg: "#ede9fe" },
  REPORTUPLOADED: { label: "Đã nộp báo cáo", color: "#9333ea", bg: "#f3e8ff" },
  REPORTPENDINGAPPROVAL: { label: "Báo cáo chờ duyệt", color: "#c026d3", bg: "#fae8ff" },
  REPORTAPPROVED: { label: "Báo cáo đã duyệt", color: "#0f766e", bg: "#ccfbf1" },
  REPORTREJECTED: { label: "Báo cáo bị từ chối", color: "#b91c1c", bg: "#fee2e2" },
  CLOSED: { label: "Đã đóng", color: "#374151", bg: "#e5e7eb" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", fontSize: 13.5, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", boxSizing: "border-box", outline: "none" };
const accentInputStyle = { ...inputStyle, borderLeft: "3px solid #E6430A" };

function SectionHeader({ children }) {
  return (
    <div style={{ background: "#eef2ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 14px", borderRadius: 8 }}>
      {children}
    </div>
  );
}

function ReadBox({ value, multiline = false }) {
  return (
    <div style={{
      fontSize: 13.5, color: value ? "#111827" : "#9ca3af",
      whiteSpace: multiline ? "pre-line" : "normal", lineHeight: 1.6, padding: "2px 0",
    }}>
      {value || "Chưa có"}
    </div>
  );
}

export default function IcpdpEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [ev, setEv] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ maxParticipants: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [detail, clubRows] = await Promise.all([
          eventApi.getEventByIdForIcpdp(eventId),
          clubApi.getAll(),
        ]);
        if (!active) return;
        if (detail) setEv(detail?.data ?? detail);
        else setNotFound(true);
        setClubs(Array.isArray(clubRows) ? clubRows : (clubRows?.data ?? clubRows?.content ?? []));
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [eventId]);

  const patchEvent = (patch) => setEv((prev) => (prev ? { ...prev, ...patch } : prev));

  const enterEdit = () => {
    const dt = ev.startDate ? new Date(ev.startDate) : null;
    const endDt = ev.endDate ? new Date(ev.endDate) : null;
    const pad = (n) => String(n).padStart(2, "0");
    setEditForm({
      maxParticipants: ev.maxParticipants ?? "",
      budget: ev.budget ?? "",
      date: dt ? `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` : "",
      time: dt ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : "",
      endTime: endDt ? `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}` : "",
      venueName: ev.venueName || "",
      location: ev.location || "",
      locationDetail: ev.locationDetail || "",
      latitude: typeof ev.latitude === "number" ? ev.latitude : null,
      longitude: typeof ev.longitude === "number" ? ev.longitude : null,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const startDate = editForm.date && editForm.time ? `${editForm.date}T${editForm.time}:00` : undefined;
      const endDate = editForm.date && editForm.endTime ? `${editForm.date}T${editForm.endTime}:00` : undefined;
      const payload = {
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : undefined,
        budget: editForm.budget !== "" ? Number(editForm.budget) : undefined,
        startDate,
        endDate,
        venueName: editForm.venueName ?? undefined,
        location: editForm.location || undefined,
        locationDetail: editForm.locationDetail ?? undefined,
        latitude: typeof editForm.latitude === "number" ? editForm.latitude : undefined,
        longitude: typeof editForm.longitude === "number" ? editForm.longitude : undefined,
      };
      await eventApi.update(ev.eventID, payload);
      patchEvent({
        maxParticipants: editForm.maxParticipants ? parseInt(editForm.maxParticipants) : ev.maxParticipants,
        budget: editForm.budget !== "" ? Number(editForm.budget) : ev.budget,
        startDate: startDate ?? ev.startDate,
        endDate: endDate ?? ev.endDate,
        venueName: editForm.venueName,
        location: editForm.location,
        locationDetail: editForm.locationDetail,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
      });
      setIsEditing(false);
      toast.success("Đã lưu thay đổi.");
    } catch (e) {
      toast.error("Lỗi lưu thay đổi: " + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Đang tải...</div>;
  if (notFound || !ev) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Không tìm thấy sự kiện.</div>;

  const rawStatus = ev.eventStatus ?? "";
  const status = rawStatus.toUpperCase().replace(/_/g, "");
  const cfg = STATUS_CFG[status] ?? { label: rawStatus, color: "#6b7280", bg: "#f3f4f6" };
  const club = clubs.find((c) => c.clubID === ev.clubID);
  const clubName = club?.name ?? club?.clubName ?? "CLB FPTU";

  const isLimitedEdit = ["APPROVED", "UPCOMING", "REGISTRATIONOPEN", "REGISTRATIONCLOSED"].includes(status);

  const dateStr = ev.startDate ? new Date(ev.startDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Chưa xác định";
  const timeStr = ev.startDate ? new Date(ev.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  const endTimeStr = ev.endDate ? new Date(ev.endDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)} title="Quay lại"
          style={{ border: "1.5px solid #e5e7eb", background: "#fff", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151", flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Chi Tiết Sự Kiện</h1>
          <p className="page-subtitle">{clubName}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(13,27,62,0.07)", border: "1px solid #f0f0f0", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, marginBottom: 8 }}>{cfg.label}</span>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827", lineHeight: 1.35, wordBreak: "break-word" }}>{ev.eventName}</h2>
        </div>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Ảnh banner</label>
                  {ev.bannerUrl ? (
                    <img src={getImageUrl(ev.bannerUrl)} alt="Banner" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, display: "block" }} />
                  ) : (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13, border: "1.5px dashed #e5e7eb", borderRadius: 8 }}>Chưa có ảnh banner</div>
                  )}
                </div>

                <SectionHeader>Thông tin</SectionHeader>
                <div>
                  <label style={labelStyle}>Tên sự kiện</label>
                  <ReadBox value={ev.eventName} />
                </div>
                <div>
                  <label style={labelStyle}>Mô tả sự kiện</label>
                  <RichTextView html={ev.description} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Số người tối đa</label>
                    {isEditing ? (
                      <input type="number" min={1} value={editForm.maxParticipants}
                        onChange={(e) => setEditForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                        style={accentInputStyle} />
                    ) : <ReadBox value={ev.maxParticipants ? `${ev.maxParticipants} người` : null} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Quỹ dự kiến (VNĐ)</label>
                    {isEditing ? (
                      <input type="number" min={0} step={1000} value={editForm.budget}
                        onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))}
                        placeholder="0" style={accentInputStyle} />
                    ) : <ReadBox value={fmtBudget(ev.budget)} />}
                  </div>
                </div>

                <SectionHeader>Thời gian</SectionHeader>
                <div>
                  <label style={labelStyle}>Ngày tổ chức</label>
                  {isEditing ? (
                    <input type="date" value={editForm.date}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      style={accentInputStyle} />
                  ) : <ReadBox value={dateStr} />}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Giờ bắt đầu</label>
                    {isEditing ? (
                      <input type="time" value={editForm.time}
                        onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                        style={accentInputStyle} />
                    ) : <ReadBox value={timeStr || null} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Giờ kết thúc</label>
                    {isEditing ? (
                      <input type="time" value={editForm.endTime}
                        onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                        style={accentInputStyle} />
                    ) : <ReadBox value={endTimeStr || null} />}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SectionHeader>Địa điểm</SectionHeader>
                <div>
                  <label style={labelStyle}>Tên địa điểm / Toà nhà</label>
                  {isEditing ? (
                    <input value={editForm.venueName}
                      onChange={(e) => setEditForm((f) => ({ ...f, venueName: e.target.value }))}
                      placeholder="VD: Hội trường Beta – Đại học FPT" style={accentInputStyle} />
                  ) : <ReadBox value={ev.venueName} />}
                </div>
                <div>
                  <label style={labelStyle}>Địa chỉ (định vị trên bản đồ)</label>
                  {isEditing ? (
                    <LocationPicker
                      address={editForm.location} lat={editForm.latitude} lng={editForm.longitude}
                      onChange={({ address, lat, lng }) => setEditForm((f) => ({ ...f, location: address, latitude: typeof lat === "number" ? lat : null, longitude: typeof lng === "number" ? lng : null }))}
                    />
                  ) : (
                    <LocationPicker address={ev.location} lat={ev.latitude} lng={ev.longitude} readOnly />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {!isLimitedEdit && !isEditing && (
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>Không thể chỉnh sửa thông tin ở trạng thái hiện tại.</p>
            )}
            {isLimitedEdit && !isEditing && (
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>Sự kiện đã được duyệt — chỉ có thể chỉnh sửa số người tham gia tối đa, quỹ dự kiến, thời gian và địa điểm (đến khi sự kiện diễn ra).</p>
            )}
            {isLimitedEdit && !isEditing && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={enterEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "#E6430A", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  <Pencil size={14} /> Chỉnh sửa
                </button>
              </div>
            )}
            {isLimitedEdit && isEditing && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsEditing(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#6b7280", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Hủy chỉnh sửa</button>
                <button disabled={saving} onClick={handleSaveEdit} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: saving ? "#86efac" : "#059669", color: "#fff", fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
