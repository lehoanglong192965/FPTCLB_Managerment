import { useState, useMemo } from "react";
import {
  Building2, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Search, Activity, CheckCircle, Users,
} from "lucide-react";
import "../../../assets/css/icpdpEventApproval.css";
import "../../../assets/css/icpdpClubOverview.css";

const MOCK_CLUBS = [
  { id: 1,  name: "FPTU IT Club",       category: "Công nghệ",  leader: "Nguyễn Văn An",   members: 45, events: 12, score: 95, trend: "up",   status: "active"   },
  { id: 2,  name: "FPTU Volunteer",     category: "Cộng đồng",  leader: "Lý Thị Hương",    members: 35, events: 11, score: 91, trend: "up",   status: "active"   },
  { id: 3,  name: "FPTU English Club",  category: "Ngôn ngữ",   leader: "Trần Thị Bích",   members: 38, events: 10, score: 88, trend: "same", status: "active"   },
  { id: 4,  name: "FPTU Music Club",    category: "Nghệ thuật", leader: "Vũ Thị Thanh",    members: 28, events: 9,  score: 84, trend: "up",   status: "active"   },
  { id: 5,  name: "FPTU Dance Club",    category: "Nghệ thuật", leader: "Lê Văn Cường",    members: 32, events: 8,  score: 82, trend: "down", status: "active"   },
  { id: 6,  name: "FPTU Photography",   category: "Nghệ thuật", leader: "Hoàng Văn Em",    members: 22, events: 7,  score: 79, trend: "same", status: "active"   },
  { id: 7,  name: "FPTU Chess Club",    category: "Thể thao",   leader: "Phạm Thị Dung",   members: 15, events: 6,  score: 75, trend: "up",   status: "active"   },
  { id: 8,  name: "FPTU Basketball",    category: "Thể thao",   leader: "Đặng Văn Giang",  members: 18, events: 5,  score: 70, trend: "down", status: "active"   },
  { id: 9,  name: "FPTU Book Club",     category: "Học thuật",  leader: "Bùi Thị Hoa",     members: 12, events: 4,  score: 65, trend: "same", status: "active"   },
  { id: 10, name: "FPTU Debate Club",   category: "Học thuật",  leader: "Phan Văn Khoa",   members: 8,  events: 3,  score: 60, trend: "down", status: "active"   },
  { id: 11, name: "FPTU Astronomy",     category: "Học thuật",  leader: "Trương Văn Long",  members: 3,  events: 1,  score: 28, trend: "down", status: "active"   },
  { id: 12, name: "FPTU Origami",       category: "Nghệ thuật", leader: "Ngô Thị Mỹ",      members: 4,  events: 1,  score: 32, trend: "down", status: "active"   },
  { id: 13, name: "FPTU Robotics",      category: "Công nghệ",  leader: "Đinh Văn Nam",    members: 0,  events: 2,  score: 15, trend: "down", status: "inactive" },
  { id: 14, name: "FPTU Cooking Club",  category: "Ẩm thực",    leader: "Cao Thị Oanh",    members: 0,  events: 3,  score: 18, trend: "down", status: "inactive" },
];

const TABS = [
  { key: "all",      label: "Tất cả" },
  { key: "active",   label: "Đang hoạt động" },
  { key: "inactive", label: "Không hoạt động" },
  { key: "risk",     label: "Cảnh báo" },
];

