import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import feedbackApi from '../../services/api/feedback/feedbackApi';

const QUESTIONS = [
  { id: 'organization', field: 'organizationRating', label: 'Công tác tổ chức sự kiện' },
  { id: 'content', field: 'contentRating', label: 'Nội dung chương trình' },
  { id: 'logistics', field: 'logisticsRating', label: 'Địa điểm và cơ sở vật chất' },
  { id: 'overall', field: 'overallRating', label: 'Đánh giá tổng thể' },
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

export default function GuestFeedbackPage() {
  const { token } = useParams();

  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    feedbackApi.validateGuestToken(token)
      .then((res) => { if (!cancelled) setTokenInfo(res?.data ?? res); })
      .catch((err) => {
        if (cancelled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setTokenInfo({ valid: false, reason: err?.response?.data?.message });
      })
      .finally(() => { if (!cancelled) setTokenLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const setRating = (id, val) => setRatings((prev) => ({ ...prev, [id]: val }));
  const canSubmit = QUESTIONS.every((question) => ratings[question.id]) && !submitting;
  const alreadySubmitted = submitted || tokenInfo?.reason === 'FEEDBACK_ALREADY_SUBMITTED';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await feedbackApi.submitGuest(token, {
        registrationId: tokenInfo?.guestRegistrationId ? undefined : tokenInfo?.registrationId,
        guestRegistrationId: tokenInfo?.guestRegistrationId,
        organizationRating: ratings.organization,
        contentRating: ratings.content,
        logisticsRating: ratings.logistics,
        overallRating: ratings.overall,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      const reason = err?.response?.data?.message || err?.response?.data?.code;
      if (reason === 'FEEDBACK_ALREADY_SUBMITTED') {
        setSubmitted(true);
        return;
      }
      setError(reason || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Đang xác thực...</p>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Bạn đã feedback cho sự kiện này</h2>
          <p className="text-gray-500 text-sm mt-2">Cảm ơn bạn, phản hồi của bạn đã được ghi nhận.</p>
        </div>
      </div>
    );
  }

  if (!tokenInfo?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <XCircle size={52} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Link không hợp lệ</h2>
          <p className="text-gray-500 text-sm mt-2">
            {tokenInfo?.reason || 'Link đánh giá đã hết hạn hoặc không tồn tại.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-lg p-8">
        <h1 className="text-xl font-bold text-gray-900">Đánh giá sự kiện (Khách)</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Sự kiện #{tokenInfo?.eventId}</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-5 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONS.map((question) => (
            <div key={question.id}>
              <p className="text-sm font-medium text-gray-700 mb-2">{question.label} *</p>
              <StarRating
                value={ratings[question.id] ?? 0}
                onChange={(value) => setRating(question.id, value)}
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
