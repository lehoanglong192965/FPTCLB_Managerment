import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Square, Users } from 'lucide-react';
import eventService from '../../services/api/events/eventService';
import attendanceService from '../../services/api/attendance/attendanceService';
import EventCheckInScanner from './EventCheckInScanner';
import { useToast } from '../../contexts/ToastContext';

const SESSION_STATUS_CFG = {
  OPEN:   { label: 'Đang mở', color: 'text-green-700', bg: 'bg-green-100' },
  CLOSED: { label: 'Đã đóng', color: 'text-gray-600',  bg: 'bg-gray-100'  },
};

function CreateSessionModal({ onConfirm, onClose }) {
  const [name, setName] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Tạo phiên điểm danh</h3>
        <label className="block text-sm text-gray-600 mb-1">Tên phiên</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Buổi sáng, Phiên 1..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Huỷ
          </button>
          <button
            onClick={() => { if (name.trim()) onConfirm(name.trim()); }}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
          >
            Tạo phiên
          </button>
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
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    eventService.getEventById(eventId)
      .then((res) => setEvent(res?.data ?? res))
      .catch(() => {});
  }, [eventId]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await attendanceService.getSessions(eventId);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setSessions(list);
      // Auto-select the only OPEN session if there is one
      const openSessions = list.filter((s) => s.status === 'OPEN');
      if (openSessions.length === 1 && !activeSession) {
        setActiveSession(openSessions[0]);
      }
    } catch {
      // silently ignore — event may not have sessions yet
    }
  }, [eventId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCreateSession = async (sessionName) => {
    setShowCreateModal(false);
    try {
      const res = await attendanceService.createSession(eventId, { sessionName });
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
      await attendanceService.openSession(session.sessionId ?? session.id);
      toast.success(`Đã mở phiên "${session.sessionName}"`);
      await fetchSessions();
      setActiveSession((prev) => ({ ...prev, status: 'OPEN' }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Mở phiên thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseSession = async (session) => {
    if (!window.confirm(`Đóng phiên "${session.sessionName}"? Những ai chưa điểm danh sẽ bị đánh ABSENT.`)) return;
    setActionLoading(session.sessionId ?? session.id);
    try {
      await attendanceService.closeSession(session.sessionId ?? session.id);
      toast.success(`Đã đóng phiên "${session.sessionName}"`);
      if (activeSession?.sessionId === (session.sessionId ?? session.id)) {
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
    <div className="p-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Điểm Danh Sự Kiện</h1>
          {event && <p className="text-sm text-gray-500 mt-1">{event.eventName}</p>}
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} /> Tạo phiên mới
          </button>
        )}
      </div>

      {/* Session list */}
      {sessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users size={15} /> Danh sách phiên ({sessions.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map((s) => {
              const sid = s.sessionId ?? s.id;
              const cfg = SESSION_STATUS_CFG[s.status] ?? SESSION_STATUS_CFG.CLOSED;
              const isSelected = activeSession?.sessionId === sid || activeSession?.id === sid;
              const isActing = actionLoading === sid;
              return (
                <div
                  key={sid}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{s.sessionName}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {s.totalCheckedIn !== undefined && (
                    <p className="text-xs text-gray-500 mb-3">{s.totalCheckedIn} đã điểm danh</p>
                  )}
                  <div className="flex gap-2">
                    {s.status !== 'OPEN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenSession(s); }}
                        disabled={isActing}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
                      >
                        <Play size={12} /> Mở phiên
                      </button>
                    )}
                    {s.status === 'OPEN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCloseSession(s); }}
                        disabled={isActing}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        <Square size={12} /> Đóng phiên
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sessions.length === 0 && canManage && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-6">
          <Users size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-blue-700 font-medium">Chưa có phiên điểm danh nào</p>
          <p className="text-xs text-blue-600 mt-1">Tạo phiên để bắt đầu điểm danh</p>
        </div>
      )}

      {/* Scanner — only shown when a session is selected */}
      {activeSession && (
        <EventCheckInScanner
          eventId={eventId}
          sessionId={activeSession.sessionId ?? activeSession.id}
          sessionStatus={activeSession.status}
        />
      )}

      {!activeSession && sessions.length > 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          Chọn một phiên ở trên để bắt đầu điểm danh
        </div>
      )}

      {showCreateModal && (
        <CreateSessionModal
          onConfirm={handleCreateSession}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
