import React, { useState } from 'react';
import { Users, UserPlus, Trash2, MoreVertical, ShieldAlert, Edit2, ArrowLeftRight } from 'lucide-react';

export default function ClubMemberManagement() {
  // Mock data
  const mockMembers = [
    { id: '1', name: 'Nguyễn Văn A', role: 'Club Leader', status: 'Active', joined: '2024-01-15' },
    { id: '2', name: 'Trần Thị B', role: 'Member', status: 'Active', joined: '2024-03-10' },
    { id: '3', name: 'Lê Văn C', role: 'Member', status: 'Pending', joined: '2024-02-05' },
  ];

  const [members, setMembers] = useState(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const AVATAR_COLORS = ['bg-blue-100 text-blue-700','bg-purple-100 text-purple-700','bg-green-100 text-green-700','bg-yellow-100 text-yellow-700','bg-pink-100 text-pink-700'];

  const statusBadge = (status) => {
    const map = {
      Active: { label: 'Hoạt động', color: 'text-green-700', bg: 'bg-green-100' },
      Pending: { label: 'Chờ duyệt', color: 'text-yellow-800', bg: 'bg-yellow-100' },
      Inactive: { label: 'Không HĐ', color: 'text-gray-600', bg: 'bg-gray-200' },
    };
    const s = map[status] || map.Inactive;
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>● {s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Quản lý thành viên CLB</h1>
            <p className="text-gray-600 text-sm sm:text-base">Thêm, xóa thành viên và bàn giao chức vụ Club Leader.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600">
            <UserPlus size={16} /> Thêm thành viên
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-x-auto">
          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center bg-gray-50 border-b border-gray-200 p-3 gap-2">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tìm thành viên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
              <ShieldAlert size={12} /> ⚡ Club Leader
            </span>
          </div>

          {/* Table */}
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left uppercase text-gray-500">Thành viên</th>
                <th className="px-4 py-2 text-left uppercase text-gray-500">Vai trò</th>
                <th className="px-4 py-2 text-left uppercase text-gray-500">Trạng thái</th>
                <th className="px-4 py-2 text-left uppercase text-gray-500">Ngày tham gia</th>
                <th className="px-4 py-2 text-right uppercase text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">Không tìm thấy thành viên phù hợp.</td>
                </tr>
              ) : filteredMembers.map((member, i) => {
                const col = AVATAR_COLORS[i % AVATAR_COLORS.length].split(' ');
                const initials = member.name.split(' ').map(w => w[0]).join('').slice(-2).toUpperCase();
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 transition-colors"
                    onMouseEnter={() => setHoveredId(member.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${col[0]} ${col[1]}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{member.name}</div>
                          <div className="text-xs text-gray-500">ID: {member.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{member.role}</td>
                    <td className="px-4 py-3">{statusBadge(member.status)}</td>
                    <td className="px-4 py-3 text-gray-500">{member.joined}</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      <button className="p-2 bg-gray-50 border rounded hover:bg-gray-100 hover:border-gray-300 transition" title="Bàn giao">
                        <ArrowLeftRight size={14} />
                      </button>
                      <button className="p-2 bg-gray-50 border rounded hover:bg-gray-100 hover:border-gray-300 transition" title="Sửa vai trò">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-2 bg-gray-50 border rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition" title="Xóa thành viên">
                        <Trash2 size={14} />
                      </button>
                      <button className="p-2 bg-gray-50 border rounded hover:bg-gray-100 hover:border-gray-300 transition" title="Thêm tùy chọn">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}