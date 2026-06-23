import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

<div className="flex items-center gap-[10px]">
        <button
          className="px-[18px] py-2 rounded-sm text-[14px] font-semibold bg-transparent border cursor-pointer font-[inherit] transition-all duration-200"
          style={{ color: "#9ca3af", borderColor: "#9ca3af" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#F37021";
            e.currentTarget.style.borderColor = "#F37021";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#9ca3af";
            e.currentTarget.style.borderColor = "#9ca3af";
          }}
          onClick={() => navigate("/login")}
        >
          Đăng Nhập
        </button>
        <button
          className="px-5 py-[9px] rounded-sm text-[14px] font-bold text-white border-0 cursor-pointer font-[inherit] transition-all duration-200 hover:-translate-y-px"
          style={{
            background: "linear-gradient(135deg, var(--orange), var(--orange-light))",
            boxShadow: "var(--shadow-orange)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 36px rgba(255,107,0,0.40)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-orange)"; }}
          onClick={() => navigate("/register")}
        >
          Đăng Ký
        </button>
      </div>
    </header>
  );
}
