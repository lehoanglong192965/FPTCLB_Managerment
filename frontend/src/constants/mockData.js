// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA TẬP TRUNG — Sprint 0
// Dùng cho tất cả stub pages cho đến khi API thật sẵn sàng.
// Shape của mỗi object khớp với response mà service file tương ứng sẽ trả về.
// Khi tích hợp API thật: xoá import mock + thêm useEffect gọi service.
// ─────────────────────────────────────────────────────────────────────────────

// ── GUEST (Sprint 4 — guestService) ──────────────────────────────────────────

export const MOCK_GUEST_EVENT = {
  eventId: 1,
  eventName: 'Hackathon FPT 2026 – Build The Future',
  clubName: 'FPT Coder',
  startDate: '15/08/2026 08:00',
  endDate: '16/08/2026 20:00',
  location: 'Hội trường A – ĐH FPT Hà Nội',
  availableSlots: 12,
  maxParticipants: 200,
};

export const MOCK_GUEST_REGISTRATION = {
  guestRef: 'GUEST-2026-001234',
  fullName: 'Nguyễn Văn A',
  email: 'exa***@gmail.com',
  phone: '09***6789',
  status: 'CONFIRMED',        // PENDING_VERIFICATION | CONFIRMED | WAITLISTED | CANCELLED
  event: MOCK_GUEST_EVENT,
  registeredAt: '01/07/2026 09:30',
};

// ── ATTENDANCE (Sprint 5 — attendanceService) ─────────────────────────────────

export const MOCK_ATTENDANCE_SESSIONS = [
  {
    sessionId: 1,
    eventId: 1,
    sessionName: 'Phiên sáng',
    status: 'CLOSED',         // PENDING | OPEN | CLOSED
    openedAt: '08:00',
    closedAt: '12:00',
    totalCheckedIn: 142,
    totalAbsent: 18,
  },
  {
    sessionId: 2,
    eventId: 1,
    sessionName: 'Phiên chiều',
    status: 'OPEN',
    openedAt: '13:00',
    closedAt: null,
    totalCheckedIn: 87,
    totalAbsent: 0,
  },
];

export const MOCK_ATTENDANCE_RECORDS = [
  { recordId: 1, userId: 101, fullName: 'Trần Thị B',  studentId: 'SE150042', status: 'PRESENT', checkedInAt: '08:05', method: 'MANUAL' },
  { recordId: 2, userId: 102, fullName: 'Lê Văn C',    studentId: 'SE150078', status: 'LATE',    checkedInAt: '08:47', method: 'MANUAL' },
  { recordId: 3, userId: 103, fullName: 'Phạm Thị D',  studentId: 'SE150091', status: 'ABSENT',  checkedInAt: null,    method: null      },
  { recordId: 4, userId: 104, fullName: 'Nguyễn Văn E',studentId: 'SE150120', status: 'PRESENT', checkedInAt: '08:12', method: 'MANUAL' },
];

export const MOCK_ATTENDANCE_SUMMARY = {
  eventId: 1,
  sessionId: 1,
  totalRegistered: 160,
  totalPresent: 130,
  totalLate: 12,
  totalAbsent: 18,
  attendanceRate: 88.75,
};

// ── WALK-IN (Sprint 5 — walkInService) ───────────────────────────────────────

export const MOCK_WALKIN_LOG = [
  { id: 1, fullName: 'Nguyễn Văn A',  studentId: 'SE150001', type: 'FPTU',  checkInAt: '08:05' },
  { id: 2, fullName: 'Trần Thị B',    studentId: 'SE150042', type: 'FPTU',  checkInAt: '08:12' },
  { id: 3, fullName: 'John Smith',     studentId: null,        type: 'GUEST', checkInAt: '08:20' },
];

// ── REPORT (Sprint 6 — reportService) ────────────────────────────────────────

export const MOCK_EVENT_REPORT = {
  reportId: 1,
  eventId: 1,
  reportUrl: '/uploads/bao-cao-hackathon-2026.pdf',
  summary: 'Sự kiện diễn ra thành công với 142/160 người tham dự. Các đội đã hoàn thành 24 giờ lập trình marathon và trình bày sản phẩm trước ban giám khảo.',
  uploadedBy: 5,
  uploadedAt: '17/08/2026 10:00',
  status: 'PENDING_REVIEW',   // PENDING_REVIEW | APPROVED | REJECTED
  rejectionReason: null,
};

