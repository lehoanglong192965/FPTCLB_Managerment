import { useNavigate } from "react-router-dom";
import { CLUBS } from "../../../constants/mockData";
import ClubCard from "./ClubCard";

export default function ClubsSection() {
  const navigate = useNavigate();

  return (
    <section id="clubs" className="clubs-section">
      <div className="section__header">
        <span className="section__eyebrow">Cộng Đồng</span>
        <h2 className="section__title">Các Câu Lạc Bộ Nổi Bật</h2>
        <p className="section__desc">
          Khám phá hơn 40 câu lạc bộ đa dạng — từ công nghệ, nghệ thuật đến
          thể thao và kinh doanh.
        </p>
      </div>

      <div className="clubs__grid">
        {CLUBS.map((club) => (
          <ClubCard key={club.abbr} club={club} />
        ))}
      </div>

      <div className="clubs__cta-wrap">
        <button className="btn-outline" onClick={() => navigate("/clubs")}>
          Xem Tất Cả Câu Lạc Bộ →
        </button>
      </div>
    </section>
  );
}
