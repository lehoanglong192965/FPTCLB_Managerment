import { useNavigate } from "react-router-dom";
import { EVENTS } from "../../../constants/mockData";
import EventCard from "./EventCard";

export default function EventsSection() {
  const navigate = useNavigate();

  return (
    <section id="events" className="events-section">
      <div className="section__header">
        <span className="section__eyebrow">Lịch Trình</span>
        <h2 className="section__title">Sự Kiện Sắp Tới</h2>
        <p className="section__desc">
          Đừng bỏ lỡ các workshop, hackathon và chương trình giao lưu hấp dẫn
          sắp diễn ra.
        </p>
      </div>

      <div className="events__list">
        {EVENTS.map((event) => (
          <EventCard key={event.title} event={event} />
        ))}
      </div>

      <div className="events__cta-wrap">
        <button className="btn-outline-white" onClick={() => navigate("/events")}>
          Xem Toàn Bộ Lịch Sự Kiện →
        </button>
      </div>
    </section>
  );
}
