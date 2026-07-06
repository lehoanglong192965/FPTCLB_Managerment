import { useNavigate } from "react-router-dom";
import { usePublicClubs } from "../../hooks/usePublicClubs";
import ClubCard from "./ClubCard";

const PREVIEW_COUNT = 8;

export default function ClubsSection() {
  const navigate = useNavigate();
  const { clubs, loading, error } = usePublicClubs();
  const preview = clubs.slice(0, PREVIEW_COUNT);

  return (
    <section id="clubs" className="px-[5%] py-24 bg-white">
      {/* Header */}
      <div className="text-center mb-14">
        <span
          className="inline-block text-[13px] font-bold tracking-[3px] uppercase mb-3"
          style={{ color: "#FF6B00" }}
        >
          Cộng Đồng
        </span>
        <h2
          className="font-black mb-3.5"
          style={{
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            color: "#0D1B3E",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          Các Câu Lạc Bộ Nổi Bật
        </h2>
        <p className="text-[15px] max-w-[500px] mx-auto leading-[1.7]" style={{ color: "#4B5674" }}>
          Khám phá các câu lạc bộ đa dạng — từ công nghệ, nghệ thuật đến thể thao và kinh doanh.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-[#FF6B00] rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-center text-gray-400 py-10">{error}</p>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div
          className="grid gap-6 max-w-[1200px] mx-auto"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {preview.map((club) => (
            <ClubCard key={club.abbr} club={club} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="text-center mt-11">
        <button
          onClick={() => navigate("/clubs")}
          className="inline-flex items-center gap-2 px-[30px] py-[13px] text-[14px] font-bold rounded-xl border-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ color: "#FF6B00", borderColor: "#FF6B00", background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FF6B00"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,107,0,0.30)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#FF6B00"; e.currentTarget.style.boxShadow = "none"; }}
        >
          Xem Tất Cả Câu Lạc Bộ →
        </button>
      </div>
    </section>
  );
}
