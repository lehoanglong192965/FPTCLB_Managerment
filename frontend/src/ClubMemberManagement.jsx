import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, MoreVertical, ShieldAlert } from 'lucide-react';
import { clubService } from '../services/clubService';
import '../css/style.css';

export default function ClubMemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const currentClubId = '1';

  useEffect(() => { fetchMembers(); }, []);
  const fetchMembers = async () => { setLoading(true); try { const data = await clubService.getClubMembers(currentClubId); setMembers(data); } catch (err) { console.error(err); } finally { setLoading(false); } };
  const handleRemoveMember = async (memberId) => { if(!window.confirm('Are you sure?')) return; try { await clubService.removeMember(currentClubId, memberId); setMembers(members.filter(m => m.id !== memberId)); } catch(err){console.error(err);alert('Failed');} };
  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.role.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Member Management</h1><p className="text-sm text-gray-500">Manage club members.</p></div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button onClick={()=>setShowAddModal(true)} className="btn-accent flex items-center"><UserPlus size={18} className="mr-2" />Add</button>
            <button onClick={()=>setShowTransferModal(true)} className="btn-green">Transfer</button>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <input type="text" placeholder="Search members..." className="search-input" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium"><ShieldAlert size={16} className="text-indigo-500" /><span>Leader privileges</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th>Name</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? <tr><td colSpan="5">Loading...</td></tr> : filteredMembers.map(m=>(
                  <tr key={m.id} className="hover:bg-gray-50 transition"><td>{m.name}</td><td>{m.role}</td><td>{m.status}</td><td>{m.joined}</td><td className="flex justify-end gap-2"><button onClick={()=>handleRemoveMember(m.id)} className="text-red-600"><Trash2 size={18}/></button><button className="text-gray-400"><MoreVertical size={18}/></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showAddModal && <Modal title="Add Member" onClose={()=>setShowAddModal(false)} />}
      {showTransferModal && <Modal title="Transfer Member" onClose={()=>setShowTransferModal(false)} />}
    </div>
  );
}

function Modal({ title, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <input type="text" placeholder="Input field" className="w-full mb-4 p-2 border rounded" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Confirm</button>
        </div>
      </div>
    </div>
  );
}
