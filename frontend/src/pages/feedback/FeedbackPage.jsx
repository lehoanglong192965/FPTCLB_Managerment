import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle2 } from 'lucide-react';

// Mock — thay bằng feedbackService.getEligibility(eventId) trong Sprint 7
const MOCK_EVENT = {
  eventId: 1,
  eventName: 'Hackathon FPT 2026 – Build The Future',
  clubName: 'FPT Coder',
  endDate: '15/08/2026',
};

const QUESTIONS = [
  { id: 'organization', label: 'Công tác tổ chức sự kiện' },
  { id: 'content',      label: 'Nội dung chương trình' },
  { id: 'venue',        label: 'Địa điểm và cơ sở vật chất' },
  { id: 'overall',      label: 'Đánh giá tổng thể' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
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
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const setRating = (id, val) => setRatings((p) => ({ ...p, [id]: val }));
  const canSubmit = QUESTIONS.every((q) => ratings[q.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO Sprint 7: gọi feedbackService.submit(eventId, { ratings, comment })
    setSubmitted(true);
  };

  if (submitted) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-lg p-8">
        <h1 className="text-xl font-bold text-gray-900">Đánh giá sự kiện</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {MOCK_EVENT.eventName} &mdash; {MOCK_EVENT.clubName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium text-gray-700 mb-2">{q.label}</p>
              <StarRating value={ratings[q.id] ?? 0} onChange={(v) => setRating(q.id, v)} />
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
              placeholder="Chia sẻ cảm nhận của bạn..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Gửi đánh giá
          </button>
        </form>
      </div>
    </div>
  );
}
