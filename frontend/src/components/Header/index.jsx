import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/header.css";

export const NAV_ITEMS = [
  { label: "Trang Chủ",  href: "home"   },
  { label: "Câu Lạc Bộ", href: "clubs"  },
  { label: "Sự Kiện",    href: "events" },
  { label: "About",      href: "about"  },
];

export default function Header({ activeSection }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href) => {
    if (href === "home") {
      navigate("/");
      return;
    }
    navigate("/");
    setTimeout(() => {
      document.getElementById(href)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <a href="/" className="header__logo">
        <div className="header__logo-icon">F</div>
        <div className="header__logo-text">
          <span>FPTU Clubs</span>
        </div>
      </a>

      <nav className="header__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            className={`header__nav-link ${activeSection === item.href ? "active" : ""}`}
            onClick={() => handleNav(item.href)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header__actions">
        <button className="btn-ghost" onClick={() => navigate("/login")}>Đăng Nhập</button>
        <button className="btn-primary" onClick={() => navigate("/register")}>Đăng Ký</button>
      </div>
    </header>
  );
}
