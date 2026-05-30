import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User, Mail, Calendar, Shield, Award } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Attempt to decode token if it exists to demonstrate JWT usage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            setTokenData(decoded);
          } catch (e) {
            console.error("Invalid token format");
          }
        }
        
        // Fetch full profile from API
        const data = await authService.getUserProfile();
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-500">
        Could not load profile. Please sign in again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="px-8 pb-8 flex flex-col sm:flex-row sm:items-end relative -mt-16 sm:-mt-12">
            <div className="h-32 w-32 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center shadow-md">
              <User size={64} className="text-indigo-500" />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500 font-medium flex items-center mt-1">
                <Mail size={16} className="mr-2" />
                {profile.email}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="px-6 py-2 bg-white border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Details Card */}
          <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <User size={20} className="mr-2 text-indigo-500" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <div className="mt-1 text-gray-900 font-medium">{profile.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="mt-1 text-gray-900 font-medium">{profile.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Member Since</label>
                <div className="mt-1 text-gray-900 font-medium flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  {new Date(profile.joinedDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Primary Role</label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    <Shield size={12} className="mr-1.5" />
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Side Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award size={20} className="mr-2 text-indigo-500" />
              Achievements
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">#1</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Top Contributor</p>
                  <p className="text-sm text-gray-500">Awarded in Fall 2025</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Club Leadership</p>
                  <p className="text-sm text-gray-500">Active role management</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
