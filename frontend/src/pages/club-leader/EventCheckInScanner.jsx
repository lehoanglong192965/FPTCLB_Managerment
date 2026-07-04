import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, User, Search, Users } from 'lucide-react';
import attendanceService from '../../services/api/attendance/attendanceService';

const EventCheckInScanner = ({ eventId, sessionId, sessionStatus }) => {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [participants, setParticipants] = useState([]); // search results
    const [checkInLoading, setCheckInLoading] = useState(null); // registrationId
    const [result, setResult] = useState(null); // { success, name, message }
    const [summary, setSummary] = useState(null);
    const [listSearch, setListSearch] = useState('');
    const searchTimeout = useRef(null);

    const fetchSummary = useCallback(async () => {
        if (!sessionId) return;
        try {
            const res = await attendanceService.getSessionSummary(sessionId);
            setSummary(res?.data ?? res);
        } catch {
            // summary is optional
        }
    }, [eventId, sessionId]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    // Search participants as user types (debounced)
    useEffect(() => {
        if (!query.trim() || !sessionId) {
            setParticipants([]);
            return;
        }
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await attendanceService.searchParticipants(sessionId, query.trim());
                const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
                setParticipants(list);
            } catch {
                setParticipants([]);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(searchTimeout.current);
    }, [query, eventId, sessionId]);

    if (sessionStatus !== 'OPEN') {
        return (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center text-sm text-yellow-700">
                Phiên này đã đóng. Mở phiên để bắt đầu điểm danh.
            </div>
        );
    }

    const handleCheckIn = async (participant) => {
        const guestRegId = participant.guestRegistrationId ?? participant.guestRegistrationID;
        const regId = guestRegId ?? participant.registrationId ?? participant.id;
        const participantKey = participant.participantKey ?? (guestRegId ? 'guest-' + guestRegId : 'fptu-' + regId);
        setCheckInLoading(participantKey);
        setResult(null);
        try {
            await attendanceService.checkIn(sessionId, {
                registrationId: guestRegId ? undefined : regId,
                guestRegistrationId: guestRegId,
                verificationMethod: 'MANUAL',
            });
            setResult({
                success: true,
                name: participant.fullName || participant.name || query.trim(),
                studentId: participant.studentId,
            });
            setQuery('');
            setParticipants([]);
            fetchSummary();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Check-in thất bại.';
            setResult({ success: false, message: msg });
        } finally {
            setCheckInLoading(null);
        }
    };

    const checkedInList = (summary?.records ?? []).filter(
      (r) => (r.status ?? r.attendanceStatus) === 'PRESENT'
    );
    const filtered = checkedInList.filter((a) => {
        const q = listSearch.toLowerCase();
        return (
            (a.fullName || a.name || '').toLowerCase().includes(q) ||
            (a.studentId || '').toLowerCase().includes(q)
        );
    });

    const formatTime = (iso) => {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch { return iso; }
    };

    return (
        <div className="space-y-5">
            {/* Summary bar */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">{summary.totalRegistered ?? '—'}</p>
                        <p className="text-xs text-blue-600 mt-1">Đã đăng ký</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{summary.totalCheckedIn ?? 0}</p>
                        <p className="text-xs text-green-600 mt-1">Đã điểm danh</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gray-700">{summary.totalAbsent ?? '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">Vắng mặt</p>
                    </div>
                </div>
            )}

            {/* Check-in search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-3">
                    Quầy Check-in
                </h3>
                <p className="text-gray-500 text-sm mb-5">
                    Nhập tên, MSSV hoặc 4 số cuối SĐT để tìm người tham dự.
                </p>

                <div className="relative max-w-2xl mx-auto">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setResult(null); }}
                        placeholder="Tìm theo MSSV, tên, 4 số cuối SĐT..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-base shadow-sm"
                    />
                    {searching && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Đang tìm...</span>
                    )}
                </div>

                {/* Search results */}
                {participants.length > 0 && (
                    <div className="mt-3 max-w-2xl mx-auto border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {participants.map((p) => {
                            const guestRegId = p.guestRegistrationId ?? p.guestRegistrationID;
                            const regId = guestRegId ?? p.registrationId ?? p.id;
                            const participantKey = p.participantKey ?? (guestRegId ? 'guest-' + guestRegId : 'fptu-' + regId);
                            const isChecking = checkInLoading === participantKey;
                            return (
                                <div key={participantKey} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                            <User size={16} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{p.fullName || p.name}</p>
                                            <p className="text-xs text-gray-500">{p.studentId || p.phone || '—'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCheckIn(p)}
                                        disabled={isChecking}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                    >
                                        {isChecking ? '...' : 'Check-in'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {query.trim() && !searching && participants.length === 0 && (
                    <p className="text-center text-sm text-gray-400 mt-4">Không tìm thấy người đăng ký.</p>
                )}

                {/* Result banner */}
                {result && (
                    <div
                        className="max-w-2xl mx-auto mt-5 rounded-xl p-5 flex items-center gap-4"
                        style={{
                            background: result.success ? '#f0fdf4' : '#fef2f2',
                            border: `2px solid ${result.success ? '#22c55e' : '#f87171'}`,
                        }}
                    >
                        {result.success ? (
                            <CheckCircle2 size={36} className="text-green-500 shrink-0" />
                        ) : (
                            <XCircle size={36} className="text-red-400 shrink-0" />
                        )}
                        {result.success ? (
                            <div>
                                <p className="text-green-700 font-bold text-base">Điểm danh thành công!</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <User size={14} className="text-green-600" />
                                    <span className="text-green-800 font-semibold">{result.name}</span>
                                    {result.studentId && <span className="text-green-600 text-sm">({result.studentId})</span>}
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-600 font-semibold">{result.message}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Checked-in list */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <Users size={18} className="text-blue-600" /> Danh sách đã điểm danh
                    </h3>
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {checkedInList.length} người
                    </span>
                </div>

                <div className="relative mb-4 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        placeholder="Tìm theo tên hoặc MSSV..."
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:border-blue-400 focus:bg-white"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                            {checkedInList.length === 0 ? 'Chưa có ai điểm danh.' : 'Không tìm thấy kết quả.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-left">
                                    <th className="px-4 py-2 font-semibold">#</th>
                                    <th className="px-4 py-2 font-semibold">Họ và tên</th>
                                    <th className="px-4 py-2 font-semibold">MSSV</th>
                                    <th className="px-4 py-2 font-semibold">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a, idx) => (
                                    <tr key={a.participantKey ?? a.recordId ?? idx} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <User size={13} className="text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-800">{a.fullName || a.name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-mono">{a.studentId || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatTime(a.checkedInAt ?? a.markedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCheckInScanner;
