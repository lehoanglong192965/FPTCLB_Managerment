import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import contributionApi from '../../services/api/contribution/contributionApi';
import { useToast } from '../../contexts/ToastContext';

const APPEAL_STATUS_CFG = {
  PENDING:  { label: 'Đang xét',     icon: <Clock size={16} className="text-yellow-500" />, bg: 'bg-yellow-50', border: 'border-yellow-200' },
  APPROVED: { label: 'Đã chấp nhận', icon: <CheckCircle2 size={16} className="text-green-500" />, bg: 'bg-green-50', border: 'border-green-200' },
  ACCEPTED: { label: 'Đã chấp nhận', icon: <CheckCircle2 size={16} className="text-green-500" />, bg: 'bg-green-50', border: 'border-green-200' },
  REJECTED: { label: 'Đã từ chối',   icon: <XCircle size={16} className="text-red-400" />, bg: 'bg-red-50', border: 'border-red-200' },
};

const CONTRIBUTION_LABELS = {
  CORE_TEAM: 'Ban tổ chức chính',
  SUPPORT_ORGANIZER: 'Hỗ trợ tổ chức',
  PARTICIPANT: 'Tham gia',
  ABSENT: 'Vắng mặt',
};

const EVALUATION_LABELS = {
  GOOD: 'Good',
  NOT_GOOD: 'Not good',
};

function contributionLabel(value) {
  return CONTRIBUTION_LABELS[value] ?? value ?? 'Chưa có';
}

function evaluationLabel(value) {
  return EVALUATION_LABELS[value] ?? value ?? 'Chưa nhận xét';
}

function AppealInfo({ appeal }) {
  const cfg = APPEAL_STATUS_CFG[appeal.status ?? 'PENDING'] ?? APPEAL_STATUS_CFG.PENDING;
  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 mt-5 flex items-start gap-3`}>
      {cfg.icon}
      <div>
        <p className="font-semibold text-gray-800">Khiếu nại: {cfg.label}</p>
        {appeal.reason && <p className="text-sm text-gray-500 mt-1">Lý do: {appeal.reason}</p>}
        {appeal.resolutionNote && <p className="text-sm text-gray-500 mt-1">Phản hồi: {appeal.resolutionNote}</p>}
        <p className="text-xs text-gray-400 mt-2">Bạn đã gửi khiếu nại cho sự kiện này nên không thể gửi thêm lần nữa.</p>
      </div>
    </div>
  );
}

export default function MemberAppealPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [contribution, setContribution] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchError, setBatchError] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppeal, setSubmittedAppeal] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let ignore = false;
    contributionApi.getMyEventContribution(eventId)
      .then((res) => {
        const item = res?.data ?? res;
        if (ignore) return;
        setContribution(item);
        setBatchId(item?.batchID);
        setBatchStatus(item?.batchStatus);
      })
      .catch(() => {
        if (!ignore) setBatchError('Bạn chưa có điểm đóng góp cho sự kiện này.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || submitting || !batchId) return;
    setSubmitting(true);
    try {
      const res = await contributionApi.submitAppeal(batchId, { reason: reason.trim() });
      const appeal = res?.data ?? res;
      toast.success('Đã nộp khiếu nại thành công!');
      setSubmittedAppeal(appeal);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || '';
      toast.error(message === 'APPEAL_ALREADY_SUBMITTED' ? 'Bạn đã gửi khiếu nại cho sự kiện này.' : 'Nộp khiếu nại thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Đang tải...</div>;
  }

  if (batchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <AlertCircle size={40} className="text-orange-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">{batchError}</p>
          <button onClick={() => navigate(-1)} className="mt-5 text-sm text-orange-500 hover:underline">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const appealWindowOpen = batchStatus === 'APPEAL_WINDOW' || batchStatus === 'APPEAL_OPEN';
  const existingAppeal = contribution?.appealStatus ? {
    status: contribution.appealStatus,
    reason: contribution.appealReason,
    resolutionNote: contribution.appealResolutionNote,
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={15} /> Quay lại
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <MessageSquare size={24} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Khiếu nại đóng góp</h1>
            <p className="text-sm text-gray-500 mt-0.5">{contribution?.eventName || `Sự kiện #${eventId}`}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-3 py-1">
            <span className="text-gray-500">Vai trò đóng góp</span>
            <strong className="text-gray-800 text-right">{contributionLabel(contribution?.contributionType)}</strong>
          </div>
          <div className="flex justify-between gap-3 py-1">
            <span className="text-gray-500">Nhận xét leader</span>
            <strong className={contribution?.leaderEvaluation === 'NOT_GOOD' ? 'text-red-600' : 'text-green-700'}>{evaluationLabel(contribution?.leaderEvaluation)}</strong>
          </div>
          <div className="flex justify-between gap-3 py-1">
            <span className="text-gray-500">Điểm hiện tại</span>
            <strong className="text-gray-900">{Number(contribution?.finalPoints ?? 0)}</strong>
          </div>
          {contribution?.rationale && <p className="text-xs text-gray-500 mt-2">Ghi chú: {contribution.rationale}</p>}
        </div>

        {submittedAppeal ? (
          <AppealInfo appeal={{ status: submittedAppeal.status, reason, resolutionNote: submittedAppeal.resolutionNote }} />
        ) : existingAppeal ? (
          <AppealInfo appeal={existingAppeal} />
        ) : !appealWindowOpen ? (
          <div className="mt-6 flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-gray-400" />
            {batchStatus === 'FINALIZED' || batchStatus === 'CLOSED'
              ? 'Cửa sổ khiếu nại đã đóng.'
              : 'Leader chưa mở cửa sổ khiếu nại cho sự kiện này.'}
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 my-5 text-sm text-blue-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              Nộp khiếu nại nếu bạn cho rằng vai trò, nhận xét hoặc điểm đóng góp chưa chính xác.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lý do khiếu nại *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả cụ thể phần đóng góp của bạn và điểm cần leader xem lại..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{reason.length} ký tự</p>
              </div>

              <button
                type="submit"
                disabled={!reason.trim() || submitting}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Đang nộp...' : 'Nộp khiếu nại'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}