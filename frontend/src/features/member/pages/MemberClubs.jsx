import { Star } from "lucide-react";

export default function MemberClubs() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Câu Lạc Bộ</h1>
        <p className="page-subtitle">CLB bạn đang tham gia và khám phá thêm</p>
      </div>
      <div className="page-placeholder">
        <Star size={48} className="page-placeholder-icon" />
        <p className="page-placeholder-label">Câu Lạc Bộ</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}