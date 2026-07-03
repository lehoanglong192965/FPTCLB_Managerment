import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, ChevronRight, Calendar, X, AlertCircle } from 'lucide-react';
import competitionService from '../../services/api/competition/competitionService';

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

function CreateModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !semesterId.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await competitionService.create({
        title: title.trim(),
        semesterId: semesterId.trim(),
        description: description.trim(),
      });
      onCreate(res?.data ?? res);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo cuộc thi thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900">Tạo cuộc thi mới</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer border-none bg-transparent">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên cuộc thi *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: CLB Xuất Sắc HK1 2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Học kỳ (Semester ID) *</label>
            <input
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              placeholder="VD: SU2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về cuộc thi..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 cursor-pointer">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !semesterId.trim() || submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer border-none"
            >
              {submitting ? 'Đang tạo...' : 'Tạo cuộc thi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IcpdpCompetitionList() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    competitionService.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        setCompetitions(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreated = (newComp) => {
    if (newComp?.competitionId) {
      setCompetitions((prev) => [newComp, ...prev]);
    } else {
      load();
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={24} className="text-yellow-500" />
            Cuộc Thi CLB
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và tính điểm các cuộc thi CLB theo học kỳ</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} /> Tạo cuộc thi
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>
      ) : (
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
                    {c.semester && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {c.semester}
                      </span>
                    )}
                    {c.clubCount != null && <span>{c.clubCount} CLB tham gia</span>}
                    {c.createdAt && <span>Tạo: {c.createdAt}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))}

          {competitions.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Trophy size={48} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có cuộc thi nào</p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}
