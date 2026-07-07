import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Lock, AlertTriangle, X, Users, Clock } from 'lucide-react';
import contributionService from '../../services/api/contribution/contributionService';
import { useToast } from '../../contexts/ToastContext';

const TIERS = ['A', 'B', 'C', 'D'];
const TIER_CFG = {
  A: { label: 'A — Xuất sắc',  color: 'text-green-700',  bg: 'bg-green-100' },
  B: { label: 'B — Tốt',       color: 'text-blue-700',   bg: 'bg-blue-100'  },
  C: { label: 'C — Trung bình', color: 'text-yellow-700', bg: 'bg-yellow-100'},
  D: { label: 'D — Yếu',       color: 'text-red-600',    bg: 'bg-red-100'   },
};

function FinalizeModal({ count, onConfirm, onClose }) {
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
          <h3 className="font-bold text-gray-900">Chốt điểm đóng góp</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Xác nhận chốt điểm cho <strong>{count}</strong> thành viên?
        </p>
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-5">
          Sau khi chốt, các thành viên có <strong>24 giờ</strong> để nộp khiếu nại. Hành động không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Huỷ</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">
            Chốt điểm
          </button>
        </div>
      </div>
    </div>
  );
}

// contributions prop used to look up name by userID
function AppealsPanel({ appeals, contributions, onProcess }) {
  const [processing, setProcessing] = useState(null);
  const [form, setForm] = useState({ isAccepted: true, newTier: 'B', reason: '' });
  const [activeAppeal, setActiveAppeal] = useState(null);
  const toast = useToast();

  const nameOf = (userID) => {
    const c = contributions.find((x) => x.userId === userID || x.userID === userID);
    return c?.fullName || c?.userName || `User #${userID}`;
  };
  const tierOf = (userID) => {
    const c = contributions.find((x) => x.userId === userID || x.userID === userID);
    return c?.tier;
  };

  const handleProcess = async () => {
    if (!form.reason.trim() || !activeAppeal) return;
    setProcessing(activeAppeal.appealID);
    try {
      await contributionService.resolveAppeal(activeAppeal.appealID, {
        status: form.isAccepted ? 'ACCEPTED' : 'REJECTED',
        resolutionNote: form.reason.trim(),
        contributionType: form.isAccepted ? form.newTier : undefined,
      });
      toast.success('Đã xử lý kháng cáo.');
      setActiveAppeal(null);
      onProcess();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xử lý thất bại.');
    } finally {
      setProcessing(null);
    }
  };

  if (!appeals?.length) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2 mb-3">
        <AlertTriangle size={15} /> Kháng cáo đang chờ ({appeals.length})
      </h3>
      <div className="space-y-2">
        {appeals.map((a) => (
          <div key={a.appealID} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-yellow-100">
            <div>
              <p className="text-sm font-medium text-gray-800">{nameOf(a.userID)}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tier hiện tại: <strong>{tierOf(a.userID) ?? '—'}</strong> · Lý do: {a.reason}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveAppeal(a);
                setForm({ isAccepted: true, newTier: tierOf(a.userID) || 'B', reason: '' });
              }}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Xử lý
            </button>
          </div>
        ))}
      </div>

      {activeAppeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => e.target === e.currentTarget && setActiveAppeal(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Xử lý kháng cáo</h3>
              <button onClick={() => setActiveAppeal(null)}><X size={16} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Kháng cáo của <strong>{nameOf(activeAppeal.userID)}</strong>
            </p>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setForm((f) => ({ ...f, isAccepted: true }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${form.isAccepted ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}
              >Chấp nhận</button>
              <button
                onClick={() => setForm((f) => ({ ...f, isAccepted: false }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${!form.isAccepted ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}
              >Từ chối</button>
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
                rows={3} placeholder="Nhập ghi chú..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveAppeal(null)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg">Huỷ</button>
              <button
                onClick={handleProcess}
                disabled={!form.reason.trim() || !!processing}
                className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
              >
                {processing ? '...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContributionManagementPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [contributions, setContributions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [appealClosesAt, setAppealClosesAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const isFinalized = batchStatus === 'CLOSED'
    || batchStatus === 'APPEAL_WINDOW'
    || batchStatus === 'APPEAL_OPEN'
    || batchStatus === 'FINALIZED';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contribRes, batchRes] = await Promise.allSettled([
        contributionService.getDraft(eventId),
        contributionService.getBatch(eventId),
      ]);
      if (contribRes.status === 'fulfilled') {
        const raw = contribRes.value;
        const data = Array.isArray(raw) ? raw : (raw?.data ?? raw?.content ?? []);
        setContributions(data.map((c) => ({
          ...c,
          tier: c.tier || 'B',
          rationale: c.rationale || '',
        })));
      } else {
        const reason = contribRes.reason;
        const isCanceled = reason?.code === 'ERR_CANCELED' || reason?.name === 'CanceledError';
        const is404 = reason?.response?.status === 404;
        if (!isCanceled && !is404) {
          console.error('[Contribution] getDraft failed:', reason);
          toast.error('Không tải được danh sách đóng góp: ' + (reason?.response?.status ?? reason?.message ?? 'lỗi không xác định'));
        }
      }
      if (batchRes.status === 'fulfilled') {
        const batch = batchRes.value?.data ?? batchRes.value;
        if (batch?.batchID) {
          setBatchId(batch.batchID);
          setBatchStatus(batch.status);
          setAppealClosesAt(batch.appealClosesAt ?? null);
        }
      }
    } catch {
      toast.error('Không thể tải dữ liệu đóng góp.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchAppeals = useCallback(async (id) => {
    const targetId = id ?? batchId;
    if (!targetId) return;
    try {
      const res = await contributionService.getAppeals(targetId);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setAppeals(list.filter((a) => a.status === 'PENDING'));
    } catch {
      setAppeals([]);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (batchId) fetchAppeals(batchId);
  }, [batchId]);

  const handleFieldChange = (userId, field, value) => {
    setContributions((prev) => prev.map((c) => c.userId === userId ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = contributions.map((c) => ({
        userId: c.userId,
        tier: c.tier,
        rationale: c.rationale,
      }));
      await contributionService.update(eventId, payload);
      toast.success('Đã lưu đánh giá đóng góp.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setShowFinalizeModal(false);
    setFinalizing(true);
    try {
      const res = await contributionService.openAppealWindow(eventId);
      const batch = res?.data ?? res;
      if (batch?.batchID) setBatchId(batch.batchID);
      if (batch?.status) setBatchStatus(batch.status);
      if (batch?.appealClosesAt) setAppealClosesAt(batch.appealClosesAt);
      toast.success('Đã chốt điểm. Thành viên có 24h để khiếu nại.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Khoá thất bại.');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-blue-600" /> Chốt Bảng Đóng Góp
          </h1>
          <p className="text-sm text-gray-500 mt-1">Đánh giá tier đóng góp cho các thành viên ban tổ chức</p>
        </div>
        {!isFinalized && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu tạm'}
            </button>
            <button
              onClick={() => setShowFinalizeModal(true)}
              disabled={finalizing || contributions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Lock size={15} /> Chốt điểm
            </button>
          </div>
        )}
      </div>

      {batchStatus === 'APPEAL_WINDOW' || batchStatus === 'APPEAL_OPEN' ? (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
          <Clock size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700">Đang mở khiếu nại</p>
            {appealClosesAt && (
              <p className="text-xs text-blue-500 mt-0.5">
                Thành viên có thể khiếu nại đến{' '}
                <strong>
                  {new Date(appealClosesAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </strong>
              </p>
            )}
          </div>
        </div>
      ) : batchStatus === 'FINALIZED' ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-700 font-medium">
          <Lock size={15} /> Đã chốt điểm cuối — không thể chỉnh sửa
        </div>
      ) : isFinalized ? (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5 text-sm text-orange-700 font-medium">
          <Lock size={15} /> Đánh giá đã khoá
        </div>
      ) : null}

      {/* Appeals panel */}
      {appeals.length > 0 && (
        <AppealsPanel
          appeals={appeals}
          contributions={contributions}
          onProcess={() => { fetchData(); if (batchId) fetchAppeals(batchId); }}
        />
      )}

      {/* Contributions table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {contributions.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Chưa có thành viên nào trong danh sách đóng góp.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thành viên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vai trò</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tier</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c, idx) => {
                const tierCfg = TIER_CFG[c.tier] ?? {};
                return (
                  <tr key={c.userId ?? idx} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.fullName || c.userName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.role || c.assignedRole || '—'}</td>
                    <td className="px-4 py-3">
                      {isFinalized ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tierCfg.bg} ${tierCfg.color}`}>
                          {tierCfg.label ?? c.tier}
                        </span>
                      ) : (
                        <select
                          value={c.tier}
                          onChange={(e) => handleFieldChange(c.userId, 'tier', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          {TIERS.map((t) => <option key={t} value={t}>{TIER_CFG[t]?.label ?? t}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isFinalized ? (
                        <span className="text-gray-500 text-xs">{c.rationale || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={c.rationale}
                          onChange={(e) => handleFieldChange(c.userId, 'rationale', e.target.value)}
                          placeholder="Ghi chú (tuỳ chọn)"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showFinalizeModal && (
        <FinalizeModal
          count={contributions.length}
          onConfirm={handleFinalize}
          onClose={() => setShowFinalizeModal(false)}
        />
      )}
    </div>
  );
}
