import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart2, CheckCircle2, XCircle, Edit2 } from 'lucide-react';
import eventService from '../../services/api/events/eventService';
import attendanceService from '../../services/api/attendance/attendanceService';

const SESSION_STATUS_CFG = {
  OPEN:   { label: 'Đang mở', color: 'text-green-700', bg: 'bg-green-100' },
  CLOSED: { label: 'Đã đóng', color: 'text-gray-600',  bg: 'bg-gray-100'  },
};

export default function AttendanceDashboardPage() {
  const { eventId } = useParams();
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
          eventService.getEventById(eventId),
          attendanceService.getSessions(eventId),
          attendanceService.getEventAttendanceSummary(eventId),
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
      const res = await attendanceService.getSessionSummary(sid);
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
    ? summary.attendanceRate ?? (summary.totalRegistered > 0 ? ((summary.totalPresent / summary.totalRegistered) * 100).toFixed(1) : 0)
    : null;

  return (
    <div className="p-6 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={22} className="text-blue-600" /> Thống kê điểm danh
          </h1>
          {event && <p className="text-sm text-gray-500 mt-1">{event.eventName}</p>}
        </div>
        <button
          onClick={() => navigate(`../events/${eventId}/checkin`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Vào điểm danh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Đang tải...</div>
      ) : (
        <>
          {/* Overall summary */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-gray-800">{summary.totalRegistered ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Đã đăng ký</p>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-100 p-5 text-center">
                <p className="text-3xl font-bold text-green-700">{summary.totalPresent ?? summary.totalCheckedIn ?? '—'}</p>
                <p className="text-xs text-green-600 mt-1 font-medium">Có mặt</p>
              </div>
              <div className="bg-red-50 rounded-xl border border-red-100 p-5 text-center">
                <p className="text-3xl font-bold text-red-600">{summary.totalAbsent ?? '—'}</p>
                <p className="text-xs text-red-500 mt-1 font-medium">Vắng mặt</p>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-center">
                <p className="text-3xl font-bold text-blue-700">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</p>
                <p className="text-xs text-blue-600 mt-1 font-medium">Tỉ lệ tham dự</p>
              </div>
            </div>
          )}

          {/* Sessions */}
          <div className="grid gap-5 lg:grid-cols-[260px_1fr] items-start">
            {/* Session list */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Các phiên ({sessions.length})</h2>
              </div>
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Chưa có phiên nào.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sessions.map((s) => {
                    const sid = s.sessionId ?? s.id;
                    const isSelected = (selectedSession?.sessionId ?? selectedSession?.id) === sid;
                    const cfg = SESSION_STATUS_CFG[s.status] ?? SESSION_STATUS_CFG.CLOSED;
                    return (
                      <button
                        key={sid}
                        onClick={() => loadSessionSummary(s)}
                        className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                            {s.sessionName}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {s.totalCheckedIn !== undefined && (
                          <p className="text-xs text-gray-500 mt-0.5">{s.totalCheckedIn} điểm danh</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Session detail */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {!selectedSession ? (
                <div className="py-16 text-center text-sm text-gray-400">
                  Chọn một phiên để xem chi tiết
                </div>
              ) : sessionLoading ? (
                <div className="py-16 text-center text-sm text-gray-400">Đang tải...</div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{selectedSession.sessionName}</h3>
                    <button
                      onClick={() => navigate(`attendance/${selectedSession.sessionId ?? selectedSession.id}/correct`)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Edit2 size={13} /> Chỉnh sửa
                    </button>
                  </div>

                  {!sessionSummary || !sessionSummary.records?.length ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                      <Users size={28} className="mx-auto mb-2 opacity-30" />
                      Chưa có dữ liệu điểm danh cho phiên này.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Họ tên</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">MSSV</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionSummary.records.map((r, idx) => (
                            <tr key={r.participantKey ?? r.recordId ?? idx} className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{r.fullName || r.name || '—'}</td>
                              <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.studentId || '—'}</td>
                              <td className="px-4 py-3">
                                {(r.status ?? r.attendanceStatus) === 'PRESENT' ? (
                                  <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                                    <CheckCircle2 size={13} /> Có mặt
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                    <XCircle size={13} /> Vắng
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">
                                {r.checkedInAt || r.markedAt ? new Date(r.checkedInAt ?? r.markedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                            </tr>
                          ))}
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
  );
}
