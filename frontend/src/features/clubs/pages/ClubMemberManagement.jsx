import React, { useState } from 'react';
import { Search, Clock, MoreVertical, ChevronDown } from 'lucide-react';
import '../../../assets/css/ClubMemberManagement.css';

const mockMembers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a.nv@fpt.edu.vn', role: 'Leader', status: 'Hoạt động', date: '2022-09-01' },
  { id: 2, name: 'Trần Thị B', email: 'b.tt@fpt.edu.vn', role: 'Vice Leader', status: 'Hoạt động', date: '2022-09-01' },
  { id: 3, name: 'Lê Văn C', email: 'c.lv@fpt.edu.vn', role: 'Core Team', status: 'Hoạt động', date: '2023-01-15' },
  { id: 4, name: 'Vũ Thị F', email: 'f.vt@fpt.edu.vn', role: 'Member', status: 'Chờ gia hạn', date: '2023-09-10' },
  { id: 5, name: 'Đặng Văn G', email: 'g.dv@fpt.edu.vn', role: 'Member', status: 'Chờ gia hạn', date: '2023-09-10' },
  { id: 6, name: 'Bùi Thị H', email: 'h.bt@fpt.edu.vn', role: 'Member', status: 'Hoạt động', date: '2024-01-20' },
  { id: 7, name: 'Đỗ Văn I', email: 'i.dv@fpt.edu.vn', role: 'Member', status: 'Chờ duyệt', date: '2026-05-01' },
  { id: 8, name: 'Hồ Thị K', email: 'k.ht@fpt.edu.vn', role: 'Member', status: 'Chờ duyệt', date: '2026-05-02' },
  { id: 9, name: 'Phạm Văn L', email: 'l.pv@fpt.edu.vn', role: 'Member', status: 'Cựu thành viên', date: '2021-09-01' },
  { id: 10, name: 'Ngô Thị M', email: 'm.nt@fpt.edu.vn', role: 'Core Team', status: 'Cựu thành viên', date: '2020-09-01' },
];

export default function ClubMemberManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = mockMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="member-mgmt-page">
      {/* Header Section */}
      <div className="header-section">
        <div className="title-group">
          <h1>Quản lý Thành viên</h1>
          <p>Danh sách nhân sự và phân quyền</p>
        </div>
        <div className="pending-badge">
          <Clock size={14} /> 2 đơn chờ duyệt
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm tên thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="select-group">
          <div className="custom-select">
            <select><option>Tất cả vai trò</option></select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
          <div className="custom-select">
            <select><option>Tất cả trạng thái</option></select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="member-list">
        {filteredMembers.map((m) => (
          <div key={m.id} className="member-row">
            <div className="col-avatar">
              <div className="avatar-box">{m.name[0]}</div>
            </div>

            <div className="col-info">
              <span className="name">{m.name}</span>
              <span className="email">{m.email}</span>
            </div>

            <div className="col-meta-group">
              <div className="col-role">
                <span className={`badge-role ${m.role.toLowerCase().replace(' ', '-')}`}>{m.role}</span>
              </div>
              <div className="col-status">
                <span className={`pill-status ${
                  m.status === 'Hoạt động'
                    ? 'st-active'
                    : m.status === 'Chờ gia hạn'
                    ? 'st-waiting'
                    : m.status === 'Chờ duyệt'
                    ? 'st-pending'
                    : 'st-expired'
                }`}>{m.status}</span>
              </div>
              <div className="col-date">{m.date}</div>
            </div>

            <div className="col-actions">
              {m.status === 'Chờ duyệt' ? (
                <div className="approve-group">
                  <button className="btn-reject">Từ chối</button>
                  <button className="btn-approve">Duyệt</button>
                </div>
              ) : (
                <button className="btn-more"><MoreVertical size={18} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
