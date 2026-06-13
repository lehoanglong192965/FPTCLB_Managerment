import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, ChevronDown, AlertTriangle, X,
  Users, Layers,
} from "lucide-react";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubManagement.css";
import clubApi from "../../../services/api/clubApi";

const CATEGORIES = ["IT", "Music", "Sports", "Art", "Culture", "Kỹ thuật", "Ngôn ngữ", "Học thuật", "Cộng đồng", "Khác"];

const STATUS_MAP = {
  Active:    { label: "Hoạt động",   cls: "cm-badge-active"    },
  Inactive: { label: "Tạm ngừng",   cls: "cm-badge-suspended" },
  Dissolved: { label: "Đã giải thể", cls: "cm-badge-dissolved" },
};

const FILTER_OPTIONS = [
  { value: "all",       label: "Tất cả trạng thái" },
  { value: "Active",    label: "Hoạt động" },
  { value: "Inactive",  label: "Tạm ngừng" },
  { value: "Dissolved", label: "Đã giải thể" },
];

const PALETTE = [
  { bg: "#dbeafe", color: "#2563eb" },
  { bg: "#d1fae5", color: "#059669" },
  { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#fce7f3", color: "#db2777" },
  { bg: "#fff8f5", color: "#e6430a" },
];

const INIT_FORM = { clubName: "", clubCode: "", description: "", leaderStudentId: "" };

export default function IcpdpClubManagement() {
  const [clubs, setClubs]         = useState([]);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [showCreate, setCreate]   = useState(false);
  const [dissolveTarget, setDiss] = useState(null);
  const [form, setForm]           = useState(INIT_FORM);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadClubs = async () => {
    setLoading(true);
    try {
      const data = await clubApi.getAll();
      setClubs(data || []);
    } catch (err) {
      showToast("Lỗi khi tải danh sách CLB", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const counts = useMemo(() => ({
    Active:    clubs.filter((c) => c.clubStatus === "Active").length,
    Inactive:  clubs.filter((c) => c.clubStatus === "Inactive").length,
    Dissolved: clubs.filter((c) => c.clubStatus === "Dissolved").length,
  }), [clubs]);

  const filtered = useMemo(() => {
    let list = clubs;
    if (filter !== "all") list = list.filter((c) => c.clubStatus === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.clubName?.toLowerCase().includes(q) || c.clubCode?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clubs, filter, search]);

  const suspend = async (id) => {
    try {
      await clubApi.updateStatus(id, "Inactive");
      showToast("Đã tạm ngừng hoạt động câu lạc bộ.");
      loadClubs();
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi tạm ngừng", "error");
    }
  };

  const reactivate = async (id) => {
    try {
      await clubApi.updateStatus(id, "Active");
      showToast("Đã kích hoạt lại câu lạc bộ.");
      loadClubs();
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi kích hoạt", "error");
    }
  };

  const confirmDissolve = async () => {
    try {
      await clubApi.updateStatus(dissolveTarget, "Dissolved");
      setDiss(null);
      showToast("Câu lạc bộ đã được giải thể.");
      loadClubs();
    } catch (err) {
      showToast(err.response?.data?.error || "Lỗi giải thể", "error");
    }
  };

  const handleCreate = async () => {
    if (!form.clubName.trim() || !form.clubCode.trim() || !form.leaderStudentId.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc.", "error");
      return;
    }
    try {
      await clubApi.create(form);
      setForm(INIT_FORM);
      setCreate(false);
      showToast("Đã tạo câu lạc bộ mới thành công.");
      loadClubs();
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.message || "Lỗi tạo CLB", "error");
    }
  };

  const dissolveClub = clubs.find((c) => c.clubID === dissolveTarget);

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
          {counts.Active > 0 && (
            <span className="cm-pill cm-pill-active">{counts.Active} hoạt động</span>
          )}
          {counts.Inactive > 0 && (
            <span className="cm-pill cm-pill-suspended">{counts.Inactive} tạm ngừng</span>
          )}
          {counts.Dissolved > 0 && (
            <span className="cm-pill cm-pill-dissolved">{counts.Dissolved} giải thể</span>
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
      {loading ? (
        <p className="approval-empty">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="cm-empty">
          <Layers size={40} />
          <p>Không có câu lạc bộ nào phù hợp.</p>
        </div>
      ) : (
        <div className="cm-club-grid">
          {filtered.map((club, index) => {
            const st = STATUS_MAP[club.clubStatus] || STATUS_MAP.Active;
            const palette = PALETTE[index % PALETTE.length];
            const initials = club.clubCode ? club.clubCode.substring(0, 2).toUpperCase() : "CL";
            return (
              <div
                key={club.clubID}
                className={`cm-club-card${club.clubStatus === "Dissolved" ? " cm-card-dissolved" : ""}`}
              >
                <div
                  className="cm-thumb"
                  style={{ background: palette.bg, color: palette.color }}
                >
                  {initials}
                </div>

                <div className="cm-card-body">
                  <div className="cm-card-top">
                    <span className="cm-club-name">{club.clubName}</span>
                    <span className={`cm-status-badge ${st.cls}`}>{st.label}</span>
                  </div>

                  <p className="cm-club-meta">
                    {club.clubCode}
                    {" · "}
                    <Users size={12} style={{ display: "inline", verticalAlign: "middle" }} />
                    {" "}{club.membersCount || 0} thành viên
                  </p>

                  <p className="cm-club-desc">{club.description || "Chưa có mô tả"}</p>

                  <div className="cm-card-actions">
                    {club.clubStatus === "Active" && (
                      <>
                        <button className="cm-btn-suspend" onClick={() => suspend(club.clubID)}>
                          Tạm ngừng
                        </button>
                        <button className="cm-btn-dissolve" onClick={() => setDiss(club.clubID)}>
                          Giải thể
                        </button>
                      </>
                    )}
                    {club.clubStatus === "Inactive" && (
                      <>
                        <button className="cm-btn-reactivate" onClick={() => reactivate(club.clubID)}>
                          Kích hoạt lại
                        </button>
                        <button className="cm-btn-dissolve" onClick={() => setDiss(club.clubID)}>
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
                  value={form.clubName}
                  onChange={set("clubName")}
                />
              </div>

              <div className="cm-form-row">
                <div className="cm-form-field">
                  <label className="pr-label">
                    Mã CLB (Code) <span className="cm-required">*</span>
                  </label>
                  <input
                    className="cm-input"
                    placeholder="VD: FCC"
                    value={form.clubCode}
                    onChange={set("clubCode")}
                  />
                </div>

                <div className="cm-form-field">
                  <label className="pr-label">
                    MSSV Trưởng CLB <span className="cm-required">*</span>
                  </label>
                  <input
                    className="cm-input"
                    placeholder="VD: SE241234"
                    value={form.leaderStudentId}
                    onChange={set("leaderStudentId")}
                  />
                </div>
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
              <button className="cm-btn-create cm-btn-modal-submit" onClick={handleCreate} disabled={loading}>
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
                  style={{ background: "#ccc", color: "#333" }}
                >
                  {dissolveClub.clubCode?.substring(0, 2).toUpperCase() || "CL"}
                </div>
                <div>
                  <p className="cm-dissolve-name">{dissolveClub.clubName}</p>
                  <p className="cm-dissolve-meta">
                    {dissolveClub.clubCode} · {dissolveClub.membersCount || 0} thành viên
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
