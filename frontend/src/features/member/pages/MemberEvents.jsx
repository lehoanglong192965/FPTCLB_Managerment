import { Calendar } from "lucide-react";

export default function MemberEvents() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sự Kiện</h1>
        <p className="page-subtitle">Sự kiện đang diễn ra và sắp tới của CLB bạn tham gia</p>
      </div>
      <div className="page-placeholder">
        <Calendar size={48} className="page-placeholder-icon" />
        <p className="page-placeholder-label">Sự Kiện</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}