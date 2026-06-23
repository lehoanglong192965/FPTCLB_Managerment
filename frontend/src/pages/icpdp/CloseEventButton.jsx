import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import eventService from '../../services/api/events/eventService';

const CloseEventButton = ({ eventId, eventStatus, onCloseSuccess }) => {
    const { addNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    // Chỉ hiển thị nút Đóng sự kiện nếu trạng thái là REPORTED (hoặc COMPLETED tùy theo luồng thực tế)
    if (eventStatus !== 'Reported' && eventStatus !== 'Completed') {
        return null;
    }

    const handleClose = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn Đóng sự kiện này? Hành động này sẽ giải ngân điểm cho tất cả thành viên.')) {
            return;
        }

        setIsLoading(true);
        try {
            await eventService.close(eventId);
            addNotification('Đóng sự kiện thành công. Đã giải ngân điểm cho thành viên!', 'success');
            if (onCloseSuccess) onCloseSuccess();
        } catch (error) {
            addNotification(error.response?.data?.message || 'Lỗi khi đóng sự kiện.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            title="Đóng sự kiện để giải ngân điểm"
        >
            {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</>
            ) : (
                <><i className="fas fa-archive"></i> Đóng Sự Kiện</>
            )}
        </button>
    );
};

export default CloseEventButton;
