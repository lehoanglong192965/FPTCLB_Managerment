import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, UserCircle, LayoutDashboard, LogOut } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Trang Chủ', path: '/', icon: <Users size={16}/> },
    { name: 'Quản Lý', path: '/manage-members', icon: <LayoutDashboard size={16}/> },
    { name: 'Hồ Sơ', path: '/profile', icon: <UserCircle size={16}/> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="font-extrabold text-xl text-orange-500">FPTU Clubs</div>

          {/* Nav Links */}
          <div className="flex space-x-3">
            {navLinks.map(link => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${active ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {link.icon} {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Buttons */}
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition">
              Đăng ký
            </button>
            <button className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
              <LogOut size={14}/> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}