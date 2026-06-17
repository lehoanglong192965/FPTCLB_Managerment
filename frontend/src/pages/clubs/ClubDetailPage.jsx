import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clubService from "../../services/api/clubs/clubService";
import { normalizeClub } from "../../hooks/usePublicClubs";
import ClubDetailCard from "../../components/clubs/ClubDetailCard";

export default function ClubDetailPage() {
  const { abbr } = useParams();
  const navigate  = useNavigate();

  const [club, setClub]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    clubService.getByIdPublic(decodeURIComponent(abbr))
      .then((res) => setClub(normalizeClub(res)))
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setClub(null);
        if (err?.response?.status !== 404) {
          setError(err?.message ?? "Không thể tải thông tin câu lạc bộ");
        }
      })
      .finally(() => setLoading(false));
  }, [abbr]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#FF6B00] rounded-full animate-spin" />
        <p className="text-[14px] text-gray-400">Đang tải thông tin câu lạc bộ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-base text-[#6B7280]">
        <p className="text-red-500">{error}</p>
        <button
          className="px-5 py-2.5 bg-[#F37021] text-white border-none rounded-lg cursor-pointer text-sm font-semibold"
          onClick={() => navigate("/clubs")}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-base text-[#6B7280]">
        <p>Không tìm thấy câu lạc bộ.</p>
        <button
          className="px-5 py-2.5 bg-[#F37021] text-white border-none rounded-lg cursor-pointer text-sm font-semibold"
          onClick={() => navigate("/clubs")}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pt-[calc(68px+28px)] px-[5%] pb-15 font-['Be_Vietnam_Pro','Inter',sans-serif]">
      <div className="max-w-[1100px] mx-auto">
        <ClubDetailCard
          club={club}
          clubEvents={[]}
          primaryAction={{ label: "Đăng ký tài khoản để tham gia", onClick: () => navigate("/register") }}
        />
      </div>
    </div>
  );
}
