import { Routes, Route } from "react-router-dom";
import LandingPage from "../features/landing/pages/LandingPage";
import ClubListPage from "../features/clubs/pages/ClubListPage";
import EventListPage from "../features/events/pages/EventListPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ClubDetailPage from "../features/clubs/pages/ClubDetailPage";
import EventDetailPage from "../features/events/pages/EventDetailPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/clubs"     element={<ClubListPage />} />
      <Route path="/events"    element={<EventListPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/register"       element={<RegisterPage />} />
      <Route path="/clubs/:abbr"    element={<ClubDetailPage />} />
      <Route path="/events/:title"  element={<EventDetailPage />} />
    </Routes>
  );
}
