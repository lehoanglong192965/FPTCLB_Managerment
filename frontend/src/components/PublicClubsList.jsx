import { useEffect, useState } from 'react';
import { clubService } from '../services/clubService';
import { Users, Activity, Tag, ArrowRight } from 'lucide-react';

export default function PublicClubsList() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await clubService.getPublicClubs();
        setClubs(data);
      } catch (error) {
        console.error("Failed to load clubs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Discover</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Explore FPT Clubs
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Find your passion and join vibrant communities across the campus.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    <Tag size={12} className="mr-1.5" />
                    {club.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500 font-medium">
                    <Users size={16} className="mr-1.5 text-gray-400" />
                    {club.memberCount} members
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {club.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {club.description}
                </p>
              </div>
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
                 <span className="text-sm font-medium text-gray-500 flex items-center">
                    <Activity size={16} className="mr-2 text-green-500" /> Active
                 </span>
                 <button className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 group-hover:underline">
                    View Details
                    <ArrowRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
