import React, { useEffect, useState } from 'react';
import '../css/style.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setProfile({ name: 'Nguyễn Văn A', email: 'nguyenvana@fpt.edu.vn', role: 'CLUB_LEADER', joinedDate: '2024-01-15' });
    }
  }, []);

  if (!profile) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-16">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">Thông tin cá nhân</h2>
        <div className="mb-2"><strong>Họ và tên:</strong> {profile.name}</div>
        <div className="mb-2"><strong>Email:</strong> {profile.email}</div>
        <div className="mb-2"><strong>Vai trò:</strong> {profile.role}</div>
        <div className="mb-2"><strong>Ngày tham gia:</strong> {new Date(profile.joinedDate).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
