import { useLocation } from "react-router-dom";
import { useScrollSpy } from "../hooks/useScrollSpy";
import Header, { NAV_ITEMS } from "../components/Header";
import Footer from "../components/Footer";
import AppRoutes from "../routes";

const HIDDEN_CHROME = ["/login", "/register"];

export default function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const showChrome = !HIDDEN_CHROME.includes(location.pathname);
  const activeSection = useScrollSpy(isHome ? NAV_ITEMS.map((n) => n.href) : []);

  return (
    <>
      {showChrome && <Header activeSection={activeSection} />}
      <AppRoutes />
      {showChrome && <Footer />}
    </>
  );
}
