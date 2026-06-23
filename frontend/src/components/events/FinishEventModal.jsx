import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import eventService from '../../services/api/events/eventService';

const FinishEventModal = ({ eventId, isOpen, onClose, onFinishSuccess }) => {
    const { addNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFinish = async () => {
        setIsLoading(true);
        try {
            await eventService.finish(eventId);
            addNotification('Đã khóa sổ sự kiện. Hệ thống đang tự động đánh vắng mặt những người không tham gia.', 'success');
            if (onFinishSuccess) onFinishSuccess();
            onClose();
        } catch (error) {
            addNotification(error.response?.data?.message || 'Lỗi khi kết thúc sự kiện.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Kết Thúc Sự Kiện?</h2>
                    <p className="text-gray-500 mt-2">
                        Hành động này sẽ <strong className="text-red-600">Khóa sổ điểm danh</strong> ngay lập tức. Những người có đăng ký nhưng chưa check-in sẽ bị hệ thống tự động ghi nhận là <strong className="text-gray-800">Vắng mặt (ABSENT)</strong>.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        Bạn không thể hoàn tác hành động này.
                    </p>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-md flex items-center gap-2"
                    >
                        {isLoading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</>
                        ) : (
                            <><i className="fas fa-lock"></i> Xác nhận Kết thúc</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinishEventModal;
