import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, User, Search, Users } from 'lucide-react';
import eventService from '../../services/api/events/eventService';

const EventCheckInScanner = ({ eventId, eventStatus }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState(null); // { success, name, studentId, message }
    const [attendees, setAttendees] = useState([]);
    const [listSearch, setListSearch] = useState('');

    const fetchAttendees = useCallback(async () => {
        try {
            const res = await eventService.getCheckedInAttendees(eventId);
            const data = Array.isArray(res) ? res : (res?.data ?? []);
            // Sort newest first
            setAttendees([...data].sort((a, b) => b.markedAt?.localeCompare(a.markedAt ?? '') ?? 0));
        } catch {
            // silently ignore if no session yet
        }
    }, [eventId]);

    useEffect(() => {
        fetchAttendees();
    }, [fetchAttendees]);

    if (eventStatus !== 'Approved' && eventStatus !== 'Upcoming' && eventStatus !== 'Ongoing') {
        return null;
    }

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsScanning(true);
        setResult(null);
        try {
            const res = await eventService.checkIn(eventId, searchQuery.trim());
            const data = res?.data ?? res ?? {};
            setResult({
                success: true,
                name: data.fullName || searchQuery.trim(),
                studentId: data.studentId || searchQuery.trim(),
            });
            setSearchQuery('');
            fetchAttendees();
        } catch (error) {
            const msg = error?.response?.data?.message
                || error?.message
                || 'Không tìm thấy người đăng ký hoặc đã điểm danh rồi.';
            setResult({ success: false, message: msg });
        } finally {
            setIsScanning(false);
        }
    };

    const filteredAttendees = attendees.filter((a) => {
        const q = listSearch.toLowerCase();
        return (
            (a.fullName || '').toLowerCase().includes(q) ||
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
        <div className="mt-6 space-y-5">
            {/* Check-in form card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-2 border-b pb-3">
                    <i className="fas fa-qrcode text-blue-600 mr-2"></i> Quầy Check-in Sự kiện
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                    Quét mã QR hoặc nhập Mã số sinh viên để điểm danh nhanh.
                </p>

                <form onSubmit={handleCheckIn} className="flex gap-4 max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg shadow-sm"
                            placeholder="Nhập MSSV (VD: SE150000)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isScanning || !searchQuery.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isScanning ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fas fa-check-circle"></i>
                        )}
                        Check-in
                    </button>
                </form>

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
                            <CheckCircle2 size={40} className="text-green-500 flex-shrink-0" />
                        ) : (
                            <XCircle size={40} className="text-red-400 flex-shrink-0" />
                        )}

                        {result.success ? (
                            <div>
                                <p className="text-green-700 font-bold text-lg leading-tight">
                                    Điểm danh thành công!
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <User size={15} className="text-green-600" />
                                    <span className="text-green-800 font-semibold text-base">
                                        {result.name}
                                    </span>
                                    <span className="text-green-600 text-sm">
                                        ({result.studentId})
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-600 font-semibold text-base">{result.message}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Attendee list card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Danh sách đã điểm danh
                    </h3>
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {attendees.length} người
                    </span>
                </div>

                {/* Search */}
                <div className="relative mb-4" style={{ maxWidth: 320 }}>
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:border-blue-400 focus:bg-white transition-colors"
                        placeholder="Tìm theo tên hoặc MSSV..."
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                    />
                </div>

                {filteredAttendees.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Users size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                            {attendees.length === 0
                                ? 'Chưa có ai điểm danh.'
                                : 'Không tìm thấy kết quả.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-left">
                                    <th className="px-4 py-2 font-semibold rounded-tl-lg">#</th>
                                    <th className="px-4 py-2 font-semibold">Họ và tên</th>
                                    <th className="px-4 py-2 font-semibold">MSSV</th>
                                    <th className="px-4 py-2 font-semibold rounded-tr-lg">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendees.map((a, idx) => (
                                    <tr
                                        key={a.userId ?? idx}
                                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <User size={14} className="text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-800">{a.fullName || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-mono">{a.studentId || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatTime(a.markedAt)}</td>
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
