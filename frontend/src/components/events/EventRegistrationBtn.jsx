import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import eventService from '../../services/api/events/eventService';

const EventRegistrationBtn = ({ eventId, eventStatus, onRegisterSuccess }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading]     = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isAssigned, setIsAssigned]   = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);

    const isExcludedRole = user?.role === 'Leader' || user?.role === 'ICPDP' || user?.role === 'Admin';

    useEffect(() => {
        if (isExcludedRole || !eventId || !user) {
            setStatusLoading(false);
            return;
        }
        eventService.getMyEventStatus(eventId)
            .then(res => {
                const data = res.data || res;
                setIsRegistered(!!data.registered);
                setIsAssigned(!!data.assigned);
            })
            .catch(err => {
                if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
                console.error("Lỗi kiểm tra trạng thái sự kiện:", err);
            })
            .finally(() => {
                setStatusLoading(false);
            });
    }, [eventId, user, isExcludedRole]);

    if (isExcludedRole) return null;

    const REGISTERABLE_STATUSES = ['Approved', 'RegistrationOpen', 'RegistrationClosed', 'Upcoming', 'Ongoing'];
    if (!REGISTERABLE_STATUSES.includes(eventStatus)) {
        return null;
    }

    if (eventStatus === 'Approved') {
        return (
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-500 cursor-default border-none" disabled>
                <i className="fas fa-clock"></i> Chưa mở đăng ký
            </button>
        );
    }

    if (eventStatus === 'RegistrationClosed') {
        return (
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-500 cursor-default border-none" disabled>
                <i className="fas fa-lock"></i> Đã đóng đăng ký
            </button>
        );
    }

    if (!user) {
        return (
            <button
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-white cursor-pointer border-none"
                style={{ background: "#F37021" }}
                onMouseEnter={e => e.currentTarget.style.background = "#e05c0a"}
                onMouseLeave={e => e.currentTarget.style.background = "#F37021"}
            >
                <i className="fas fa-ticket-alt"></i> Đăng ký để tham gia
            </button>
        );
    }

    if (statusLoading) {
        return (
            <button
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-default border-none"
                disabled
            >
                Đang kiểm tra...
            </button>
        );
    }

    if (isAssigned) {
        return (
            <button
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-blue-100 text-blue-700 cursor-default border-none"
                disabled
            >
                <i className="fas fa-user-shield"></i> Ban Tổ Chức / Hỗ Trợ
            </button>
        );
    }

    if (isRegistered) {
        return (
            <button
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 text-green-700 cursor-default border-none"
                disabled
            >
                <i className="fas fa-check-circle"></i> Đã Đăng Ký
            </button>
        );
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

    return (
        <button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            style={{ background: "#F37021" }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#e05c0a"; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = "#F37021"; }}
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
