// src/pages/ClubMemberManagement.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Search, Clock, MoreVertical, ChevronDown, Check } from 'lucide-react';
import '../assets/css/ClubMemberManagement.css';

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

const semesterOptions = [
  { id: 'SP26', label: 'Spring 2026', ended: true },
  { id: 'SU26', label: 'Summer 2026', ended: false },
];

const roleFilterOptions = ['Tất cả vai trò', 'Leader', 'Vice Leader', 'Core Team', 'Member'];
const statusFilterOptions = ['Tất cả trạng thái', 'Hoạt động', 'Chờ duyệt', 'Chờ gia hạn', 'Cựu thành viên'];

export default function ClubMemberManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(semesterOptions[1].id);
  const [selectedRole, setSelectedRole] = useState(roleFilterOptions[0]);
  const [selectedStatus, setSelectedStatus] = useState(statusFilterOptions[0]);
  const [openFilter, setOpenFilter] = useState(null);
  const filterDropdownRef = useRef(null);

  const activeSemester = semesterOptions.find((semester) => semester.id === selectedSemester);
  const isReadonlyBySemester = Boolean(activeSemester?.ended);

  const filteredMembers = mockMembers.filter(
    (m) =>
      (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.status.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedRole === roleFilterOptions[0] || m.role === selectedRole) &&
      (selectedStatus === statusFilterOptions[0] || m.status === selectedStatus)
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="member-mgmt-page">
      {/* Header Section */}
      <div className="header-section">
        <div className="title-group">
          <h1>Quản lý Thành viên</h1>
          <p>
            Danh sách nhân sự và phân quyền
          </p>
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
        <div className="select-group" ref={filterDropdownRef}>
          <div className="custom-select">
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
            >
              {semesterOptions.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
          <div className="custom-select custom-select-menu">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setOpenFilter(openFilter === 'role' ? null : 'role')}
            >
              {selectedRole}
              <ChevronDown size={14} className="select-arrow-icon" />
            </button>
            {openFilter === 'role' && (
              <div className="filter-menu">
                {roleFilterOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className="filter-item"
                    onClick={() => {
                      setSelectedRole(role);
                      setOpenFilter(null);
                    }}
                  >
                    <span>{role}</span>
                    {selectedRole === role && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="custom-select custom-select-menu">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
            >
              {selectedStatus}
              <ChevronDown size={14} className="select-arrow-icon" />
            </button>
            {openFilter === 'status' && (
              <div className="filter-menu">
                {statusFilterOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="filter-item"
                    onClick={() => {
                      setSelectedStatus(status);
                      setOpenFilter(null);
                    }}
                  >
                    <span>{status}</span>
                    {selectedStatus === status && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isReadonlyBySemester && (
        <div className="readonly-alert">
          Học kỳ {activeSemester?.label} đã kết thúc. Tất cả thao tác cập nhật thành viên bị khóa.
        </div>
      )}

      {/* Member List */}
      <div className="member-list">
        {filteredMembers.map((m) => (
          <div key={m.id} className="member-row">
            {/* Avatar */}
            <div className="col-avatar">
              <div className="avatar-box">{m.name[0]}</div>
            </div>

            {/* Name + Email */}
            <div className="col-info">
              <span className="name">{m.name}</span>
              <span className="email">{m.email}</span>
            </div>

            {/* Role / Status / Date */}
            <div className="col-meta-group">
              <div className="col-role">
                <span className={`badge-role role-${m.role.toLowerCase().replace(/\s+/g, '-')}`}>
                  {m.role}
                </span>
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

            {/* Actions */}
            <div className="col-actions">
              {m.status === 'Chờ duyệt' ? (
                <div className="approve-group">
                  <button className="btn-reject" disabled={isReadonlyBySemester}>
                    Từ chối
                  </button>
                  <button className="btn-approve" disabled={isReadonlyBySemester}>
                    Duyệt
                  </button>
                </div>
              ) : (
                <div className="row-action-group">
                  <button className="btn-inline-action" disabled={isReadonlyBySemester}>
                    Edit
                  </button>
                  <button className="btn-inline-action danger" disabled={isReadonlyBySemester}>
                    Delete
                  </button>
                  <button className="btn-more" disabled={isReadonlyBySemester}>
                    <MoreVertical size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}