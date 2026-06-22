import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "./EventCard";

function loadApprovedEvents() {
  try {
    return JSON.parse(localStorage.getItem("public_approved_events") || "[]");
  } catch {
    return [];
  }
}

export default function EventsSection() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(loadApprovedEvents);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "public_approved_events") setEvents(loadApprovedEvents());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <section
      id="events"
      className="relative px-[5%] py-24 overflow-hidden"
      style={{ background: "linear-gradient(150deg, #0D1B3E 0%, #132150 60%, #1a2a5e 100%)" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 50%, transparent 100%)",
        }}
      />
      {/* Blob accent */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(55,138,221,0.18) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="relative z-10 text-center mb-14">
        <span
          className="inline-block text-[13px] font-bold tracking-[3px] uppercase mb-3"
          style={{ color: "#FF8C33" }}
        >
          Lịch Trình
        </span>
        <h2
          className="font-black text-white mb-3.5"
          style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", letterSpacing: "-1.5px", lineHeight: 1.1 }}
        >
          Sự Kiện Sắp Tới
        </h2>
        <p className="text-[15px] max-w-[480px] mx-auto leading-[1.7]" style={{ color: "rgba(255,255,255,0.50)" }}>
          Đừng bỏ lỡ các workshop, hackathon và chương trình giao lưu hấp dẫn sắp diễn ra.
        </p>
      </div>

      {/* Grid */}
      <div
        className="relative z-10 grid gap-5 max-w-[1200px] mx-auto"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
      >
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
              Chưa có sự kiện nào được phê duyệt.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="relative z-10 text-center mt-11">
        <button
          onClick={() => navigate("/events")}
          className="inline-flex items-center gap-2 px-[30px] py-[13px] text-[14px] font-bold rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 border-2"
          style={{ color: "#FF8C33", borderColor: "rgba(255,107,0,0.4)", background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FF6B00"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#FF6B00"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,107,0,0.30)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#FF8C33"; e.currentTarget.style.borderColor = "rgba(255,107,0,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          Xem Toàn Bộ Lịch Sự Kiện →
        </button>
      </div>
    </section>
  );
}
