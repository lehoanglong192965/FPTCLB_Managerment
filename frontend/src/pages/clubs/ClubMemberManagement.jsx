import React, { useState } from 'react';
import { Search, Clock, MoreVertical, ChevronDown } from 'lucide-react';

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

function getRoleBadgeClass(role) {
  switch (role) {
    case 'Leader':      return 'text-[#f04e23] border border-[#f04e23]';
    case 'Vice Leader': return 'text-[#3b82f6] border border-[#3b82f6]';
    default:            return 'text-[#1e293b] border border-[#1e293b]';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Hoạt động':    return 'bg-[#e6f9f1] text-[#10b981]';
    case 'Chờ gia hạn':  return 'bg-[#fff4e6] text-[#f97316]';
    case 'Chờ duyệt':    return 'bg-[#fef9c3] text-[#854d0e]';
    default:              return 'bg-[#f1f5f9] text-[#64748b]';
  }
}

export default function ClubMemberManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = mockMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#f8fafc] p-10 font-['Be_Vietnam_Pro',sans-serif] max-w-[1100px] mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-[25px]">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1a202c] m-0">Quản lý Thành viên</h1>
          <p className="text-[#718096] text-sm">Danh sách nhân sự và phân quyền</p>
        </div>
        <div className="bg-[#fef3c7] text-[#92400e] px-3.5 py-1.5 rounded-[20px] text-[13px] font-semibold flex items-center gap-1.5">
          <Clock size={14} /> 2 đơn chờ duyệt
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-[15px] mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" />
          <input
            type="text"
            placeholder="Tìm tên thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 pr-2.5 pl-10 border border-[#e2e8f0] rounded-lg bg-white text-sm outline-none"
          />
        </div>
        <div className="flex gap-2.5">
          <div className="relative">
            <select className="py-2.5 pl-[15px] pr-9 border border-[#e2e8f0] rounded-lg bg-white text-[#4a5568] text-sm appearance-none min-w-[160px] outline-none">
              <option>Tất cả vai trò</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] pointer-events-none" />
          </div>
          <div className="relative">
            <select className="py-2.5 pl-[15px] pr-9 border border-[#e2e8f0] rounded-lg bg-white text-[#4a5568] text-sm appearance-none min-w-[160px] outline-none">
              <option>Tất cả trạng thái</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {filteredMembers.map((m) => (
          <div key={m.id} className="flex items-center px-6 py-3 border-b border-[#f1f5f9] last:border-b-0">
            <div className="w-11 h-11 bg-[#fff2ef] text-[#f04e23] rounded-full flex items-center justify-center font-bold mr-4 shrink-0">
              {m.name[0]}
            </div>

            <div className="flex-1 flex flex-col">
              <span className="font-bold text-[#111827] text-[15px]">{m.name}</span>
              <span className="text-[13px] text-[#64748b]">{m.email}</span>
            </div>

            <div className="flex items-center gap-2.5 mr-5">
              <div className="min-w-[90px] flex justify-center">
                <span className={`px-2.5 py-0.5 rounded-md text-[12px] font-semibold min-w-[80px] text-center inline-block ${getRoleBadgeClass(m.role)}`}>
                  {m.role}
                </span>
              </div>
              <div className="min-w-[90px] flex justify-center">
                <span className={`px-2 py-1 rounded-md text-[12px] font-semibold whitespace-nowrap ${getStatusClass(m.status)}`}>
                  {m.status}
                </span>
              </div>
              <div className="min-w-[80px] text-center text-[12px] text-[#64748b]">{m.date}</div>
            </div>

            <div className="min-w-[80px] flex justify-end gap-1.5">
              {m.status === 'Chờ duyệt' ? (
                <div className="flex gap-1.5">
                  <button className="text-[12px] px-2.5 py-1 rounded-[5px] bg-white text-[#ef4444] border border-[#ef4444] cursor-pointer">Từ chối</button>
                  <button className="text-[12px] px-2.5 py-1 rounded-[5px] bg-[#10b981] text-white border-none cursor-pointer">Duyệt</button>
                </div>
              ) : (
                <button className="bg-transparent border-none text-[#cbd5e0] cursor-pointer p-1.5">
                  <MoreVertical size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
