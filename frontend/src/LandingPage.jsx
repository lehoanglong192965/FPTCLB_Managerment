import PublicClubsList from '../components/PublicClubsList';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-sm font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles size={16} className="mr-2" />
              <span>Welcome to the new standard for club management</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
              Empower your campus <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                community experience
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Join, manage, and scale university clubs seamlessly. FPTCLB provides an intuitive, powerful platform designed for students and club leaders alike.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-full shadow-lg shadow-indigo-200 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-200">
                Get Started
                <ArrowRight size={18} className="ml-2" />
              </button>
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-full text-base font-medium text-gray-900 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clubs List Section */}
      <PublicClubsList />
    </div>
  );
}
