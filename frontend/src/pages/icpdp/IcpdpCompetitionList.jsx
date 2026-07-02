import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, ChevronRight, Calendar } from 'lucide-react';
import { MOCK_COMPETITIONS } from '../../constants/mockData';

// TODO Sprint 8: thay MOCK_COMPETITIONS bằng competitionService.getAll()

const STATUS_BADGE = {
  Draft:     'bg-gray-100 text-gray-600',
  Approved:  'bg-blue-100 text-blue-700',
  Published: 'bg-green-100 text-green-700',
  Closed:    'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  Draft:     'Nháp',
  Approved:  'Đã duyệt',
  Published: 'Đã công bố',
  Closed:    'Đã kết thúc',
};

export default function IcpdpCompetitionList() {
  const navigate = useNavigate();
  const [competitions] = useState(MOCK_COMPETITIONS);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={24} className="text-yellow-500" />
            Cuộc Thi CLB
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và tính điểm các cuộc thi CLB theo học kỳ</p>
        </div>
        <button
          onClick={() => alert('[Sprint 8] Tạo cuộc thi mới')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} /> Tạo cuộc thi
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {competitions.map((c) => (
          <div
            key={c.competitionId}
            onClick={() => navigate(`/icpdp/competition/${c.competitionId}`)}
            className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:shadow-sm hover:border-blue-200 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <Trophy size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {c.semester}
                  </span>
                  <span>{c.clubCount} CLB tham gia</span>
                  <span>Tạo: {c.createdAt}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {competitions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Trophy size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có cuộc thi nào</p>
        </div>
      )}
    </div>
  );
}
