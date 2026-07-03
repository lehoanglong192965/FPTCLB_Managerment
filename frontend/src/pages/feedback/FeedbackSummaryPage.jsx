import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare, BarChart2, AlertCircle } from 'lucide-react';
import feedbackService from '../../services/api/feedback/feedbackService';

const SCORE_LABELS = {
  organization: 'Tổ chức',
  content:      'Nội dung',
  venue:        'Địa điểm',
  overall:      'Tổng thể',
};

function ScoreBar({ label, value, max = 5 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-gray-800">
        {Number.isFinite(value) ? value.toFixed(1) : '–'}
      </span>
    </div>
  );
}

export default function FeedbackSummaryPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    feedbackService.getSummary(eventId)
      .then((res) => setSummary(res?.data ?? res))
      .catch(() => setError('Không thể tải thống kê đánh giá.'))
      .finally(() => setLoading(false));
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

  const scores = summary?.averageRatings ?? {};
  const totalCount = summary?.totalFeedbacks ?? summary?.count ?? 0;
  const overallAvg = summary?.overallAverage ?? scores?.overall ?? null;
  const insufficient = summary?.status === 'INSUFFICIENT_SAMPLE';
  const comments = summary?.comments ?? [];

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <BarChart2 size={22} className="text-orange-500" />
        Thống kê đánh giá
      </h1>
      <p className="text-sm text-gray-500 mb-6">Sự kiện #{eventId}</p>

      {/* Overall score */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 mb-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-orange-500">
            {overallAvg != null ? Number(overallAvg).toFixed(1) : '–'}
          </p>
          <p className="text-sm text-gray-500 mt-1">/ 5.0</p>
          <div className="flex gap-0.5 mt-2 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= Math.round(overallAvg ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
        </div>
        <div className="border-l border-orange-200 pl-6">
          <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
          <p className="text-sm text-gray-500">đánh giá</p>
          {insufficient && (
            <p className="text-xs text-amber-600 mt-1 font-medium">Chưa đủ mẫu (không tính điểm)</p>
          )}
        </div>
      </div>

      {/* Per-category bars */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Điểm theo tiêu chí</h2>
        {Object.entries(SCORE_LABELS).map(([key, label]) => (
          <ScoreBar key={key} label={label} value={scores[key] ?? 0} />
        ))}
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MessageSquare size={15} className="text-gray-400" /> Nhận xét ({comments.length})
          </h2>
          <div className="space-y-3">
            {comments.map((c, i) => (
              <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {totalCount === 0 && !loading && (
        <p className="text-center text-sm text-gray-400 py-6">Chưa có đánh giá nào.</p>
      )}
    </div>
  );
}
