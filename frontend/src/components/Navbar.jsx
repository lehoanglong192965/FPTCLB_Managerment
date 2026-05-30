import { Link, useLocation } from 'react-router-dom';
import { Users, UserCircle, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: <Users size={18} /> },
    { name: 'Manage Members', path: '/manage-members', icon: <LayoutDashboard size={18} /> },
    { name: 'Profile', path: '/profile', icon: <UserCircle size={18} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tighter">
              FPT Club Management<span className="text-gray-800">.</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.name}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center">
             {/* Mock logout button for visual completeness */}
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
