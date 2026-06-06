import { useLocation } from "react-router-dom";
import { useScrollSpy } from "../hooks/useScrollSpy";
import Header, { NAV_ITEMS } from "../components/Header";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import AppRoutes from "../routes";

const HIDDEN_CHROME = [];

const DASHBOARD_PREFIXES = ["/admin", "/club-leader", "/manager", "/vice-leader", "/core-team", "/member"];

export default function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isDashboard = DASHBOARD_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  const showChrome = !isDashboard && !HIDDEN_CHROME.includes(location.pathname);
  const activeSection = useScrollSpy(isHome ? NAV_ITEMS.map((n) => n.href) : []);

  return (
    <>
      <ScrollToTop />
      {showChrome && <Header activeSection={activeSection} />}
      <AppRoutes />
      {showChrome && <Footer />}
    </>
  );
}
