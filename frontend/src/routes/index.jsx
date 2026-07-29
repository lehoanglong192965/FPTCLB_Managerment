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
const GuestLookupPage = lazy(() => import("../pages/guest/GuestLookupPage"));

// Feedback flow (Sprint 7)
const FeedbackPage = lazy(() => import("../pages/feedback/FeedbackPage"));
const GuestFeedbackPage = lazy(() => import("../pages/feedback/GuestFeedbackPage"));
const FeedbackSummaryPage = lazy(() => import("../pages/feedback/FeedbackSummaryPage"));

// Competition pages (Sprint 8)
const CompetitionRankingPage = lazy(() => import("../pages/competitions/CompetitionRankingPage"));
const CompetitionAwardsPage = lazy(() => import("../pages/competitions/CompetitionAwardsPage"));

// Member pages (Sprint 6)
const MemberAppealPage = lazy(() => import("../pages/member/MemberAppealPage"));
const MemberPendingFeedbackPage = lazy(() => import("../pages/member/MemberPendingFeedbackPage"));
const MemberMyContributionsPage = lazy(() => import("../pages/member/MemberMyContributionsPage"));

// Dashboard layout (shared sidebar + outlet)
const DashboardLayout = lazy(() => import("../components/layout/DashboardLayout"));
const ClubDashboardPage = lazy(() => import("../pages/club-leader/ClubDashboardPage"));

// ICPDP pages
const IcpdpEventApprovalPage = lazy(() => import("../pages/icpdp/IcpdpEventApprovalPage"));
const IcpdpEventManagementPage = lazy(() => import("../pages/icpdp/IcpdpEventManagementPage"));
const IcpdpEventDetailPage = lazy(() => import("../pages/icpdp/IcpdpEventDetailPage"));
const IcpdpPersonnelReassignPage = lazy(() => import("../pages/icpdp/IcpdpPersonnelReassignPage"));
const IcpdpDisciplineLogPage = lazy(() => import("../pages/icpdp/IcpdpDisciplineLogPage"));
const IcpdpClubManagementPage = lazy(() => import("../pages/icpdp/IcpdpClubManagementPage"));
const IcpdpRecruitmentPage = lazy(() => import("../pages/icpdp/IcpdpRecruitmentPage"));
const IcpdpReportReviewPage = lazy(() => import("../pages/icpdp/IcpdpReportReviewPage"));
const IcpdpCompetitionListPage = lazy(() => import("../pages/icpdp/IcpdpCompetitionListPage"));
const IcpdpCompetitionDetailPage = lazy(() => import("../pages/icpdp/IcpdpCompetitionDetailPage"));
const IcpdpContributionPage = lazy(() => import("../pages/icpdp/IcpdpContributionPage"));

// Admin pages
const SemesterManagementPage = lazy(() => import("../pages/admin/SemesterManagementPage"));
const UserManagementPage = lazy(() => import("../pages/admin/UserManagementPage"));
const SystemConfigPage = lazy(() => import("../pages/admin/SystemConfigPage"));

// Club Leader pages
const ClubMemberManagementPage = lazy(() => import("../pages/club-leader/ClubMemberManagementPage"));
const ClubEventsManagementPage = lazy(() => import("../pages/club-leader/ClubEventsManagementPage"));
const EventManageDetailPage = lazy(() => import("../pages/club-leader/EventManageDetailPage"));
const PersonnelAssignmentPage = lazy(() => import("../pages/club-leader/PersonnelAssignmentPage"));
const ClubReportsPage = lazy(() => import("../pages/club-leader/ClubReportsPage"));
const ClubApplicationsManagementPage = lazy(() => import("../pages/club-leader/ClubApplicationsManagementPage"));
const RecruitmentCycleManagementPage = lazy(() => import("../pages/club-leader/RecruitmentCycleManagementPage"));
const ClubBlacklistPage = lazy(() => import("../pages/club-leader/ClubBlacklistPage"));
const CreateEventPage = lazy(() => import("../pages/club-leader/CreateEventPage"));
const ClubInfoPage = lazy(() => import("../pages/club-leader/ClubInfoPage"));
const ClubNotificationPage = lazy(() => import("../pages/club-leader/ClubNotificationPage"));
const MemberLeaderboardPage = lazy(() => import("../pages/club-leader/MemberLeaderboardPage"));
const ContributionManagementPage = lazy(() => import("../pages/club-leader/ContributionManagementPage"));
const CheckInPage = lazy(() => import("../pages/club-leader/CheckInPage"));
const ReportSubmitPage = lazy(() => import("../pages/club-leader/ReportSubmitPage"));
const WalkInPage = lazy(() => import("../pages/club-leader/WalkInPage"));
const RegistrationManagementPage = lazy(() => import("../pages/club-leader/RegistrationManagementPage"));
const AttendanceDashboardPage = lazy(() => import("../pages/club-leader/AttendanceDashboardPage"));
const AttendanceCorrectionPage = lazy(() => import("../pages/club-leader/AttendanceCorrectionPage"));
const KnowledgeArchiveManagementPage = lazy(() => import("../pages/shared/KnowledgeArchiveManagementPage"));
const ClubManagementLayout = lazy(() => import("../components/layout/ClubManagementLayout"));
const ClubSpace = lazy(() => import("../components/clubs/ClubSpace"));
const ClubLeaderMyClubsPage = lazy(() => import("../pages/club-leader/ClubLeaderMyClubsPage"));

