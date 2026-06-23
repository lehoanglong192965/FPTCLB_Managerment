import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clubService from "../../services/api/clubs/clubService";
import applicationApi from "../../services/api/member/applicationApi";
import { normalizeClub } from "../../hooks/usePublicClubs";
import ClubDetailCard from "../../components/clubs/ClubDetailCard";
import ApplyClubModal from "../../components/clubs/ApplyClubModal";
import { useAuth } from "../../contexts/AuthContext";

const ACTIVE_STATUSES = new Set(["Submitted", "Reviewing", "ACCEPTED"]);

export default function ClubDetailPage() {
  const { abbr } = useParams();
  const navigate  = useNavigate();
  const { user, profile }  = useAuth();

  const [club, setClub]               = useState(null);
  const [clubEvents, setClubEvents]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showApply, setShowApply]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    setAlreadyApplied(false);
    setClubEvents([]);
    clubService.getByIdPublic(decodeURIComponent(abbr))
      .then((res) => {
        const normalized = normalizeClub(res);
        setClub(normalized);
        // Fetch events sau khi có clubId
        if (normalized?.id) {
          clubService.getAllEvents(normalized.id)
            .then((evRes) => {
              const raw = Array.isArray(evRes) ? evRes
                : (evRes?.content ?? evRes?.data ?? []);
              // Chỉ hiện events đã được ICPDP duyệt trở lên
              const SHOW = new Set(["Approved", "APPROVED", "UPCOMING", "Upcoming", "ONGOING", "Ongoing", "COMPLETED", "Completed", "CLOSED", "Closed"]);
              const mapped = raw
                .filter((e) => SHOW.has(e.eventStatus))
                .map((e) => ({
                  id:       e.eventID,
                  title:    e.eventName ?? "",
                  color:    normalized.color ?? "#F37021",
                  emoji:    normalized.emoji ?? "🎉",
                  date:     e.startDate
                    ? new Date(e.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                    : "",
                  location: e.location ?? "",
                }));
              setClubEvents(mapped);
            })
            .catch((err) => console.error("[ClubDetail] Lỗi tải events:", err));
        }
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setClub(null);
        if (err?.response?.status !== 404) {
          setError(err?.message ?? "Không thể tải thông tin câu lạc bộ");
        }
      })
      .finally(() => setLoading(false));
  }, [abbr]);

  // Kiểm tra member đã nộp đơn vào CLB này chưa (dùng API thật)
  // normalizeClub map raw.clubID → club.id (không phải club.clubID)
  useEffect(() => {
    if (!user || !club?.id) return;
    applicationApi.getMyApplications()
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        const hasActive = arr.some(
          (a) => a.clubID === club.id && ACTIVE_STATUSES.has(a.status)
        );
        setAlreadyApplied(hasActive);
      })
      .catch(() => setAlreadyApplied(false));
  }, [user, club?.id]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApplySubmitted = async (payload) => {
    setShowApply(false);
    try {
      await applicationApi.apply({
        clubID: club.id,
        introduction: payload.introduction,
        cvUrl: payload.cvUrl ?? "",
      });
      setAlreadyApplied(true);
      showToast(`Nộp đơn vào ${club.name} thành công!`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Không thể nộp đơn. Vui lòng thử lại.";
      showToast(msg, "error");
    }
  };

  const getPrimaryAction = () => {
    if (!user) {
      return { label: "Đăng ký tài khoản để tham gia", onClick: () => navigate("/register") };
    }
    if (!club?.recruiting) return null;
    if (alreadyApplied) {
      return { label: "Đã nộp đơn — đang chờ duyệt", onClick: () => navigate("/member/apply"), disabled: false };
    }
    return { label: "Nộp đơn ứng tuyển", onClick: () => setShowApply(true) };
  };

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
      {toast && (
        <div
          className={`fixed top-5 right-7 z-[999] px-5 py-3 rounded-lg text-[13.5px] font-medium shadow-lg ${
            toast.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-[1100px] mx-auto">
        <ClubDetailCard
          club={club}
          clubEvents={clubEvents}
          primaryAction={getPrimaryAction()}
        />
      </div>

      {showApply && (
        <ApplyClubModal
          club={club}
          clubId={club.abbr ?? abbr}
          onClose={() => setShowApply(false)}
          onSubmitted={handleApplySubmitted}
        />
      )}
    </div>
  );
}
