// Phải khớp với backend: com.fptu.fcms.service.event.RefundPolicyCalculator (TIME_BASED_REFUND_V2).
// Mức hoàn được quyết định bởi TRẠNG THÁI sự kiện tại thời điểm huỷ, không phải bởi so sánh với
// một mốc thời gian. Còn mở đăng ký => ghế bán lại được => hoàn đủ. Đóng rồi => bậc thang theo
// giờ bắt đầu.
const REGISTRATION_OPEN_STATUSES = ['RegistrationOpen', 'REGISTRATION_OPEN', 'REGISTRATIONOPEN'];

export const isRegistrationOpen = (eventStatus) =>
  REGISTRATION_OPEN_STATUSES.includes(String(eventStatus ?? ''));

export const getRefundPolicyPreview = (eventStart, baseAmount = 0, eventStatus = null, now = Date.now()) => {
  const amountOf = (rate) => Math.round((Math.max(0, Number(baseAmount) || 0) * rate) / 100);

  if (isRegistrationOpen(eventStatus)) {
    return { rate: 100, amount: amountOf(100), label: 'Đang mở đăng ký' };
  }

  const startTime = new Date(eventStart).getTime();
  const remainingMs = Number.isFinite(startTime) ? startTime - now : 0;
  const hour = 60 * 60 * 1000;
  let rate = 0;
  let label = 'Dưới 24 giờ trước sự kiện';

  if (remainingMs >= 7 * 24 * hour) {
    rate = 100;
    label = 'Từ 7 ngày trước sự kiện';
  } else if (remainingMs >= 3 * 24 * hour) {
    rate = 75;
    label = 'Từ 3 đến dưới 7 ngày trước sự kiện';
  } else if (remainingMs >= 24 * hour) {
    rate = 50;
    label = 'Từ 24 giờ đến dưới 3 ngày trước sự kiện';
  }

  return { rate, amount: amountOf(rate), label };
};

// Câu giải thích "mức này giữ tới bao giờ" — đây là chỗ duy nhất mốc đóng đăng ký còn vai trò:
// để nói cho người dùng biết khi nào mức hoàn sẽ giảm, chứ không tham gia vào phép tính.
export const getRefundPolicyHint = (eventStatus, registrationCloseAt) => {
  if (!isRegistrationOpen(eventStatus)) {
    return 'Đăng ký đã đóng, mức hoàn giảm dần theo số ngày còn lại tới giờ bắt đầu sự kiện.';
  }
  const closeAt = registrationCloseAt ? new Date(registrationCloseAt) : null;
  if (!closeAt || Number.isNaN(closeAt.getTime())) {
    return 'Mức này được giữ trong lúc sự kiện còn mở đăng ký.';
  }
  const formatted = closeAt.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return `Mức này được giữ tới khi đóng đăng ký lúc ${formatted}, sau đó giảm dần theo số ngày còn lại tới giờ bắt đầu.`;
};
