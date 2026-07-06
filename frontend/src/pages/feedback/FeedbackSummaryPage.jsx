import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare, BarChart2, AlertCircle } from 'lucide-react';
import feedbackService from '../../services/api/feedback/feedbackService';

const SCORE_ROWS = [
  { key: 'avgContentRating', label: 'Content rating average' },
  { key: 'avgOrganizationRating', label: 'Organization rating average' },
  { key: 'avgLogisticsRating', label: 'Logistics rating average' },
  { key: 'avgOverallRating', label: 'Overall average' },
];

function formatScore(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '0.0';
}
function participantTypeLabel(type) {
  if (type === 'Guest') return 'Khách';
  if (type === 'Member') return 'Thành viên';
  return 'Người tham dự';
}

function ScoreBar({ label, value }) {
  const numeric = Number(value) || 0;
  const pct = Math.min(100, Math.max(0, Math.round((numeric / 5) * 100)));
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 text-sm text-gray-600 shrink-0">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-gray-800">{formatScore(value)}</span>
    </div>
  );
}

export default function FeedbackSummaryPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return undefined;

    let ignore = false;
    let requestCanceled = false;
    setLoading(true);
    setError(null);

    feedbackService.getReport(eventId)
      .then((res) => {
        if (!ignore) setReport(res?.data ?? res);
      })
      .catch((err) => {
        requestCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';
        if (ignore || requestCanceled) return;

        const body = err?.response?.data;
        const detail = body?.message || body?.code || err?.message || 'Không thể tải feedback report.';
        const status = err?.response?.status || 'Network';
        setError(`Không thể tải feedback report (${status}): ${detail}`);
      })
      .finally(() => {
        if (!ignore && !requestCanceled) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [eventId]);

  if (loading) {
    return <div className="p-6 text-center text-sm text-gray-400">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-red-500">
        <AlertCircle size={15} /> {error}
      </div>
    );
  }

  const total = report?.totalFeedback ?? 0;
  const items = report?.feedbackItems ?? [];
  const overall = report?.avgOverallRating ?? 0;

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
        <BarChart2 size={22} className="text-orange-500" /> Feedback / Event Report
      </h1>
      <p className="mb-6 text-sm text-gray-500">{report?.eventName || `Sự kiện #${eventId}`}</p>

      <div className="mb-6 grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-orange-100 bg-orange-50 p-6 text-center">
          <p className="text-5xl font-bold text-orange-500">{formatScore(overall)}</p>
          <p className="mt-1 text-sm text-gray-500">/ 5.0</p>
          <div className="mt-2 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((score) => (
              <Star
                key={score}
                size={16}
                className={score <= Math.round(Number(overall) || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Tổng feedback</p>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-6 space-y-3">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Average rating</h2>
          {SCORE_ROWS.map((row) => (
            <ScoreBar key={row.key} label={row.label} value={report?.[row.key] ?? 0} />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <MessageSquare size={15} className="text-gray-400" /> Danh sách comment góp ý
        </h2>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Chưa có feedback nào.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.feedbackId} className="rounded-lg bg-gray-50 px-4 py-3">
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-gray-900">
                    {item.respondentName || participantTypeLabel(item.respondentType)}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-orange-600">
                    {participantTypeLabel(item.respondentType)}
                  </span>
                  {item.respondentEmail && (
                    <span className="text-xs text-gray-500">{item.respondentEmail}</span>
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                  <span>Content {item.contentRating}/5</span>
                  <span>Organization {item.organizationRating}/5</span>
                  <span>Logistics {item.logisticsRating}/5</span>
                  <span>Overall {item.overallRating}/5</span>
                </div>
                <p className="m-0 text-sm leading-relaxed text-gray-700">
                  {item.comment?.trim() || 'Không có comment.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
