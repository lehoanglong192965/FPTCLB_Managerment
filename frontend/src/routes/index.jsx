import { Routes, Route } from "react-router-dom";
import LandingPage from "../features/landing/pages/LandingPage";
import ClubListPage from "../features/clubs/pages/ClubListPage";
import EventListPage from "../features/events/pages/EventListPage";
import LoginPage from "../features/auth/pages/LoginPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"       element={<LandingPage />} />
      <Route path="/clubs"  element={<ClubListPage />} />
      <Route path="/events" element={<EventListPage />} />
      <Route path="/login"  element={<LoginPage />} />
    </Routes>
  );
}
