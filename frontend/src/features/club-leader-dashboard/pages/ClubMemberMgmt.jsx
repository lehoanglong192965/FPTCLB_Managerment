import { Users } from "lucide-react";

export default function ClubMemberMgmt() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Thành Viên</h1>
        <p className="page-subtitle">Duyệt đơn, phân quyền và quản lý danh sách thành viên CLB</p>
      </div>
      <div className="page-placeholder">
        <Users size={48} className="page-placeholder-icon" />
        <p className="page-placeholder-label">Quản Lý Thành Viên</p>
        <p className="page-placeholder-desc">Chức năng đang được phát triển</p>
      </div>
    </div>
  );
}