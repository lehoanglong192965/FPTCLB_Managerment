import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Lock, AlertTriangle, X, Users, CheckCircle2, Clock } from 'lucide-react';
import contributionService from '../../services/api/contribution/contributionService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

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
          <h3 className="font-bold text-gray-900">Khoá đánh giá đóng góp</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Xác nhận khoá đánh giá cho <strong>{count}</strong> thành viên?
        </p>
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-5">
          Sau khi khoá, các thành viên có <strong>24 giờ</strong> để nộp kháng cáo. Hành động không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Huỷ</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">
            Khoá ngay
          </button>
        </div>
      </div>
    </div>
  );
}

const normalizeContribution = (contribution) => ({
  ...contribution,
  userId: contribution.userId ?? contribution.userID,
  fullName: contribution.fullName || contribution.userName,
  tier: contribution.tier || 'B',
  rationale: contribution.rationale || '',
});

const getApiErrorCode = (error) => error?.response?.data?.code || error?.response?.data?.message;

const isCanceledRequest = (error) =>
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';

const formatDateTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

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
        tier: form.isAccepted ? form.newTier : undefined,
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
  const { user } = useAuth();
  const fetchSeqRef = useRef(0);

  const [contributions, setContributions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [appealClosesAt, setAppealClosesAt] = useState(null);
  const [missingBatch, setMissingBatch] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [now, setNow] = useState(Date.now());

  const appealWindowOpen = batchStatus === 'APPEAL_WINDOW' || batchStatus === 'APPEAL_OPEN';
  const batchFinalized = batchStatus === 'CLOSED' || batchStatus === 'FINALIZED';
  const isLocked = appealWindowOpen || batchFinalized;
  const appealCloseTime = appealClosesAt ? new Date(appealClosesAt).getTime() : null;
  const appealWindowClosed = appealWindowOpen && appealCloseTime != null && now >= appealCloseTime;
  const canFinalizeBatch = appealWindowClosed && appeals.length === 0 && contributions.length > 0;
  const appealCloseLabel = formatDateTime(appealClosesAt);
  const canEdit = !isLocked && !missingBatch && !loadError;

  const fetchData = useCallback(async () => {
    const fetchSeq = fetchSeqRef.current + 1;
    fetchSeqRef.current = fetchSeq;
    const isCurrentFetch = () => fetchSeqRef.current === fetchSeq;

    setLoading(true);
    setMissingBatch(false);
    setLoadError(null);
    try {
      const [contribRes, batchRes] = await Promise.allSettled([
        contributionService.getDraft(eventId),
        contributionService.getBatch(eventId),
      ]);
      if (!isCurrentFetch()) {
        return;
      }
      let warnedMissingBatch = false;
      const notifyLoadFailure = (error, fallbackMessage) => {
        if (isCanceledRequest(error)) {
          return;
        }
        if (getApiErrorCode(error) === 'CONTRIBUTION_BATCH_NOT_FOUND') {
          setMissingBatch(true);
          setLoadError('Chưa có bảng đóng góp. ICPDP cần phê duyệt báo cáo trước.');
          if (!warnedMissingBatch) {
            toast.warning('Chưa có bảng đóng góp. ICPDP cần duyệt báo cáo trước.');
            warnedMissingBatch = true;
          }
          return;
        }
        setLoadError(fallbackMessage);
        toast.error(error?.response?.data?.message || fallbackMessage);
      };
      if (contribRes.status === 'fulfilled') {
        const data = Array.isArray(contribRes.value) ? contribRes.value : (contribRes.value?.data ?? []);
        setContributions(data.map(normalizeContribution));
      } else if (!isCanceledRequest(contribRes.reason)) {
        setContributions([]);
        notifyLoadFailure(contribRes.reason, 'Không thể tải danh sách đóng góp.');
      }
      if (batchRes.status === 'fulfilled') {
        const batch = batchRes.value?.data ?? batchRes.value;
        if (batch?.batchID) {
          setBatchId(batch.batchID);
          setBatchStatus(batch.status);
          setAppealClosesAt(batch.appealClosesAt ?? null);
        }
      } else if (!isCanceledRequest(batchRes.reason)) {
        setBatchId(null);
        setBatchStatus(null);
        setAppealClosesAt(null);
        notifyLoadFailure(batchRes.reason, 'Không thể tải trạng thái bảng đóng góp.');
      }
    } catch (err) {
      if (isCanceledRequest(err) || !isCurrentFetch()) {
        return;
      }
      toast.error('Không thể tải dữ liệu đóng góp.');
    } finally {
      if (isCurrentFetch()) {
        setLoading(false);
      }
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

  useEffect(() => {
    if (!appealWindowOpen || !appealClosesAt) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [appealWindowOpen, appealClosesAt]);

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
      setAppealClosesAt(batch?.appealClosesAt ?? null);
      toast.success('Đã khoá đánh giá. Thành viên có 24h để kháng cáo.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Khoá thất bại.');
    } finally {
      setFinalizing(false);
    }
  };

  const handleCompleteFinalize = async () => {
    if (!canFinalizeBatch || finalizing) return;
    setFinalizing(true);
    try {
      const res = await contributionService.finalize(eventId);
      const batch = res?.data ?? res;
      if (batch?.status) setBatchStatus(batch.status);
      if (batch?.finalizedAt) setAppealClosesAt(null);
      toast.success('Đã hoàn tất đóng góp và ghi nhận điểm thành viên.');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Hoàn tất đóng góp thất bại.');
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
        {canEdit && (
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
              <Lock size={15} /> Khoá đánh giá
            </button>
          </div>
        )}
      </div>

      {appealWindowOpen && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-sm text-orange-700">
              <Lock size={15} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Đánh giá đã khoá - đang trong cửa sổ kháng cáo 24h</p>
                <p className="mt-0.5 text-xs text-orange-600">
                  Hạn kháng cáo: {appealCloseLabel ?? 'đang cập nhật'} · Khiếu nại chờ xử lý: {appeals.length}
                </p>
              </div>
            </div>
            {canFinalizeBatch ? (
              <button
                onClick={handleCompleteFinalize}
                disabled={finalizing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={15} /> {finalizing ? 'Đang hoàn tất...' : 'Hoàn tất đóng góp'}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-600">
                <Clock size={14} />
                {appeals.length > 0
                  ? 'Xử lý hết khiếu nại trước khi hoàn tất.'
                  : 'Chờ hết 24h để hoàn tất.'}
              </div>
            )}
          </div>
        </div>
      )}

      {batchFinalized && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-700 font-medium">
          <CheckCircle2 size={15} /> Đã hoàn tất đóng góp - điểm đã ghi nhận vào Member Performance.
        </div>
      )}

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
        {missingBatch ? (
          <div className="py-14 px-6 text-center">
            <AlertTriangle size={24} className="mx-auto mb-3 text-orange-500" />
            <p className="text-sm font-semibold text-gray-700">Chưa có bảng đóng góp cho sự kiện này.</p>
            <p className="text-sm text-gray-400 mt-1">ICPDP cần phê duyệt báo cáo trước, sau đó hệ thống mới tạo danh sách đóng góp.</p>
          </div>
        ) : loadError ? (
          <div className="py-14 px-6 text-center">
            <AlertTriangle size={24} className="mx-auto mb-3 text-red-500" />
            <p className="text-sm font-semibold text-gray-700">{loadError}</p>
          </div>
        ) : contributions.length === 0 ? (
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
                      {isLocked ? (
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
                      {isLocked ? (
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
