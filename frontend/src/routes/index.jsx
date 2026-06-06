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
import DashboardLayout from "../layouts/DashboardLayout";

// ICPDP pages
import IcpdpOverview from "../features/icpdp/pages/IcpdpOverview";

// Admin pages
import SemesterManagement from "../features/admin/pages/SemesterManagement";
import UserManagement from "../features/admin/pages/UserManagement";

// Club Leader pages
import ClubOverview from "../features/clubLeader/pages/ClubOverview";
import ClubMemberMgmt from "../features/clubLeader/pages/ClubMemberMgmt";
import ClubEventsMgmt from "../features/clubLeader/pages/ClubEventsMgmt";
import ClubNotifications from "../features/clubLeader/pages/ClubNotifications";
import ClubReports from "../features/clubLeader/pages/ClubReports";

// Member pages
import MemberHome from "../features/member/pages/MemberHome";
import MemberEvents from "../features/member/pages/MemberEvents";
import MemberClubs from "../features/member/pages/MemberClubs";
import MemberNotifications from "../features/member/pages/MemberNotifications";

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
      </Route>

      {/* ── Admin dashboard ─────────────────────────────────── */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route index element={<SemesterManagement />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* ── Club Leader dashboard ───────────────────────────── */}
      <Route path="/club-leader" element={<DashboardLayout />}>
        <Route index element={<ClubOverview />} />
        <Route path="members" element={<ClubMemberMgmt />} />
        <Route path="events" element={<ClubEventsMgmt />} />
        <Route path="notifications" element={<ClubNotifications />} />
        <Route path="reports" element={<ClubReports />} />
      </Route>

      {/* ── Member dashboard ────────────────────────────────── */}
      <Route path="/member" element={<DashboardLayout />}>
        <Route index element={<MemberHome />} />
        <Route path="clubs" element={<MemberClubs />} />
        <Route path="events" element={<MemberEvents />} />
        <Route path="notifications" element={<MemberNotifications />} />
      </Route>
    </Routes>
  );
}