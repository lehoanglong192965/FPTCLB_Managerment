import { useState, useMemo } from "react";
import {
  Plus, Search, ChevronDown, AlertTriangle, X,
  Users, Layers,
} from "lucide-react";

const MOCK_CLUBS = [
  {
    id: 1,
    name: "FPTU IT Club",
    category: "IT",
    members: 150,
    description: "Câu lạc bộ Công nghệ Thông tin",
    status: "active",
    leader: "Nguyễn Văn An",
    leaderId: "SE171234",
    founded: "15/01/2020",
    bg: "#dbeafe",
    color: "#2563eb",
    initials: "IT",
  },
  {
    id: 2,
    name: "Melody Club",
    category: "Music",
    members: 85,
    description: "Câu lạc bộ Âm nhạc FPTU",
    status: "active",
    leader: "Vũ Thị Thanh",
    leaderId: "MU201001",
    founded: "20/03/2019",
    bg: "#ede9fe",
    color: "#7c3aed",
    initials: "MC",
  },
  {
    id: 3,
    name: "FPTU FC",
    category: "Sports",
    members: 120,
    description: "Câu lạc bộ Bóng đá",
    status: "active",
    leader: "Lê Văn Cường",
    leaderId: "SP181001",
    founded: "01/09/2018",
    bg: "#d1fae5",
    color: "#059669",
    initials: "FC",
  },
  {
    id: 4,
    name: "Art Club",
    category: "Art",
    members: 45,
    description: "Câu lạc bộ Mỹ thuật",
    status: "active",
    leader: "Hoàng Thị Lan",
    leaderId: "AR191001",
    founded: "10/06/2019",
    bg: "#fef3c7",
    color: "#d97706",
    initials: "AC",
  },
  {
    id: 5,
    name: "Debate Club",
    category: "Culture",
    members: 60,
    description: "Câu lạc bộ Tranh biện",
    status: "active",
    leader: "Phan Văn Khoa",
    leaderId: "CU201001",
    founded: "15/04/2020",
    bg: "#fff8f5",
    color: "#e6430a",
    initials: "DB",
  },
  {
    id: 6,
    name: "Photography Club",
    category: "Art",
    members: 95,
    description: "Câu lạc bộ Nhiếp ảnh",
    status: "suspended",
    leader: "Trần Minh Tuấn",
    leaderId: "AR201002",
    founded: "28/02/2020",
    bg: "#f3f4f6",
    color: "#6b7280",
    initials: "PC",
  },
];

const CATEGORIES = ["IT", "Music", "Sports", "Art", "Culture", "Kỹ thuật", "Ngôn ngữ", "Học thuật", "Cộng đồng", "Khác"];

const STATUS_MAP = {
  active:    { label: "Hoạt động",   cls: "bg-green-100 text-green-700" },
  suspended: { label: "Tạm ngừng",   cls: "bg-yellow-100 text-yellow-700" },
  dissolved: { label: "Đã giải thể", cls: "bg-gray-100 text-gray-500" },
};

const FILTER_OPTIONS = [
  { value: "all",       label: "Tất cả trạng thái" },
  { value: "active",    label: "Hoạt động" },
  { value: "suspended", label: "Tạm ngừng" },
  { value: "dissolved", label: "Đã giải thể" },
];

