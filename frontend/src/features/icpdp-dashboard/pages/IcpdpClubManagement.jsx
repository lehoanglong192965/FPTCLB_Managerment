import { useState, useMemo } from "react";
import {
  Plus, Search, ChevronDown, AlertTriangle, X,
  Users, Layers,
} from "lucide-react";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubManagement.css";

/* ── Mock data ───────────────────────────────────────────── */
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
  active:    { label: "Hoạt động",   cls: "cm-badge-active"    },
  suspended: { label: "Tạm ngừng",   cls: "cm-badge-suspended" },
  dissolved: { label: "Đã giải thể", cls: "cm-badge-dissolved" },
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

  return (
    <div>
      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="cm-page-header">
        <div>
          <h1 className="page-title">Quản Lý CLB</h1>
          <p className="page-subtitle">
            IC-PDP — Tạo và giám sát hoạt động các câu lạc bộ
          </p>
        </div>

        <div className="cm-header-right">
          {counts.active > 0 && (
            <span className="cm-pill cm-pill-active">{counts.active} hoạt động</span>
          )}
          {counts.suspended > 0 && (
            <span className="cm-pill cm-pill-suspended">{counts.suspended} tạm ngừng</span>
          )}
          {counts.dissolved > 0 && (
            <span className="cm-pill cm-pill-dissolved">{counts.dissolved} giải thể</span>
          )}
          <button className="cm-btn-create" onClick={() => setCreate(true)}>
            <Plus size={15} />
            Tạo CLB mới
          </button>
        </div>
      </div>

      {/* ── Search + filter ──────────────────────────────────── */}
      <div className="cm-controls">
        <div className="cm-search-wrap">
          <Search size={15} className="cm-search-icon" />
          <input
            className="cm-search-input"
            placeholder="Tìm tên CLB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="cm-filter-wrap">
          <select
            className="cm-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="cm-filter-arrow" />
        </div>
      </div>

      {/* ── Club grid ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="cm-empty">
          <Layers size={40} />
          <p>Không có câu lạc bộ nào phù hợp.</p>
        </div>
      ) : (
        <div className="cm-club-grid">
          {filtered.map((club) => {
            const st = STATUS_MAP[club.status];
            return (
              <div
                key={club.id}
                className={`cm-club-card${club.status === "dissolved" ? " cm-card-dissolved" : ""}`}
              >
                <div
                  className="cm-thumb"
                  style={{ background: club.bg, color: club.color }}
                >
                  {club.initials}
                </div>

                <div className="cm-card-body">
                  <div className="cm-card-top">
                    <span className="cm-club-name">{club.name}</span>
                    <span className={`cm-status-badge ${st.cls}`}>{st.label}</span>
                  </div>

                  <p className="cm-club-meta">
                    {club.category}
                    {" · "}
                    <Users size={12} style={{ display: "inline", verticalAlign: "middle" }} />
                    {" "}{club.members} thành viên
                  </p>

                  <p className="cm-club-desc">{club.description}</p>

                  <div className="cm-card-actions">
                    {club.status === "active" && (
                      <>
                        <button className="cm-btn-suspend" onClick={() => suspend(club.id)}>
                          Tạm ngừng
                        </button>
                        <button className="cm-btn-dissolve" onClick={() => setDiss(club.id)}>
                          Giải thể
                        </button>
                      </>
                    )}
                    {club.status === "suspended" && (
                      <>
                        <button className="cm-btn-reactivate" onClick={() => reactivate(club.id)}>
                          Kích hoạt lại
                        </button>
                        <button className="cm-btn-dissolve" onClick={() => setDiss(club.id)}>
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

      {/* ── Create CLB modal ─────────────────────────────────── */}
      {showCreate && (
        <div className="cm-overlay" onClick={() => setCreate(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3 className="cm-modal-title">Tạo CLB Mới</h3>
              <button className="dl-modal-close" onClick={() => setCreate(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cm-modal-body">
              <div className="cm-form-field">
                <label className="pr-label">
                  Tên CLB <span className="cm-required">*</span>
                </label>
                <input
                  className="cm-input"
                  placeholder="VD: FPTU Chess Club"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>

              <div className="cm-form-row">
                <div className="cm-form-field">
                  <label className="pr-label">
                    Phân loại <span className="cm-required">*</span>
                  </label>
                  <div className="pr-select-wrap">
                    <select className="pr-select" value={form.category} onChange={set("category")}>
                      <option value="">-- Chọn phân loại --</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="pr-select-arrow" />
                  </div>
                </div>

                <div className="cm-form-field">
                  <label className="pr-label">
                    Tên Trưởng CLB <span className="cm-required">*</span>
                  </label>
                  <input
                    className="cm-input"
                    placeholder="Họ và tên"
                    value={form.leader}
                    onChange={set("leader")}
                  />
                </div>
              </div>

              <div className="cm-form-field">
                <label className="pr-label">MSSV Trưởng CLB</label>
                <input
                  className="cm-input"
                  placeholder="VD: SE241234"
                  value={form.leaderId}
                  onChange={set("leaderId")}
                />
              </div>

              <div className="cm-form-field">
                <label className="pr-label">Mô tả CLB</label>
                <textarea
                  className="pr-textarea"
                  rows={3}
                  placeholder="Giới thiệu ngắn về câu lạc bộ..."
                  value={form.description}
                  onChange={set("description")}
                />
              </div>
            </div>

            <div className="cm-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setCreate(false)}>Hủy</button>
              <button className="cm-btn-create cm-btn-modal-submit" onClick={handleCreate}>
                <Plus size={15} />
                Tạo CLB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dissolve confirm modal ───────────────────────────── */}
      {dissolveTarget && dissolveClub && (
        <div className="cm-overlay" onClick={() => setDiss(null)}>
          <div className="cm-modal cm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3 className="cm-modal-title cm-modal-title-danger">Xác nhận Giải thể CLB</h3>
              <button className="dl-modal-close" onClick={() => setDiss(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="cm-modal-body">
              <div className="cm-dissolve-info">
                <div
                  className="cm-thumb cm-thumb-sm"
                  style={{ background: dissolveClub.bg, color: dissolveClub.color }}
                >
                  {dissolveClub.initials}
                </div>
                <div>
                  <p className="cm-dissolve-name">{dissolveClub.name}</p>
                  <p className="cm-dissolve-meta">
                    {dissolveClub.category} · {dissolveClub.members} thành viên
                  </p>
                </div>
              </div>
              <div className="cm-dissolve-warning">
                <AlertTriangle size={16} />
                <p>
                  Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ dữ liệu thành viên
                  và lịch sử hoạt động của CLB sẽ bị khoá vĩnh viễn.
                </p>
              </div>
            </div>

            <div className="cm-modal-footer">
              <button className="pr-btn-ghost" onClick={() => setDiss(null)}>Hủy</button>
              <button className="cm-btn-dissolve-confirm" onClick={confirmDissolve}>
                Xác nhận giải thể
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
