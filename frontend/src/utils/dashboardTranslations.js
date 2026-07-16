const TEXT = {
  "N/A": "Chưa có",
  "No data": "Không có dữ liệu",
  "No records": "Không có dữ liệu",
  "No previous semester": "Không có học kỳ trước",

  Continue: "Tiếp tục",
  "Continue with Improvement Plan": "Tiếp tục kèm kế hoạch cải thiện",
  Warning: "Cảnh báo",
  Suspend: "Tạm ngưng",
  Close: "Đóng CLB",

  GOOD: "Tốt",
  WATCH: "Cần theo dõi",
  RISK: "Rủi ro",
  INFO: "Thông tin",
  EMPTY: "Chưa có",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  UNKNOWN: "Không xác định",
  TOP: "Nổi bật",
  LOW_SCORE: "Điểm thấp",
  NO_ACTIVITY: "Chưa hoạt động",
  MISSING_REPORT: "Thiếu báo cáo",
  REPORT_REJECTED: "Báo cáo bị từ chối",
  CONTRIBUTION_NOT_FINALIZED: "Chưa chốt điểm",

  CRITICAL: "Nghiêm trọng",
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",

  DRAFT: "Bản nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  REGISTRATION_OPEN: "Đang mở đăng ký",
  REGISTRATION_CLOSED: "Đã đóng đăng ký",
  ONGOING: "Đang diễn ra",
  CHECKIN_OPEN: "Đang mở điểm danh",
  COMPLETED: "Đã hoàn thành",
  REPORT_UPLOADED: "Đã nộp báo cáo",
  REPORT_PENDING_APPROVAL: "Báo cáo chờ duyệt",
  REPORT_APPROVED: "Báo cáo đã duyệt",
  CONTRIBUTION_DRAFT: "Nháp điểm đóng góp",
  CONTRIBUTION_PENDING_APPROVAL: "Điểm đóng góp chờ duyệt",
  CONTRIBUTION_APPROVED: "Điểm đóng góp đã duyệt",
  CONTRIBUTION_SCORING: "Đang chấm điểm",
  CONTRIBUTION_FINALIZED: "Đã chốt điểm",
  FINALIZED: "Đã chốt",
  UPLOADED: "Đã tải lên",
  PRESENT: "Có mặt",
  ABSENT: "Vắng mặt",
  REGISTERED: "Đã đăng ký",
  CONFIRMED: "Đã xác nhận",
  PROMOTED: "Đã chuyển thành thành viên",
  WITHDRAWN: "Đã rút",
  INTERVIEWING: "Đang phỏng vấn",
  PASSED: "Đạt",
  FAILED: "Không đạt",
  GUEST: "Khách",
  SCHOOL_MEMBER: "Sinh viên trường",
  CLUB_MEMBER: "Thành viên CLB",
  Leader: "Chủ nhiệm",
  "Vice Leader": "Phó chủ nhiệm",
  Member: "Thành viên",
  "Club Member": "Thành viên CLB",

  members: "thành viên",
  events: "sự kiện",
  reports: "báo cáo",
  violations: "vi phạm",
  points: "điểm",

  "No ICPDP evaluation saved yet": "Chưa có đánh giá ICPDP",
  "High confidence. No major warning generated from available data.": "Độ tin cậy cao. Dữ liệu hiện có không phát sinh cảnh báo lớn.",
  "Medium confidence. Review warnings and data gaps before final decision.": "Độ tin cậy trung bình. Cần rà soát cảnh báo và dữ liệu thiếu trước khi quyết định cuối cùng.",
  "Average contribution below threshold": "Điểm đóng góp trung bình dưới ngưỡng",
  "No event registration or present attendance in semester": "Không có đăng ký sự kiện hoặc lượt có mặt trong học kỳ",
  "High contribution score": "Điểm đóng góp cao",
  "Ended event has no report": "Sự kiện đã kết thúc nhưng chưa có báo cáo",
};

const METRIC_LABELS = {
  totalMembers: "Tổng thành viên",
  activeMembers: "Thành viên hoạt động",
  activeMemberRate: "Tỷ lệ thành viên hoạt động",
  approvedEvents: "Sự kiện đã duyệt",
  completedEvents: "Sự kiện hoàn thành",
  eventCompletionRate: "Tỷ lệ hoàn thành sự kiện",
  attendanceRate: "Tỷ lệ tham dự",
  averageContributionScore: "Điểm đóng góp trung bình",
  overdueReports: "Báo cáo thiếu hoặc trễ",
  activeViolations: "Vi phạm còn hiệu lực",
  clubKpiScore: "Điểm KPI CLB",
  evaluationStatus: "Đánh giá mới nhất",
  systemSuggestion: "Đề xuất hệ thống",
  kpiChange: "Thay đổi KPI",
  eventCompletion: "Hoàn thành sự kiện",
  activeMember: "Thành viên hoạt động",
  attendance: "Tham dự",
  reportOnTime: "Báo cáo đúng hạn",
  contribution: "Đóng góp",
  compliance: "Tuân thủ",
  completedEventsComparison: "Sự kiện hoàn thành",
  lateReports: "Báo cáo trễ",
  averageContribution: "Điểm đóng góp trung bình",
};

