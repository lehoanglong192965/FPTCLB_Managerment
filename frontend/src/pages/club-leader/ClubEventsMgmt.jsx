import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search, Plus } from "lucide-react";
import { TokenService } from "../../services/api/axiosClient";
import clubApi from "../../services/api/clubs/clubApi";
import eventApi from "../../services/api/events/eventApi";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";

const STATUS_DEFS = [
  { keys: ["Draft",                   "DRAFT"],                        label: "Bản nháp",                    color: "#6b7280", bg: "#f3f4f6" },
  { keys: ["Pending",                 "PENDING",          "pending"],  label: "Chờ duyệt (cũ)",              color: "#d97706", bg: "#fffbeb" },
  { keys: ["PendingApproval",         "PENDING_APPROVAL", "PENDINGAPPROVAL"], label: "Chờ ICPDP duyệt",     color: "#b45309", bg: "#fef3c7" },
  { keys: ["Approved",                "APPROVED"],                     label: "Đã duyệt",                    color: "#059669", bg: "#d1fae5" },
  { keys: ["RegistrationOpen",        "REGISTRATION_OPEN",   "REGISTRATIONOPEN"],   label: "Mở đăng ký",    color: "#0891b2", bg: "#cffafe" },
  { keys: ["RegistrationClosed",      "REGISTRATION_CLOSED", "REGISTRATIONCLOSED"], label: "Đóng đăng ký",  color: "#0e7490", bg: "#e0f2fe" },
  { keys: ["CheckinOpen",             "CHECKIN_OPEN",    "CHECKINOPEN"],            label: "Đang điểm danh",color: "#0284c7", bg: "#bae6fd" },
  { keys: ["Upcoming",                "UPCOMING"],                     label: "Sắp diễn ra",                 color: "#16a34a", bg: "#dcfce7" },
  { keys: ["Ongoing",                 "ONGOING"],                      label: "Đang diễn ra",                color: "#2563eb", bg: "#dbeafe" },
  { keys: ["Completed",               "COMPLETED"],                    label: "Đã kết thúc",                 color: "#7c3aed", bg: "#ede9fe" },
  { keys: ["ReportUploaded",          "REPORT_UPLOADED",     "REPORTUPLOADED"],     label: "Đã nộp báo cáo",color: "#9333ea", bg: "#f3e8ff" },
  { keys: ["ReportPendingApproval",   "REPORT_PENDING_APPROVAL", "REPORTPENDINGAPPROVAL"], label: "Báo cáo chờ duyệt", color: "#c026d3", bg: "#fae8ff" },
  { keys: ["ReportApproved",          "REPORT_APPROVED", "REPORTAPPROVED"],         label: "Báo cáo đã duyệt",color: "#0f766e", bg: "#ccfbf1" },
  { keys: ["ReportRejected",          "REPORT_REJECTED", "REPORTREJECTED"],         label: "Báo cáo bị từ chối",color: "#b91c1c", bg: "#fee2e2" },
  { keys: ["ContributionDraft",       "CONTRIBUTION_DRAFT",        "CONTRIBUTIONDRAFT"],        label: "Đóng góp — Nháp",     color: "#475569", bg: "#f1f5f9" },
  { keys: ["ContributionCalculated",  "CONTRIBUTION_CALCULATED",   "CONTRIBUTIONCALCULATED"],   label: "Đã tính điểm",        color: "#0369a1", bg: "#e0f2fe" },
  { keys: ["ContributionScoring",     "CONTRIBUTION_SCORING",      "CONTRIBUTIONSCORING"],      label: "Đang chấm điểm",      color: "#7c2d12", bg: "#fff7ed" },
  { keys: ["ContributionPendingApproval","CONTRIBUTION_PENDING_APPROVAL","CONTRIBUTIONPENDINGAPPROVAL"], label: "Đóng góp chờ duyệt", color: "#a16207", bg: "#fefce8" },
  { keys: ["ContributionApproved",    "CONTRIBUTION_APPROVED",     "CONTRIBUTIONAPPROVED"],     label: "Đóng góp đã duyệt",   color: "#15803d", bg: "#f0fdf4" },
  { keys: ["ContributionFinalized",   "CONTRIBUTION_FINALIZED",    "CONTRIBUTIONFINALIZED"],    label: "Đóng góp hoàn tất",   color: "#166534", bg: "#dcfce7" },
  { keys: ["Closed",                  "CLOSED"],                       label: "Đã đóng",                     color: "#374151", bg: "#e5e7eb" },
  { keys: ["Cancelled",               "CANCELLED",        "CANCELED"],label: "Đã hủy",                      color: "#dc2626", bg: "#fee2e2" },
  { keys: ["Rejected",                "REJECTED"],                     label: "Bị từ chối",                  color: "#b91c1c", bg: "#fff1f2" },
  { keys: ["Withdrawn",               "WITHDRAWN"],                    label: "Đã rút",                     color: "#9f1239", bg: "#fff1f2" },
];

