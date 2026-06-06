import { BarChart2 } from "lucide-react";

export default function ClubReports() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Báo Cáo CLB</h1>
        <p className="page-subtitle">Thống kê hoạt động và số liệu của câu lạc bộ</p>
      </div>
      <div className="page-placeholder">
        <BarChart2 size={48} className="page-placeholder-icon" />
        <p className="page-placeholder-label">Báo Cáo CLB</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}
