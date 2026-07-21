import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useToast } from '../../contexts/ToastContext';
import eventApi from '../../services/api/events/eventApi';
import AlertModal from '../ui/AlertModal';

const EventRegistrationBtn = ({ eventId, eventStatus, onRegisterSuccess }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const toast = useToast();
    const navigate = useNavigate();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const location = useLocation();
    const [isLoading, setIsLoading]     = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const [canReregister, setCanReregister] = useState(true);
    const [reregistrationBlockReason, setReregistrationBlockReason] = useState(null);
    const [canReregisterAt, setCanReregisterAt] = useState(null);
    const [showCancel, setShowCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isAssigned, setIsAssigned]   = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);

    const isExcludedRole = user?.role === 'Leader' || user?.role === 'ICPDP' || user?.role === 'Admin';

    useEffect(() => {
        if (isExcludedRole || !eventId || !user) {
            setStatusLoading(false);
            return;
        }
        eventApi.getMyEventStatus(eventId)
            .then(res => {
                const data = res.data || res;
                setIsRegistered(!!data.registered);
                setRegistrationId(data.registrationId ?? null);
                setCanReregister(data.canReregister ?? true);
                setReregistrationBlockReason(data.reregistrationBlockReason ?? null);
                setCanReregisterAt(data.canReregisterAt ?? null);
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

    const statusNorm = (eventStatus || '').toUpperCase().replace(/_/g, '');
    const REGISTERABLE_STATUSES = ['APPROVED', 'REGISTRATIONOPEN', 'REGISTRATIONCLOSED', 'UPCOMING', 'ONGOING'];
    if (!REGISTERABLE_STATUSES.includes(statusNorm)) {
        return null;
    }

    if (statusNorm === 'APPROVED') {
        return (
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-500 cursor-default border-none" disabled>
                <i className="fas fa-clock"></i> Chưa mở đăng ký
            </button>
        );
    }

    if (statusNorm === 'REGISTRATIONCLOSED') {
        return (
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-500 cursor-default border-none" disabled>
                <i className="fas fa-lock"></i> Đã đóng đăng ký
            </button>
        );
    }

    if (!user) {
        return (
            <>
                <div className="flex flex-col gap-2.5 w-full">
                    <button
                        onClick={() => setShowLoginPrompt(true)}
                        className="w-full px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-white cursor-pointer border-none"
                        style={{ background: "#F37021" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#e05c0a"}
                        onMouseLeave={e => e.currentTarget.style.background = "#F37021"}
                    >
                        <i className="fas fa-ticket-alt"></i> Đăng Ký Tham Gia
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">hoặc</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <button
                        onClick={() => navigate(`/guest/register/${eventId}`)}
                        className="w-full px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 cursor-pointer border border-gray-200 bg-white text-gray-700 hover:border-[#F37021] hover:text-[#F37021]"
                        style={{ transition: "all 0.15s" }}
                    >
                        <i className="fas fa-user"></i> Đăng ký với tư cách khách
                    </button>
                </div>
                {showLoginPrompt && (
                    <AlertModal
                        type="error"
                        title="CHƯA ĐĂNG NHẬP"
                        message="Bạn chưa đăng nhập."
                        subMessage="Vui lòng đăng nhập để đăng ký tham gia sự kiện."
                        confirmLabel="Đăng nhập ngay"
                        cancelLabel="Để sau"
                        onConfirm={() => navigate('/login', { state: { from: location.pathname } })}
                        onClose={() => setShowLoginPrompt(false)}
                    />
                )}
            </>
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
            <div className="flex flex-col gap-2 relative">
                <button
                    className="w-full px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 text-green-700 cursor-default border-none"
                    disabled
                >
                    <i className="fas fa-check-circle"></i> Đã Đăng Ký
                </button>
                <button
                    onClick={() => navigate('/member/tickets')}
                    className="w-full px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer border border-green-300 bg-white text-green-700 hover:bg-green-50 transition-colors"
                >
                    <i className="fas fa-ticket-alt"></i> Xem vé của tôi
                </button>
                <button
                    onClick={() => setShowCancel(true)}
                    className="w-full px-6 py-2.5 rounded-lg font-medium border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
                >
                    Hủy đăng ký
                </button>
                {showCancel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900">Xác nhận hủy đăng ký</h3>
                            <p className="mt-2 text-sm text-gray-600">Nếu hủy sát giờ, bạn bắt buộc phải cung cấp lý do.</p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                maxLength={500}
                                rows={4}
                                placeholder="Lý do không thể tham gia..."
                                className="mt-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-red-400"
                            />
                            <div className="mt-4 flex justify-end gap-3">
                                <button onClick={() => setShowCancel(false)} className="rounded-lg border px-4 py-2">Quay lại</button>
                                <button
                                    disabled={isLoading || !cancelReason.trim()}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            await eventApi.cancelRegistration(registrationId, cancelReason.trim());
                                            setIsRegistered(false);
                                            setRegistrationId(null);
                                            setCanReregister(false);
                                            setReregistrationBlockReason('REREGISTRATION_COOLDOWN');
                                            setCanReregisterAt(new Date(Date.now() + 30 * 60 * 1000).toISOString());
                                            setShowCancel(false);
                                            setCancelReason('');
                                            toast.success('Đã hủy đăng ký và giải phóng suất tham gia.');
                                            if (onRegisterSuccess) onRegisterSuccess();
                                        } catch (error) {
                                            toast.error(error.response?.data?.message || 'Không thể hủy đăng ký.');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                                >
                                    Xác nhận hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (!canReregister && reregistrationBlockReason) {
        const message = reregistrationBlockReason === 'REREGISTRATION_LIMIT_REACHED'
            ? 'Bạn đã sử dụng hết lượt đăng ký lại cho sự kiện này.'
            : reregistrationBlockReason === 'REREGISTRATION_DEADLINE_PASSED'
                ? 'Không thể đăng ký lại trong vòng 24 giờ trước sự kiện.'
                : `Có thể đăng ký lại lúc ${canReregisterAt
                    ? new Date(canReregisterAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : 'sau 30 phút'}. Vui lòng tải lại trang khi đến giờ.`;
        return (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
                <i className="fas fa-clock mr-2"></i>{message}
            </div>
        );
    }

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            await eventApi.register(eventId);
            setIsRegistered(true);
            addNotification({ title: 'Đăng ký thành công', content: 'Đã đăng ký tham gia sự kiện thành công!' });
            if (onRegisterSuccess) onRegisterSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi đăng ký sự kiện.');
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
