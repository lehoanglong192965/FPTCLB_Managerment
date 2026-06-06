import { useState, useMemo } from "react";
import { Search, Calendar, Building2, FileText, X, Eye } from "lucide-react";
import "../../../assets/css/studentApplications.css";

/* ── Mock data ──────────────────────────────────────────────── */
const INITIAL_APPLICATIONS = [
  {
    id: 1,
    clubName: "FPTU IT Club",
    clubAbbr: "IT",
    logoColor: "blue",
    position: "Thành viên",
    appliedDate: "2026-05-20",
    status: "pending",
    message: "Em muốn tham gia CLB để học hỏi thêm về lập trình và công nghệ.",
  },
  {
    id: 2,
    clubName: "FPTU Music Club",
    clubAbbr: "MC",
    logoColor: "orange",
    position: "Thành viên",
    appliedDate: "2026-05-15",
    status: "approved",
    message: "Em có đam mê âm nhạc và muốn tham gia các hoạt động biểu diễn.",
  },
  {
    id: 3,
    clubName: "FPTU English Club",
    clubAbbr: "EC",
    logoColor: "green",
    position: "Thành viên",
    appliedDate: "2026-05-10",
    status: "rejected",
    message: "Em muốn cải thiện kỹ năng tiếng Anh qua các hoạt động CLB.",
  },
  {
    id: 4,
    clubName: "FPTU Art Club",
    clubAbbr: "AC",
    logoColor: "purple",
    position: "Core Team",
    appliedDate: "2026-05-25",
    status: "pending",
    message: "Em có kinh nghiệm thiết kế đồ hoạ và muốn đóng góp cho CLB.",
  },
  {
    id: 5,
    clubName: "FPTU Sport Club",
    clubAbbr: "SC",
    logoColor: "blue",
    position: "Thành viên",
    appliedDate: "2026-04-30",
    status: "withdrawn",
    message: "Em muốn tham gia hoạt động thể thao.",
  },
];

const STATUS_MAP = {
  pending:   { label: "Chờ duyệt",  cls: "sa-status--pending" },
  approved:  { label: "Đã duyệt",   cls: "sa-status--approved" },
  rejected:  { label: "Bị từ chối", cls: "sa-status--rejected" },
  withdrawn: { label: "Đã rút đơn", cls: "sa-status--withdrawn" },
};

function StatusBadge({ status }) {
  const info = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`sa-status ${info.cls}`}>
      <span className="sa-status-dot" />
      {info.label}
    </span>
  );
}

export default function StudentApplications() {
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  /* ── Withdraw application ───────────────────────────────── */
  function handleWithdraw() {
    if (!withdrawTarget) return;
    setApplications((prev) =>
      prev.map((app) =>
        app.id === withdrawTarget.id
          ? { ...app, status: "withdrawn" }
          : app
      )
    );
    setWithdrawTarget(null);
  }

  /* ── Filtering ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.clubName.toLowerCase().includes(search.toLowerCase()) ||
        app.position.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" || app.status === filter;
      return matchSearch && matchFilter;
    });
  }, [applications, search, filter]);

  /* ── Stats ──────────────────────────────────────────────── */
  const total    = applications.length;
  const pending  = applications.filter((a) => a.status === "pending").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div>
      <div className="sa-header">
        <h1 className="page-title">Đơn ứng tuyển của tôi</h1>
        <div className="sa-controls">
          <div className="sa-search-wrap">
            <Search size={15} className="sa-search-icon" />
            <input
              className="sa-search"
              type="text"
              placeholder="Tìm tên CLB hoặc vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="sa-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
            <option value="withdrawn">Đã rút đơn</option>
          </select>
        </div>
      </div>

      {/* ── Stats cards ───────────────────────────────────── */}
      <div className="sa-stats">
        <div className="sa-stat-card sa-stat-card--total">
          <div className="sa-stat-value">{total}</div>
          <div className="sa-stat-label">Tổng đơn</div>
        </div>
        <div className="sa-stat-card sa-stat-card--pending">
          <div className="sa-stat-value">{pending}</div>
          <div className="sa-stat-label">Chờ duyệt</div>
        </div>
        <div className="sa-stat-card sa-stat-card--approved">
          <div className="sa-stat-value">{approved}</div>
          <div className="sa-stat-label">Đã duyệt</div>
        </div>
        <div className="sa-stat-card sa-stat-card--rejected">
          <div className="sa-stat-value">{rejected}</div>
          <div className="sa-stat-label">Bị từ chối</div>
        </div>
      </div>

      <p className="sa-count">
        Hiển thị <strong>{filtered.length}</strong> / {applications.length} đơn ứng tuyển
      </p>

      {/* ── Application list ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="sa-empty">
          <FileText size={40} style={{ opacity: 0.3 }} />
          <p className="sa-empty-label">Không có đơn ứng tuyển nào</p>
          <p className="sa-empty-desc">Bạn chưa nộp đơn ứng tuyển CLB hoặc không có kết quả phù hợp.</p>
        </div>
      ) : (
        <div className="sa-list">
          {filtered.map((app) => (
            <div key={app.id} className={`sa-card sa-card--${app.status}`}>
              {/* Club logo */}
              <div className={`sa-club-logo sa-club-logo--${app.logoColor}`}>
                {app.clubAbbr}
              </div>

              {/* Card body */}
              <div className="sa-card-body">
                <p className="sa-club-name">{app.clubName}</p>
                <p className="sa-position">Vị trí: {app.position}</p>
                <div className="sa-meta">
                  <span className="sa-meta-item">
                    <Calendar size={12} />
                    {app.appliedDate}
                  </span>
                  <span className="sa-meta-item">
                    <Building2 size={12} />
                    {app.clubAbbr}
                  </span>
                </div>
              </div>

              {/* Status */}
              <StatusBadge status={app.status} />

              {/* Actions */}
              <div className="sa-actions">
                <button className="sa-btn-detail" title="Xem chi tiết">
                  <Eye size={14} /> Chi tiết
                </button>

                {app.status === "pending" ? (
                  <button
                    className="sa-btn-withdraw"
                    onClick={() => setWithdrawTarget(app)}
                  >
                    <X size={14} /> Rút đơn
                  </button>
                ) : (
                  <button className="sa-btn-withdraw sa-btn-disabled" disabled>
                    <X size={14} /> Rút đơn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirm withdraw modal ────────────────────────── */}
      {withdrawTarget && (
        <div className="sa-modal-overlay" onClick={() => setWithdrawTarget(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-icon">
              <X size={28} />
            </div>
            <h3 className="sa-modal-title">Rút đơn ứng tuyển?</h3>
            <p className="sa-modal-desc">
              Bạn có chắc chắn muốn rút đơn ứng tuyển vào{" "}
              <span className="sa-modal-club">{withdrawTarget.clubName}</span>?
              <br />
              Thao tác này không thể hoàn tác.
            </p>
            <div className="sa-modal-footer">
              <button className="sa-modal-btn-cancel" onClick={() => setWithdrawTarget(null)}>
                Huỷ bỏ
              </button>
              <button className="sa-modal-btn-confirm" onClick={handleWithdraw}>
                Xác nhận rút đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
