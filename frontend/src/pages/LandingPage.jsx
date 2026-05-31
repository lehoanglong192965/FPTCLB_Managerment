import React from 'react';
import PublicClubsList from '../components/PublicClubsList';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-orange-50 border-b border-gray-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-2/5 h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(240,78,35,0.06)_0%,_transparent_70%)] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 mb-7 text-xs font-semibold rounded-full bg-orange-100 border border-orange-200">
            <Sparkles size={14} />
            Nền tảng quản lý câu lạc bộ mới
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Kết nối cộng đồng <br />
            <span className="text-orange-500">sinh viên FPT</span>
          </h1>

          <p className="text-gray-600 text-base sm:text-lg mb-9 max-w-xl mx-auto leading-relaxed">
            Tham gia, quản lý và phát triển câu lạc bộ một cách dễ dàng. FPTU Clubs mang đến nền tảng trực quan dành riêng cho sinh viên và trưởng CLB.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-orange-500 text-white font-bold shadow-md hover:bg-orange-600 transform hover:-translate-y-0.5 transition-all duration-200">
              Khám phá ngay
              <ArrowRight size={16} />
            </button>
            <button className="inline-flex items-center px-7 py-3 rounded-full bg-white text-gray-900 font-semibold border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
              Xem tài liệu
            </button>
          </div>
        </div>
      </div>

      {/* Clubs List Section */}
      {/* PublicClubsList nên dùng mock data để bỏ backend */}
      <PublicClubsList />
    </div>
  );
}