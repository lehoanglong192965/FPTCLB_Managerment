import React from 'react';
import '../css/style.css';
import PublicClubsList from './PublicClubsList';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center py-16 bg-indigo-50 rounded-b-3xl">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Khám phá CLB tại FPT</h1>
        <p className="text-gray-700 text-lg">Tham gia những CLB yêu thích, kết nối bạn bè cùng đam mê</p>
      </div>
      <PublicClubsList />
    </div>
  );
}
