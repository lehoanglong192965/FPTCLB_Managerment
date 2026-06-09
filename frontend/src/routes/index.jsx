import { Routes, Route } from "react-router-dom";
// Public pages
import LandingPage from "../features/landing/pages/LandingPage";
import ClubListPage from "../features/clubs/pages/ClubListPage";
import EventListPage from "../features/events/pages/EventListPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import VerifyOTP from "../features/auth/pages/VerifyOTP";
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

// Admin pages
import SemesterManagement from "../features/admin-dashboard/pages/SemesterManagement";
import UserManagement from "../features/admin-dashboard/pages/UserManagement";

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

// Shared
import ProfilePage from "../features/profile/pages/ProfilePage";

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

      {/* ── ICPDP dashboard ─────────────────────────────────── */}
      <Route path="/icpdp" element={<DashboardLayout />}>
        <Route index element={<IcpdpOverview />} />
        <Route path="club-overview" element={<IcpdpClubOverview />} />
        <Route path="club-management" element={<IcpdpClubManagement />} />
        <Route path="event-approval" element={<IcpdpEventApproval />} />
        <Route path="personnel-reassign" element={<IcpdpPersonnelReassign />} />
        <Route path="discipline-log" element={<IcpdpDisciplineLog />} />
        <Route path="notifications" element={<IcpdpNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Admin dashboard ─────────────────────────────────── */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route index element={<SemesterManagement />} />
        <Route path="users" element={<UserManagement />} />
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
        <Route path="events" element={<MemberEvents />} />
        <Route path="notifications" element={<MemberNotifications />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}