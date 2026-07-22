import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useToast } from '../../contexts/ToastContext';
import eventApi from '../../services/api/events/eventApi';
import AlertModal from '../ui/AlertModal';
import TicketDetailModal from './TicketDetailModal';

const EventRegistrationBtn = ({ eventId, eventStatus, isPaidEvent = false, ticketPrice = 0, ticketCurrency = 'VND', onRegisterSuccess }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const toast = useToast();
    const navigate = useNavigate();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const location = useLocation();
    const [isLoading, setIsLoading]     = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [canReregister, setCanReregister] = useState(true);
    const [reregistrationBlockReason, setReregistrationBlockReason] = useState(null);
    const [canReregisterAt, setCanReregisterAt] = useState(null);
    const [showCancel, setShowCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isAssigned, setIsAssigned]   = useState(false);
    const [paymentExempt, setPaymentExempt] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [registrationResult, setRegistrationResult] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paying, setPaying] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketLoading, setTicketLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [purchasedTicketCount, setPurchasedTicketCount] = useState(0);
    const [showTicketOrder, setShowTicketOrder] = useState(false);
    const [participants, setParticipants] = useState([{
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phoneNumber || user?.phone || '',
        studentId: user?.studentId || '',
    }]);

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
                setCanReregister(data.canReregister ?? true);
                setReregistrationBlockReason(data.reregistrationBlockReason ?? null);
                setCanReregisterAt(data.canReregisterAt ?? null);
                setIsAssigned(!!data.assigned);
                setPaymentExempt(!!data.paymentExempt);
                setPurchasedTicketCount(Number(data.purchasedTicketCount || 0));
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

    if (isAssigned && !isRegistered) {
        return (
            <button
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-blue-100 text-blue-700 cursor-default border-none"
                disabled
            >
                <i className="fas fa-user-shield"></i> Ban Tổ Chức / Hỗ Trợ
            </button>
        );
    }

    const openCurrentTicket = async () => {
        setTicketLoading(true);
        try {
            const response = await eventApi.getMyRegistrationDetails();
            const registrations = Array.isArray(response) ? response : (response?.data ?? []);
            const ticket = registrations.find((item) => Number(item.eventId) === Number(eventId));
            if (!ticket) {
                toast.error('Không tìm thấy thông tin vé của sự kiện này.');
                return;
            }
            setSelectedTicket(ticket);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tải thông tin vé.');
        } finally {
            setTicketLoading(false);
        }
    };

    const handleCancelTicket = async (reason) => {
        setCancelling(true);
        try {
            let registrationId = registrationResult?.registrationId;
            if (!registrationId) {
                const response = await eventApi.getMyRegistrationDetails();
                const registrations = Array.isArray(response) ? response : (response?.data ?? []);
                const activeRegistration = registrations
                    .filter((item) => Number(item.eventId) === Number(eventId) && item.registrationStatus !== 'CANCELLED')
                    .sort((a, b) => Number(b.registrationId ?? 0) - Number(a.registrationId ?? 0))[0];
                registrationId = activeRegistration?.registrationId;
            }
            if (!registrationId) {
                toast.error('Không tìm thấy đăng ký đang hoạt động để hủy.');
                return;
            }

            if (registrationResult?.ticketOrderCode) {
                await eventApi.cancelTicketOrder(registrationResult.ticketOrderCode, reason);
            } else {
                await eventApi.cancelRegistration(registrationId, reason);
            }
            setIsRegistered(false);
            setCanReregister(false);
            setReregistrationBlockReason('REREGISTRATION_COOLDOWN');
            setCanReregisterAt(new Date(Date.now() + 30 * 60 * 1000).toISOString());
            setRegistrationResult(null);
            setSelectedTicket(null);
            setShowCancel(false);
            setCancelReason('');
            toast.success('Đã hủy vé và thu hồi mã QR.');
            if (onRegisterSuccess) onRegisterSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể hủy vé.');
        } finally {
            setCancelling(false);
        }
    };

    if (isRegistered && registrationResult?.paymentStatus !== 'PENDING'
        && !(isPaidEvent && !paymentExempt && purchasedTicketCount < 4)) {
        return (
            <>
            <div className="flex flex-col gap-2 relative">
                <button
                    className="w-full px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 text-green-700 cursor-default border-none"
                    disabled
                >
                    <i className="fas fa-check-circle"></i> Đã Đăng Ký
                </button>
                <button
                    onClick={openCurrentTicket}
                    disabled={ticketLoading || cancelling}
                    className="w-full px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer border border-green-300 bg-white text-green-700 hover:bg-green-50 transition-colors"
                >
                    <i className={`fas ${ticketLoading ? 'fa-spinner fa-spin' : 'fa-ticket-alt'}`}></i> {ticketLoading ? 'Đang tải vé...' : 'Xem vé của tôi'}
                </button>
                <button
                    onClick={() => setShowCancel(true)}
                    disabled={cancelling || ticketLoading}
                    className="w-full px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer border border-red-300 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    <i className={`fas ${cancelling ? 'fa-spinner fa-spin' : 'fa-times-circle'}`}></i> {cancelling ? 'Đang hủy vé...' : 'Hủy đăng ký / vé'}
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
                                    disabled={cancelling || !cancelReason.trim()}
                                    onClick={() => handleCancelTicket(cancelReason.trim())}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                                >
                                    Xác nhận hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
            </>
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
            const response = await eventApi.register(eventId);
            const result = response?.data ?? response;
            setRegistrationResult(result);
            setIsRegistered(true);
            addNotification({ title: 'Đăng ký thành công', content: 'Đã đăng ký tham gia sự kiện thành công!' });
            if ((!isPaidEvent || paymentExempt) && onRegisterSuccess) onRegisterSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi đăng ký sự kiện.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!registrationResult?.registrationId) return;
        setPaying(true);
        try {
            await eventApi.confirmPayment(registrationResult.registrationId, {
                paymentMethod,
                transactionReference: registrationResult.paymentReference,
            });
            addNotification({ title: 'Thanh toán thành công', content: 'Vé QR của bạn đã được phát hành.' });
            navigate('/member/tickets');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán.');
        } finally {
            setPaying(false);
        }
    };

    const updateTicketQuantity = (quantity) => {
        const safeQuantity = Math.max(1, Math.min(Number(quantity) || 1, Math.max(1, 4 - purchasedTicketCount)));
        setParticipants((current) => Array.from({ length: safeQuantity }, (_, index) => current[index] || {
            fullName: '', email: '', phone: '', studentId: '',
        }));
    };

    const updateParticipant = (index, field, value) => {
        setParticipants((current) => current.map((participant, participantIndex) =>
            participantIndex === index ? { ...participant, [field]: value } : participant));
    };

    const handleCreateTicketOrder = async () => {
        setIsLoading(true);
        try {
            const response = await eventApi.createTicketOrder(eventId, participants);
            const result = response?.data ?? response;
            setRegistrationResult(result);
            setIsRegistered(true);
            setPurchasedTicketCount((count) => count + Number(result.ticketCount || participants.length));
            setShowTicketOrder(false);
            addNotification({
                title: 'Đã giữ chỗ cho đơn vé',
                content: `Vui lòng thanh toán ${Number(result.amountDue || 0).toLocaleString('vi-VN')} ${result.currency || ticketCurrency}.`,
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tạo đơn vé.');
        } finally {
            setIsLoading(false);
        }
    };

    if (registrationResult?.paymentStatus === 'PENDING') {
        return (
            <div className="space-y-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
                <p className="m-0 font-bold text-orange-800">Thanh toán vé</p>
                <p className="m-0 text-orange-700">{Number(registrationResult.amountDue ?? ticketPrice).toLocaleString('vi-VN')} {registrationResult.currency ?? ticketCurrency}</p>
                <p className="m-0 break-all text-xs text-gray-600">Mã đối chiếu: {registrationResult.paymentReference}</p>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-orange-200 bg-white p-2">
                    <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                    <option value="VNPAY">VNPay</option>
                    <option value="MOMO">MoMo</option>
                </select>
                <button type="button" onClick={handlePayment} disabled={paying} className="w-full rounded-lg border-0 bg-[#F37021] px-3 py-2 font-bold text-white disabled:opacity-50">
                    {paying ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                </button>
                <button
                    type="button"
                    onClick={handleCancelTicket}
                    disabled={cancelling || paying}
                    className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 font-bold text-red-600 disabled:opacity-50"
                >
                    {cancelling ? 'Đang hủy vé...' : 'Hủy vé'}
                </button>
            </div>
        );
    }

    if (isPaidEvent && !paymentExempt) {
        const remainingTickets = Math.max(0, 4 - purchasedTicketCount);
        if (!showTicketOrder) {
            return (
                <div className="flex w-full flex-col gap-2">
                    {isRegistered && (
                        <button type="button" onClick={() => navigate('/member/tickets')} className="w-full rounded-lg border border-green-300 bg-white px-6 py-2.5 font-medium text-green-700 hover:bg-green-50">
                            Xem {purchasedTicketCount} vé đã đặt
                        </button>
                    )}
                    {remainingTickets > 0 && (
                        <button type="button" onClick={() => setShowTicketOrder(true)} className="w-full rounded-lg border-0 bg-[#F37021] px-6 py-2.5 font-medium text-white">
                            Mua vé · còn tối đa {remainingTickets} vé/tài khoản
                        </button>
                    )}
                </div>
            );
        }
        return (
            <div className="w-full space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <p className="m-0 font-bold text-orange-900">Đặt vé theo nhóm</p>
                    <select value={participants.length} onChange={(event) => updateTicketQuantity(event.target.value)} className="rounded-lg border border-orange-200 bg-white px-3 py-2">
                        {Array.from({ length: remainingTickets }, (_, index) => index + 1).map((quantity) => (
                            <option key={quantity} value={quantity}>{quantity} vé</option>
                        ))}
                    </select>
                </div>
                {participants.map((participant, index) => (
                    <div key={index} className="space-y-2 rounded-lg border border-orange-100 bg-white p-3">
                        <p className="m-0 font-semibold text-gray-800">Người tham gia {index + 1}</p>
                        <input value={participant.fullName} onChange={(event) => updateParticipant(index, 'fullName', event.target.value)} placeholder="Họ và tên" className="w-full rounded-lg border border-gray-200 p-2" />
                        <input type="email" value={participant.email} onChange={(event) => updateParticipant(index, 'email', event.target.value)} placeholder="Email" className="w-full rounded-lg border border-gray-200 p-2" />
                        <input value={participant.phone} onChange={(event) => updateParticipant(index, 'phone', event.target.value)} placeholder="Số điện thoại" className="w-full rounded-lg border border-gray-200 p-2" />
                        <input value={participant.studentId} onChange={(event) => updateParticipant(index, 'studentId', event.target.value)} placeholder="MSSV (nếu là sinh viên FPTU)" className="w-full rounded-lg border border-gray-200 p-2" />
                    </div>
                ))}
                <div className="flex items-center justify-between font-semibold text-orange-900">
                    <span>Tổng thanh toán</span>
                    <span>{(Number(ticketPrice || 0) * participants.length).toLocaleString('vi-VN')} {ticketCurrency}</span>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setShowTicketOrder(false)} className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700">Quay lại</button>
                    <button type="button" onClick={handleCreateTicketOrder} disabled={isLoading} className="flex-1 rounded-lg border-0 bg-[#F37021] px-3 py-2 font-bold text-white disabled:opacity-50">
                        {isLoading ? 'Đang giữ chỗ...' : 'Tạo đơn vé'}
                    </button>
                </div>
            </div>
        );
    }

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
                <><i className="fas fa-ticket-alt"></i> {
                    isPaidEvent && !paymentExempt
                        ? `Mua vé · ${Number(ticketPrice || 0).toLocaleString('vi-VN')} ${ticketCurrency}`
                        : paymentExempt
                            ? 'Đăng ký miễn phí · Trưởng/Phó CLB tổ chức'
                            : 'Đăng Ký Tham Gia'
                }</>
            )}
        </button>
    );
};

export default EventRegistrationBtn;
