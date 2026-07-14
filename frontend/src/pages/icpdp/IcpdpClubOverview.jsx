import { useState, useMemo, useEffect } from "react";
import {
  Building2, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Search, Activity, CheckCircle, Users, Loader2,
} from "lucide-react";
import clubApi from "../../services/api/clubs/clubApi";
import { useToast } from "../../contexts/ToastContext";

const TABS = [
  { key: "all",      label: "Tất cả" },
  { key: "active",   label: "Đang hoạt động" },
  { key: "inactive", label: "Không hoạt động" },
  { key: "risk",     label: "Cảnh báo" },
];

function normalizeClub(raw) {
  return {
    id:       raw.clubId      ?? raw.id,
    name:     raw.clubName    ?? raw.name ?? "—",
    category: raw.category    ?? raw.type ?? "Khác",
    leader:   raw.leaderName  ?? raw.leader?.fullName ?? "—",
    members:  raw.memberCount ?? raw.members ?? 0,
    events:   raw.eventCount  ?? raw.events  ?? 0,
    score:    raw.kpiScore    ?? raw.score   ?? 0,
    trend:    raw.trend       ?? "same",
    status:   (raw.status     ?? raw.clubStatus ?? "active").toLowerCase(),
  };
}

export default function IcpdpClubOverview() {
  const toast = useToast();
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState("all");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    clubApi.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? res?.clubs ?? []);
        setClubs(list.map(normalizeClub));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.warn("[IcpdpClubOverview] fetch failed:", err?.response?.status);
        toast.error("Không thể tải danh sách CLB. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));
  }, []);

  const atRisk        = clubs.filter((c) => c.status === "active" && c.members < 5);
  const activeCount   = clubs.filter((c) => c.status === "active").length;
  const inactiveCount = clubs.filter((c) => c.status === "inactive").length;

  const rankedClubs = useMemo(
    () => [...clubs].sort((a, b) => b.score - a.score),
    [clubs]
  );

  const filteredClubs = useMemo(() => {
    let list = rankedClubs;
    if (activeTab === "active")   list = list.filter((c) => c.status === "active" && c.members >= 5);
    if (activeTab === "inactive") list = list.filter((c) => c.status === "inactive");
    if (activeTab === "risk")     list = list.filter((c) => c.status === "active" && c.members < 5);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.leader.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rankedClubs, activeTab, search]);

  const tabCount = (key) => {
    if (key === "all")      return clubs.length;
    if (key === "active")   return clubs.filter((c) => c.status === "active" && c.members >= 5).length;
    if (key === "inactive") return inactiveCount;
    if (key === "risk")     return atRisk.length;
    return 0;
  };

  const downgrade = async (id) => {
    try {
      await clubApi.review(id, { status: "Inactive", reason: "Dưới 5 thành viên (ICPDP hạ trạng thái)" });
      setClubs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "inactive" } : c))
      );
      toast.success("Đã hạ trạng thái CLB xuống Không hoạt động.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể hạ trạng thái CLB. Vui lòng thử lại.");
    }
  };

  const downgradeAll = async () => {
    const targets = atRisk;
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((c) => clubApi.review(c.id, { status: "Inactive", reason: "Dưới 5 thành viên (ICPDP hạ trạng thái)" }))
      );
      setClubs((prev) =>
        prev.map((c) =>
          c.status === "active" && c.members < 5 ? { ...c, status: "inactive" } : c
        )
      );
      toast.success(`Đã hạ trạng thái ${targets.length} CLB xuống Không hoạt động.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Một số CLB hạ trạng thái thất bại. Vui lòng thử lại.");
    }
  };

  const podium = [
    { data: rankedClubs[1], emoji: "🥈", bar: 44, type: "silver" },
    { data: rankedClubs[0], emoji: "🥇", bar: 66, type: "gold"   },
    { data: rankedClubs[2], emoji: "🥉", bar: 33, type: "bronze" },
  ];

  const podiumBarStyle = {
    gold:   "linear-gradient(180deg, #fde68a, #f59e0b)",
    silver: "linear-gradient(180deg, #e5e7eb, #9ca3af)",
    bronze: "linear-gradient(180deg, #fed7aa, #f97316)",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1">Tổng Quan CLB Toàn Trường</h1>
          <p className="text-sm text-gray-500 m-0">
            Giám sát toàn bộ câu lạc bộ, theo dõi KPI và xếp hạng thi đua
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-xl border-l-4 border-blue-400 border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Tổng số CLB</p>
                <Building2 size={18} className="text-blue-400 opacity-65" />
              </div>
              <p className="text-2xl font-bold text-gray-900 m-0">{clubs.length}</p>
            </div>

            <div className="bg-white rounded-xl border-l-4 border-emerald-400 border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Đang hoạt động</p>
                <Activity size={18} className="text-emerald-400 opacity-65" />
              </div>
              <p className="text-2xl font-bold text-gray-900 m-0">{activeCount}</p>
            </div>

            <div className="bg-white rounded-xl border-l-4 border-gray-400 border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Không hoạt động</p>
                <Minus size={18} className="text-gray-400 opacity-65" />
              </div>
              <p className="text-2xl font-bold text-gray-900 m-0">{inactiveCount}</p>
            </div>

            <div className="bg-white rounded-xl border-l-4 border-red-400 border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Cần chú ý (&lt; 5 TV)</p>
                <AlertTriangle size={18} className="text-red-400 opacity-65" />
              </div>
              <p className="text-2xl font-bold text-gray-900 m-0">{atRisk.length}</p>
            </div>
          </div>

          <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1.45fr 1fr" }}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 m-0 mb-4">Xếp Hạng Thi Đua KPI</h2>

              {rankedClubs.length >= 3 ? (
                <>
                  <div className="flex items-end justify-center gap-2.5 pt-2 mb-5">
                    {podium.map(({ data, emoji, bar, type }) =>
                      data ? (
                        <div key={data.id} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-[26px] leading-none">{emoji}</span>
                          <span className="text-xs font-semibold text-gray-900 text-center leading-snug">{data.name}</span>
                          <span className="text-[11.5px] text-gray-500 mb-1">{data.score} điểm</span>
                          <div
                            className="w-full rounded-t-md"
                            style={{ height: bar + "px", background: podiumBarStyle[type] }}
                          />
                        </div>
                      ) : null
                    )}
                  </div>
                  <div className="flex flex-col border-t border-gray-100">
                    {rankedClubs.slice(3).map((club, i) => (
                      <div key={club.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
                        <span className="text-[12.5px] font-bold text-gray-400 min-w-[22px] text-center">{i + 4}</span>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[13px] font-medium text-gray-900 truncate">{club.name}</span>
                          <span className="text-[11.5px] text-gray-400">{club.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-gray-700">{club.score}</span>
                          {club.trend === "up"   && <TrendingUp   size={13} className="text-emerald-500" />}
                          {club.trend === "down" && <TrendingDown size={13} className="text-red-400" />}
                          {club.trend === "same" && <Minus        size={13} className="text-gray-300" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <TrendingUp size={32} strokeWidth={1.5} />
                  <p className="text-[13px] m-0">Chưa đủ dữ liệu xếp hạng.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-3.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                <h2 className="text-base font-bold text-gray-800 m-0 flex-1">CLB Có Nguy Cơ Bị Hạ Hạng</h2>
                {atRisk.length > 0 && (
                  <button
                    className="ml-auto shrink-0 px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white border-none rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    onClick={downgradeAll}
                  >
                    Hạ tất cả
                  </button>
                )}
              </div>

              {atRisk.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 py-11 text-emerald-500">
                  <CheckCircle size={36} />
                  <p className="text-[13px] text-gray-500 m-0 text-center">Tất cả CLB đều đạt tiêu chuẩn thành viên tối thiểu</p>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-gray-500 leading-snug m-0 mb-3.5">
                    CLB có ít hơn <strong>5 thành viên</strong> sẽ tự động chuyển sang
                    trạng thái <strong>Không hoạt động</strong>.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {atRisk.map((club) => (
                      <div key={club.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[13.5px] font-semibold text-gray-900 truncate">{club.name}</span>
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Users size={11} />
                            {club.members} thành viên
                          </span>
                        </div>
                        <button
                          className="shrink-0 px-3 py-1.5 bg-white border border-amber-400 text-amber-600 rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-amber-400 hover:text-white whitespace-nowrap"
                          onClick={() => downgrade(club.id)}
                        >
                          Hạ trạng thái
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-base font-bold text-gray-800 m-0">Danh Sách Tất Cả CLB</h2>
              <div className="relative">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-[13.5px] text-gray-900 outline-none w-64 transition-all focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] bg-white"
                  placeholder="Tìm theo tên CLB, trưởng CLB..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex border-b-2 border-gray-200 mb-6">
              {TABS.map((tab) => {
                const count = tabCount(tab.key);
                return (
                  <button
                    key={tab.key}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer bg-none border-l-0 border-r-0 border-t-0 font-[inherit] transition-colors ${
                      activeTab === tab.key
                        ? "text-[#e6430a] border-b-[#e6430a] font-semibold"
                        : "text-gray-500 border-b-transparent hover:text-[#e6430a]"
                    }`}
                    onClick={() => setTab(tab.key)}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${
                        activeTab === tab.key ? "bg-[#e6430a]" : "bg-gray-500"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredClubs.length === 0 ? (
              <p className="text-center py-16 text-gray-400 text-sm">Không có CLB nào phù hợp.</p>
            ) : (
              <table className="w-full border-collapse text-[13.5px] mt-1">
                <thead>
                  <tr>
                    {["Hạng", "Tên CLB", "Phân loại", "Trưởng CLB", "Thành viên", "Sự kiện", "Điểm KPI", "Trạng thái"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b-2 border-gray-100 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClubs.map((club) => {
                    const rank       = rankedClubs.findIndex((c) => c.id === club.id) + 1;
                    const isRisk     = club.status === "active" && club.members < 5;
                    const scoreColor = club.score >= 80 ? "green" : club.score >= 60 ? "yellow" : "red";
                    const scoreBarColor = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444" };
                    const scoreNumColor = { green: "#059669", yellow: "#d97706", red: "#dc2626" };
                    const medalStyle = {
                      gold:   { bg: "#fef3c7", color: "#b45309" },
                      silver: { bg: "#f3f4f6", color: "#4b5563" },
                      bronze: { bg: "#ffedd5", color: "#c2410c" },
                    };
                    const medalType = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : null;

                    return (
                      <tr
                        key={club.id}
                        style={isRisk ? { background: "#fffbeb" } : {}}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isRisk ? "#fef3c7" : "#fafafa"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isRisk ? "#fffbeb" : ""; }}
                      >
                        <td className="px-3 py-3 border-b border-gray-50 w-14 text-center align-middle">
                          {medalType ? (
                            <span
                              className="inline-flex items-center justify-center w-6.5 h-6.5 rounded-full text-xs font-bold"
                              style={{ background: medalStyle[medalType].bg, color: medalStyle[medalType].color }}
                            >
                              {rank}
                            </span>
                          ) : (
                            <span className="text-[13px] font-semibold text-gray-400">{rank}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900">{club.name}</span>
                            {isRisk && <AlertTriangle size={13} className="text-amber-400 shrink-0" />}
                          </div>
                        </td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle">
                          <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                            {club.category}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle text-gray-700">{club.leader}</td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle">
                          <span className={`font-semibold ${club.members < 5 ? "text-red-600" : ""}`}>
                            {club.members}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle text-gray-500">{club.events}</td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[52px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${club.score}%`, background: scoreBarColor[scoreColor] }}
                              />
                            </div>
                            <span className="text-[13px] font-bold min-w-[26px] text-right" style={{ color: scoreNumColor[scoreColor] }}>
                              {club.score}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 border-b border-gray-50 align-middle">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            club.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                          }`}>
                            {club.status === "active" ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