export const MOCK_PENDING_REPORTS = [
  { reportId: 1, eventId: 1, eventName: 'Hackathon FPT 2026', clubName: 'FPT Coder',   uploadedAt: '17/08/2026', status: 'PENDING_REVIEW' },
  { reportId: 2, eventId: 2, eventName: 'Workshop UI/UX',      clubName: 'FPT Design',  uploadedAt: '25/06/2026', status: 'PENDING_REVIEW' },
];

// ── CONTRIBUTION (Sprint 6 — contributionService) ────────────────────────────

export const MOCK_CONTRIBUTIONS = [
  { userId: 5,  fullName: 'Nguyễn Leader',  role: 'Trưởng BTC', tier: 'A', rationale: 'Điều phối toàn bộ sự kiện',        appealStatus: null       },
  { userId: 6,  fullName: 'Trần Vice',       role: 'Phó BTC',    tier: 'A', rationale: 'Hỗ trợ logistics xuyên suốt',     appealStatus: null       },
  { userId: 7,  fullName: 'Lê Thành Viên',  role: 'Hỗ trợ',    tier: 'B', rationale: 'Tham gia đầy đủ các ca trực',      appealStatus: 'PENDING'  },
  { userId: 8,  fullName: 'Phạm Nhân Sự',   role: 'Hỗ trợ',    tier: 'C', rationale: 'Vắng một buổi không báo',          appealStatus: null       },
];

export const MOCK_APPEALS = [
  {
    appealId: 1,
    userId: 7,
    fullName: 'Lê Thành Viên',
    currentTier: 'B',
    requestedTier: 'A',
    reason: 'Tôi đã tham gia đầy đủ và hỗ trợ setup từ 6 giờ sáng, xin xem xét lại.',
    status: 'PENDING',       // PENDING | ACCEPTED | REJECTED
    submittedAt: '18/08/2026 08:30',
  },
];

// ── FEEDBACK (Sprint 7 — feedbackService) ────────────────────────────────────

export const MOCK_FEEDBACK_SUMMARY = {
  eventId: 1,
  totalResponses: 98,
  sampleStatus: 'SUFFICIENT',  // SUFFICIENT | INSUFFICIENT_SAMPLE
  averageScores: {
    organization: 4.3,
    content:      4.5,
    venue:        4.1,
    overall:      4.4,
  },
  overallAverage: 4.33,
  isIncludedInExternalScore: true,
};

export const MOCK_FEEDBACK_ELIGIBILITY = {
  eligible: true,
  reason: null,              // null nếu eligible; string nếu không (vd: 'ALREADY_SUBMITTED', 'NOT_ATTENDED')
  attendanceStatus: 'PRESENT',
};

// ── COMPETITION (Sprint 8 — competitionService) ───────────────────────────────

export const MOCK_COMPETITIONS = [
  {
    competitionId: 1,
    title: 'Cuộc Thi CLB Xuất Sắc – HK1 2026',
    semester: 'HK1 2026-2027',
    semesterId: 3,
    status: 'Draft',          // Draft | Approved | Published | Closed
    clubCount: 12,
    createdAt: '01/07/2026',
  },
  {
    competitionId: 2,
    title: 'Cuộc Thi CLB Xuất Sắc – HK2 2025',
    semester: 'HK2 2025-2026',
    semesterId: 2,
    status: 'Published',
    clubCount: 15,
    createdAt: '10/01/2026',
  },
  {
    competitionId: 3,
    title: 'Cuộc Thi CLB Xuất Sắc – HK1 2025',
    semester: 'HK1 2025-2026',
    semesterId: 1,
    status: 'Closed',
    clubCount: 14,
    createdAt: '01/07/2025',
  },
];

export const MOCK_COMPETITION_SCORES = [
  { clubId: 1, clubName: 'FPT Coder',   activity: 22, feedback: 18, participation: 14, engagement: 20, compliance: 13, total: 87, rank: 1 },
  { clubId: 2, clubName: 'FPT Design',  activity: 20, feedback: 16, participation: 12, engagement: 18, compliance: 15, total: 81, rank: 2 },
  { clubId: 3, clubName: 'FPT AI Club', activity: 18, feedback: 14, participation: 13, engagement: 16, compliance: 12, total: 73, rank: 3 },
  { clubId: 4, clubName: 'FPT English', activity: 15, feedback: 12, participation: 10, engagement: 14, compliance: 10, total: 61, rank: 4 },
];

