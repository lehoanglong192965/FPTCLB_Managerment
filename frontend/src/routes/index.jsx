import { Routes, Route, Navigate } from "react-router-dom";

// Auth guard
import PrivateRoute from "../components/auth/PrivateRoute";

// Public pages
import LandingPage from "../pages/landing/LandingPage";
import ClubListPage from "../pages/clubs/ClubListPage";
import EventListPage from "../pages/events/EventListPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import OAuthRedirect from "../pages/auth/OAuthRedirect";
import ClubDetailPage from "../pages/clubs/ClubDetailPage";
import EventDetailPage from "../pages/events/EventDetailPage";

// Guest flow (Sprint 4)
import GuestRegisterPage from "../pages/guest/GuestRegisterPage";
import GuestVerifyOtpPage from "../pages/guest/GuestVerifyOtpPage";
import GuestStatusPage from "../pages/guest/GuestStatusPage";

// Feedback flow (Sprint 7)
import FeedbackPage from "../pages/feedback/FeedbackPage";
import GuestFeedbackPage from "../pages/feedback/GuestFeedbackPage";

// Dashboard layout (shared sidebar + outlet)
import DashboardLayout from "../components/layout";

// ICPDP pages
import IcpdpOverview from "../pages/icpdp/IcpdpOverview";
import IcpdpNotifications from "../pages/icpdp/IcpdpNotifications";
import IcpdpEventApproval from "../pages/icpdp/IcpdpEventApproval";
import IcpdpClubOverview from "../pages/icpdp/IcpdpClubOverview";
import IcpdpPersonnelReassign from "../pages/icpdp/IcpdpPersonnelReassign";
import IcpdpDisciplineLog from "../pages/icpdp/IcpdpDisciplineLog";
import IcpdpClubManagement from "../pages/icpdp/IcpdpClubManagement";
import IcpdpRecruitment from "../pages/icpdp/IcpdpRecruitment";
import IcpdpClubRequests from "../pages/icpdp/IcpdpClubRequests";
import IcpdpReportReview from "../pages/icpdp/IcpdpReportReview";
import IcpdpCompetitionList from "../pages/icpdp/IcpdpCompetitionList";
import IcpdpCompetitionDetail from "../pages/icpdp/IcpdpCompetitionDetail";

// Admin pages
import SemesterManagement from "../pages/admin/SemesterManagement";
import UserManagement from "../pages/admin/UserManagement";
import SystemConfigPage from "../pages/admin/SystemConfigPage";

// Club Leader pages
import ClubOverview from "../pages/club-leader/ClubOverview";
import ClubMemberMgmt from "../pages/club-leader/ClubMemberMgmt";
import ClubEventsMgmt from "../pages/club-leader/ClubEventsMgmt";
import PersonnelAssignmentPage from "../pages/club-leader/PersonnelAssignmentPage";
import ClubNotifications from "../pages/club-leader/ClubNotifications";
import ClubReports from "../pages/club-leader/ClubReports";
import ClubApplicationsMgmt from "../pages/club-leader/ClubApplicationsMgmt";
import ClubBlacklist from "../pages/club-leader/ClubBlacklist";
import CreateEventPage from "../pages/club-leader/CreateEventPage";
import ClubInfoPage from "../pages/club-leader/ClubInfoPage";
import ContributionManagementPage from "../pages/club-leader/ContributionManagementPage";
import CheckInPage from "../pages/club-leader/CheckInPage";
import ReportSubmitPage from "../pages/club-leader/ReportSubmitPage";
import WalkInPage from "../pages/club-leader/WalkInPage";
import { ClubDataProvider } from "../contexts/ClubDataContext";

// Member pages
import MemberHome from "../pages/member/MemberHome";
import MemberEvents from "../pages/member/MemberEvents";
import MemberClubs from "../pages/member/MemberClubs";
import MemberMyClubs from "../pages/member/MemberMyClubs";
import MemberNotifications from "../pages/member/MemberNotifications";
import MemberMyTickets from "../pages/member/MemberMyTickets";
import MemberApply from "../pages/member/MemberApply";
import ClubRegistrationForm from "../pages/member/ClubRegistrationForm";
import MemberRegistrationHistory from "../pages/member/MemberRegistrationHistory";
import MemberNotificationSettings from "../pages/member/MemberNotificationSettings";

// Shared
import ProfilePage from "../pages/profile/ProfilePage";

