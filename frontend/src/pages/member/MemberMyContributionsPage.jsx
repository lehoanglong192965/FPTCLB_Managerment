import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import contributionApi from '../../services/api/contribution/contributionApi';

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

const APPEAL_STATUS_LABELS = {
  PENDING: { label: 'Đã gửi khiếu nại', className: 'bg-yellow-50 text-yellow-700' },
  APPROVED: { label: 'Khiếu nại đã chấp nhận', className: 'bg-green-50 text-green-700' },
  ACCEPTED: { label: 'Khiếu nại đã chấp nhận', className: 'bg-green-50 text-green-700' },
  REJECTED: { label: 'Khiếu nại bị từ chối', className: 'bg-red-50 text-red-600' },
};

function AppealStatusBadge({ status }) {
  if (!status) return null;
  const cfg = APPEAL_STATUS_LABELS[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span>;
}

function BatchStatusBadge({ status }) {
  if (!status || status === 'DRAFT' || status === 'SCORING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Clock size={11} /> Chưa mở khiếu nại
      </span>
    );
  }
  if (status === 'APPEAL_WINDOW' || status === 'APPEAL_OPEN') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
        <AlertCircle size={11} /> Đang mở khiếu nại
      </span>
    );
  }
  if (status === 'FINALIZED' || status === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
        <CheckCircle size={11} /> Đã chốt điểm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
      <Clock size={11} /> {status}
    </span>
  );
}

function contributionLabel(value) {
  return CONTRIBUTION_LABELS[value] ?? value ?? 'Chưa có';
}

function evaluationLabel(value) {
  return EVALUATION_LABELS[value] ?? value ?? 'Chưa nhận xét';
}

function isAppealOpen(item) {
  return item?.batchStatus === 'APPEAL_WINDOW' || item?.batchStatus === 'APPEAL_OPEN';
}

export default function MemberMyContributionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await contributionApi.getMine();
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        const sorted = [...data].sort((a, b) => new Date(b.eventStartDate || 0) - new Date(a.eventStartDate || 0));
        if (!ignore) setItems(sorted);
      } catch (err) {
        if (ignore || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setItems([]);
        setError(err?.response?.data?.message ?? 'Không thể tải danh sách đóng góp. Vui lòng thử lại.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={22} className="text-blue-600" /> Đóng Góp Của Tôi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem điểm đóng góp từ các sự kiện và gửi khiếu nại khi leader mở cửa sổ xét lại
        </p>
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-red-100 py-16 text-center">
          <AlertCircle size={36} className="mx-auto text-red-300 mb-3" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Bạn chưa có điểm đóng góp sự kiện nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {items.map((item) => {
            const appealOpen = isAppealOpen(item);
            const hasAppeal = Boolean(item.appealStatus);
            const canAppeal = appealOpen && !hasAppeal;
            return (
              <div key={item.contributionID ?? item.eventID} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.eventName || `Sự kiện #${item.eventID}`}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.eventStartDate && (
                      <span className="text-xs text-gray-400">
                        {new Date(item.eventStartDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    <BatchStatusBadge status={item.batchStatus} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                      {contributionLabel(item.contributionType)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.leaderEvaluation === 'NOT_GOOD' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {evaluationLabel(item.leaderEvaluation)}
                    </span>
                    {hasAppeal && <AppealStatusBadge status={item.appealStatus} />}
                    {item.appealClosesAt && appealOpen && !hasAppeal && (
                      <span className="text-xs text-blue-500">
                        Hạn: {new Date(item.appealClosesAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Base {Number(item.basePoints ?? 0)}</span>
                    <span>Vai trò +{Number(item.bonusPoints ?? 0)}</span>
                    <span>Penalty -{Number(item.penaltyPoints ?? 0)}</span>
                    <span className="font-bold text-gray-900">Tổng {Number(item.finalPoints ?? 0)}</span>
                  </div>
                  {item.rationale && <p className="text-xs text-gray-500 mt-1">Ghi chú: {item.rationale}</p>}
                  {item.appealResolutionNote && <p className="text-xs text-gray-500 mt-1">Phản hồi khiếu nại: {item.appealResolutionNote}</p>}
                </div>

                {canAppeal && (
                  <button
                    onClick={() => navigate(`/member/events/${item.eventID}/appeal`)}
                    className="shrink-0 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1"
                  >
                    Khiếu nại <ChevronRight size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}