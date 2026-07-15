import { useState } from "react";
import { usePublicClubs } from "../../hooks/usePublicClubs";
import ClubCard from "../../components/clubs/ClubCard";
import { CLUB_CATEGORIES } from "../../constants/clubCategories";

// value = giá trị DB dùng để filter, label = nhãn hiển thị tiếng Việt
const CATEGORIES = [{ value: "Tất cả", label: "Tất cả" }, ...CLUB_CATEGORIES];

export default function ClubListPage() {
  const { clubs, loading, error } = usePublicClubs();
  const [search, setSearch]       = useState("");
  const [activeTag, setActiveTag] = useState("Tất cả");

  // Lọc danh sách câu lạc bộ dựa trên tag và từ khóa tìm kiếm.
  const filtered = clubs.filter((club) => {
    const matchTag    = activeTag === "Tất cả" || club.tag === activeTag;
    const matchSearch = club.name.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-[5%] pt-[calc(var(--header-h,68px)+48px)] pb-20">
      
      <div className="mb-10">
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black text-[#0D1B3E] tracking-[-1.5px] mb-2.5">
          Danh Sách Câu Lạc Bộ
        </h1>
        <p className="text-[15px] text-[#4B5674]">
          Tìm kiếm và tham gia câu lạc bộ phù hợp với sở thích của bạn.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-9">
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-[18px] py-3 focus-within:border-[#FF6B00] focus-within:shadow-[0_0_0_3px_rgba(255,107,0,0.15)] transition-all">
          <span>🔍</span>
          <input
            className="flex-1 border-none outline-none text-sm text-[#0D1B3E] bg-transparent placeholder-gray-400"
            placeholder="Tìm kiếm câu lạc bộ..."
            // hiển thị giá trị state
            value={search} 
            // mỗi lần gõ ký tự → cập nhật search → React re-render → lọc lại danh sách
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`px-[18px] py-2 rounded-full border text-[13px] font-semibold cursor-pointer transition-all font-[inherit] ${
                activeTag === cat.value
                  ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_2px_8px_rgba(255,107,0,0.35)]"
                  : "border-gray-200 bg-white text-[#4B5674] hover:border-[#FF6B00] hover:text-[#FF6B00]"
              }`}
              onClick={() => setActiveTag(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#FF6B00] rounded-full animate-spin" />
          <p className="text-[14px] text-gray-400">Đang tải danh sách câu lạc bộ...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-[15px] text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-semibold cursor-pointer hover:bg-[#E05A00] transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filtered.length > 0
            ? filtered.map((club) => <ClubCard key={club.abbr} club={club} />)
            : (
              <p className="col-span-full text-center text-gray-400 text-[15px] py-16">
                Không tìm thấy câu lạc bộ nào.
              </p>
            )
          }
        </div>
      )}
    </div>
  );
}