export const MOCK_COMPETITION_AWARDS = [
  { rank: 1, clubName: 'FPT Coder',  leaderName: 'Nguyễn A', viceLeaderName: 'Trần B', award: 'Giải Nhất — CLB Xuất Sắc' },
  { rank: 2, clubName: 'FPT Design', leaderName: 'Lê C',      viceLeaderName: 'Phạm D', award: 'Giải Nhì — CLB Xuất Sắc'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE DATA (giữ nguyên từ trước)
// ─────────────────────────────────────────────────────────────────────────────

export const STATS = [
  { value: "5K+",  label: "Thành viên"   },
  { value: "120+", label: "Sự kiện/năm" },
];

export const CLUBS = [
  {
    emoji: "💻",
    color: "#1C3F94",
    name: "CLB Lập Trình FPT",
    abbr: "FPT Coder",
    categoryCode: "IT",
    desc: "Nơi hội tụ những lập trình viên đam mê công nghệ, cùng nhau xây dựng dự án thực tế.",
    members: 320,
    tag: "Công nghệ",
    recruiting: true,
  },
  {
    emoji: "🎨",
    color: "#9B2335",
    name: "CLB Thiết Kế Sáng Tạo",
    abbr: "FPT Design",
    categoryCode: "Design",
    desc: "Khơi dậy năng lực sáng tạo qua UI/UX, đồ họa, và nghệ thuật số hiện đại.",
    members: 185,
    tag: "Thiết kế",
    recruiting: false,
  },
  {
    emoji: "🎤",
    color: "#5C3D99",
    name: "CLB Kỹ Năng Mềm",
    abbr: "FPT Skill",
    categoryCode: "Skill",
    desc: "Rèn luyện thuyết trình, lãnh đạo, giao tiếp và xây dựng tư duy phát triển.",
    members: 240,
    tag: "Kỹ năng",
    recruiting: true,
  },
  {
    emoji: "🤖",
    color: "#0A7A6B",
    name: "CLB Trí Tuệ Nhân Tạo",
    abbr: "FPT AI Club",
    categoryCode: "AI",
    desc: "Nghiên cứu và ứng dụng Machine Learning, Deep Learning vào các bài toán thực tế.",
    members: 150,
    tag: "AI & Data",
    recruiting: true,
  },
  {
    emoji: "🏆",
    color: "#D4770A",
    name: "CLB Khởi Nghiệp",
    abbr: "FPT StartUp",
    categoryCode: "Biz",
    desc: "Ươm mầm ý tưởng kinh doanh, kết nối mentor và cộng đồng startup năng động.",
    members: 210,
    tag: "Business",
    recruiting: false,
  },
  {
    emoji: "🌍",
    color: "#1A6B3C",
    name: "CLB Tiếng Anh",
    abbr: "FPT English",
    categoryCode: "Lang",
    desc: "Nâng cao kỹ năng tiếng Anh toàn diện qua debate, storytelling và giao lưu quốc tế.",
    members: 280,
    tag: "Ngôn ngữ",
    recruiting: true,
  },
  {
    emoji: "📸",
    color: "#7A2D8A",
    name: "CLB Nhiếp Ảnh",
    abbr: "FPT Lens",
    categoryCode: "Art",
    desc: "Khai phá ngôn ngữ hình ảnh, từ chụp chân dung đến nhiếp ảnh đường phố đô thị.",
    members: 130,
    tag: "Nghệ thuật",
    recruiting: false,
  },
  {
    emoji: "⚽",
    color: "#1A6095",
    name: "CLB Thể Thao",
    abbr: "FPT Sport",
    categoryCode: "Sport",
    desc: "Giao lưu và thi đấu các môn thể thao: bóng đá, cầu lông, bơi lội và nhiều hơn nữa.",
    members: 400,
    tag: "Thể thao",
    recruiting: false,
  },
];

export const EVENTS = [
  {
    emoji: "💻",
    color: "#1C3F94",
    title: "Hackathon FPT 2025 – Build The Future",
    club: "FPT Coder",
    date: "15/6/2025",
    time: "08:00",
    venue: "Hội trường A",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 180,
    maxParticipants: 200,
    desc: "48 giờ lập trình marathon, giải thưởng lên đến 50 triệu đồng cho đội chiến thắng.",
    longDesc: "Đây là cơ hội tuyệt vời để sinh viên giao lưu, học hỏi và phát triển kỹ năng trong môi trường thực tế. Sự kiện mở cửa cho tất cả sinh viên FPTU.",
    badge: "Đăng ký mở",
    badgeType: "open",
  },
  {
    emoji: "🎨",
    color: "#9B2335",
    title: "Workshop: UI/UX Design với Figma 2025",
    club: "FPT Design",
    date: "22/6/2025",
    time: "14:00",
    venue: "Phòng Lab 3",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 45,
    maxParticipants: 80,
    desc: "Học kỹ năng thiết kế giao diện chuyên nghiệp từ chuyên gia hàng đầu trong ngành.",
    longDesc: "Workshop thực hành trực tiếp trên Figma, từ wireframe đến prototype hoàn chỉnh. Phù hợp với cả người mới bắt đầu lẫn những ai muốn nâng cao kỹ năng thiết kế.",
    badge: "Sắp diễn ra",
    badgeType: "upcoming",
  },
  {
    emoji: "🤖",
    color: "#0A7A6B",
    title: "Toạ đàm: AI & Tương Lai Nghề Nghiệp",
    club: "FPT AI Club",
    date: "28/6/2025",
    time: "09:00",
    venue: "Hội trường B",
    venueDetail: "Đại học FPT TP.HCM",
    currentParticipants: 90,
    maxParticipants: 150,
    desc: "Chuyên gia chia sẻ xu hướng AI và cách sinh viên chuẩn bị cho kỷ nguyên tự động hoá.",
    longDesc: "Sự kiện quy tụ các chuyên gia hàng đầu trong lĩnh vực AI để chia sẻ về xu hướng công nghệ và định hướng nghề nghiệp. Đây là cơ hội kết nối trực tiếp với các doanh nghiệp công nghệ lớn.",
    badge: "Sắp diễn ra",
    badgeType: "upcoming",
  },
  {
    emoji: "🌍",
    color: "#1A6B3C",
    title: "FPT English Debate Championship 2025",
    club: "FPT English",
    date: "5/7/2025",
    time: "08:30",
    venue: "Sân khấu chính",
    venueDetail: "Đại học FPT Đà Nẵng",
    currentParticipants: 120,
    maxParticipants: 120,
    desc: "Giải tranh biện tiếng Anh thường niên với sự tham gia của 20+ đội thi từ các trường.",
    longDesc: "Cuộc thi tranh biện tiếng Anh quy mô lớn nhất năm, quy tụ các đội thi xuất sắc từ nhiều trường đại học. Ban giám khảo gồm các chuyên gia ngôn ngữ và doanh nhân quốc tế.",
    badge: "Hết chỗ",
    badgeType: "full",
  },
  {
    emoji: "🏆",
    color: "#D4770A",
    title: "Startup Pitch Night – Season 3",
    club: "FPT StartUp",
    date: "12/7/2025",
    time: "18:00",
    venue: "Innovation Hub",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 60,
    maxParticipants: 100,
    desc: "Đêm gọi vốn với sự có mặt của 15 nhà đầu tư và mentor đến từ hệ sinh thái FPT.",
    longDesc: "Sân chơi dành cho các startup trẻ có cơ hội trình bày ý tưởng trực tiếp trước các nhà đầu tư và mentor giàu kinh nghiệm. Giải thưởng lên đến 100 triệu đồng cho ý tưởng xuất sắc nhất.",
    badge: "Đăng ký mở",
    badgeType: "open",
    tag: "Business",
  },
  {
    id: 3,
    emoji: "🎵",
    color: "#7c3aed",
    title: "Acoustic Night Vol.5",
    club: "FPTU Music Club",
    tag: "Âm nhạc",
    date: "22/06/2026",
    time: "18:30",
    venue: "Sân khấu ngoài trời",
    venueDetail: "Khuôn viên Đại học FPT",
    currentParticipants: 80,
    maxParticipants: 150,
    desc: "Đêm nhạc acoustic lần thứ 5 quy tụ những giọng ca tài năng từ các CLB âm nhạc FPTU.",
    longDesc: "Sự kiện âm nhạc thường niên dành cho những tâm hồn yêu âm nhạc. Acoustic Night Vol.5 hứa hẹn mang đến những tiết mục đặc sắc, không gian ấm cúng và cơ hội kết nối với cộng đồng yêu âm nhạc.",
    badge: "Đăng ký mở",
    badgeType: "open",
  },
  {
    id: 4,
    emoji: "⚽",
    color: "#d97706",
    title: "FPT Sport Festival 2026",
    club: "FPTU Sport Club",
    tag: "Thể thao",
    date: "28/06/2026",
    time: "07:00",
    venue: "Sân vận động FPTU",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 200,
    maxParticipants: 300,
    desc: "Lễ hội thể thao thường niên lớn nhất FPTU với hơn 10 môn thi đấu khác nhau.",
    longDesc: "FPT Sport Festival 2026 là sự kiện thể thao đỉnh cao quy tụ hàng trăm vận động viên sinh viên tranh tài ở nhiều bộ môn: bóng đá, cầu lông, bóng rổ, bơi lội và nhiều hơn nữa.",
    badge: "Đăng ký mở",
    badgeType: "open",
  },
  {
    id: 5,
    emoji: "🌍",
    color: "#059669",
    title: "English Debate Open",
    club: "FPTU English Club",
    tag: "Hội thảo",
    date: "01/07/2026",
    time: "14:00",
    venue: "Hội trường C",
    venueDetail: "Đại học FPT TP.HCM",
    currentParticipants: 45,
    maxParticipants: 60,
    desc: "Cuộc thi tranh biện tiếng Anh mở dành cho sinh viên tất cả các trường tại khu vực.",
    longDesc: "English Debate Open là đấu trường tranh biện tiếng Anh uy tín, nơi các bạn sinh viên thể hiện tư duy phản biện, kỹ năng lập luận và khả năng biểu đạt bằng tiếng Anh trong môi trường chuyên nghiệp.",
    badge: "Đăng ký mở",
    badgeType: "open",
  },
  {
    id: 6,
    emoji: "💃",
    color: "#e11d48",
    title: "Kpop Cover Contest",
    club: "FPTU Dance Club",
    tag: "Giải trí",
    date: "05/07/2026",
    time: "17:00",
    venue: "Sân khấu chính",
    venueDetail: "Khuôn viên Đại học FPT",
    currentParticipants: 30,
    maxParticipants: 50,
    desc: "Cuộc thi nhảy cover Kpop dành cho các nhóm sinh viên yêu thích văn hóa Hàn Quốc.",
    longDesc: "Kpop Cover Contest là sân chơi sôi động dành cho những ai đam mê nhảy và văn hóa Kpop. Các đội thi sẽ trình diễn các vũ đạo cover ấn tượng trước ban giám khảo và khán giả cổ vũ nhiệt tình.",
    badge: "Đăng ký mở",
    badgeType: "open",
  },
  {
    id: 7,
    emoji: "🔬",
    color: "#0284c7",
    title: "STEM Hackathon 2026",
    club: "FPTU Science Club",
    tag: "Công nghệ",
    date: "10/07/2026",
    time: "08:00",
    venue: "Phòng Lab STEM",
    venueDetail: "Đại học FPT Đà Nẵng",
    currentParticipants: 60,
    maxParticipants: 80,
    desc: "Hackathon STEM 24 giờ nơi sinh viên giải quyết bài toán khoa học thực tế.",
    longDesc: "STEM Hackathon 2026 là cuộc thi sáng tạo khoa học - kỹ thuật kéo dài 24 giờ. Các đội thi sẽ được thử thách với những bài toán thực tế trong các lĩnh vực: khoa học dữ liệu, vật lý ứng dụng và sinh học phân tử.",
    badge: "Sắp diễn ra",
    badgeType: "upcoming",
  },
  {
    id: 8,
    emoji: "🤝",
    color: "#16a34a",
    title: "Green Campus Day",
    club: "FPTU Volunteer Club",
    tag: "Cộng đồng",
    date: "12/07/2026",
    time: "08:00",
    venue: "Khuôn viên FPTU",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 120,
    maxParticipants: 200,
    desc: "Ngày hội môi trường xanh - cùng nhau làm sạch, trồng cây và lan tỏa lối sống bền vững.",
    longDesc: "Green Campus Day là hoạt động tình nguyện vì môi trường quy mô lớn. Sinh viên sẽ cùng nhau tham gia dọn dẹp khuôn viên, trồng cây xanh, và tham gia các workshop về lối sống bền vững.",
    badge: "Đăng ký mở",
    badgeType: "open",
  },
  {
    id: 9,
    emoji: "📹",
    color: "#9333ea",
    title: "Short Film Festival",
    club: "FPTU Media Club",
    tag: "Giải trí",
    date: "18/07/2026",
    time: "19:00",
    venue: "Rạp chiếu phim FPTU",
    venueDetail: "Đại học FPT TP.HCM",
    currentParticipants: 55,
    maxParticipants: 100,
    desc: "Liên hoan phim ngắn sinh viên với các tác phẩm độc đáo từ CLB truyền thông FPTU.",
    longDesc: "Short Film Festival là đêm chiếu phim đặc biệt giới thiệu các tác phẩm điện ảnh ngắn do sinh viên FPTU sáng tạo. Sự kiện quy tụ các nhà làm phim trẻ tài năng và mang đến những câu chuyện đầy cảm xúc.",
    badge: "Sắp diễn ra",
    badgeType: "upcoming",
  },
  {
    id: 10,
    emoji: "🎨",
    color: "#db2777",
    title: "Art Exhibition 2026",
    club: "FPTU Art Club",
    tag: "Giải trí",
    date: "20/07/2026",
    time: "10:00",
    venue: "Phòng triển lãm A",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 80,
    maxParticipants: 80,
    desc: "Triển lãm nghệ thuật sinh viên với hơn 100 tác phẩm hội họa, điêu khắc và nghệ thuật số.",
    longDesc: "Art Exhibition 2026 là sự kiện nghệ thuật lớn nhất trong năm của FPTU Art Club. Triển lãm quy tụ hơn 100 tác phẩm từ các nghệ sĩ sinh viên, bao gồm tranh sơn dầu, điêu khắc, nhiếp ảnh nghệ thuật và digital art.",
    badge: "Hết chỗ",
    badgeType: "full",
  },
  {
    id: 11,
    emoji: "💻",
    color: "#E6430A",
    title: "Code War 2026",
    club: "FPTU IT Club",
    tag: "Công nghệ",
    date: "15/07/2026",
    time: "15:00",
    venue: "Hall A",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 120,
    maxParticipants: 150,
    desc: "Cuộc thi lập trình tốc độ tranh tài giữa các lập trình viên sinh viên xuất sắc nhất FPTU.",
    longDesc: "Code War 2026 là giải đấu lập trình cạnh tranh thường niên, nơi các lập trình viên sinh viên đọ sức qua các bài toán thuật toán, cấu trúc dữ liệu và tư duy logic trong thời gian giới hạn.",
    badge: "Đăng ký mở",
    badgeType: "open",
    ticketStatus: "registered",
  },
  {
    id: 12,
    emoji: "🤖",
    color: "#0284c7",
    title: "Tech Talk: AI & LLM",
    club: "FPTU IT Club",
    tag: "Công nghệ",
    date: "20/06/2026",
    time: "09:00",
    venue: "Tòa nhà F – P.201",
    venueDetail: "Đại học FPT Hà Nội",
    currentParticipants: 95,
    maxParticipants: 100,
    desc: "Buổi tọa đàm chuyên sâu về AI tạo sinh và mô hình ngôn ngữ lớn (LLM) trong thực tiễn.",
    longDesc: "Tech Talk: AI & LLM là sự kiện chia sẻ kiến thức về trí tuệ nhân tạo thế hệ mới. Các chuyên gia sẽ trình bày về kiến trúc LLM, ứng dụng thực tế và xu hướng phát triển AI trong tương lai gần.",
    badge: "Đang diễn ra",
    badgeType: "upcoming",
    ticketStatus: "ongoing",
  },
  {
    id: 13,
    emoji: "🎵",
    color: "#7c3aed",
    title: "Acoustic Night Vol.4",
    club: "FPTU Music Club",
    tag: "Âm nhạc",
    date: "10/05/2026",
    time: "18:30",
    venue: "Sân khấu ngoài trời",
    venueDetail: "Khuôn viên Đại học FPT",
    currentParticipants: 150,
    maxParticipants: 150,
    desc: "Đêm nhạc acoustic lần thứ 4 với những tiết mục đặc sắc từ các nghệ sĩ sinh viên FPTU.",
    longDesc: "Acoustic Night Vol.4 đã là một đêm nhạc đáng nhớ với hơn 20 tiết mục âm nhạc sống động. Sự kiện quy tụ hàng trăm khán giả yêu âm nhạc trong không gian ấm cúng và lãng mạn.",
    badge: "Hết chỗ",
    badgeType: "full",
    ticketStatus: "completed",
  },
];
