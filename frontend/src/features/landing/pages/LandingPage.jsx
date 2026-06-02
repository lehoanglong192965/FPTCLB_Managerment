import { STATS } from "../../../constants/mockData";
import ClubsSection from "../../clubs/components/ClubsSection";
import EventsSection from "../../events/components/EventsSection";
import "../../../assets/css/landingPage.css";

function Hero() {
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="home" className="hero">
      <div className="hero__bg-grid" />
      <div className="hero__blob hero__blob--1" />
      <div className="hero__blob hero__blob--2" />
      <div className="hero__blob hero__blob--3" />
      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Đại Học FPT – Hệ Thống Câu Lạc Bộ
        </div>
        <h1 className="hero__title">
          Kết Nối. Phát Triển.{" "}
          <span className="hero__title-highlight">Toả Sáng.</span>
        </h1>
        <p className="hero__sub">
          Nền tảng quản lý và tham gia câu lạc bộ dành riêng cho sinh viên FPT —
          nơi đam mê gặp gỡ cơ hội và cộng đồng.
        </p>
        <div className="hero__cta">
          <button className="btn-primary-lg" onClick={() => scrollTo("clubs")}>
            Khám Phá CLB ↓
          </button>
          <button className="btn-ghost-lg" onClick={() => scrollTo("events")}>
            📅 Xem Sự Kiện
          </button>
        </div>
        <div className="hero__stats">
          {STATS.map((s) => (
            <div key={s.label} className="hero__stat">
              <div className="hero__stat-value">{s.value}</div>
              <div className="hero__stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section id="about" className="cta-banner">
      <div className="cta-banner__inner">
        <div className="cta-banner__bg-pattern" />
        <div className="cta-banner__blob" />
        <div className="cta-banner__content">
          <h2 className="cta-banner__title">
            Sẵn Sàng Trở Thành<br />Một Phần Của Cộng Đồng?
          </h2>
          <p className="cta-banner__desc">
            Tham gia ngay hôm nay để kết nối với hàng nghìn sinh viên FPT,
            phát triển kỹ năng và tạo ra những kỷ niệm đáng nhớ.
          </p>
          <div className="cta-banner__actions">
            <button className="btn-primary-lg">Đăng Ký Miễn Phí</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="page">
      <Hero />
      <ClubsSection />
      <EventsSection />
      <CTABanner />
    </div>
  );
}
