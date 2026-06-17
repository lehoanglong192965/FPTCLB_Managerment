import { useState } from "react";
import { Star } from "lucide-react";
import ClubCard from "../../components/clubs/ClubCard";
import ClubSpace from "./ClubSpace";

const mockJoinedClubs = [
  {
    id: 1,
    abbr: "it",
    name: "FPTU IT Club",
    tag: "IT",
    color: "#1d4ed8",
    emoji: "💻",
    role: "Thành viên",
    members: 120,
  },
];

export default function MemberMyClubs() {
  const [selectedClub, setSelectedClub] = useState(null);

  if (selectedClub) {
    return <ClubSpace club={selectedClub} onBack={() => setSelectedClub(null)} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Câu Lạc Bộ Của Tôi</h1>
        <p className="page-subtitle">Các câu lạc bộ bạn đang tham gia</p>
      </div>

      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">CLB đã tham gia</h2>
          <span className="text-[13px] text-gray-400">{mockJoinedClubs.length} CLB</span>
        </div>

        {mockJoinedClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-9 text-gray-400 gap-2">
            <Star size={36} strokeWidth={1.5} />
            <p className="text-sm m-0">Bạn chưa tham gia CLB nào.</p>
          </div>
        ) : (
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {mockJoinedClubs.map((club) => (
              <ClubCard key={club.id} club={club} onSelect={() => setSelectedClub(club)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
