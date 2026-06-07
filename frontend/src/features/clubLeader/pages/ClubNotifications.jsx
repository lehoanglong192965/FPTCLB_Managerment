import { Bell } from "lucide-react";

export default function ClubNotifications() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Thông Báo</h1>
        <p className="page-subtitle">Thông báo và tin tức của câu lạc bộ</p>
      </div>
      <div className="page-placeholder">
        <Bell size={48} className="page-placeholder-icon" />
        <p className="page-placeholder-label">Thông Báo</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}