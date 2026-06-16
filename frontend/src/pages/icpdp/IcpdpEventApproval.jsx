import { useState } from "react";

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
  pending:  "bg-yellow-100 text-yellow-700",
  ongoing:  "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
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

      <div className="flex gap-0 border-b-2 border-gray-200 mb-6">
        {TABS.map((tab) => {
          const count = countOf(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 ${
                isActive
                  ? "text-[#e6430a] border-[#e6430a] font-semibold"
                  : "text-gray-500 border-transparent hover:text-[#e6430a]"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${isActive ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3.5">
        {filtered.length === 0 && (
          <p className="text-center py-16 text-gray-400 text-sm">Không có sự kiện nào.</p>
        )}
        {filtered.map((event) => (
          <div key={event.id} className="bg-white rounded-xl px-6 py-5 shadow-sm flex justify-between items-start gap-6">
            <div className="flex-1 min-w-0">
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold mb-2.5 ${STATUS_BADGE[event.status]}`}>
                {event.statusLabel}
              </span>
              <h3 className="text-[17px] font-bold text-gray-900 m-0 mb-0.5">{event.name}</h3>
              <p className="text-[13px] text-[#e6430a] font-medium m-0 mb-2">{event.club}</p>
              <p className="text-[13.5px] text-gray-600 m-0 mb-3 leading-relaxed">{event.description}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-gray-500">
                <span>Ngày tổ chức: <strong className="text-gray-900">{event.eventDate}</strong></span>
                <span>Ngân sách: <strong className="text-gray-900">{event.budget} đ</strong></span>
                <span>Địa điểm: <strong className="text-gray-900">{event.location}</strong></span>
                {event.daysLeft !== null && (
                  <span className="text-[#e6430a] font-semibold">Còn {event.daysLeft} ngày</span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-gray-500 mt-1.5">
                <span>Nộp ngày: {event.submittedAt}</span>
              </div>
            </div>

            {event.status === "pending" && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                  onClick={() => approve(event.id)}
                >
                  Phê duyệt
                </button>
                <button
                  className="px-5 py-2 bg-white text-gray-700 border border-gray-300 hover:border-red-500 hover:text-red-600 rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                  onClick={() => reject(event.id)}
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
