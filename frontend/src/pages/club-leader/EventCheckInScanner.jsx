import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import eventService from '../../services/api/events/eventService';

const EventCheckInScanner = ({ eventId, eventStatus }) => {
    const { addNotification } = useNotifications();
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    if (eventStatus !== 'Approved' && eventStatus !== 'Upcoming' && eventStatus !== 'Ongoing') {
        return null;
    }

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsScanning(true);
        try {
            // Gọi API check-in với studentId
            await eventService.checkIn(eventId, searchQuery);
            
            // Play success sound
            const audio = new Audio('/success-bell.mp3'); // Mock sound
            audio.play().catch(e => console.log('Audio play failed', e));

            addNotification(`Điểm danh thành công cho ${searchQuery}`, 'success');
            setSearchQuery('');
        } catch (error) {
            addNotification(error.response?.data?.message || 'Không tìm thấy người đăng ký hoặc đã điểm danh rồi.', 'error');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 border-b pb-3">
                <i className="fas fa-qrcode text-blue-600 mr-2"></i> Quầy Check-in Sự kiện
            </h3>
            <p className="text-gray-500 text-sm mb-6">Quét mã QR hoặc nhập Mã số sinh viên để điểm danh nhanh.</p>
            
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
        </div>
    );
};

export default EventCheckInScanner;
