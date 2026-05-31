import React, { useEffect, useState } from 'react';
import { Users, Tag, Activity, ArrowRight } from 'lucide-react';
import { clubService } from '../services/clubService';
import '../css/style.css';

export default function PublicClubsList() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const fetchClubs = async () => { try { const data = await clubService.getPublicClubs(); setClubs(data); } catch(err){console.error(err);} finally{setLoading(false);} }; fetchClubs(); }, []);
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => (
          <div key={club.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
            <div className="p-6">
              <span className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"><Tag size={12} className="mr-1" />{club.category}</span>
              <h3 className="text-lg font-bold mt-2 mb-2 text-gray-900">{club.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{club.description}</p>
              <div className="text-gray-500 text-sm flex items-center"><Users size={16} className="mr-1" />{club.memberCount} members</div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-between">
              <span className="text-green-600 flex items-center"><Activity size={16} className="mr-1" />Active</span>
              <button className="text-indigo-600 inline-flex items-center text-sm font-semibold">View Details <ArrowRight size={16} className="ml-1" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
