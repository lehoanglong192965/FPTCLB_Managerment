import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/style.css';

export default function Navbar() {
  const location = useLocation();
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Profile', path: '/profile' },
    { name: 'Manage Members', path: '/manage-members' }
  ];
  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 font-bold text-2xl">FPTU Clubs</div>
          <div className="flex space-x-4">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === link.path ? 'text-white bg-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
