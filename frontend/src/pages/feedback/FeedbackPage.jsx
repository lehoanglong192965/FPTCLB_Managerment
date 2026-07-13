import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import feedbackApi from '../../services/api/feedback/feedbackApi';

// 4 questions matching FeedbackSubmitRequest fields
const QUESTIONS = [
  { id: 'organization', field: 'organizationRating', label: 'Công tác tổ chức sự kiện' },
  { id: 'content',      field: 'contentRating',      label: 'Nội dung chương trình' },
  { id: 'logistics',    field: 'logisticsRating',    label: 'Địa điểm và cơ sở vật chất' },
  { id: 'overall',      field: 'overallRating',      label: 'Đánh giá tổng thể' },
];

function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`p-0.5 transition-transform ${disabled ? 'cursor-default' : 'hover:scale-110'}`}
        >
          <Star
            size={28}
            className={star <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { eventId } = useParams();

  const [eligibility, setEligibility] = useState(null);
  const [registrationId, setRegistrationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    feedbackApi.checkEligibility(eventId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        setEligibility(data);
        if (data?.registrationId) setRegistrationId(data.registrationId);
      })
      .catch((err) => {
        if (cancelled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setEligibility({ eligible: false, reason: 'Không thể xác minh tư cách đánh giá.' });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  const setRating = (id, val) => setRatings((p) => ({ ...p, [id]: val }));
  const canSubmit = QUESTIONS.every((q) => ratings[q.id]) && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await feedbackApi.submit(eventId, {
        registrationId,
        organizationRating: ratings.organization,
        contentRating:      ratings.content,
        logisticsRating:    ratings.logistics,
        overallRating:      ratings.overall,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Đang tải...</p>
      </div>
    );
  }

  if (submitted || eligibility?.alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Cảm ơn bạn!</h2>
          <p className="text-gray-500 text-sm mt-2">Phản hồi của bạn đã được ghi nhận.</p>
          <Link to="/member/events" className="mt-6 block text-sm text-orange-500 hover:underline">
            Về trang sự kiện
          </Link>
        </div>
      </div>
    );
  }

  if (eligibility && !eligibility.eligible) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <XCircle size={52} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Không thể đánh giá</h2>
          <p className="text-gray-500 text-sm mt-2">
            {eligibility.reason || 'Bạn không đủ điều kiện đánh giá sự kiện này (yêu cầu có mặt tại sự kiện).'}
          </p>
          <Link to="/member/events" className="mt-6 block text-sm text-orange-500 hover:underline">
            Về trang sự kiện
          </Link>
        </div>
      </div>
    );
  }

  const event = eligibility?.event;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-lg p-8">
        <h1 className="text-xl font-bold text-gray-900">Đánh giá sự kiện</h1>
        {event ? (
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {event.eventName}{event.clubName && <> &mdash; {event.clubName}</>}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1 mb-6">Sự kiện #{eventId}</p>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-5 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium text-gray-700 mb-2">{q.label} *</p>
              <StarRating
                value={ratings[q.id] ?? 0}
                onChange={(v) => setRating(q.id, v)}
                disabled={submitting}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét thêm (tuỳ chọn)
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              placeholder="Chia sẻ cảm nhận của bạn..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      </div>
    </div>
  );
}
