import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, X, Lock, Users } from 'lucide-react';
import contributionService from '../../services/api/contribution/contributionService';
import { useToast } from '../../contexts/ToastContext';

const TIERS = ['A', 'B', 'C', 'D'];
const TIER_CFG = {
  A: { label: 'A — Xuất sắc',  color: 'text-green-700',  bg: 'bg-green-100' },
  B: { label: 'B — Tốt',       color: 'text-blue-700',   bg: 'bg-blue-100'  },
  C: { label: 'C — Trung bình', color: 'text-yellow-700', bg: 'bg-yellow-100'},
  D: { label: 'D — Yếu',       color: 'text-red-600',    bg: 'bg-red-100'   },
};

function ConfirmFinalizeModal({ onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-900">Xác nhận chốt điểm cuối</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Hành động này sẽ chốt điểm đóng góp cho tất cả thành viên và kết thúc cửa sổ khiếu nại.
        </p>
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-5">
          Hành động không thể hoàn tác sau khi xác nhận.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function ResolveAppealModal({ appeal, onConfirm, onClose }) {
  const [form, setForm] = useState({ isAccepted: true, newTier: 'B', reason: '' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Xử lý khiếu nại</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Khiếu nại của <strong>{appeal.memberName ?? `User #${appeal.userID}`}</strong>
        </p>
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          Lý do: {appeal.reason}
        </p>
        <div className="flex gap-3 mb-4">
          <button onClick={() => setForm((f) => ({ ...f, isAccepted: true }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${form.isAccepted ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
            Chấp nhận
          </button>
          <button onClick={() => setForm((f) => ({ ...f, isAccepted: false }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${!form.isAccepted ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}>
            Từ chối
          </button>
        </div>
        {form.isAccepted && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tier mới</label>
            <select value={form.newTier} onChange={(e) => setForm((f) => ({ ...f, newTier: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {TIERS.map((t) => <option key={t} value={t}>{TIER_CFG[t]?.label ?? t}</option>)}
            </select>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú *</label>
          <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            rows={3} placeholder="Nhập ghi chú xử lý..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg">
            Huỷ
          </button>
          <button
            disabled={!form.reason.trim()}
            onClick={() => form.reason.trim() && onConfirm(appeal.appealID, {
              status: form.isAccepted ? 'ACCEPTED' : 'REJECTED',
              resolutionNote: form.reason.trim(),
              contributionType: form.isAccepted ? form.newTier : undefined,
            })}
            className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium">
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IcpdpContributionPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [batch, setBatch] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);

  const fetchBatch = useCallback(async () => {
    try {
      const res = await contributionService.getBatch(eventId);
      const b = res?.data ?? res;
      setBatch(b ?? null);
      return b;
    } catch {
      setBatch(null);
      return null;
    }
  }, [eventId]);

  const fetchAppeals = useCallback(async (batchId) => {
    if (!batchId) return;
    try {
      const res = await contributionService.getAppeals(batchId);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setAppeals(list.filter((a) => a.status === 'PENDING'));
    } catch {
      setAppeals([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBatch()
      .then((b) => { if (b?.batchID) fetchAppeals(b.batchID); })
      .finally(() => setLoading(false));
  }, [fetchBatch, fetchAppeals]);

  const handleFinalize = async () => {
    setShowFinalizeModal(false);
    setFinalizing(true);
    try {
      const res = await contributionService.finalize(eventId);
      const b = res?.data ?? res;
      setBatch(b ?? batch);
      toast.success('Đã chốt điểm cuối. Bảng đóng góp đã được chốt.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chốt điểm thất bại.');
    } finally {
      setFinalizing(false);
    }
  };

  const handleResolve = async (appealId, payload) => {
    try {
      await contributionService.resolveAppeal(appealId, payload);
      toast.success('Đã xử lý khiếu nại.');
      setResolveTarget(null);
      const b = await fetchBatch();
      if (b?.batchID) fetchAppeals(b.batchID);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xử lý thất bại.');
    }
  };

  const batchStatus = batch?.status;
  const canFinalize = batchStatus === 'APPEAL_WINDOW' || batchStatus === 'APPEAL_OPEN';
  const isFinalized = batchStatus === 'FINALIZED';

  const formatDeadline = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-purple-600" /> Bảng Đóng Góp
          </h1>
          <p className="text-sm text-gray-500 mt-1">Xem và chốt điểm đóng góp thành viên ban tổ chức</p>
        </div>
        {canFinalize && (
          <button
            onClick={() => setShowFinalizeModal(true)}
            disabled={finalizing}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Lock size={15} /> Chốt điểm cuối
          </button>
        )}
      </div>

      {/* Batch status banner */}
      {!batch ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm text-gray-500">
          Chưa có bảng đóng góp cho sự kiện này.
        </div>
      ) : isFinalized ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-700 font-medium">
          <CheckCircle2 size={15} /> Đã chốt điểm cuối — bảng đóng góp đã hoàn tất
        </div>
      ) : canFinalize ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 mb-5">
          <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
            <Clock size={15} /> Đang trong cửa sổ khiếu nại
          </p>
          {batch.appealClosesAt && (
            <p className="text-xs text-blue-500 mt-1">
              Thời hạn khiếu nại: <strong>{formatDeadline(batch.appealClosesAt)}</strong>
            </p>
          )}
          <p className="text-xs text-blue-400 mt-1">
            Sau khi hết hạn khiếu nại, nhấn "Chốt điểm cuối" để kết thúc.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-700">
          <Clock size={15} /> Trưởng nhóm chưa chốt điểm — trạng thái: {batchStatus ?? 'DRAFT'}
        </div>
      )}

      {/* Appeals panel */}
      {appeals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2 mb-3">
            <AlertTriangle size={15} /> Khiếu nại đang chờ ({appeals.length})
          </h3>
          <div className="space-y-2">
            {appeals.map((a) => (
              <div key={a.appealID} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-yellow-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {a.memberName ?? `User #${a.userID}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.reason}</p>
                </div>
                <button
                  onClick={() => setResolveTarget(a)}
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Xử lý
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch summary */}
      {batch && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin batch</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Batch ID</p>
              <p className="font-medium text-gray-800">#{batch.batchID}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Trạng thái</p>
              <p className="font-medium text-gray-800">{batch.status ?? '—'}</p>
            </div>
            {batch.appealOpenedAt && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Mở khiếu nại lúc</p>
                <p className="font-medium text-gray-800">{formatDeadline(batch.appealOpenedAt)}</p>
              </div>
            )}
            {batch.appealClosesAt && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Đóng khiếu nại lúc</p>
                <p className="font-medium text-gray-800">{formatDeadline(batch.appealClosesAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showFinalizeModal && (
        <ConfirmFinalizeModal
          onConfirm={handleFinalize}
          onClose={() => setShowFinalizeModal(false)}
        />
      )}

      {resolveTarget && (
        <ResolveAppealModal
          appeal={resolveTarget}
          onConfirm={handleResolve}
          onClose={() => setResolveTarget(null)}
        />
      )}
    </div>
  );
}