// Member pages
const MemberEventsPage = lazy(() => import("../pages/member/MemberEventsPage"));
const MemberClubsPage = lazy(() => import("../pages/member/MemberClubsPage"));
const MemberMyClubsPage = lazy(() => import("../pages/member/MemberMyClubsPage"));
const MemberNotificationsPage = lazy(() => import("../pages/member/MemberNotificationsPage"));
const MemberMyTicketsPage = lazy(() => import("../pages/member/MemberMyTicketsPage"));
const TicketDetailPage = lazy(() => import("../pages/shared/TicketDetailPage"));
const MemberApplyPage = lazy(() => import("../pages/member/MemberApplyPage"));
const ClubRegistrationFormPage = lazy(() => import("../pages/icpdp/ClubRegistrationFormPage"));
const MemberNotificationSettingsPage = lazy(() => import("../pages/member/MemberNotificationSettingsPage"));

// Shared
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

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
      <Route path="/guest/lookup" element={<GuestLookupPage />} />

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
        <Route index element={<Navigate to="/icpdp/club-management" replace />} />
        <Route path="club-dashboard" element={<ClubDashboardPage />} />
        <Route path="club-management" element={<IcpdpClubManagementPage />} />
        <Route path="clubs/create" element={<ClubRegistrationFormPage mode="icpdp" />} />
        <Route path="event-approval" element={<IcpdpEventApprovalPage />} />
        <Route path="event-management" element={<IcpdpEventManagementPage />} />
        <Route path="report-review" element={<IcpdpReportReviewPage />} />
        <Route path="personnel-reassign" element={<IcpdpPersonnelReassignPage />} />
        <Route path="discipline-log" element={<IcpdpDisciplineLogPage />} />
        <Route path="recruitment" element={<IcpdpRecruitmentPage />} />
        <Route path="competition" element={<IcpdpCompetitionListPage />} />
        <Route path="competition/:competitionId" element={<IcpdpCompetitionDetailPage />} />
        <Route path="events/:eventId/manage" element={<IcpdpEventDetailPage />} />
        <Route path="events/:eventId/checkin" element={<CheckInPage />} />
        <Route path="events/:eventId/attendance/:sessionId/correct" element={<AttendanceCorrectionPage />} />
        <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
        <Route path="events/:eventId/contributions" element={<IcpdpContributionPage />} />
        <Route path="knowledge-archive" element={<KnowledgeArchiveManagementPage />} />
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
        <Route index element={<SemesterManagementPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="system-config" element={<SystemConfigPage />} />
        <Route path="knowledge-archive" element={<KnowledgeArchiveManagementPage />} />
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
          <Route index element={<ClubLeaderMyClubsPage />} />
          <Route element={<ClubManagementLayout />}>
            <Route path="space" element={<ClubSpace />} />
            <Route path="events" element={<ClubEventsManagementPage />} />
            <Route path="events/:eventId" element={<EventManageDetailPage />} />
            <Route path="events/:eventId/assignments" element={<PersonnelAssignmentPage />} />
            <Route path="events/:eventId/checkin" element={<CheckInPage />} />
            <Route path="events/:eventId/walkin" element={<WalkInPage />} />
            <Route path="events/:eventId/registrations" element={<RegistrationManagementPage />} />
            <Route path="events/:eventId/attendance" element={<AttendanceDashboardPage />} />
            <Route path="events/:eventId/attendance/:sessionId/correct" element={<AttendanceCorrectionPage />} />
            <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
            <Route path="reports/:eventId/submit" element={<ReportSubmitPage />} />
            <Route path="contributions/:eventId" element={<ContributionManagementPage />} />
            <Route path="members" element={<ClubMemberManagementPage />} />
            <Route path="applications" element={<ClubApplicationsManagementPage />} />
            <Route path="recruitment" element={<RecruitmentCycleManagementPage />} />
            <Route path="reports" element={<ClubReportsPage />} />
            <Route path="blacklist" element={<ClubBlacklistPage />} />
            <Route path="notifications" element={<ClubNotificationPage />} />
            <Route path="club-info" element={<ClubInfoPage />} />
          </Route>
        </Route>
        <Route element={<ClubManagementLayout />}>
          <Route path="event-create" element={<CreateEventPage />} />
          <Route path="knowledge-archive" element={<KnowledgeArchiveManagementPage />} />
        </Route>
        <Route path="events" element={<MemberEventsPage />} />
        <Route path="clubs" element={<MemberClubsPage />} />
        <Route path="apply" element={<MemberApplyPage />} />
        <Route path="tickets" element={<MemberMyTicketsPage />} />
        <Route path="tickets/:registrationId" element={<TicketDetailPage />} />
        <Route path="pending-feedback" element={<MemberPendingFeedbackPage />} />
        <Route path="contributions" element={<MemberMyContributionsPage />} />
        <Route path="events/:eventId/appeal" element={<MemberAppealPage />} />
        <Route path="notifications" element={<MemberNotificationsPage />} />
        <Route path="notification-settings" element={<MemberNotificationSettingsPage />} />
        <Route path="leaderboard" element={<MemberLeaderboardPage />} />
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
          <Route index element={<ClubLeaderMyClubsPage />} />
          <Route element={<ClubManagementLayout />}>
            <Route path="space" element={<ClubSpace />} />
            <Route path="events" element={<ClubEventsManagementPage />} />
            <Route path="events/:eventId" element={<EventManageDetailPage />} />
            <Route path="events/:eventId/assignments" element={<PersonnelAssignmentPage />} />
            <Route path="events/:eventId/checkin" element={<CheckInPage />} />
            <Route path="events/:eventId/walkin" element={<WalkInPage />} />
            <Route path="events/:eventId/registrations" element={<RegistrationManagementPage />} />
            <Route path="events/:eventId/attendance" element={<AttendanceDashboardPage />} />
            <Route path="events/:eventId/attendance/:sessionId/correct" element={<AttendanceCorrectionPage />} />
            <Route path="events/:eventId/feedback" element={<FeedbackSummaryPage />} />
            <Route path="contributions/:eventId" element={<ContributionManagementPage />} />
            <Route path="members" element={<ClubMemberManagementPage />} />
            <Route path="recruitment" element={<RecruitmentCycleManagementPage />} />
            <Route path="reports" element={<ClubReportsPage />} />
            <Route path="club-info" element={<ClubInfoPage />} />
          </Route>
        </Route>
        <Route element={<ClubManagementLayout />}>
          <Route path="event-create" element={<CreateEventPage />} />
          <Route path="knowledge-archive" element={<KnowledgeArchiveManagementPage />} />
        </Route>
        <Route path="events" element={<MemberEventsPage />} />
        <Route path="clubs" element={<MemberClubsPage />} />
        <Route path="apply" element={<MemberApplyPage />} />
        <Route path="tickets" element={<MemberMyTicketsPage />} />
        <Route path="tickets/:registrationId" element={<TicketDetailPage />} />
        <Route path="pending-feedback" element={<MemberPendingFeedbackPage />} />
        <Route path="contributions" element={<MemberMyContributionsPage />} />
        <Route path="events/:eventId/appeal" element={<MemberAppealPage />} />
        <Route path="notifications" element={<MemberNotificationsPage />} />
        <Route path="notification-settings" element={<MemberNotificationSettingsPage />} />
        <Route path="leaderboard" element={<MemberLeaderboardPage />} />
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
        <Route path="my-clubs" element={<MemberMyClubsPage />} />
        <Route path="clubs" element={<MemberClubsPage />} />
        <Route path="club-register" element={<Navigate to="/member/clubs" replace />} />
        <Route path="events" element={<MemberEventsPage />} />
        <Route path="pending-feedback" element={<MemberPendingFeedbackPage />} />
        <Route path="tickets" element={<MemberMyTicketsPage />} />
        <Route path="tickets/:registrationId" element={<TicketDetailPage />} />
        <Route path="notifications" element={<MemberNotificationsPage />} />
        <Route path="notification-settings" element={<MemberNotificationSettingsPage />} />
        <Route path="apply" element={<MemberApplyPage />} />
        <Route path="contributions" element={<MemberMyContributionsPage />} />
        <Route path="events/:eventId/appeal" element={<MemberAppealPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Catch-all 404 ───────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}
