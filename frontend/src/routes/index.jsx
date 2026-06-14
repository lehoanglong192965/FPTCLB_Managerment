import { Routes, Route } from "react-router-dom";
// Public pages
import LandingPage from "../features/landing/pages/LandingPage";
import ClubListPage from "../features/clubs/pages/ClubListPage";
import EventListPage from "../features/events/pages/EventListPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import VerifyOTP from "../features/auth/pages/VerifyOTP";
import OAuthRedirect from "../features/auth/pages/OAuthRedirect";
import ClubDetailPage from "../features/clubs/pages/ClubDetailPage";
import EventDetailPage from "../features/events/pages/EventDetailPage";

// Dashboard layout (shared sidebar + outlet)
import DashboardLayout from "../layouts/dashboard-layout";

// ICPDP pages
import IcpdpOverview from "../features/icpdp-dashboard/pages/IcpdpOverview";
import IcpdpNotifications from "../features/icpdp-dashboard/pages/IcpdpNotifications";
import IcpdpEventApproval from "../features/icpdp-dashboard/pages/IcpdpEventApproval";
import IcpdpClubOverview from "../features/icpdp-dashboard/pages/IcpdpClubOverview";
import IcpdpPersonnelReassign from "../features/icpdp-dashboard/pages/IcpdpPersonnelReassign";
import IcpdpDisciplineLog from "../features/icpdp-dashboard/pages/IcpdpDisciplineLog";
import IcpdpClubManagement from "../features/icpdp-dashboard/pages/IcpdpClubManagement";
import IcpdpRecruitment from "../features/icpdp-dashboard/pages/IcpdpRecruitment";
import IcpdpClubRequests from "../features/icpdp-dashboard/pages/IcpdpClubRequests";
import IcpdpBlacklist from "../features/icpdp-dashboard/pages/IcpdpBlacklist";

// Admin pages
import SemesterManagement from "../features/admin-dashboard/pages/SemesterManagement";
import UserManagement from "../features/admin-dashboard/pages/UserManagement";
import SystemConfigPage from "../features/admin-dashboard/pages/SystemConfigPage";

// Club Leader pages
import ClubOverview from "../features/club-leader-dashboard/pages/ClubOverview";
import ClubMemberMgmt from "../features/club-leader-dashboard/pages/ClubMemberMgmt";
import ClubEventsMgmt from "../features/club-leader-dashboard/pages/ClubEventsMgmt";
import ClubNotifications from "../features/club-leader-dashboard/pages/ClubNotifications";
import ClubReports from "../features/club-leader-dashboard/pages/ClubReports";

// Member pages
import MemberHome from "../features/member-dashboard/pages/MemberHome";
import MemberEvents from "../features/member-dashboard/pages/MemberEvents";
import MemberClubs from "../features/member-dashboard/pages/MemberClubs";
import MemberNotifications from "../features/member-dashboard/pages/MemberNotifications";
import MemberApply from "../features/member-dashboard/pages/MemberApply";
import ClubRegistrationForm from "../features/member-dashboard/pages/ClubRegistrationForm";
import MemberRegistrationHistory from "../features/member-dashboard/pages/MemberRegistrationHistory";

// Shared
import ProfilePage from "../features/profile/pages/ProfilePage";

// Alumni pages
import AlumniHome from "../features/alumni/pages/AlumniHome";
import AlumniClubs from "../features/alumni/pages/AlumniClubs";
import AlumniEvents from "../features/alumni/pages/AlumniEvents";
import AlumniNetwork from "../features/alumni/pages/AlumniNetwork";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes ───────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/clubs" element={<ClubListPage />} />
      <Route path="/clubs/:abbr" element={<ClubDetailPage />} />
      <Route path="/events" element={<EventListPage />} />
      <Route path="/events/:title" element={<EventDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

      {/* ── ICPDP dashboard ─────────────────────────────────── */}
      <Route path="/icpdp" element={<DashboardLayout />}>
        <Route index element={<IcpdpOverview />} />
        <Route path="club-overview" element={<IcpdpClubOverview />} />
        <Route path="club-management" element={<IcpdpClubManagement />} />
        <Route path="club-requests" element={<IcpdpClubRequests />} />
        <Route path="event-approval" element={<IcpdpEventApproval />} />
        <Route path="personnel-reassign" element={<IcpdpPersonnelReassign />} />
        <Route path="discipline-log" element={<IcpdpDisciplineLog />} />
        <Route path="recruitment" element={<IcpdpRecruitment />} />
        <Route path="blacklist" element={<IcpdpBlacklist />} />
        <Route path="notifications" element={<IcpdpNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Admin dashboard ─────────────────────────────────── */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route index element={<SemesterManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="system-config" element={<SystemConfigPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Club Leader dashboard ───────────────────────────── */}
      <Route path="/club-leader" element={<DashboardLayout />}>
        <Route index element={<ClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="reports" element={<ClubReports />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Member dashboard ────────────────────────────────── */}
      <Route path="/member" element={<DashboardLayout />}>
        <Route index element={<MemberHome />} />
        <Route path="clubs" element={<MemberClubs />} />
        <Route path="club-register" element={<ClubRegistrationForm />} />
        <Route path="club-register-history" element={<MemberRegistrationHistory />} />
        <Route path="events" element={<MemberEvents />} />
        <Route path="notifications" element={<MemberNotifications />} />
        <Route path="apply" element={<MemberApply />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Vice Leader dashboard ───────────────────────────── */}
      <Route path="/vice-leader" element={<DashboardLayout />}>
        <Route index element={<ClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Core Team dashboard ─────────────────────────────── */}
      <Route path="/core-team" element={<DashboardLayout />}>
        <Route index element={<ClubOverview />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Club Manager dashboard ──────────────────────────── */}
      <Route path="/manager" element={<DashboardLayout />}>
        <Route index element={<ClubOverview />} />
        <Route path="clubs" element={<IcpdpClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="reports" element={<ClubReports />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Alumni dashboard ────────────────────────────────── */}
      <Route path="/alumni" element={<DashboardLayout />}>
        <Route index element={<AlumniHome />} />
        <Route path="clubs" element={<AlumniClubs />} />
        <Route path="events" element={<AlumniEvents />} />
        <Route path="network" element={<AlumniNetwork />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}