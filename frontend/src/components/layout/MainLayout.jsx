import { useLocation } from "react-router-dom";
import Header from "../../components/header";
import Footer from "../../components/footer";
import ScrollToTop from "../../components/ScrollToTop";
import AppRoutes from "../../routes";
import { useAuth } from "../../contexts/AuthContext";

const HIDDEN_CHROME = [];

const DASHBOARD_PREFIXES = ["/admin", "/icpdp", "/club-leader", "/manager", "/vice-leader", "/member", "/alumni"];

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  const isEventDetail = /^\/events\/\d+/.test(location.pathname);
  const showChrome = !isDashboard && !HIDDEN_CHROME.includes(location.pathname) && !(isEventDetail && !user);

  return (
    <>
      <ScrollToTop />
      {showChrome && <Header />}
      <AppRoutes />
      {showChrome && <Footer />}
    </>
  );
}
