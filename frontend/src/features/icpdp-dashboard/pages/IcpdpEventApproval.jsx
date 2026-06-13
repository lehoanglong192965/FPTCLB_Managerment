import { useState } from "react";
import "../../../assets/css/icpdpEventApproval.css";

const MOCK_EVENTS = [
  {
    id: 1,
    status: "pending",
    statusLabel: "Chờ IC-PDP duyệt",
    name: "Tech Talk: AI & LLM",
    club: "FPTU IT Club",
    description: "Buổi hội thảo chuyên sâu về Large Language Models và ứng dụng trong doanh nghiệp.",
    eventDate: "28/7/2026",
    budget: "5.000.000",
    location: "Phòng 202 — Tòa nhà A",
    daysLeft: 50,
    submittedAt: "5/7/2026",
  },
  {
    id: 2,
    status: "ongoing",
    statusLabel: "Đang diễn ra",
    name: "Workshop: React & TypeScript",
    club: "FPTU Code Club",
    description: "Workshop thực hành xây dựng ứng dụng web hiện đại với React và TypeScript.",
    eventDate: "10/6/2026",
    budget: "2.000.000",
    location: "Phòng 301 — Tòa nhà B",
    daysLeft: null,
    submittedAt: "1/6/2026",
  },
  {
    id: 3,
    status: "pending",
    statusLabel: "Chờ IC-PDP duyệt",
    name: "Giao lưu Văn hóa Quốc tế",
    club: "FPTU English Club",
    description: "Sự kiện giao lưu văn hóa giữa sinh viên Việt Nam và sinh viên quốc tế tại FPTU.",
    eventDate: "15/8/2026",
    budget: "8.500.000",
    location: "Hội trường A — Tòa nhà C",
    daysLeft: 68,
    submittedAt: "8/7/2026",
  },
];

const STATUS_BADGE = {
  pending:  "badge-pending",
  ongoing:  "badge-ongoing",
  approved: "badge-approved",
  rejected: "badge-rejected",
};

const TABS = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "ongoing", label: "Đang diễn ra" },
  { key: "all",     label: "Tất cả" },
];

export default function IcpdpEventApproval() {
  const [activeTab, setActiveTab] = useState("pending");
  const [events, setEvents]       = useState(MOCK_EVENTS);

  const filtered = activeTab === "all"
    ? events
    : events.filter((e) => e.status === activeTab);

  const countOf = (key) => key === "all"
    ? events.length
    : events.filter((e) => e.status === key).length;

  const approve = (id) =>
    setEvents((prev) =>
      prev.map((e) => e.id === id ? { ...e, status: "approved", statusLabel: "Đã phê duyệt" } : e)
    );

  const reject = (id) =>
    setEvents((prev) =>
      prev.map((e) => e.id === id ? { ...e, status: "rejected", statusLabel: "Đã từ chối" } : e)
    );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Phê Duyệt Sự Kiện</h1>
        <p className="page-subtitle">Xét duyệt đề xuất tổ chức sự kiện từ các câu lạc bộ</p>
      </div>

      <div className="approval-tabs">
        {TABS.map((tab) => {
          const count = countOf(tab.key);
          return (
            <button
              key={tab.key}
              className={`approval-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {count > 0 && <span className="approval-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="approval-list">
        {filtered.length === 0 && (
          <p className="approval-empty">Không có sự kiện nào.</p>
        )}
        {filtered.map((event) => (
          <div key={event.id} className="approval-card">
            <div className="approval-card-body">
              <span className={`approval-status-badge ${STATUS_BADGE[event.status]}`}>
                {event.statusLabel}
              </span>
              <h3 className="approval-event-name">{event.name}</h3>
              <p className="approval-club-name">{event.club}</p>
              <p className="approval-description">{event.description}</p>
              <div className="approval-meta">
                <span className="approval-meta-item">
                  Ngày tổ chức: <strong>{event.eventDate}</strong>
                </span>
                <span className="approval-meta-item">
                  Ngân sách: <strong>{event.budget} đ</strong>
                </span>
                <span className="approval-meta-item">
                  Địa điểm: <strong>{event.location}</strong>
                </span>
                {event.daysLeft !== null && (
                  <span className="approval-days-left">Còn {event.daysLeft} ngày</span>
                )}
              </div>
              <div className="approval-meta" style={{ marginTop: 6 }}>
                <span className="approval-meta-item">Nộp ngày: {event.submittedAt}</span>
              </div>
            </div>

            {event.status === "pending" && (
              <div className="approval-actions">
                <button className="btn-approve" onClick={() => approve(event.id)}>Phê duyệt</button>
                <button className="btn-reject"  onClick={() => reject(event.id)}>Từ chối</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
