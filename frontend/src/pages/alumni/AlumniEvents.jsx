import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import axiosClient from "../../services/api/axiosClient";

const FALLBACK = [
  { id: 1, name: "Hackathon Alumni 2026",                  date: "15/08/2026", time: "08:00", location: "FPT Arena",      tag: "Sắp diễn ra" },
  { id: 2, name: "Hội thảo: Từ sinh viên đến chuyên gia", date: "20/07/2026", time: "14:00", location: "Hội trường lớn", tag: "Sắp diễn ra" },
];

const TAG_CFG = {
  "Sắp diễn ra": { color: "#059669", bg: "#ecfdf5" },
  "Đã kết thúc": { color: "#6b7280", bg: "#f3f4f6" },
};

export default function AlumniEvents() {
  const [events, setEvents]   = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/alumni/events")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (list.length > 0) {
          setEvents(list.map((e) => ({
            id:       e.id       ?? e.eventId,
            name:     e.name     ?? e.eventName ?? "—",
            date:     e.date     ?? e.startDate ?? "",
            time:     e.time     ?? "",
            location: e.location ?? "",
            tag:      e.status === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc",
          })));
        }
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sự Kiện Alumni</h1>
        <p className="page-subtitle">Các sự kiện dành riêng cho cựu sinh viên FPTU</p>
      </div>

      <div className="content-card">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
            <Calendar size={40} strokeWidth={1.2} />
            <p className="text-[13px] m-0">Không có sự kiện nào.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => {
              const cfg = TAG_CFG[ev.tag] ?? TAG_CFG["Đã kết thúc"];
              return (
                <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-[#f0f0f0] bg-white">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF3EE] flex items-center justify-center shrink-0">
                    <Calendar size={20} color="#E6430A" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 m-0 mb-1">{ev.name}</p>
                    <p className="text-xs text-gray-400 m-0 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={11} /> {ev.date}{ev.time ? ` ${ev.time}` : ""}</span>
                      {ev.location && <span className="flex items-center gap-1"><MapPin size={11} /> {ev.location}</span>}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0" style={{ color: cfg.color, background: cfg.bg }}>
                    {ev.tag}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
