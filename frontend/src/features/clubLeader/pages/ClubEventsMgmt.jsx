import { Calendar } from "lucide-react";

export default function ClubEventsMgmt() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sự Kiện CLB</h1>
        <p className="page-subtitle">Tạo và quản lý sự kiện của câu lạc bộ</p>
      </div>
      <div className="page-placeholder">
        <Calendar size={48} className="page-placeholder-icon" />
        <p className="page-placeholder-label">Sự Kiện CLB</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}
