import { createContext, useContext, useState } from "react";

const LS_PROPOSALS = "fptclb_proposals";
const LS_APPROVED  = "fptclb_approved_events";

const loadLS = (key) => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? []; }
  catch { return []; }
};

const CATEGORY_STYLE = {
  "Workshop":           { emoji: "🎯", color: "#E6430A" },
  "Hội thảo":          { emoji: "🎤", color: "#0284c7" },
  "Giao lưu":          { emoji: "🤝", color: "#059669" },
  "Thi đấu thể thao":  { emoji: "⚽", color: "#d97706" },
  "Văn nghệ":          { emoji: "🎵", color: "#7c3aed" },
  "Tình nguyện":       { emoji: "💚", color: "#16a34a" },
  "Cuộc thi":          { emoji: "🏆", color: "#f59e0b" },
  "Khác":              { emoji: "⭐", color: "#6366f1" },
};

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function daysUntil(displayDate) {
  const [d, m, y] = displayDate.split("/");
  const diff = Math.ceil((new Date(`${y}-${m}-${d}`) - new Date()) / 86400000);
  return diff > 0 ? diff : null;
}

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const [proposals,      setProposals]   = useState(() => loadLS(LS_PROPOSALS));
  const [approvedEvents, setApproved]    = useState(() => loadLS(LS_APPROVED));

  const persistProposals = (data) => {
    setProposals(data);
    localStorage.setItem(LS_PROPOSALS, JSON.stringify(data));
  };

  const persistApproved = (data) => {
    setApproved(data);
    localStorage.setItem(LS_APPROVED, JSON.stringify(data));
  };

  /** Club Leader gửi đề xuất */
  const proposeEvent = (formData, clubName = "CLB FPT") => {
    const dateDisplay = toDisplayDate(formData.date);
    persistProposals([
      {
        id:               Date.now(),
        status:           "pending",
        statusLabel:      "Chờ IC-PDP duyệt",
        name:             formData.name,
        club:             clubName,
        description:      formData.desc,
        eventDate:        dateDisplay,
        budget:           Number(formData.budget || 0).toLocaleString("vi-VN"),
        location:         formData.location || "Online",
        daysLeft:         daysUntil(dateDisplay),
        submittedAt:      new Date().toLocaleDateString("vi-VN"),
        scheduleConflict: false,
        _category:        formData.category,
        _expectedCount:   formData.expectedCount,
        _startTime:       formData.startTime,
        _desc:            formData.desc,
        _bannerUrl:       formData.banner || null,
      },
      ...proposals,
    ]);
  };

  /** ICPDP phê duyệt → chuyển sang danh sách công khai */
  const approveProposal = (id) => {
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) return;

    persistProposals(
      proposals.map((p) =>
        p.id === id ? { ...p, status: "approved", statusLabel: "Đã phê duyệt" } : p
      )
    );

    const style = CATEGORY_STYLE[proposal._category] ?? { emoji: "⭐", color: "#6366f1" };
    persistApproved([
      {
        id:                  id,
        emoji:               style.emoji,
        color:               style.color,
        title:               proposal.name,
        club:                proposal.club,
        tag:                 proposal._category || "Khác",
        date:                proposal.eventDate,
        time:                proposal._startTime || "",
        venue:               proposal.location,
        venueDetail:         "Đại học FPT",
        currentParticipants: 0,
        maxParticipants:     Number(proposal._expectedCount) || 100,
        desc:                proposal._desc,
        longDesc:            proposal._desc,
        badge:               "Đăng ký mở",
        badgeType:           "open",
        bannerUrl:           proposal._bannerUrl || null,
      },
      ...approvedEvents,
    ]);
  };

  /** ICPDP từ chối */
  const rejectProposal = (id) => {
    persistProposals(
      proposals.map((p) =>
        p.id === id ? { ...p, status: "rejected", statusLabel: "Đã từ chối" } : p
      )
    );
  };

  return (
    <EventsContext.Provider value={{ proposals, approvedEvents, proposeEvent, approveProposal, rejectProposal }}>
      {children}
    </EventsContext.Provider>
  );
}

export const useEvents = () => useContext(EventsContext);
