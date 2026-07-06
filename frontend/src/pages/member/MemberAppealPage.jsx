import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import contributionService from '../../services/api/contribution/contributionService';
import { useToast } from '../../contexts/ToastContext';

const APPEAL_STATUS_CFG = {
  PENDING:  { label: 'Đang xét',     icon: <Clock size={16} className="text-yellow-500" />, bg: 'bg-yellow-50', border: 'border-yellow-200' },
  ACCEPTED: { label: 'Đã chấp nhận', icon: <CheckCircle2 size={16} className="text-green-500" />, bg: 'bg-green-50', border: 'border-green-200' },
  APPROVED: { label: 'Đã chấp nhận', icon: <CheckCircle2 size={16} className="text-green-500" />, bg: 'bg-green-50', border: 'border-green-200' },
  REJECTED: { label: 'Đã từ chối',   icon: <XCircle size={16} className="text-red-400" />, bg: 'bg-red-50', border: 'border-red-200' },
};

export default function MemberAppealPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchError, setBatchError] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppeal, setSubmittedAppeal] = useState(null); // AppealResponse from BE

  useEffect(() => {
    if (!eventId) return;
    contributionService.getBatch(eventId)
      .then((res) => {
        const batch = res?.data ?? res;
        setBatchId(batch?.batchID);
        setBatchStatus(batch?.status);
      })
      .catch(() => setBatchError('Không tìm thấy thông tin đánh giá đóng góp cho sự kiện này.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || submitting || !batchId) return;
    setSubmitting(true);
    try {
      const res = await contributionService.submitAppeal(batchId, { reason: reason.trim() });
      const appeal = res?.data ?? res;
      toast.success('Đã nộp kháng cáo thành công!');
      setSubmittedAppeal(appeal);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nộp kháng cáo thất bại.');
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

  if (submittedAppeal) {
    const cfg = APPEAL_STATUS_CFG[submittedAppeal.status ?? 'PENDING'] ?? APPEAL_STATUS_CFG.PENDING;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
            <ArrowLeft size={15} /> Quay lại
          </button>
          <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-5 flex items-start gap-3`}>
            {cfg.icon}
            <div>
              <p className="font-semibold text-gray-800">Kháng cáo: {cfg.label}</p>
              {submittedAppeal.resolutionNote && (
                <p className="text-sm text-gray-500 mt-1">Ghi chú: {submittedAppeal.resolutionNote}</p>
              )}
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">Kháng cáo của bạn đang chờ xét duyệt.</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900">Kháng cáo đóng góp</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cửa sổ kháng cáo: 24 giờ kể từ khi khoá</p>
          </div>
        </div>

        {!appealWindowOpen ? (
          <div className="mt-6 flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-gray-400" />
            {batchStatus === 'FINALIZED' || batchStatus === 'CLOSED'
              ? 'Cửa sổ kháng cáo đã đóng.'
              : 'Kháng cáo chưa được mở. Leader cần khoá đánh giá trước.'}
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 my-5 text-sm text-blue-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              Nộp kháng cáo nếu bạn cho rằng tier đóng góp của mình chưa chính xác. Leader sẽ xem xét trong 24h.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lý do kháng cáo *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả cụ thể đóng góp của bạn và lý do tier hiện tại chưa phản ánh đúng..."
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
                {submitting ? 'Đang nộp...' : 'Nộp kháng cáo'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
