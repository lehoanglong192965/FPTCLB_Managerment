import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_REDIRECT } from "../../constants/roles";
import { getInitials } from "../../utils/avatar";

export default function Header() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const { pathname }              = useLocation();
  const menuRef                   = useRef(null);

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"
    || pathname.startsWith("/guest/register") || pathname === "/guest/verify-otp" || pathname.startsWith("/guest/status");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dashboardPath = user ? (ROLE_REDIRECT[user.role] ?? "/member") : "/";

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-[999] h-[68px] flex items-center justify-between px-[5%] bg-white transition-all duration-200",
        scrolled ? "shadow-md backdrop-blur-[16px]" : "",
      ].join(" ")}
    >
      <a href="/" className="flex items-center gap-[10px] flex-shrink-0 no-underline">
        <div
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[18px] font-black text-white flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--orange), var(--orange-light))",
            boxShadow: "0 4px 12px rgba(255,107,0,0.40)",
          }}
        >
          F
        </div>
        <div className="flex flex-col leading-[1.1]">
          <span className="text-[15px] font-extrabold text-[#F37021] tracking-[-0.3px]">FPTU Clubs</span>
        </div>
      </a>

      {/* Nav links */}
      {!isAuthPage && (
        <nav className="hidden sm:flex items-center gap-1">
          {[
            { to: "/",       label: "Trang chủ" },
            { to: "/clubs",  label: "Câu lạc bộ" },
            { to: "/events", label: "Sự kiện" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "relative px-4 py-2 rounded-sm text-[14px] font-semibold no-underline bg-transparent border-0 cursor-pointer font-[inherit] transition-all duration-200 " +
                (isActive ? "bg-[rgba(243,112,33,0.12)]" : "hover:bg-[rgba(243,112,33,0.12)]")
              }
              style={({ isActive }) => ({
                color: isActive ? "#F37021" : "rgba(114,114,114,0.75)",
              })}
              onMouseEnter={e => { e.currentTarget.style.color = "#F37021"; }}
              onMouseLeave={e => { if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.color = "rgba(114,114,114,0.75)"; }}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-[10px]">
        {user ? (
          /* ── Đã đăng nhập: hiện avatar + dropdown ── */
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#F37021] transition-all cursor-pointer bg-white"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F37021, #ff9a44)" }}
              >
                {getInitials(user.fullName || user.email)}
              </div>
              <span className="text-[13.5px] font-semibold text-gray-700 max-w-[120px] truncate hidden sm:block">
                {user.fullName || user.email}
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[200px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                <button
                  onClick={() => { setMenuOpen(false); navigate(dashboardPath); }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.color = "#F37021"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#374151"; }}
                  style={{ color: "#374151", background: "transparent" }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13.5px] cursor-pointer border-none outline-none text-left font-[inherit] transition-colors duration-150 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Trang quản lý
                </button>
                <div className="h-px bg-gray-100 mx-3 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  style={{ color: "#ef4444", background: "transparent" }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13.5px] cursor-pointer border-none outline-none text-left font-[inherit] transition-colors duration-150 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : !isAuthPage && (
          /* ── Chưa đăng nhập: hiện nút Đăng nhập / Đăng ký ── */
          <>
            <button
              className="px-[18px] py-2 rounded-sm text-[14px] font-semibold bg-transparent border cursor-pointer font-[inherit] transition-all duration-200"
              style={{ color: "#9ca3af", borderColor: "#9ca3af" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F37021"; e.currentTarget.style.borderColor = "#F37021"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#9ca3af"; }}
              onClick={() => navigate("/login", { state: { from: pathname } })}
            >
              Đăng Nhập
            </button>
            <button
              className="px-5 py-[9px] rounded-sm text-[14px] font-bold text-white border-0 cursor-pointer font-[inherit] transition-all duration-200 hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, var(--orange), var(--orange-light))", boxShadow: "var(--shadow-orange)" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 36px rgba(255,107,0,0.40)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-orange)"; }}
              onClick={() => navigate("/register", { state: { from: pathname } })}
            >
              Đăng Ký
            </button>
          </>
        )}
      </div>
    </header>
  );
}
