import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Square, Users, ScanLine } from 'lucide-react';
import eventApi from '../../services/api/events/eventApi';
import attendanceApi from '../../services/api/attendance/attendanceApi';
import EventCheckInScanner from '../../components/events/EventCheckInScanner';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const SESSION_STATUS_CFG = {
  DRAFT:  { label: 'Chưa mở',  dotColor: '#F59E0B', textColor: '#92400E', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
  OPEN:   { label: 'Đang mở',  dotColor: '#10B981', textColor: '#065F46', bgColor: '#D1FAE5', borderColor: '#10B981' },
  CLOSED: { label: 'Đã đóng', dotColor: '#94A3B8', textColor: '#475569', bgColor: '#F1F5F9', borderColor: '#CBD5E1' },
};

function CreateSessionModal({ onConfirm, onClose }) {
  const [name, setName] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(13,27,62,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="h-1 w-full" style={{ background: '#F37021' }} />
        <div className="p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-0.5">Tạo phiên điểm danh</h3>
          <p className="text-sm text-slate-500 mb-5">Đặt tên rõ ràng để nhận biết nhanh trong ca điểm danh.</p>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
            Tên phiên
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
            placeholder="VD: Buổi sáng, Phiên 1..."
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 mb-5"
            style={{ '--tw-ring-color': '#F37021' }}
          />
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={() => { if (name.trim()) onConfirm(name.trim()); }}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2.5 text-sm text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
              style={{ background: '#F37021' }}
              onMouseEnter={(e) => { if (name.trim()) e.currentTarget.style.background = '#E06518'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F37021'; }}
            >
              Tạo phiên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const confirm = useConfirm();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    eventApi.getEventById(eventId)
      .then((res) => setEvent(res?.data ?? res))
      .catch(() => {});
  }, [eventId]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await attendanceApi.getSessions(eventId);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setSessions(list);
      const openSessions = list.filter((s) => s.status === 'OPEN');
      if (openSessions.length === 1) {
        setActiveSession((cur) => cur ?? openSessions[0]);
      }
    } catch {
      // silently ignore — event may not have sessions yet
    }
  }, [eventId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCreateSession = async (sessionName) => {
    setShowCreateModal(false);
    try {
      const res = await attendanceApi.createSession(eventId, { sessionName });
      const session = res?.data ?? res;
      toast.success(`Đã tạo phiên "${sessionName}"`);
      fetchSessions();
      return session;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo phiên thất bại.');
    }
  };

  const handleOpenSession = async (session) => {
    setActionLoading(session.sessionId ?? session.id);
    try {
      await attendanceApi.openSession(session.sessionId ?? session.id);
      toast.success(`Đã mở phiên "${session.sessionName}"`);
      await fetchSessions();
      setActiveSession({ ...session, status: 'OPEN' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Mở phiên thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseSession = async (session) => {
    if (!(await confirm(`Đóng phiên "${session.sessionName}"? Những ai chưa điểm danh sẽ bị đánh ABSENT.`, { danger: true, confirmLabel: "Đóng phiên" }))) return;
    setActionLoading(session.sessionId ?? session.id);
    try {
      await attendanceApi.closeSession(session.sessionId ?? session.id);
      toast.success(`Đã đóng phiên "${session.sessionName}"`);
      if ((activeSession?.sessionId ?? activeSession?.id) === (session.sessionId ?? session.id)) {
        setActiveSession(null);
      }
      fetchSessions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đóng phiên thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const eventStatus = event?.eventStatus ?? '';
  const canManage = ['Approved', 'Upcoming', 'RegistrationOpen', 'RegistrationClosed', 'Ongoing'].includes(eventStatus);

  return (
    <div className="min-h-screen" style={{ background: '#EEF3FA' }}>

      {/* ── Header ── */}
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
              className="text-xs font-bold uppercase tracking-widest mb-1.5"
              style={{ color: '#F37021', letterSpacing: '0.12em' }}
            >
              Điểm danh sự kiện
            </p>
            <h1 className="text-xl font-bold text-white leading-snug" style={{ textWrap: 'balance' }}>
              {event?.eventName ?? 'Đang tải...'}
            </h1>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors"
              style={{ background: '#F37021' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E06518'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F37021'; }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Tạo phiên mới
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6 max-w-4xl mx-auto">

        {/* Session strip */}
        {sessions.length > 0 && (
          <section className="mb-5">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"
              style={{ color: '#64748B', letterSpacing: '0.1em' }}
            >
              <Users size={11} strokeWidth={2.5} />
              Danh sách phiên ({sessions.length})
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => {
                const sid = s.sessionId ?? s.id;
                const cfg = SESSION_STATUS_CFG[s.status] ?? SESSION_STATUS_CFG.CLOSED;
                const isSelected = activeSession?.sessionId === sid || activeSession?.id === sid;
                const isActing = actionLoading === sid;
                const isOpen = s.status === 'OPEN';

                return (
                  <div
                    key={sid}
                    onClick={() => setActiveSession(s)}
                    className="bg-white rounded-2xl cursor-pointer transition-all duration-150 overflow-hidden"
                    style={{
                      boxShadow: isSelected
                        ? '0 0 0 2px #F37021, 0 4px 16px rgba(243,112,33,0.12)'
                        : '0 1px 3px rgba(13,27,62,0.07)',
                      borderTop: `3px solid ${isSelected ? '#F37021' : cfg.borderColor}`,
                    }}
                  >
                    <div className="p-4">
                      {/* Status row */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5"
                          style={{ color: cfg.textColor, background: cfg.bgColor }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{
                              background: cfg.dotColor,
                              animation: isOpen ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                            }}
                          />
                          {cfg.label}
                        </span>
                        {s.totalCheckedIn !== undefined && (
                          <span
                            className="text-xs font-variant-numeric"
                            style={{ color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}
                          >
                            {s.totalCheckedIn} điểm danh
                          </span>
                        )}
                      </div>

                      {/* Session name */}
                      <p
                        className="font-semibold text-sm mb-3 leading-snug"
                        style={{ color: isSelected ? '#0D1B3E' : '#1E293B' }}
                      >
                        {s.sessionName}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {s.status === 'DRAFT' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenSession(s); }}
                            disabled={isActing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: '#065F46', background: '#D1FAE5', border: '1px solid #A7F3D0' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#A7F3D0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#D1FAE5'; }}
                          >
                            <Play size={11} fill="currentColor" strokeWidth={0} /> Mở phiên
                          </button>
                        )}
                        {isOpen && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCloseSession(s); }}
                            disabled={isActing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FECACA'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                          >
                            <Square size={11} fill="currentColor" strokeWidth={0} /> Đóng phiên
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No sessions empty state */}
        {sessions.length === 0 && canManage && (
          <div
            className="rounded-2xl p-10 text-center mb-5"
            style={{ background: 'white', border: '2px dashed #CBD5E1' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#F1F5F9' }}
            >
              <Users size={22} style={{ color: '#94A3B8' }} />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#475569' }}>
              Chưa có phiên điểm danh nào
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Tạo phiên để bắt đầu điểm danh
            </p>
          </div>
        )}

        {/* Scanner workspace */}
        {activeSession ? (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(13,27,62,0.08)' }}
          >
            <EventCheckInScanner
              eventId={eventId}
              sessionId={activeSession.sessionId ?? activeSession.id}
              sessionStatus={activeSession.status}
            />
          </div>
        ) : sessions.length > 0 ? (
          <div
            className="rounded-2xl py-14 text-center"
            style={{ background: 'white', boxShadow: '0 1px 3px rgba(13,27,62,0.06)' }}
          >
            <ScanLine size={28} className="mx-auto mb-2.5" style={{ color: '#CBD5E1' }} />
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Chọn một phiên ở trên để bắt đầu điểm danh
            </p>
          </div>
        ) : null}
      </div>

      {showCreateModal && (
        <CreateSessionModal
          onConfirm={handleCreateSession}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
