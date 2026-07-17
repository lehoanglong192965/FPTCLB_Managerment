import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Auth guard + provider — giữ eager vì bọc ngoài mọi route con
import PrivateRoute from "../components/auth/PrivateRoute";
import { ClubDataProvider } from "../contexts/ClubDataContext";

// Hai trang vào-app phổ biến nhất giữ import tĩnh: nằm sẵn trong bundle đầu
// nên không tốn thêm một round-trip tải chunk trước khi hiển thị.
import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";

// Các page còn lại lazy-load để tách chunk theo route — người dùng chỉ tải
// phần code của khu vực họ truy cập (guest không tải code admin/ICPDP...).

// Public pages
const ClubListPage = lazy(() => import("../pages/clubs/ClubListPage"));
const EventListPage = lazy(() => import("../pages/events/EventListPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const VerifyOtpPage = lazy(() => import("../pages/auth/VerifyOtpPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const OAuthRedirect = lazy(() => import("../pages/auth/OAuthRedirect"));
const ClubDetailPage = lazy(() => import("../pages/clubs/ClubDetailPage"));
const EventDetailPage = lazy(() => import("../pages/events/EventDetailPage"));

// Guest flow (Sprint 4)
const GuestRegisterPage = lazy(() => import("../pages/guest/GuestRegisterPage"));
const GuestVerifyOtpPage = lazy(() => import("../pages/guest/GuestVerifyOtpPage"));
const GuestStatusPage = lazy(() => import("../pages/guest/GuestStatusPage"));

// Feedback flow (Sprint 7)
const FeedbackPage = lazy(() => import("../pages/feedback/FeedbackPage"));
const GuestFeedbackPage = lazy(() => import("../pages/feedback/GuestFeedbackPage"));
const FeedbackSummaryPage = lazy(() => import("../pages/feedback/FeedbackSummaryPage"));

// Competition pages (Sprint 8)
const CompetitionRankingPage = lazy(() => import("../pages/competitions/CompetitionRankingPage"));
const CompetitionAwardsPage = lazy(() => import("../pages/competitions/CompetitionAwardsPage"));

// Member pages (Sprint 6)
const MemberAppealPage = lazy(() => import("../pages/member/MemberAppealPage"));
const MemberPendingFeedback = lazy(() => import("../pages/member/MemberPendingFeedback"));
const MemberMyContributionsPage = lazy(() => import("../pages/member/MemberMyContributionsPage"));

// Dashboard layout (shared sidebar + outlet)
const DashboardLayout = lazy(() => import("../components/layout/DashboardLayout"));
const ClubDashboardPage = lazy(() => import("../pages/dashboard/ClubDashboardPage"));

// ICPDP pages
const IcpdpOverview = lazy(() => import("../pages/icpdp/IcpdpOverview"));
const IcpdpNotifications = lazy(() => import("../pages/icpdp/IcpdpNotifications"));
const IcpdpEventApproval = lazy(() => import("../pages/icpdp/IcpdpEventApproval"));
const IcpdpPersonnelReassign = lazy(() => import("../pages/icpdp/IcpdpPersonnelReassign"));
const IcpdpDisciplineLog = lazy(() => import("../pages/icpdp/IcpdpDisciplineLog"));
const IcpdpClubManagement = lazy(() => import("../pages/icpdp/IcpdpClubManagement"));
const IcpdpClubQuality = lazy(() => import("../pages/icpdp/IcpdpClubQuality"));
const IcpdpRecruitment = lazy(() => import("../pages/icpdp/IcpdpRecruitment"));
const IcpdpReportReview = lazy(() => import("../pages/icpdp/IcpdpReportReview"));
const IcpdpCompetitionList = lazy(() => import("../pages/icpdp/IcpdpCompetitionList"));
const IcpdpCompetitionDetail = lazy(() => import("../pages/icpdp/IcpdpCompetitionDetail"));
const IcpdpEmergencyOverridePage = lazy(() => import("../pages/icpdp/IcpdpEmergencyOverridePage"));
const IcpdpEmergencyOverrideLookup = lazy(() => import("../pages/icpdp/IcpdpEmergencyOverrideLookup"));
const IcpdpContributionPage = lazy(() => import("../pages/icpdp/IcpdpContributionPage"));

// Admin pages
const SemesterManagement = lazy(() => import("../pages/admin/SemesterManagement"));
const UserManagement = lazy(() => import("../pages/admin/UserManagement"));
const SystemConfigPage = lazy(() => import("../pages/admin/SystemConfigPage"));

// Club Leader pages
const ClubMemberMgmt = lazy(() => import("../pages/club-leader/ClubMemberMgmt"));
const ClubEventsMgmt = lazy(() => import("../pages/club-leader/ClubEventsMgmt"));
const PersonnelAssignmentPage = lazy(() => import("../pages/club-leader/PersonnelAssignmentPage"));
const ClubReports = lazy(() => import("../pages/club-leader/ClubReports"));
const ClubApplicationsMgmt = lazy(() => import("../pages/club-leader/ClubApplicationsMgmt"));
const ClubBlacklist = lazy(() => import("../pages/club-leader/ClubBlacklist"));
const CreateEventPage = lazy(() => import("../pages/club-leader/CreateEventPage"));
const ClubInfoPage = lazy(() => import("../pages/club-leader/ClubInfoPage"));
const MemberLeaderboardPage = lazy(() => import("../pages/club-leader/MemberLeaderboardPage"));
const ContributionManagementPage = lazy(() => import("../pages/club-leader/ContributionManagementPage"));
const CheckInPage = lazy(() => import("../pages/club-leader/CheckInPage"));
const ReportSubmitPage = lazy(() => import("../pages/club-leader/ReportSubmitPage"));
const WalkInPage = lazy(() => import("../pages/club-leader/WalkInPage"));
const RegistrationMgmtPage = lazy(() => import("../pages/club-leader/RegistrationMgmtPage"));
const AttendanceDashboardPage = lazy(() => import("../pages/club-leader/AttendanceDashboardPage"));
const AttendanceCorrectionPage = lazy(() => import("../pages/club-leader/AttendanceCorrectionPage"));
const KnowledgeArchiveMgmt = lazy(() => import("../pages/shared/KnowledgeArchiveMgmt"));
const ClubManagementLayout = lazy(() => import("../components/layout/ClubManagementLayout"));
const ClubSpace = lazy(() => import("../components/clubs/ClubSpace"));
const ClubLeaderMyClubs = lazy(() => import("../pages/club-leader/ClubLeaderMyClubs"));

// Member pages
const MemberEvents = lazy(() => import("../pages/member/MemberEvents"));
const MemberClubs = lazy(() => import("../pages/member/MemberClubs"));
const MemberMyClubs = lazy(() => import("../pages/member/MemberMyClubs"));
const MemberNotifications = lazy(() => import("../pages/member/MemberNotifications"));
const MemberMyTickets = lazy(() => import("../pages/member/MemberMyTickets"));
const MemberApply = lazy(() => import("../pages/member/MemberApply"));
const ClubRegistrationForm = lazy(() => import("../pages/icpdp/ClubRegistrationForm"));
const MemberNotificationSettings = lazy(() => import("../pages/member/MemberNotificationSettings"));

// Shared
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

// Alumni pages
const AlumniHome = lazy(() => import("../pages/alumni/AlumniHome"));
const AlumniClubs = lazy(() => import("../pages/alumni/AlumniClubs"));
const AlumniEvents = lazy(() => import("../pages/alumni/AlumniEvents"));
const AlumniNetwork = lazy(() => import("../pages/alumni/AlumniNetwork"));

// Spinner Tailwind thuần (animate-spin) — không import antd ở đây để chunk
// khởi đầu không phải tải kèm antd trước khi page đầu tiên kịp hiển thị.
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        aria-label="Đang tải trang"
        className="animate-spin h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#1A6FC4]"
      />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public routes ───────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/clubs" element={<ClubListPage />} />
      <Route path="/clubs/:abbr" element={<ClubDetailPage />} />
      <Route path="/events" element={<EventListPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

      {/* ── Guest flow (public — không cần tài khoản) ───────── */}
      <Route path="/guest/register/:eventId" element={<GuestRegisterPage />} />
      <Route path="/guest/verify-otp" element={<GuestVerifyOtpPage />} />
      <Route path="/guest/status/:ref" element={<GuestStatusPage />} />

      {/* ── Feedback (Sprint 7) ─────────────────────────────── */}
      <Route
        path="/feedback/:eventId"
        element={
          <PrivateRoute allowedRoles={["MEMBER", "CLUB_LEADER", "VICE_LEADER"]}>
            <FeedbackPage />
          </PrivateRoute>
        }
      />
      {/* Guest feedback — truy cập qua token trong email, không cần đăng nhập */}
      <Route path="/feedback/guest/:token" element={<GuestFeedbackPage />} />

      {/* Competition public pages (Sprint 8) */}
      <Route path="/competitions/:competitionId/ranking" element={<CompetitionRankingPage />} />
      <Route path="/competitions/:competitionId/awards" element={<CompetitionAwardsPage />} />

      {/* ── ICPDP dashboard ─────────────────────────────────── */}
      <Route
        path="/icpdp"
        element={
          <PrivateRoute allowedRoles={["ICPDP"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<IcpdpOverview />} />
        <Route path="club-dashboard" element={<ClubDashboardPage />} />
        <Route path="club-overview" element={<IcpdpClubQuality />} />
        <Route path="club-management" element={<IcpdpClubManagement />} />
        <Route path="clubs/create" element={<ClubRegistrationForm mode="icpdp" />} />
        <Route path="event-approval" element={<IcpdpEventApproval />} />
        <Route path="report-review" element={<IcpdpReportReview />} />
        <Route path="personnel-reassign" element={<IcpdpPersonnelReassign />} />
        <Route path="discipline-log" element={<IcpdpDisciplineLog />} />
        <Route path="recruitment" element={<IcpdpRecruitment />} />
        <Route path="competition" element={<IcpdpCompetitionList />} />
        <Route path="competition/:competitionId" element={<IcpdpCompetitionDetail />} />
        <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
        <Route path="emergency-override" element={<IcpdpEmergencyOverrideLookup />} />
        <Route path="events/:eventId/emergency-override" element={<IcpdpEmergencyOverridePage />} />
        <Route path="events/:eventId/contributions" element={<IcpdpContributionPage />} />
        <Route path="notifications" element={<IcpdpNotifications />} />
        <Route path="knowledge-archive" element={<KnowledgeArchiveMgmt />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Admin dashboard ─────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<SemesterManagement />} />
        <Route path="club-dashboard" element={<ClubDashboardPage />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="system-config" element={<SystemConfigPage />} />
        <Route path="knowledge-archive" element={<KnowledgeArchiveMgmt />} />
        <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Club Leader dashboard ───────────────────────────── */}
      <Route
        path="/club-leader"
        element={
          <PrivateRoute allowedRoles={["CLUB_LEADER"]}>
            <ClubDataProvider>
              <DashboardLayout />
            </ClubDataProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/club-leader/my-club" replace />} />
        <Route path="my-club">
          <Route index element={<ClubLeaderMyClubs />} />
          <Route element={<ClubManagementLayout />}>
            <Route path="space" element={<ClubSpace />} />
            <Route path="events" element={<ClubEventsMgmt />} />
            <Route path="events/:eventId/assignments" element={<PersonnelAssignmentPage />} />
            <Route path="events/:eventId/checkin" element={<CheckInPage />} />
            <Route path="events/:eventId/walkin" element={<WalkInPage />} />
            <Route path="events/:eventId/registrations" element={<RegistrationMgmtPage />} />
            <Route path="events/:eventId/attendance" element={<AttendanceDashboardPage />} />
            <Route path="events/:eventId/attendance/:sessionId/correct" element={<AttendanceCorrectionPage />} />
            <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
            <Route path="reports/:eventId/submit" element={<ReportSubmitPage />} />
            <Route path="contributions/:eventId" element={<ContributionManagementPage />} />
            <Route path="members" element={<ClubMemberMgmt />} />
            <Route path="applications" element={<ClubApplicationsMgmt />} />
            <Route path="reports" element={<ClubReports />} />
            <Route path="blacklist" element={<ClubBlacklist />} />
            <Route path="club-info" element={<ClubInfoPage />} />
          </Route>
        </Route>
        <Route element={<ClubManagementLayout />}>
          <Route path="event-create" element={<CreateEventPage />} />
        </Route>
        <Route path="events" element={<MemberEvents />} />
        <Route path="clubs" element={<MemberClubs />} />
        <Route path="tickets" element={<MemberMyTickets />} />
        <Route path="pending-feedback" element={<MemberPendingFeedback />} />
        <Route path="contributions" element={<MemberMyContributionsPage />} />
        <Route path="notifications" element={<MemberNotifications />} />
        <Route path="notification-settings" element={<MemberNotificationSettings />} />
        <Route path="leaderboard" element={<MemberLeaderboardPage />} />
        <Route path="knowledge-archive" element={<KnowledgeArchiveMgmt />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Vice Leader dashboard ───────────────────────────── */}
      <Route
        path="/vice-leader"
        element={
          <PrivateRoute allowedRoles={["VICE_LEADER"]}>
            <ClubDataProvider>
              <DashboardLayout />
            </ClubDataProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/vice-leader/my-club" replace />} />
        <Route path="my-club">
          <Route index element={<ClubLeaderMyClubs />} />
          <Route element={<ClubManagementLayout />}>
            <Route path="space" element={<ClubSpace />} />
            <Route path="events" element={<ClubEventsMgmt />} />
            <Route path="events/:eventId/assignments" element={<PersonnelAssignmentPage />} />
            <Route path="events/:eventId/checkin" element={<CheckInPage />} />
            <Route path="events/:eventId/walkin" element={<WalkInPage />} />
            <Route path="events/:eventId/registrations" element={<RegistrationMgmtPage />} />
            <Route path="events/:eventId/attendance" element={<AttendanceDashboardPage />} />
            <Route path="events/:eventId/attendance/:sessionId/correct" element={<AttendanceCorrectionPage />} />
            <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
            <Route path="contributions/:eventId" element={<ContributionManagementPage />} />
            <Route path="members" element={<ClubMemberMgmt />} />
            <Route path="reports" element={<ClubReports />} />
            <Route path="club-info" element={<ClubInfoPage />} />
          </Route>
        </Route>
        <Route element={<ClubManagementLayout />}>
          <Route path="event-create" element={<CreateEventPage />} />
        </Route>
        <Route path="events" element={<MemberEvents />} />
        <Route path="clubs" element={<MemberClubs />} />
        <Route path="tickets" element={<MemberMyTickets />} />
        <Route path="pending-feedback" element={<MemberPendingFeedback />} />
        <Route path="contributions" element={<MemberMyContributionsPage />} />
        <Route path="notifications" element={<MemberNotifications />} />
        <Route path="notification-settings" element={<MemberNotificationSettings />} />
        <Route path="leaderboard" element={<MemberLeaderboardPage />} />
        <Route path="knowledge-archive" element={<KnowledgeArchiveMgmt />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Member dashboard ────────────────────────────────── */}
      <Route
        path="/member"
        element={
          <PrivateRoute allowedRoles={["MEMBER"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/member/my-clubs" replace />} />
        <Route path="my-clubs" element={<MemberMyClubs />} />
        <Route path="clubs" element={<MemberClubs />} />
        <Route path="club-register" element={<Navigate to="/member/clubs" replace />} />
        <Route path="events" element={<MemberEvents />} />
        <Route path="pending-feedback" element={<MemberPendingFeedback />} />
        <Route path="tickets" element={<MemberMyTickets />} />
        <Route path="notifications" element={<MemberNotifications />} />
        <Route path="notification-settings" element={<MemberNotificationSettings />} />
        <Route path="apply" element={<MemberApply />} />
        <Route path="contributions" element={<MemberMyContributionsPage />} />
        <Route path="events/:eventId/appeal" element={<MemberAppealPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Alumni dashboard ────────────────────────────────── */}
      <Route
        path="/alumni"
        element={
          <PrivateRoute allowedRoles={["ALUMNI"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AlumniHome />} />
        <Route path="clubs" element={<AlumniClubs />} />
        <Route path="events" element={<AlumniEvents />} />
        <Route path="network" element={<AlumniNetwork />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Catch-all 404 ───────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}