export default function IcpdpClubOverview() {
  const [clubs, setClubs]     = useState(MOCK_CLUBS);
  const [activeTab, setTab]   = useState("all");
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState(null);

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

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const downgrade = (id) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "inactive" } : c))
    );
    showToast("Đã hạ trạng thái CLB xuống Không hoạt động.");
  };

  const downgradeAll = () => {
    const count = atRisk.length;
    setClubs((prev) =>
      prev.map((c) =>
        c.status === "active" && c.members < 5 ? { ...c, status: "inactive" } : c
      )
    );
    showToast(`Đã hạ trạng thái ${count} CLB xuống Không hoạt động.`);
  };

  const podium = [
    { data: rankedClubs[1], emoji: "🥈", bar: 44, cls: "co-podium-silver" },
    { data: rankedClubs[0], emoji: "🥇", bar: 66, cls: "co-podium-gold"   },
    { data: rankedClubs[2], emoji: "🥉", bar: 33, cls: "co-podium-bronze" },
  ];

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Tổng Quan CLB Toàn Trường</h1>
        <p className="page-subtitle">
          Giám sát toàn bộ câu lạc bộ, theo dõi KPI và xếp hạng thi đua
        </p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="co-stat-row">
            <p className="stat-label">Tổng số CLB</p>
            <Building2 size={18} className="co-stat-icon co-stat-icon-blue" />
          </div>
          <p className="stat-value">{clubs.length}</p>
        </div>

        <div className="stat-card stat-card-green">
          <div className="co-stat-row">
            <p className="stat-label">Đang hoạt động</p>
            <Activity size={18} className="co-stat-icon co-stat-icon-green" />
          </div>
          <p className="stat-value">{activeCount}</p>
        </div>

        <div className="stat-card co-stat-card-gray">
          <div className="co-stat-row">
            <p className="stat-label">Không hoạt động</p>
            <Minus size={18} className="co-stat-icon co-stat-icon-gray" />
          </div>
          <p className="stat-value">{inactiveCount}</p>
        </div>

        <div className="stat-card co-stat-card-red">
          <div className="co-stat-row">
            <p className="stat-label">Cần chú ý (&lt; 5 TV)</p>
            <AlertTriangle size={18} className="co-stat-icon co-stat-icon-red" />
          </div>
          <p className="stat-value">{atRisk.length}</p>
        </div>
      </div>

      {/* ── KPI Ranking + Risk Alert ─────────────────────────── */}
      <div className="co-middle-grid">
        {/* KPI Ranking */}
        <div className="content-card">
          <h2 className="content-card-title">Xếp Hạng Thi Đua KPI</h2>

          <div className="co-podium">
            {podium.map(({ data, emoji, bar, cls }) =>
              data ? (
                <div key={data.id} className={`co-podium-item ${cls}`}>
                  <span className="co-podium-badge">{emoji}</span>
                  <span className="co-podium-name">{data.name}</span>
                  <span className="co-podium-score">{data.score} điểm</span>
                  <div className="co-podium-bar" style={{ height: bar + "px" }} />
                </div>
              ) : null
            )}
          </div>

          <div className="co-rank-list">
            {rankedClubs.slice(3).map((club, i) => (
              <div key={club.id} className="co-rank-row">
                <span className="co-rank-pos">{i + 4}</span>
                <div className="co-rank-info">
                  <span className="co-rank-name">{club.name}</span>
                  <span className="co-rank-cat">{club.category}</span>
                </div>
                <div className="co-rank-right">
                  <span className="co-rank-score">{club.score}</span>
                  {club.trend === "up"   && <TrendingUp   size={13} className="co-trend-up"   />}
                  {club.trend === "down" && <TrendingDown size={13} className="co-trend-down" />}
                  {club.trend === "same" && <Minus        size={13} className="co-trend-same" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Alert */}
        <div className="content-card">
          <div className="co-risk-header">
            <AlertTriangle size={18} className="co-risk-icon" />
            <h2 className="content-card-title" style={{ margin: 0 }}>
              CLB Có Nguy Cơ Bị Hạ Hạng
            </h2>
            {atRisk.length > 0 && (
              <button className="co-btn-downgrade-all" onClick={downgradeAll}>
                Hạ tất cả
              </button>
            )}
          </div>

          {atRisk.length === 0 ? (
            <div className="co-risk-empty">
              <CheckCircle size={36} />
              <p>Tất cả CLB đều đạt tiêu chuẩn thành viên tối thiểu</p>
            </div>
          ) : (
            <>
              <p className="co-risk-desc">
                CLB có ít hơn <strong>5 thành viên</strong> sẽ tự động chuyển sang
                trạng thái <strong>Không hoạt động</strong>. Có thể xử lý thủ công ngay bên dưới.
              </p>
              <div className="co-risk-list">
                {atRisk.map((club) => (
                  <div key={club.id} className="co-risk-item">
                    <div className="co-risk-item-info">
                      <span className="co-risk-item-name">{club.name}</span>
                      <span className="co-risk-item-members">
                        <Users size={11} />
                        {club.members} thành viên
                      </span>
                    </div>
                    <button
                      className="co-btn-downgrade"
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

      {/* ── Club Table ──────────────────────────────────────── */}
      <div className="content-card co-table-card">
        <div className="co-table-header">
          <h2 className="content-card-title" style={{ margin: 0 }}>
            Danh Sách Tất Cả CLB
          </h2>
          <div className="co-search-wrap">
            <Search size={15} className="co-search-icon" />
            <input
              className="co-search-input"
              placeholder="Tìm theo tên CLB, trưởng CLB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="approval-tabs">
          {TABS.map((tab) => {
            const count = tabCount(tab.key);
            return (
              <button
                key={tab.key}
                className={`approval-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setTab(tab.key)}
              >
                {tab.label}
                {count > 0 && (
                  <span className="approval-tab-badge">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {filteredClubs.length === 0 ? (
          <p className="approval-empty">Không có CLB nào phù hợp.</p>
        ) : (
          <table className="co-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Tên CLB</th>
                <th>Phân loại</th>
                <th>Trưởng CLB</th>
                <th>Thành viên</th>
                <th>Sự kiện</th>
                <th>Điểm KPI</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredClubs.map((club) => {
                const rank       = rankedClubs.findIndex((c) => c.id === club.id) + 1;
                const isRisk     = club.status === "active" && club.members < 5;
                const scoreColor =
                  club.score >= 80 ? "green" : club.score >= 60 ? "yellow" : "red";

                return (
                  <tr key={club.id} className={isRisk ? "co-row-risk" : ""}>
                    <td className="co-td-rank">
                      {rank <= 3 ? (
                        <span className={`co-medal co-medal-${["gold", "silver", "bronze"][rank - 1]}`}>
                          {rank}
                        </span>
                      ) : (
                        <span className="co-rank-num">{rank}</span>
                      )}
                    </td>

                    <td>
                      <div className="co-club-cell">
                        <span className="co-club-name">{club.name}</span>
                        {isRisk && (
                          <AlertTriangle size={13} className="co-risk-inline" />
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="co-category-tag">{club.category}</span>
                    </td>

                    <td className="co-td-leader">{club.leader}</td>

                    <td>
                      <span className={`co-member-count${club.members < 5 ? " co-member-low" : ""}`}>
                        {club.members}
                      </span>
                    </td>

                    <td className="co-td-events">{club.events}</td>

                    <td>
                      <div className="co-score-cell">
                        <div className="co-score-bar-wrap">
                          <div
                            className={`co-score-bar co-bar-${scoreColor}`}
                            style={{ width: `${club.score}%` }}
                          />
                        </div>
                        <span className={`co-score-num co-num-${scoreColor}`}>
                          {club.score}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`approval-status-badge ${
                          club.status === "active" ? "badge-approved" : "badge-rejected"
                        }`}
                      >
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
    </div>
  );
}
