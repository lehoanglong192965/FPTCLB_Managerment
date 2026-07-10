import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, MessageSquare, Send, Star } from "lucide-react";
import feedbackService from "../../services/api/feedback/feedbackService";

const QUESTIONS = [
  { key: "contentRating", label: "Nội dung event" },
  { key: "organizationRating", label: "Tổ chức" },
  { key: "logisticsRating", label: "Hậu cần" },
  { key: "overallRating", label: "Hài lòng chung" },
];

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RatingInput({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          onMouseEnter={() => setHover(score)}
          onMouseLeave={() => setHover(0)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-amber-50 disabled:cursor-not-allowed"
          title={`${score}/5`}
        >
          <Star
            size={22}
            className={score <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackForm({ event, onSubmitted }) {
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = useMemo(
    () => QUESTIONS.every((question) => ratings[question.key] >= 1 && ratings[question.key] <= 5) && !submitting,
    [ratings, submitting]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await feedbackService.submit(event.eventId, {
        contentRating: ratings.contentRating,
        organizationRating: ratings.organizationRating,
        logisticsRating: ratings.logisticsRating,
        overallRating: ratings.overallRating,
        comment: comment.trim() || null,
      });
      onSubmitted(event.eventId);
    } catch (err) {
      setError(err?.response?.data?.message || "Gửi feedback thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 border-t border-gray-100 pt-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {QUESTIONS.map((question) => (
          <div key={question.key}>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">{question.label}</p>
            <RatingInput
              value={ratings[question.key] || 0}
              disabled={submitting}
              onChange={(value) => setRatings((prev) => ({ ...prev, [question.key]: value }))}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
          <MessageSquare size={15} className="text-gray-400" /> Góp ý thêm
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          disabled={submitting}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e6430a] focus:ring-2 focus:ring-orange-100 resize-none"
          placeholder="Chia sẻ điều bạn muốn CLB cải thiện..."
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-lg bg-[#e6430a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c93607] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={16} /> {submitting ? "Đang gửi..." : "Gửi feedback"}
      </button>
    </form>
  );
}

export default function MemberPendingFeedback() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    feedbackService.getPending()
      .then((res) => {
        if (!cancelled) setItems(Array.isArray(res) ? res : (res?.data ?? []));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || "Không thể tải danh sách feedback.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmitted = (eventId) => {
    setItems((prev) => prev.filter((item) => item.eventId !== eventId));
    setActiveId(null);
    setSuccess(true);
    window.setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Feedback Cần Gửi</h1>
        <p className="page-subtitle">Các event bạn đã tham gia và chưa gửi phản hồi</p>
      </div>

      <div className="content-card">
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
            <CheckCircle2 size={16} /> Feedback đã được ghi nhận.
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Đang tải...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 size={42} className="mx-auto mb-3 text-green-500" />
            <p className="text-sm font-semibold text-gray-700">Không có feedback đang chờ.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((event) => (
              <div key={event.eventId} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="m-0 text-base font-bold text-gray-900">{event.eventName}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <CalendarDays size={14} /> {formatDate(event.endDate || event.startDate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveId((prev) => prev === event.eventId ? null : event.eventId)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e6430a] px-4 py-2 text-sm font-semibold text-[#e6430a] hover:bg-orange-50"
                  >
                    <Star size={16} /> Feedback
                  </button>
                </div>
                {activeId === event.eventId && <FeedbackForm event={event} onSubmitted={handleSubmitted} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}