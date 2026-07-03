import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, CheckCircle2, XCircle, Search, X } from 'lucide-react';
import attendanceService from '../../services/api/attendance/attendanceService';
import { useToast } from '../../contexts/ToastContext';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt', color: 'text-green-700', bg: 'bg-green-100' },
  { value: 'ABSENT',  label: 'Vắng mặt', color: 'text-red-600',   bg: 'bg-red-100'   },
];

function CorrectModal({ record, onConfirm, onClose }) {
  const [newStatus, setNewStatus] = useState(record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT');
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Chỉnh sửa điểm danh</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Thay đổi trạng thái của <strong>{record.fullName || record.name}</strong>
        </p>

        <div className="flex gap-3 mb-4">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setNewStatus(opt.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                newStatus === opt.value
                  ? `border-current ${opt.bg} ${opt.color}`
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold text-gray-600 mb-1">Lý do chỉnh sửa *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ghi rõ lý do (bắt buộc)..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Huỷ
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(newStatus, reason.trim())}
            disabled={!reason.trim() || newStatus === record.status}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceCorrectionPage() {
  const { eventId, sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getSessionSummary(sessionId);
      const data = res?.data ?? res;
      setRecords(data?.records ?? []);
    } catch (err) {
      toast.error('Không thể tải dữ liệu điểm danh.');
    } finally {
      setLoading(false);
    }
  }, [eventId, sessionId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleCorrect = async (newStatus, reason) => {
    const { recordId } = editTarget;
    setEditTarget(null);
    setSaving(recordId);
    try {
      await attendanceService.correctAttendance(recordId, { status: newStatus, reason });
      toast.success('Đã cập nhật điểm danh.');
      fetchRecords();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(null);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.fullName || r.name || '').toLowerCase().includes(q) ||
      (r.studentId || '').toLowerCase().includes(q)
    );
  });

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount  = records.filter((r) => r.status !== 'PRESENT').length;

  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Edit2 size={20} className="text-blue-600" /> Chỉnh sửa điểm danh
          </h1>
          <p className="text-sm text-gray-500 mt-1">Mọi thay đổi đều được ghi nhật ký kiểm toán</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-green-700 font-semibold">
            <CheckCircle2 size={15} /> {presentCount} có mặt
          </span>
          <span className="flex items-center gap-1.5 text-red-500 font-semibold">
            <XCircle size={15} /> {absentCount} vắng
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc MSSV..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Không có dữ liệu.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Họ tên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">MSSV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thời gian</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Sửa</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const isSaving = saving === r.recordId;
                return (
                  <tr key={r.recordId ?? idx} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.fullName || r.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.studentId || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'PRESENT' ? (
                        <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                          <CheckCircle2 size={13} /> Có mặt
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle size={13} /> Vắng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditTarget(r)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        {isSaving ? <span className="text-xs text-gray-400">...</span> : <Edit2 size={15} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editTarget && (
        <CorrectModal
          record={editTarget}
          onConfirm={handleCorrect}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