const PALETTE = [
  { bg: "#dbeafe", color: "#2563eb" },
  { bg: "#d1fae5", color: "#059669" },
  { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#fce7f3", color: "#db2777" },
  { bg: "#fff8f5", color: "#e6430a" },
];

const INIT_FORM = { name: "", category: "", description: "", leader: "", leaderId: "" };

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border";

export default function IcpdpClubManagement() {
  const [clubs, setClubs]         = useState(MOCK_CLUBS);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [showCreate, setCreate]   = useState(false);
  const [dissolveTarget, setDiss] = useState(null);
  const [form, setForm]           = useState(INIT_FORM);
  const [toast, setToast]         = useState(null);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const counts = useMemo(() => ({
    active:    clubs.filter((c) => c.status === "active").length,
    suspended: clubs.filter((c) => c.status === "suspended").length,
    dissolved: clubs.filter((c) => c.status === "dissolved").length,
  }), [clubs]);

  const filtered = useMemo(() => {
    let list = clubs;
    if (filter !== "all") list = list.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clubs, filter, search]);

  const suspend = (id) => {
    setClubs((p) => p.map((c) => c.id === id ? { ...c, status: "suspended" } : c));
    showToast("Đã tạm ngừng hoạt động câu lạc bộ.");
  };

  const reactivate = (id) => {
    setClubs((p) => p.map((c) => c.id === id ? { ...c, status: "active" } : c));
    showToast("Đã kích hoạt lại câu lạc bộ.");
  };

  const confirmDissolve = () => {
    setClubs((p) =>
      p.map((c) => c.id === dissolveTarget ? { ...c, status: "dissolved" } : c)
    );
    setDiss(null);
    showToast("Câu lạc bộ đã được giải thể.");
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.category || !form.leader.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc.", "error");
      return;
    }
    const palette = PALETTE[clubs.length % PALETTE.length];
    setClubs((p) => [
      ...p,
      {
        id: Date.now(),
        ...form,
        members: 0,
        status: "active",
        founded: new Date().toLocaleDateString("vi-VN"),
        initials: form.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase(),
        ...palette,
      },
    ]);
    setForm(INIT_FORM);
    setCreate(false);
    showToast("Đã tạo câu lạc bộ mới thành công.");
  };

  const dissolveClub = clubs.find((c) => c.id === dissolveTarget);

  const ModalOverlay = ({ children, onClose }) => (
    <div
      className="fixed inset-0 bg-black/35 z-[200] flex items-center justify-center p-6 animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );

  return (
    <div>
      {toast && (
        <div className={`fixed top-5 right-7 z-[999] px-5 py-3 rounded-lg text-[13.5px] font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <h1 className="page-title">Quản Lý CLB</h1>
          <p className="page-subtitle">IC-PDP — Tạo và giám sát hoạt động các câu lạc bộ</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {counts.active > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold bg-green-100 text-green-700 whitespace-nowrap">
              {counts.active} hoạt động
            </span>
          )}
          {counts.suspended > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold bg-yellow-100 text-yellow-700 whitespace-nowrap">
              {counts.suspended} tạm ngừng
            </span>
          )}
          {counts.dissolved > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold bg-gray-100 text-gray-500 whitespace-nowrap">
              {counts.dissolved} giải thể
            </span>
          )}
          <button
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
            onClick={() => setCreate(true)}
          >
            <Plus size={15} />
            Tạo CLB mới
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full py-2.5 pl-[38px] pr-3.5 border border-gray-200 rounded-[9px] text-sm text-gray-900 bg-white outline-none transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border"
            placeholder="Tìm tên CLB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative flex-shrink-0">
          <select
            className="py-2.5 pl-3.5 pr-10 border border-gray-200 rounded-[9px] text-sm text-gray-700 bg-white appearance-none outline-none cursor-pointer transition-colors duration-150 focus:border-[#e6430a] min-w-[170px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-300">
          <Layers size={40} />
          <p className="text-sm text-gray-400 m-0">Không có câu lạc bộ nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((club) => {
            const st = STATUS_MAP[club.status];
            return (
              <div
                key={club.id}
                className={`bg-white rounded-xl border border-[#f0f0f0] shadow-sm px-5 py-4.5 flex gap-4 transition-all duration-150 hover:shadow-md hover:border-gray-200 ${
                  club.status === "dissolved" ? "opacity-60 bg-gray-50" : ""
                }`}
              >
                <div
                  className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-[18px] font-extrabold flex-shrink-0 select-none tracking-tight"
                  style={{ background: club.bg, color: club.color }}
                >
                  {club.initials}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15.5px] font-bold text-gray-900 truncate">{club.name}</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>

                  <p className="text-[12.5px] text-gray-500 m-0 truncate">
                    {club.category}
                    {" · "}
                    <Users size={12} className="inline align-middle" />
                    {" "}{club.members} thành viên
                  </p>

                  <p className="text-[13px] text-gray-600 mt-1 m-0 leading-snug line-clamp-2">{club.description}</p>

                  <div className="flex justify-end gap-2 mt-auto pt-2.5">
                    {club.status === "active" && (
                      <>
                        <button
                          className="px-3.5 py-1.5 bg-white border-[1.5px] border-yellow-400 text-yellow-600 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:bg-yellow-50 whitespace-nowrap"
                          onClick={() => suspend(club.id)}
                        >
                          Tạm ngừng
                        </button>
                        <button
                          className="px-3.5 py-1.5 bg-white border-[1.5px] border-red-300 text-red-600 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:bg-red-50 whitespace-nowrap"
                          onClick={() => setDiss(club.id)}
                        >
                          Giải thể
                        </button>
                      </>
                    )}
                    {club.status === "suspended" && (
                      <>
                        <button
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-500 hover:bg-green-600 border-none text-white rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                          onClick={() => reactivate(club.id)}
                        >
                          Kích hoạt lại
                        </button>
                        <button
                          className="px-3.5 py-1.5 bg-white border-[1.5px] border-red-300 text-red-600 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:bg-red-50 whitespace-nowrap"
                          onClick={() => setDiss(club.id)}
                        >
                          Giải thể
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <ModalOverlay onClose={() => setCreate(false)}>
          <div className="bg-white rounded-[14px] w-full max-w-[540px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.18s_ease]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900 m-0">Tạo CLB Mới</h3>
              <button
                className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-gray-500 rounded-md cursor-pointer transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setCreate(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">
                  Tên CLB <span className="text-red-600">*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="VD: FPTU Chess Club"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-medium text-gray-700">
                    Phân loại <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className={inputCls + " appearance-none pr-9 cursor-pointer"}
                      value={form.category}
                      onChange={set("category")}
                    >
                      <option value="">-- Chọn phân loại --</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-medium text-gray-700">
                    Tên Trưởng CLB <span className="text-red-600">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="Họ và tên"
                    value={form.leader}
                    onChange={set("leader")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">MSSV Trưởng CLB</label>
                <input
                  className={inputCls}
                  placeholder="VD: SE241234"
                  value={form.leaderId}
                  onChange={set("leaderId")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">Mô tả CLB</label>
                <textarea
                  className={inputCls + " resize-y font-[inherit] leading-relaxed"}
                  rows={3}
                  placeholder="Giới thiệu ngắn về câu lạc bộ..."
                  value={form.description}
                  onChange={set("description")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                className="px-5.5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-gray-900 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                onClick={() => setCreate(false)}
              >
                Hủy
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                onClick={handleCreate}
              >
                <Plus size={15} />
                Tạo CLB
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {dissolveTarget && dissolveClub && (
        <ModalOverlay onClose={() => setDiss(null)}>
          <div className="bg-white rounded-[14px] w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.18s_ease]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-red-600 m-0">Xác nhận Giải thể CLB</h3>
              <button
                className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-gray-500 rounded-md cursor-pointer transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setDiss(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3.5 px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: dissolveClub.bg, color: dissolveClub.color }}
                >
                  {dissolveClub.initials}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900 m-0 mb-0.5">{dissolveClub.name}</p>
                  <p className="text-[12.5px] text-gray-500 m-0">
                    {dissolveClub.category} · {dissolveClub.members} thành viên
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 px-4 py-3.5 bg-red-50 border border-red-200 rounded-[9px] text-[13px] text-red-800 leading-relaxed">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="m-0">
                  Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ dữ liệu thành viên
                  và lịch sử hoạt động của CLB sẽ bị khoá vĩnh viễn.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                className="px-5.5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-gray-900 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                onClick={() => setDiss(null)}
              >
                Hủy
              </button>
              <button
                className="px-5.5 py-2.5 bg-red-600 hover:bg-red-700 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                onClick={confirmDissolve}
              >
                Xác nhận giải thể
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
