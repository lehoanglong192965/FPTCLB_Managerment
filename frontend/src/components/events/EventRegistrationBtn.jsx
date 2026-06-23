import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import eventService from '../../services/api/events/eventService';

const EventRegistrationBtn = ({ eventId, eventStatus, onRegisterSuccess }) => {
    const { user, isMember } = useAuth();
    const { addNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // Chỉ hiển thị cho Member hoặc Guest hợp lệ. Nếu là Leader/ICPDP thì không hiển thị.
    if (user?.role === 'Leader' || user?.role === 'ICPDP' || user?.role === 'Admin') {
        return null;
    }

    if (eventStatus !== 'Approved' && eventStatus !== 'Upcoming') {
        return null; // Chỉ cho đăng ký khi sự kiện sắp diễn ra
    }

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            await eventService.register(eventId);
            setIsRegistered(true);
            addNotification('Đăng ký tham gia sự kiện thành công!', 'success');
            if (onRegisterSuccess) onRegisterSuccess();
        } catch (error) {
            addNotification(error.response?.data?.message || 'Lỗi khi đăng ký sự kiện.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isRegistered) {
        return (
            <button 
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-green-100 text-green-700 cursor-default"
                disabled
            >
                <i className="fas fa-check-circle"></i> Đã Đăng Ký
            </button>
        );
    }

    return (
        <button 
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</>
            ) : (
                <><i className="fas fa-ticket-alt"></i> Đăng Ký Tham Gia</>
            )}
        </button>
    );
};

export default EventRegistrationBtn;
