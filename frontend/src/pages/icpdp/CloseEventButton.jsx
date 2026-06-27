import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import eventService from '../../services/api/events/eventService';

const CloseEventButton = ({ eventId, eventStatus, onCloseSuccess }) => {
    const { addNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    const normalizedStatus = (eventStatus || "").toUpperCase();
    if (!["COMPLETED", "REPORTUPLOADED", "REPORTED"].includes(normalizedStatus)) {
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
            style={{
                padding: "10px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                background: isLoading ? "#9ca3af" : "#374151", color: "#fff", border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
            }}
        >
            {isLoading ? "Đang xử lý..." : "Đóng sự kiện"}
        </button>
    );
};

export default CloseEventButton;
