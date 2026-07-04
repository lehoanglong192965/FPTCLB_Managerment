import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import eventService from '../../services/api/events/eventService';
import contributionService from '../../services/api/contribution/contributionService';

const TIER_CFG = {
  A: { label: 'A — Xuất sắc',  color: 'text-green-700',  bg: 'bg-green-100' },
  B: { label: 'B — Tốt',       color: 'text-blue-700',   bg: 'bg-blue-100'  },
  C: { label: 'C — Trung bình', color: 'text-yellow-700', bg: 'bg-yellow-100'},
  D: { label: 'D — Yếu',       color: 'text-red-600',    bg: 'bg-red-100'   },
};

function BatchStatusBadge({ status }) {
  if (!status || status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Clock size={11} /> Chưa chốt
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
  if (status === 'FINALIZED') {
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

export default function MemberMyContributionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const assignRes = await eventService.getMyAssignments();
        const events = Array.isArray(assignRes) ? assignRes : (assignRes?.data ?? []);

        const enriched = await Promise.allSettled(
          events.map(async (ev) => {
            try {
              const batchRes = await contributionService.getBatch(ev.eventID);
              const batch = batchRes?.data ?? batchRes;
              return { ...ev, batch: batch ?? null };
            } catch {
              return { ...ev, batch: null };
            }
          })
        );

        setItems(
          enriched.map((r) => (r.status === 'fulfilled' ? r.value : r.reason))
        );
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canAppeal = (batch) =>
    batch?.status === 'APPEAL_WINDOW' || batch?.status === 'APPEAL_OPEN';

  const myTier = (batch) => batch?.myTier ?? batch?.contributionType ?? null;

  if (loading) {
    return <div className="p-10 text-center text-sm text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={22} className="text-blue-600" /> Đóng Góp Của Tôi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem điểm đóng góp từ các sự kiện bạn đã tham gia ban tổ chức
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Bạn chưa tham gia ban tổ chức sự kiện nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {items.map((ev) => {
            const tier = myTier(ev.batch);
            const tierCfg = tier ? TIER_CFG[tier] : null;
            const appealOpen = canAppeal(ev.batch);

            return (
              <div key={ev.eventID} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{ev.eventName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {ev.startDate && (
                      <span className="text-xs text-gray-400">
                        {new Date(ev.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    <BatchStatusBadge status={ev.batch?.status} />
                    {tierCfg && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${tierCfg.bg} ${tierCfg.color}`}>
                        {tierCfg.label}
                      </span>
                    )}
                    {ev.batch?.appealClosesAt && appealOpen && (
                      <span className="text-xs text-blue-500">
                        Hạn:{' '}
                        {new Date(ev.batch.appealClosesAt).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {appealOpen && (
                  <button
                    onClick={() => navigate(`/member/events/${ev.eventID}/appeal`)}
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
