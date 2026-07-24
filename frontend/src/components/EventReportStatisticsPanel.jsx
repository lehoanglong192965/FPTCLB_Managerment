import { BarChart3, Banknote, MessageSquareText, TicketCheck, UserCheck, Users } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return numberFormatter.format(Number(value ?? 0));
}

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
}

function formatMoney(value, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function snapshotToStatistics(report) {
  return {
    totalRegistrations: report?.snapshotTotalRegistrations,
    confirmedRegistrations: report?.snapshotConfirmedRegistrations,
    cancelledRegistrations: report?.snapshotCancelledRegistrations,
    fptuRegistrations: report?.snapshotFptuRegistrations,
    guestRegistrations: report?.snapshotGuestRegistrations,
    pendingPaymentCount: report?.snapshotPendingPaymentCount,
    paidTicketCount: report?.snapshotPaidTicketCount,
    revenue: report?.snapshotRevenue,
    currency: report?.snapshotCurrency,
    attendanceSessionCount: report?.snapshotAttendanceSessionCount,
    attendanceSessionsClosed: true,
    presentParticipants: report?.snapshotPresentParticipants,
    absentParticipants: report?.snapshotAbsentParticipants,
    walkInParticipants: report?.snapshotWalkInParticipants,
    attendanceRate: report?.snapshotAttendanceRate,
    feedbackCount: report?.snapshotFeedbackCount,
    averageOverallRating: report?.snapshotAverageRating,
    feedbackResponseRate: report?.snapshotFeedbackResponseRate,
    plannedBudget: report?.snapshotPlannedBudget,
    calculatedAt: report?.snapshotGeneratedAt,
  };
}

export default function EventReportStatisticsPanel({ statistics, snapshot = false }) {
  const data = snapshot ? snapshotToStatistics(statistics) : statistics;
  if (!data) return null;

  const cards = [
    { label: 'Đăng ký hợp lệ', value: formatNumber(data.confirmedRegistrations), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Đã tham dự', value: formatNumber(data.presentParticipants), icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tỷ lệ tham dự', value: formatPercent(data.attendanceRate), icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Khách ngoài/FPTU', value: `${formatNumber(data.guestRegistrations)} / ${formatNumber(data.fptuRegistrations)}`, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Doanh thu vé', value: formatMoney(data.revenue, data.currency), icon: Banknote, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Đánh giá trung bình', value: `${Number(data.averageOverallRating ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/5`, icon: MessageSquareText, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Dữ liệu tổng hợp từ hệ thống</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {snapshot ? 'Snapshot được khóa tại thời điểm leader nộp báo cáo.' : 'Số liệu chỉ đọc, được tính trực tiếp từ dữ liệu sự kiện.'}
          </p>
        </div>
        {data.calculatedAt && (
          <span className="text-[11px] text-gray-400 whitespace-nowrap">
            {new Date(data.calculatedAt).toLocaleString('vi-VN')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 truncate">{label}</p>
              <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-gray-600">
        <span>Tổng lượt đăng ký: <strong>{formatNumber(data.totalRegistrations)}</strong></span>
        <span>Đã hủy/từ chối: <strong>{formatNumber(data.cancelledRegistrations)}</strong></span>
        <span>Vắng mặt: <strong>{formatNumber(data.absentParticipants)}</strong></span>
        <span>Walk-in: <strong>{formatNumber(data.walkInParticipants)}</strong></span>
        <span>Vé đã thanh toán: <strong>{formatNumber(data.paidTicketCount)}</strong></span>
        <span>Phản hồi: <strong>{formatNumber(data.feedbackCount)}</strong></span>
        <span>Tỷ lệ phản hồi: <strong>{formatPercent(data.feedbackResponseRate)}</strong></span>
        <span>Ngân sách dự kiến: <strong>{formatMoney(data.plannedBudget, 'VND')}</strong></span>
      </div>

      {!snapshot && (!data.attendanceSessionsClosed || Number(data.pendingPaymentCount) > 0) && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
          <TicketCheck size={14} className="shrink-0 mt-0.5" />
          <span>
            {!data.attendanceSessionsClosed && 'Cần đóng tất cả phiên điểm danh. '}
            {Number(data.pendingPaymentCount) > 0 && `Còn ${formatNumber(data.pendingPaymentCount)} giao dịch chờ thanh toán hoặc xác minh.`}
          </span>
        </div>
      )}
    </section>
  );
}
