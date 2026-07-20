import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, CheckCircle, Ban, Layers, Gauge, Plus } from "lucide-react";
import clubApi from "../../services/api/clubs/clubApi";
import { useToast } from "../../contexts/ToastContext";
import IcpdpClubQuality from "./IcpdpClubQuality";

const PAGE_TABS = [
  { key: "list",    label: "Danh sách CLB",  Icon: Layers },
  { key: "quality", label: "Tổng quan CLB", Icon: Gauge },
];

const STATUS_MAP = {
  Active:    { label: "Hoạt động",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Inactive:  { label: "Ngừng hoạt động", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  Suspended: { label: "Tạm ngừng",       cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Dissolved: { label: "Đã giải thể",     cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

// ICPDP thấy tất cả CLB (không lọc theo status ở backend) nên bộ lọc phải bao gồm mọi
// clubStatus có thể tồn tại: Active, Inactive (tự động khi CLB có <5 thành viên hoạt động
// trong kỳ — xem ClubRepository.updateStatusToInactive), Suspended, Dissolved (ICPDP tự set).
const FILTER_OPTIONS = [
  { value: "all",       label: "Tất cả" },
  { value: "Active",    label: "Hoạt động" },
  { value: "Inactive",  label: "Ngừng hoạt động" },
  { value: "Suspended", label: "Tạm ngừng" },
  { value: "Dissolved", label: "Đã giải thể" },
];

export default function IcpdpClubManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("list");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const response = await clubApi.getAll();
      const data = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);
      setClubs(data);
    } catch (error) {
        console.error("Lỗi tải CLB:", error);
        setClubs([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClubs(); }, []);

  const handleUpdateStatus = async (club, status) => {
    // API uses clubID based on logs
    const clubId = club.clubID;
    if (!clubId) {
        toast.error("Không thể cập nhật: Thiếu ID câu lạc bộ.");
        return;
    }
    try {
      await clubApi.review(clubId, { status, reason: "Cập nhật từ ICPDP" });
      toast.success(`Đã chuyển "${club.name}" sang trạng thái "${STATUS_MAP[status]?.label ?? status}".`);
      // Chuyển bộ lọc về "Tất cả" để CLB vừa đổi trạng thái vẫn hiển thị ngay tại chỗ,
      // tránh cảm giác dữ liệu "biến mất" khi nó không còn khớp bộ lọc đang chọn.
      setFilter("all");
      fetchClubs();
    } catch (e) { toast.error(e?.response?.data?.message ?? e?.response?.data?.error ?? e.message); }
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(clubs)) return [];
    return clubs.filter(c =>
      (filter === "all" || c.clubStatus === filter) &&
      (c.name?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [clubs, filter, search]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-slate-800">Quản Lý Câu Lạc Bộ</h1>
      </div>

      {/* Tab: Danh sách CLB / Chất lượng CLB */}
      <div className="flex items-center gap-1.5 mb-6 border-b border-slate-200">
        {PAGE_TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-semibold border-0 border-b-2 bg-transparent cursor-pointer font-[inherit] transition-colors -mb-px ${
                active
                  ? "text-[#E6430A] border-[#E6430A]"
                  : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          );
        })}
      </div>

      {tab === "quality" && <IcpdpClubQuality embedded />}

      {tab === "list" && (<>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative w-full max-w-sm flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên CLB..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors bg-white"
              style={{ border: '1px solid #E2E8F0', color: '#1E293B' }}
              onFocus={(e) => { e.target.style.borderColor = '#e6430a'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; }}
            />
          </div>
          <button
            onClick={() => navigate("/icpdp/clubs/create")}
            className="flex items-center gap-1.5 bg-[#e6430a] hover:bg-[#c93900] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Tạo câu lạc bộ
          </button>
        </div>

        <div className="flex gap-0 border-b-2 border-gray-200">
          {FILTER_OPTIONS.map(({ value, label }) => {
            const active = filter === value;
            const count  = value === "all" ? clubs.length : clubs.filter((c) => c.clubStatus === value).length;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                  active ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${active ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 font-semibold text-slate-600">Tên CLB</th>
                <th className="p-5 font-semibold text-slate-600">Trạng thái</th>
                <th className="p-5 font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.clubID} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-medium text-slate-800">{c.name || "N/A"}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_MAP[c.clubStatus]?.cls || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_MAP[c.clubStatus]?.label || c.clubStatus || "Unknown"}
                    </span>
                  </td>
                  <td className="p-5 flex gap-3">
                    <button onClick={() => handleUpdateStatus(c, 'Active')} className="flex items-center gap-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg transition-colors font-medium">
                        <CheckCircle size={14} /> Active
                    </button>
                    <button onClick={() => handleUpdateStatus(c, 'Suspended')} className="flex items-center gap-1.5 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg transition-colors font-medium">
                        <Ban size={14} /> Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
              <div className="p-10 text-center text-slate-500">Không tìm thấy câu lạc bộ phù hợp.</div>
          )}
        </div>
      )}
      </>)}
    </div>
  );
}
