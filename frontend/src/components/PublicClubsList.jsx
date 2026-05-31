import React, { useState } from 'react';
import { Users, Activity, Tag, ArrowRight } from 'lucide-react';

export default function PublicClubsList() {
  const mockClubs = [
    { id: 1, name: 'FPTU IT Club', category: 'IT', memberCount: 150, description: 'Câu lạc bộ Công nghệ thông tin' },
    { id: 2, name: 'Melody Club', category: 'Music', memberCount: 85, description: 'Câu lạc bộ Âm nhạc' },
    { id: 3, name: 'FPTU Sports Club', category: 'Sports', memberCount: 60, description: 'Câu lạc bộ Thể thao' },
  ];

  const [clubs] = useState(mockClubs);
  const [hoveredId, setHoveredId] = useState(null);

  const CAT_BADGE = {
    IT: { bg: 'bg-blue-100', color: 'text-blue-700' },
    Music: { bg: 'bg-purple-100', color: 'text-purple-700' },
    Sports: { bg: 'bg-green-100', color: 'text-green-700' },
    Art: { bg: 'bg-yellow-100', color: 'text-yellow-700' },
    Culture: { bg: 'bg-blue-100', color: 'text-blue-700' },
  };

  return (
    <section className="py-16 bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase text-orange-500 mb-1">Khám phá</div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Các câu lạc bộ tại FPT</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            Tìm đam mê của bạn và gia nhập cộng đồng sôi động trên toàn khuôn viên trường.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map(club => {
            const isHovered = hoveredId === club.id;
            const badge = CAT_BADGE[club.category] || { bg: 'bg-gray-200', color: 'text-gray-700' };
            return (
              <div
                key={club.id}
                className={`flex flex-col bg-white border rounded-lg overflow-hidden shadow transition-transform duration-200 cursor-pointer ${isHovered ? 'translate-y-[-3px] shadow-lg' : ''}`}
                onMouseEnter={() => setHoveredId(club.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.color}`}>
                      <Tag size={12}/> {club.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                      <Users size={12}/> {club.memberCount} thành viên
                    </div>
                  </div>
                  <h3 className={`font-bold text-base mb-2 ${isHovered ? 'text-orange-500' : 'text-gray-900'}`}>{club.name}</h3>
                  <p className="text-sm text-gray-600">{club.description}</p>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Activity size={12}/> Đang hoạt động
                  </span>
                  <button className={`flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600`}>
                    Xem chi tiết <ArrowRight size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}