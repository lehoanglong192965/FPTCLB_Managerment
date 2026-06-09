const CLUB_STATS = [
  { label: "Tổng thành viên",  value: 42,  color: "stat-card-blue" },
  { label: "Sự kiện trong kỳ", value: 3,   color: "stat-card-orange" },
  { label: "Chờ duyệt",        value: 5,   color: "stat-card-purple" },
  { label: "Thành viên mới",   value: 8,   color: "stat-card-green" },
];

export default function ClubOverview() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tổng Quan CLB</h1>
        <p className="page-subtitle">Theo dõi hoạt động và số liệu của câu lạc bộ</p>
      </div>

      <div className="stats-grid">
        {CLUB_STATS.map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="page-placeholder" style={{ marginTop: 0 }}>
        <p className="page-placeholder-label">Hoạt động gần đây</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}