const STATUS_CFG = Object.fromEntries(
  STATUS_DEFS.flatMap(({ keys, label, color, bg }) =>
    keys.map((k) => [k, { label, color, bg }])
  )
);

// Lấy clubId từ nhiều nguồn: TokenService → localStorage.user → null
function resolveClubId() {
  const fromToken = TokenService.getClubId();
  if (fromToken) return fromToken;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.clubId ?? null;
  } catch {
    return null;
  }
}

function normalizeEvent(ev) {
  return {
    eventID:         ev.eventID         ?? ev.id          ?? null,
    eventName:       ev.eventName       ?? ev.name        ?? "",
    eventStatus:     ev.eventStatus     ?? ev.status      ?? "Draft",
    startDate:       ev.startDate       ?? null,
    endDate:         ev.endDate         ?? null,
    date:            ev.date            ?? "",
    time:            ev.time            ?? "",
    venueName:       ev.venueName       ?? "",
    location:        ev.location        ?? "",
    locationDetail:  ev.locationDetail  ?? "",
    latitude:        ev.latitude        ?? null,
    longitude:       ev.longitude       ?? null,
    description:     ev.description     ?? "",
    maxParticipants: ev.maxParticipants ?? null,
    budget:          ev.budget          ?? null,
    bannerUrl:        ev.bannerUrl        ?? null,
    bannerPublicId:   ev.bannerPublicId   ?? null,
    rejectionReason:  ev.rejectionReason  ?? null,
    createdAt:        ev.createdAt        ?? ev.createdDate ?? null,
  };
}

