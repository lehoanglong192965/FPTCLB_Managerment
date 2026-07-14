import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, CheckCircle, Ban, RefreshCw } from "lucide-react";
import clubApi from "../../services/api/clubs/clubApi";
import { useToast } from "../../contexts/ToastContext";

const STATUS_MAP = {
  Active:    { label: "Hoạt động",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Suspended: { label: "Tạm ngừng",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Dissolved: { label: "Đã giải thể", cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

const FILTER_OPTIONS = [
  { value: "all",       label: "Tất cả" },
  { value: "Active",    label: "Hoạt động" },
  { value: "Suspended", label: "Tạm ngừng" },
  { value: "Dissolved", label: "Đã giải thể" },
];

export default function IcpdpClubManagement() {
  const toast = useToast();
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Quản Lý Câu Lạc Bộ</h1>
        <button onClick={fetchClubs} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <RefreshCw size={18} /> Làm mới
        </button>
      </div>
      
      <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="border border-slate-200 p-2.5 pl-10 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Tìm tên CLB..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={filter} onChange={e => setFilter(e.target.value)}>
          {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
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
    </div>
  );
}
