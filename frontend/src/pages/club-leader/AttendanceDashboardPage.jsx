import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserCheck, UserX, TrendingUp, CheckCircle2, XCircle, Edit2 } from 'lucide-react';
import eventApi from '../../services/api/events/eventApi';
import attendanceApi from '../../services/api/attendance/attendanceApi';

const SESSION_STATUS_CFG = {
  OPEN:   { label: 'Đang mở', color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  CLOSED: { label: 'Đã đóng', color: '#475569', bg: '#F1F5F9', dot: '#94A3B8' },
};


export default function AttendanceDashboardPage({ eventId: eventIdProp, embedded = false, correctionBasePath } = {}) {
  const { eventId: eventIdParam } = useParams();
  const eventId = eventIdProp ?? eventIdParam;
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [evRes, sessRes, sumRes] = await Promise.allSettled([
          eventApi.getEventById(eventId),
          attendanceApi.getSessions(eventId),
          attendanceApi.getEventAttendanceSummary(eventId),
        ]);
        if (evRes.status === 'fulfilled') setEvent(evRes.value?.data ?? evRes.value);
        if (sessRes.status === 'fulfilled') {
          const list = Array.isArray(sessRes.value) ? sessRes.value : (sessRes.value?.data ?? []);
          setSessions(list);
        }
        if (sumRes.status === 'fulfilled') setSummary(sumRes.value?.data ?? sumRes.value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const loadSessionSummary = useCallback(async (session) => {
    const sid = session.sessionId ?? session.id;
    setSelectedSession(session);
    setSessionLoading(true);
    setSessionSummary(null);
    try {
      const res = await attendanceApi.getSessionSummary(sid);
      setSessionSummary(res?.data ?? res);
    } catch {
      setSessionSummary(null);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      loadSessionSummary(sessions[0]);
    }
  }, [sessions, selectedSession, loadSessionSummary]);

  const attendanceRate = summary
    ? summary.attendanceRate ?? (summary.totalRegistered > 0
        ? ((summary.totalPresent / summary.totalRegistered) * 100).toFixed(1)
        : 0)
    : null;

  return (
    <div className={embedded ? "" : "min-h-screen"} style={embedded ? undefined : { background: '#EEF3FA' }}>

      {/* ── Header ── */}
      {embedded ? (
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 m-0 mb-3">
          <Users size={16} className="text-blue-600" /> Thống kê điểm danh
        </p>
      ) : (
        <div style={{ background: '#0D1B3E' }} className="px-6 pt-5 pb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} /> Quay lại
          </button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className="text-xs font-bold uppercase mb-1.5"
                style={{ color: '#F37021', letterSpacing: '0.12em' }}
              >
                Thống kê điểm danh
              </p>
              <h1 className="text-xl font-bold text-white leading-snug">
                {event?.eventName ?? 'Đang tải...'}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className={embedded ? "" : "px-6 py-6 max-w-5xl mx-auto"}>
        {loading ? (
          <div className="py-20 text-center text-sm" style={{ color: '#94A3B8' }}>Đang tải...</div>
        ) : (
          <>
            {/* ── Stats row ── */}
            {summary && (() => {
              const pct = Math.min(100, Math.max(0, parseFloat(attendanceRate) || 0));
              const rateColor = pct >= 80 ? '#10B981' : pct >= 50 ? '#F37021' : '#EF4444';
              const rateTrack = pct >= 80 ? '#D1FAE5' : pct >= 50 ? '#FEE9D6' : '#FEE2E2';
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {/* Đã đăng ký */}
                  <div className="bg-white rounded-2xl px-5 py-5" style={{ boxShadow: '0 1px 3px rgba(13,27,62,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8', letterSpacing: '0.1em' }}>Đã đăng ký</p>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EEF3FA' }}>
                        <Users size={15} style={{ color: '#0D1B3E' }} />
                      </span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#0D1B3E', fontVariantNumeric: 'tabular-nums' }}>
                      {summary.totalRegistered ?? '—'}
                    </p>
                  </div>

                  {/* Có mặt */}
                  <div className="bg-white rounded-2xl px-5 py-5" style={{ boxShadow: '0 1px 3px rgba(13,27,62,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8', letterSpacing: '0.1em' }}>Có mặt</p>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                        <UserCheck size={15} style={{ color: '#10B981' }} />
                      </span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                      {summary.totalPresent ?? summary.totalCheckedIn ?? '—'}
                    </p>
                  </div>

                  {/* Vắng mặt */}
                  <div className="bg-white rounded-2xl px-5 py-5" style={{ boxShadow: '0 1px 3px rgba(13,27,62,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8', letterSpacing: '0.1em' }}>Vắng mặt</p>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                        <UserX size={15} style={{ color: '#EF4444' }} />
                      </span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                      {summary.totalAbsent ?? '—'}
                    </p>
                  </div>

                  {/* Tỉ lệ tham dự */}
                  <div className="bg-white rounded-2xl px-5 py-5" style={{ boxShadow: '0 1px 3px rgba(13,27,62,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8', letterSpacing: '0.1em' }}>Tỉ lệ tham dự</p>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: rateTrack }}>
                        <TrendingUp size={15} style={{ color: rateColor }} />
                      </span>
                    </div>
                    <p className="text-3xl font-bold mb-3" style={{ color: rateColor, fontVariantNumeric: 'tabular-nums' }}>
                      {attendanceRate !== null ? `${pct}%` : '—'}
                    </p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: rateTrack }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: rateColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Sessions + Detail ── */}
            <div className="grid gap-4 lg:grid-cols-[220px_1fr] items-start">

              {/* Session list */}
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(13,27,62,0.07)' }}
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B', letterSpacing: '0.1em' }}>
                    Các phiên ({sessions.length})
                  </p>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: '#94A3B8' }}>Chưa có phiên nào.</p>
                ) : (
                  <div>
                    {sessions.map((s) => {
                      const sid = s.sessionId ?? s.id;
                      const isSelected = (selectedSession?.sessionId ?? selectedSession?.id) === sid;
                      const cfg = SESSION_STATUS_CFG[s.status] ?? SESSION_STATUS_CFG.CLOSED;
                      return (
                        <button
                          key={sid}
                          onClick={() => loadSessionSummary(s)}
                          className="w-full text-left px-4 py-3.5 transition-colors border-l-4"
                          style={{
                            borderLeftColor: isSelected ? '#F37021' : 'transparent',
                            background: isSelected ? '#FFF7F0' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-sm font-semibold truncate pr-1"
                              style={{ color: isSelected ? '#F37021' : '#1E293B' }}
                            >
                              {s.sessionName}
                            </span>
                            <span
                              className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                              style={{ color: cfg.color, background: cfg.bg }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{
                                  background: cfg.dot,
                                  animation: s.status === 'OPEN' ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                                }}
                              />
                              {cfg.label}
                            </span>
                          </div>
                          {s.totalCheckedIn !== undefined && (
                            <p className="text-xs" style={{ color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                              {s.totalCheckedIn} điểm danh
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Session detail */}
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(13,27,62,0.07)' }}
              >
                {!selectedSession ? (
                  <div className="py-20 text-center text-sm" style={{ color: '#94A3B8' }}>
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    Chọn một phiên để xem chi tiết
                  </div>
                ) : sessionLoading ? (
                  <div className="py-20 text-center text-sm" style={{ color: '#94A3B8' }}>Đang tải...</div>
                ) : (
                  <>
                    {/* Detail header */}
                    <div
                      className="px-5 py-4 flex items-center justify-between border-b border-slate-100"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#94A3B8', letterSpacing: '0.1em' }}>
                          Phiên điểm danh
                        </p>
                        <h3 className="font-bold text-base" style={{ color: '#0D1B3E' }}>
                          {selectedSession.sessionName}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const sid = selectedSession.sessionId ?? selectedSession.id;
                          correctionBasePath
                            ? navigate(`${correctionBasePath}/${sid}/correct`)
                            : navigate(`${sid}/correct`, { relative: "path" });
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        style={{ color: '#F37021', background: '#FFF7F0' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE9D6'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF7F0'; }}
                      >
                        <Edit2 size={12} /> Chỉnh sửa
                      </button>
                    </div>

                    {/* Table or empty */}
                    {!sessionSummary?.records?.length ? (
                      <div className="py-16 text-center" style={{ color: '#94A3B8' }}>
                        <Users size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Chưa có dữ liệu điểm danh cho phiên này.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8', letterSpacing: '0.08em' }}>#</th>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8', letterSpacing: '0.08em' }}>Họ tên</th>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8', letterSpacing: '0.08em' }}>MSSV</th>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8', letterSpacing: '0.08em' }}>Trạng thái</th>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8', letterSpacing: '0.08em' }}>Thời gian</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionSummary.records.map((r, idx) => {
                              const isPresent = (r.status ?? r.attendanceStatus) === 'PRESENT';
                              const time = r.checkedInAt || r.markedAt
                                ? new Date(r.checkedInAt ?? r.markedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                : '—';
                              return (
                                <tr
                                  key={r.participantKey ?? r.recordId ?? idx}
                                  style={{ borderBottom: '1px solid #F1F5F9' }}
                                >
                                  <td className="px-5 py-3.5 text-xs" style={{ color: '#CBD5E1', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                                  <td className="px-5 py-3.5 font-semibold" style={{ color: '#1E293B' }}>{r.fullName || r.name || '—'}</td>
                                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>{r.studentId || '—'}</td>
                                  <td className="px-5 py-3.5">
                                    {isPresent ? (
                                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#10B981' }}>
                                        <CheckCircle2 size={13} /> Có mặt
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#EF4444' }}>
                                        <XCircle size={13} /> Vắng
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>{time}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