export default function ClubEventsMgmt() {
  const confirm  = useConfirm();
  const toast    = useToast();
  const clubId   = resolveClubId();
  const navigate = useNavigate();

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [events, setEvents]             = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await clubApi.getAllEvents(clubId);
        // axiosClient interceptor đã unwrap response.data, nên response IS the data
        // Hỗ trợ: plain array, { content: [...] } (paginated), { data: [...] }
        let raw;
        if (Array.isArray(response)) {
          raw = response;
        } else if (response?.content && Array.isArray(response.content)) {
          raw = response.content;
        } else if (response?.data && Array.isArray(response.data)) {
          raw = response.data;
        } else {
          raw = [];
        }
        const normalized = raw.map(normalizeEvent);
        setEvents(normalized);
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        console.error("[ClubEventsMgmt] Lỗi tải sự kiện:", error);
      }
    };
    if (clubId) fetchEvents();
  }, [clubId]);

  // Thứ tự hiển thị chip lọc (chỉ các trạng thái Club Leader thực sự gặp)
  const STATUS_ORDER = [
    "DRAFT",
    "PENDING_APPROVAL", "PENDINGAPPROVAL",
    "REJECTED",
    "WITHDRAWN",
    "APPROVED",
    "REGISTRATION_OPEN", "REGISTRATIONOPEN",
    "REGISTRATION_CLOSED", "REGISTRATIONCLOSED",
    "ONGOING",
    "COMPLETED",
    "REPORT_UPLOADED", "REPORTUPLOADED",
    "REPORT_APPROVED", "REPORTAPPROVED",
    "CONTRIBUTION_FINALIZED", "CONTRIBUTIONFINALIZED",
    "CLOSED",
    "CANCELLED",
  ];

  const availableStatuses = [...new Set(events.map((e) => (e.eventStatus || "Draft").toUpperCase()))]
    .sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a);
      const ib = STATUS_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  const filtered = events
    .filter((e) => (e.eventName || "").toLowerCase().includes(search.toLowerCase()))
    .filter((e) => statusFilter === "ALL" || (e.eventStatus || "Draft").toUpperCase() === statusFilter)
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
      return (b.eventID ?? 0) - (a.eventID ?? 0);
    });

  const handleDeleteDraft = async (ev) => {
    if (!(await confirm(`Xóa bản nháp "${ev.eventName}"? Hành động này không thể hoàn tác.`, { danger: true, confirmLabel: "Xóa bản nháp" }))) return;
    try {
      await eventApi.deleteDraft(ev.eventID);
      setEvents((prev) => prev.filter((e) => e.eventID !== ev.eventID));
      toast.success("Đã xóa bản nháp.");
    } catch (e) {
      toast.error("Lỗi xóa bản nháp: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Sự Kiện</h1>
        <p className="page-subtitle">Theo dõi trạng thái các sự kiện đã đề xuất</p>
      </div>

      <div className="content-card">
        <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ position: "relative", maxWidth: 360, flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sự kiện..."
                style={{ width: "100%", height: 38, padding: "8px 10px 8px 32px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={() => navigate("../../event-create", { relative: "path" })}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, padding: "0 16px", borderRadius: 8, border: "none", background: "#E6430A", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxSizing: "border-box" }}
            >
              <Plus size={15} /> Tạo sự kiện
            </button>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex gap-0 border-b-2 border-gray-200 mb-1">
            {[{ key: "ALL", label: "Tất cả" },
              ...availableStatuses.map((s) => {
                const cfg = STATUS_CFG[s] || STATUS_CFG["Draft"];
                return { key: s, label: cfg.label };
              })
            ].map(({ key, label }) => {
              const active = statusFilter === key;
              const count  = key === "ALL" ? events.length : events.filter((e) => (e.eventStatus || "Draft").toUpperCase() === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                    active ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${active ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Calendar size={40} style={{ color: "#e5e7eb", margin: "0 auto 14px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>
              {search ? "Không tìm thấy sự kiện phù hợp." : (!clubId ? "Không xác định được câu lạc bộ." : "Chưa có sự kiện nào.")}
            </p>
            {!search && !clubId && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 10px" }}>
                Vui lòng đăng xuất và đăng nhập lại để làm mới phiên.
              </p>
            )}
            {!search && !!clubId && (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Tạo đề xuất sự kiện để bắt đầu.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((ev, index) => {
              const rawStatus = ev.eventStatus || "Draft";
              const status    = rawStatus.toUpperCase().replace(/_/g, "");
              const cfg       = STATUS_CFG[rawStatus] || STATUS_CFG[status] || STATUS_CFG["Draft"];
              const isDraft = status === "DRAFT";
              return (
                <div
                  key={ev.eventID ?? `${ev.eventName}-${ev.startDate ?? ev.date ?? index}`}
                  onClick={() => navigate(`${ev.eventID}`, { relative: "path" })}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.875rem 1.25rem", borderRadius: 12,
                    border: status === "CANCELLED" ? "1.5px solid #fecaca" : "1.5px solid #f0f0f0",
                    background: status === "CANCELLED" ? "#fff8f8" : "#fff",
                    transition: "border-color 0.15s, background 0.15s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#fdba8c")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = status === "CANCELLED" ? "#fecaca" : "#f0f0f0")}
                >
                  {/* Trái: tên sự kiện + trạng thái */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.eventName}
                    </p>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Phải: nút Xoá (chỉ bản nháp) */}
                  {isDraft && (
                    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDraft(ev); }}
                        style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                      >
                        Xoá
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