// Alumni pages
import AlumniHome from "../pages/alumni/AlumniHome";
import AlumniClubs from "../pages/alumni/AlumniClubs";
import AlumniEvents from "../pages/alumni/AlumniEvents";
import AlumniNetwork from "../pages/alumni/AlumniNetwork";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes ───────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/clubs" element={<ClubListPage />} />
      <Route path="/clubs/:abbr" element={<ClubDetailPage />} />
      <Route path="/events" element={<EventListPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
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
          <PrivateRoute allowedRoles={["MEMBER", "CLUB_LEADER", "VICE_LEADER", "CORE_TEAM"]}>
            <FeedbackPage />
          </PrivateRoute>
        }
      />
      {/* Guest feedback — truy cập qua token trong email, không cần đăng nhập */}
      <Route path="/feedback/guest/:token" element={<GuestFeedbackPage />} />

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
        <Route path="club-overview" element={<IcpdpClubOverview />} />
        <Route path="club-management" element={<IcpdpClubManagement />} />
        <Route path="clubs/create" element={<ClubRegistrationForm mode="icpdp" />} />
        <Route path="event-approval" element={<IcpdpEventApproval />} />
        <Route path="report-review" element={<IcpdpReportReview />} />
        <Route path="personnel-reassign" element={<IcpdpPersonnelReassign />} />
        <Route path="discipline-log" element={<IcpdpDisciplineLog />} />
        <Route path="recruitment" element={<IcpdpRecruitment />} />
        <Route path="competition" element={<IcpdpCompetitionList />} />
        <Route path="competition/:competitionId" element={<IcpdpCompetitionDetail />} />
        <Route path="notifications" element={<IcpdpNotifications />} />
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
        <Route path="users" element={<UserManagement />} />
        <Route path="system-config" element={<SystemConfigPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Club Leader dashboard ───────────────────────────── */}
      <Route
        path="/club-leader"
        element={
          <PrivateRoute allowedRoles={["CLUB_LEADER", "VICE_LEADER"]}>
            <ClubDataProvider>
              <DashboardLayout />
            </ClubDataProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<ClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="applications" element={<ClubApplicationsMgmt />} />
        <Route path="event-create" element={<CreateEventPage />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="events/:eventId/assignments" element={<PersonnelAssignmentPage />} />
        <Route path="events/:eventId/checkin" element={<CheckInPage />} />
        <Route path="events/:eventId/walkin" element={<WalkInPage />} />
        <Route path="reports/:eventId/submit" element={<ReportSubmitPage />} />
        <Route path="contributions/:eventId" element={<ContributionManagementPage />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="reports" element={<ClubReports />} />
        <Route path="blacklist" element={<ClubBlacklist />} />
        <Route path="club-info" element={<ClubInfoPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Vice Leader dashboard ───────────────────────────── */}
      <Route
        path="/vice-leader"
        element={
          <PrivateRoute allowedRoles={["VICE_LEADER"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="event-create" element={<CreateEventPage />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="events/:eventId/assignments" element={<PersonnelAssignmentPage />} />
        <Route path="events/:eventId/checkin" element={<CheckInPage />} />
        <Route path="events/:eventId/walkin" element={<WalkInPage />} />
        <Route path="contributions/:eventId" element={<ContributionManagementPage />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Core Team dashboard ─────────────────────────────── */}
      <Route
        path="/core-team"
        element={
          <PrivateRoute allowedRoles={["CORE_TEAM"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ClubOverview />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Club Manager dashboard ──────────────────────────── */}
      <Route
        path="/manager"
        element={
          <PrivateRoute allowedRoles={["CLUB_MANAGER"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ClubOverview />} />
        <Route path="clubs" element={<IcpdpClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="reports" element={<ClubReports />} />
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
        <Route index element={<MemberHome />} />
        <Route path="my-clubs" element={<MemberMyClubs />} />
        <Route path="clubs" element={<MemberClubs />} />
        <Route path="club-register" element={<Navigate to="/member/clubs" replace />} />
        <Route path="club-register-history" element={<MemberRegistrationHistory />} />
        <Route path="events" element={<MemberEvents />} />
        <Route path="tickets" element={<MemberMyTickets />} />
        <Route path="notifications" element={<MemberNotifications />} />
        <Route path="notification-settings" element={<MemberNotificationSettings />} />
        <Route path="apply" element={<MemberApply />} />
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
    </Routes>
  );
}
