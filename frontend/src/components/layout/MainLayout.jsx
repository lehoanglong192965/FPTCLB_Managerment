import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ScrollToTop from "../../components/ScrollToTop";
import AppRoutes from "../../routes";

const HIDDEN_CHROME = [];

const DASHBOARD_PREFIXES = ["/admin", "/icpdp", "/club-leader", "/manager", "/vice-leader", "/core-team", "/member", "/alumni"];

export default function MainLayout() {
  const location = useLocation();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  const showChrome = !isDashboard && !HIDDEN_CHROME.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      {showChrome && <Header />}
      <AppRoutes />
      {showChrome && <Footer />}
    </>
  );
}
