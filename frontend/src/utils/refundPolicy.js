export const getRefundPolicyPreview = (eventStart, baseAmount = 0, now = Date.now()) => {
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

  const amount = Math.round((Math.max(0, Number(baseAmount) || 0) * rate) / 100);
  return { rate, amount, label };
};