const FORMULAS = {
  totalMembers: "Số membership của CLB trong học kỳ đã chọn",
  activeMembers: "Thành viên có đăng ký, điểm danh hoặc điểm đóng góp",
  activeMemberRate: "Thành viên hoạt động / tổng thành viên",
  approvedEvents: "Sự kiện trong các trạng thái đã được duyệt",
  completedEvents: "Sự kiện đã hoàn thành hoặc ở bước sau đó",
  eventCompletionRate: "Sự kiện hoàn thành / sự kiện đã duyệt",
  attendanceRate: "Có mặt / tổng bản ghi điểm danh",
  averageContributionScore: "Trung bình điểm đóng góp cuối cùng",
  overdueReports: "Báo cáo thiếu + báo cáo trễ hạn",
  activeViolations: "DisciplineLog còn hiệu lực của thành viên CLB",
  clubKpiScore: "Công thức KPI có trọng số do backend tính",
  evaluationStatus: "Đánh giá ClubEvaluation mới nhất trong học kỳ",
  systemSuggestion: "Điểm KPI + mức độ cảnh báo",
  kpiChange: "KPI hiện tại - KPI học kỳ trước",
  eventCompletion: "Sự kiện hoàn thành / sự kiện đã duyệt",
  activeMember: "Thành viên hoạt động / tổng thành viên",
  attendance: "Có mặt / tổng bản ghi điểm danh",
  reportOnTime: "Báo cáo đúng hạn / báo cáo cần nộp",
  contribution: "Điểm đóng góp trung bình chuẩn hóa về 100",
  compliance: "100 - điểm trừ do vi phạm còn hiệu lực",
};

const WARNING_TYPES = {
  NO_VALID_LEADER: "Không có chủ nhiệm hợp lệ",
  LOW_MEMBER_COUNT: "Số lượng thành viên thấp",
  NO_APPROVED_EVENTS: "Không có sự kiện đã duyệt",
  REPORT_SLA: "Báo cáo thiếu hoặc trễ hạn",
  LOW_ATTENDANCE: "Tỷ lệ tham dự thấp",
  DISCIPLINED_BOARD_MEMBER: "Ban điều hành đang bị kỷ luật",
  KPI_DROP: "KPI giảm mạnh",
};

const WARNING_MESSAGES = {
  "Club has no valid Leader in this semester.": "CLB chưa có chủ nhiệm hợp lệ trong học kỳ này.",
  "Club has fewer members than the configured minimum.": "Số thành viên CLB thấp hơn ngưỡng tối thiểu đã cấu hình.",
  "No approved events found for this semester.": "Không có sự kiện đã duyệt trong học kỳ này.",
  "There are missing or late event reports.": "Có báo cáo sự kiện bị thiếu hoặc nộp trễ.",
  "Attendance rate is below the configured threshold.": "Tỷ lệ tham dự thấp hơn ngưỡng đã cấu hình.",
  "Leader or Vice Leader has active discipline.": "Chủ nhiệm hoặc phó chủ nhiệm đang có kỷ luật còn hiệu lực.",
  "KPI dropped by at least 20 points compared with previous semester.": "KPI giảm ít nhất 20 điểm so với học kỳ trước.",
};

const API_MESSAGES = {
  "Cannot load dashboard filters.": "Không thể tải bộ lọc dashboard.",
  "Cannot load dashboard.": "Không thể tải dữ liệu dashboard.",
  "Cannot save evaluation.": "Không thể lưu đánh giá.",
  "Evaluation saved.": "Đã lưu đánh giá.",
  "Network Error": "Không thể kết nối máy chủ.",
  "finalDecision is required": "Vui lòng chọn quyết định cuối cùng.",
  "Unsupported finalDecision": "Quyết định cuối cùng không hợp lệ.",
  "decisionReason is required for Suspend or Close": "Cần nhập lý do khi tạm ngưng hoặc đóng CLB.",
  "improvementRequirements is required for this decision": "Cần nhập yêu cầu cải thiện cho quyết định này.",
  "improvementDeadline is required for this decision": "Cần nhập hạn cải thiện cho quyết định này.",
  "improvementDeadline cannot be in the past": "Hạn cải thiện không được nằm trong quá khứ.",
};

export function translateDashboardText(value) {
  if (value === null || value === undefined || value === "") return "Chưa có";
  return TEXT[value] ?? value;
}

export function translateDecision(value) {
  return translateDashboardText(value);
}

export function translateStatus(value) {
  return translateDashboardText(value);
}

export function translateSeverity(value) {
  return translateDashboardText(value);
}

export function translateWarningType(value) {
  return WARNING_TYPES[value] ?? translateDashboardText(value);
}

export function translateWarningMessage(value) {
  return WARNING_MESSAGES[value] ?? translateDashboardText(value);
}

export function translateMetricLabel(key, fallback) {
  return METRIC_LABELS[key] ?? translateDashboardText(fallback);
}

export function translateFormula(key, fallback) {
  return FORMULAS[key] ?? translateDashboardText(fallback);
}

export function translateUnit(unit) {
  return translateDashboardText(unit);
}

export function translateChartLabel(label) {
  return translateDashboardText(label);
}

export function translateAttentionReason(reason) {
  if (typeof reason === "string" && reason.startsWith("Contribution batch status: ")) {
    const status = reason.replace("Contribution batch status: ", "");
    return `Trạng thái chấm điểm: ${translateStatus(status)}`;
  }
  return translateDashboardText(reason);
}

export function translateApiMessage(message) {
  return API_MESSAGES[message] ?? translateDashboardText(message);
}
