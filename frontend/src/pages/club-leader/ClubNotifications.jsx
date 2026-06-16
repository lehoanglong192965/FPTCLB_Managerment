import { Bell, Info, CheckCircle2, AlertTriangle } from "lucide-react";

const MOCK_NOTIFS = [
  { id: 1, type: "info",    title: "Nhắc nhở nộp báo cáo",         desc: "Hạn nộp báo cáo hoạt động học kỳ: 31/07/2026",        time: "2 giờ trước" },
  { id: 2, type: "success", title: "Sự kiện được phê duyệt",        desc: 'IC-PDP đã phê duyệt "Workshop UI/UX Design"',          time: "Hôm qua" },
  { id: 3, type: "warning", title: "Đơn tuyển thành viên mới",      desc: "Có 3 đơn ứng tuyển đang chờ xem xét",                  time: "2 ngày trước" },
  { id: 4, type: "success", title: "Thành viên mới được phê duyệt", desc: "Nguyễn Văn B đã được thêm vào CLB",                   time: "3 ngày trước" },
  { id: 5, type: "info",    title: "Thông báo lịch họp",             desc: "Họp ban điều hành: 10/07/2026, 15:00 — Phòng lab IT", time: "1 tuần trước" },
];

const TYPE_CFG = {
  info:    { icon: Info,         color: "#3b82f6", bg: "#eff6ff" },
  success: { icon: CheckCircle2, color: "#059669", bg: "#ecfdf5" },
  warning: { icon: AlertTriangle,color: "#d97706", bg: "#fffbeb" },
};

export default function ClubNotifications() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Thông Báo</h1>
        <p className="page-subtitle">Thông báo và tin tức của câu lạc bộ</p>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {MOCK_NOTIFS.map((n) => {
            const cfg = TYPE_CFG[n.type];
            const Icon = cfg.icon;
            return (
              <div key={n.id} style={{
                display: "flex", gap: "1rem", padding: "1rem 1.25rem",
                borderRadius: 12, border: "1.5px solid #f0f0f0", background: "#fff",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 2px" }}>{n.title}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px" }}>{n.desc}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: "1rem" }}>
          Dữ liệu thông báo thật sẽ được tích hợp trong phiên bản tiếp theo
        </p>
      </div>
    </div>
  );
}
