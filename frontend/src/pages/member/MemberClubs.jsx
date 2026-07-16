import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import ClubCard from "../../components/clubs/ClubCard";
import ClubDetailCard from "../../components/clubs/ClubDetailCard";
import ApplyClubModal from "../../components/clubs/ApplyClubModal";
import { usePublicClubs } from "../../hooks/usePublicClubs";
import { useAuth } from "../../contexts/AuthContext";
import applicationApi from "../../services/api/member/applicationApi";
import authApi from "../../services/api/auth/authApi";
import { useToast } from "../../contexts/ToastContext";

const ACTIVE_STATUSES = new Set(["Submitted", "Reviewing", "ACCEPTED"]);

const ALL_TAGS = [
  { value: "Tất cả",    label: "Tất cả" },
  { value: "Công nghệ", label: "Công nghệ" },
  { value: "Thiết kế",  label: "Thiết kế" },
  { value: "Kỹ năng",   label: "Kỹ năng" },
  { value: "AI & Data", label: "AI & Dữ liệu" },
  { value: "Business",  label: "Kinh doanh" },
  { value: "Ngôn ngữ",  label: "Ngôn ngữ" },
  { value: "Nghệ thuật",label: "Nghệ thuật" },
  { value: "Thể thao",  label: "Thể thao" },
];

export default function MemberClubs() {
  const toast = useToast();
  const { clubs, loading, error } = usePublicClubs();
  const { user }                  = useAuth();
  const [search, setSearch]       = useState("");
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [filterOpen, setFilterOpen]   = useState(false);
  const [viewingClub, setViewingClub] = useState(null);
  const [applyClub, setApplyClub]     = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [joinedClubId, setJoinedClubId] = useState(null);
  const filterRef = useRef(null);

  // Lấy CLB user đã tham gia để ẩn khỏi danh sách khám phá
  useEffect(() => {
    if (!user) return;
    authApi.getMyClubRole()
      .then((res) => { if (res?.clubID) setJoinedClubId(res.clubID); })
      .catch(() => {});
  }, [user]);

  // Khi chọn xem CLB, kiểm tra member đã nộp đơn chưa
  useEffect(() => {
    if (!user || !viewingClub?.id) { setAlreadyApplied(false); return; }
    let cancelled = false;
    applicationApi.getMyApplications()
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        setAlreadyApplied(arr.some((a) => a.clubID === viewingClub.id && ACTIVE_STATUSES.has(a.status)));
      })
      .catch((err) => {
        if (cancelled || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setAlreadyApplied(false);
      });
    return () => { cancelled = true; };
  }, [user, viewingClub?.id]);

  const handleApplySubmitted = async (payload) => {
    setApplyClub(null);
    try {
      await applicationApi.apply({
        clubID: viewingClub.id,
        introduction: payload.introduction,
        cvUrl: payload.cvUrl ?? "",
      });
      setAlreadyApplied(true);
      toast.success(`Nộp đơn vào ${viewingClub.name} thành công!`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Không thể nộp đơn. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = clubs.filter((c) => {
    if (joinedClubId && c.id === joinedClubId) return false;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchTag    = activeTag === "Tất cả" || c.tag === activeTag;
    return matchSearch && matchTag;
  });

  if (viewingClub) {
    return (
      <>
        <ClubDetailCard
          club={viewingClub}
          clubEvents={[]}
          onBack={() => { setViewingClub(null); setAlreadyApplied(false); }}
          primaryAction={
            !viewingClub.recruiting
              ? null
              : alreadyApplied
              ? { label: "Đã nộp đơn — đang chờ duyệt", onClick: () => {} }
              : { label: "Nộp đơn ứng tuyển", onClick: () => setApplyClub(viewingClub) }
          }
        />
        {applyClub && (
          <ApplyClubModal
            club={applyClub}
            onClose={() => setApplyClub(null)}
            onSubmitted={handleApplySubmitted}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Khám Phá CLB</h1>
        <p className="page-subtitle">Tìm và đăng ký tham gia câu lạc bộ phù hợp với bạn</p>
      </div>

      <div className="bg-white rounded-[14px] px-6 py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">Tất cả câu lạc bộ</h2>
          <span className="text-[13px] text-gray-400">{filtered.length} CLB</span>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2.5 items-center mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-[38px] pr-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[10px] text-sm text-gray-900 outline-none bg-gray-50 box-border font-[inherit] transition-colors focus:border-[#e6430a] focus:bg-white placeholder:text-gray-400"
              placeholder="Tìm kiếm câu lạc bộ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative flex-shrink-0" ref={filterRef}>
            <button
              className={`relative w-[42px] h-[42px] rounded-[10px] border-[1.5px] flex items-center justify-center cursor-pointer transition-all ${
                filterOpen || activeTag !== "Tất cả"
                  ? "border-[#e6430a] bg-[#fff7f5] text-[#e6430a]"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#e6430a] hover:bg-[#fff7f5] hover:text-[#e6430a]"
              }`}
              onClick={() => setFilterOpen((o) => !o)}
              title="Bộ lọc"
            >
              <SlidersHorizontal size={17} />
              {activeTag !== "Tất cả" && (
                <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#e6430a] border-[1.5px] border-white" />
              )}
            </button>

            {filterOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-[200px] bg-white border-[1.5px] border-gray-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] py-2 px-1.5 z-50">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.5px] px-2.5 pt-1 pb-2 m-0 border-b border-gray-100">
                  Lọc theo lĩnh vực
                </p>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    className={`flex items-center gap-2 w-full px-2.5 py-2 border-none bg-none text-[13.5px] cursor-pointer rounded-lg font-[inherit] text-left transition-all hover:bg-[#fef3ed] hover:text-[#e6430a] ${
                      activeTag === tag.value ? "text-[#e6430a] font-semibold" : "text-gray-700"
                    }`}
                    onClick={() => { setActiveTag(tag.value); setFilterOpen(false); }}
                  >
                    <span className="w-4 text-[13px] text-[#e6430a] flex-shrink-0">
                      {activeTag === tag.value && "✓"}
                    </span>
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-[13px] m-0">Đang tải danh sách câu lạc bộ...</p>
          </div>
        ) : error ? (
          <p className="text-center py-10 text-red-400 text-sm m-0">{error}</p>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtered.length === 0 ? (
              <p className="col-span-full text-center py-10 text-gray-400 text-sm m-0">
                Không tìm thấy câu lạc bộ phù hợp.
              </p>
            ) : (
              filtered.map((club) => (
                <ClubCard key={club.abbr ?? club.id} club={club} onSelect={() => setViewingClub(club)} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
