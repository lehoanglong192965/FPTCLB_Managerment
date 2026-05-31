import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Shield, Award } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data trực tiếp
    const mockProfile = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@fpt.edu.vn',
      role: 'Club Leader',
      joinedDate: '2024-01-15',
    };
    setProfile(mockProfile);
    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        Đang tải...
      </div>
    );

  const initials = profile.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(-2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-orange-500 to-orange-400 rounded-t-xl" />

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-end gap-4 sm:gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white font-bold text-xl border-4 border-white">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-gray-900">{profile.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                <Mail size={12} /> {profile.email}
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 mt-2 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">
                <Shield size={12} /> {profile.role}
              </span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50">
                Chỉnh sửa
              </button>
              <button className="px-4 py-2 rounded-full bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600">
                Quản lý CLB →
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div className="border-b border-gray-200 pb-4 text-sm font-semibold text-gray-700">
            Thông tin cá nhân
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
              <div className="text-gray-900 font-medium">{profile.name}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <div className="flex items-center gap-1 text-gray-900 font-medium">
                <Mail size={12} /> {profile.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày tham gia</label>
              <div className="flex items-center gap-1 text-gray-900 font-medium">
                <Calendar size={12} /> {new Date(profile.joinedDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vai trò</label>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">
                <Shield size={12} /> {profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements */}
      <div className="bg-white border border-gray-200 rounded-xl shadow p-4">
          <div className="flex items-center gap-2 font-semibold border-b border-gray-200 pb-2">
            <Award size={16} color="#f04e23"/> Thành tích
          </div>
          <ul className="space-y-2 mt-2">
            <li className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <div className="w-9 h-9 rounded-md bg-yellow-100 flex items-center justify-center">🥇</div>
              <div>

              </div>
            </li>
            <li className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <div className="w-9 h-9 rounded-md bg-blue-100 flex items-center justify-center">🛡️</div>
              <div>
                
              </div>
            </li>
            <li className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <div className="w-9 h-9 rounded-md bg-green-100 flex items-center justify-center">⭐</div>
              <div>
                
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}