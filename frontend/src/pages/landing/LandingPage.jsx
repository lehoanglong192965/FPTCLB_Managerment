import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Rocket, Calendar, Users, Bot, BarChart2, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ClubsSection from "../../components/clubs/ClubsSection";
import EventsSection from "../../components/events/EventsSection";
import AiChat from "../../components/AiChat";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/* ── Hero — split asymmetric ──────────────────────── */
function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #0D1B3E 0%, #132150 55%, #1a2a5e 100%)",
        paddingTop: "68px",
        minHeight: "100svh",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Orange glow */}
      <div
        className="absolute top-[-80px] right-[5%] w-[520px] h-[520px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.18) 0%, transparent 70%)" }}
      />

      {/* Split layout */}
      <div className="relative z-10 flex items-center min-h-[calc(100svh-68px)] px-[5%] gap-12 lg:gap-16">
        {/* Left — text block */}
        <div className="flex-[0_0_100%] lg:flex-[0_0_52%] max-w-[620px] py-16 lg:py-20">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-[5px] text-xs font-bold tracking-[0.4px] uppercase mb-8 border"
            style={{
              background: "rgba(255,107,0,0.10)",
              borderColor: "rgba(255,107,0,0.30)",
              color: "#FF8C33",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
            Đại Học FPT – Hệ Thống Câu Lạc Bộ
          </div>

          <h1
            className="font-black text-white mb-6"
            style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.8rem)", letterSpacing: "-3px", lineHeight: 1.04 }}
          >
            Kết Nối.<br />
            Phát Triển.<br />
            <span
              style={{
                background: "linear-gradient(135deg, #FF6B00, #FF8C33 55%, #FFD580)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Toả Sáng.
            </span>
          </h1>

          <p
            className="text-[17px] leading-[1.8] mb-10 max-w-[480px]"
            style={{ color: "rgba(255,255,255,0.58)" }}
          >
            Nền tảng quản lý và tham gia câu lạc bộ dành riêng cho sinh viên FPT,
            nơi đam mê gặp gỡ cơ hội và cộng đồng.
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => scrollTo("clubs")}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-bold text-[15px] rounded-xl border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #FF6B00, #FF8C33)",
                boxShadow: "0 8px 32px rgba(255,107,0,0.35)",
              }}
            >
              Khám Phá CLB <ArrowRight size={16} />
            </button>
            <button
              onClick={() => scrollTo("events")}
              className="inline-flex items-center gap-2 px-7 py-3.5 font-semibold text-[15px] rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.82)",
                border: "1.5px solid rgba(255,255,255,0.16)",
              }}
            >
              Xem Sự Kiện
            </button>
          </div>
        </div>

        {/* Right — floating stat cards */}
        <div className="hidden lg:flex flex-[0_0_44%] relative items-center justify-center min-h-[480px]">
          {/* Ring decorations */}
          <div className="absolute w-[380px] h-[380px] rounded-full border border-[rgba(255,107,0,0.09)]" />
          <div className="absolute w-[260px] h-[260px] rounded-full border border-[rgba(255,107,0,0.06)]" />

          {/* Top-left: CLB count */}
          <div
            className="absolute top-[8%] left-[4%] rounded-2xl px-5 py-4 border backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}
          >
            <div className="text-[30px] font-black text-white leading-none">24+</div>
            <div className="text-[11px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.44)" }}>
              Câu lạc bộ hoạt động
            </div>
          </div>

          {/* Right-mid: student count */}
          <div
            className="absolute top-[42%] right-[-2%] -translate-y-1/2 rounded-2xl px-5 py-4 border backdrop-blur-sm"
            style={{ background: "rgba(255,107,0,0.11)", borderColor: "rgba(255,107,0,0.22)" }}
          >
            <div className="text-[30px] font-black leading-none" style={{ color: "#FF8C33" }}>2,000+</div>
            <div className="text-[11px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.44)" }}>
              Sinh viên tham gia
            </div>
          </div>

          {/* Bottom-left: events count */}
          <div
            className="absolute bottom-[10%] left-[8%] rounded-2xl px-5 py-4 border backdrop-blur-sm"
            style={{ background: "rgba(55,138,221,0.11)", borderColor: "rgba(55,138,221,0.22)" }}
          >
            <div className="text-[30px] font-black text-white leading-none">100+</div>
            <div className="text-[11px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.44)" }}>
              Sự kiện mỗi năm
            </div>
          </div>

          {/* Center logo */}
          <div
            className="w-[92px] h-[92px] rounded-[22px] flex items-center justify-center text-[38px] font-black text-white relative z-10"
            style={{
              background: "linear-gradient(135deg, #FF6B00, #FF8C33)",
              boxShadow: "0 0 56px rgba(255,107,0,0.32), 0 0 120px rgba(255,107,0,0.14)",
            }}
          >
            F
          </div>
        </div>
      </div>

    </section>
  );
}

/* ── How It Works — horizontal timeline ────────────── */
const HOW_STEPS = [
  {
    num: "01", icon: UserPlus,
    title: "Đăng Ký Tài Khoản",
    desc: "Dùng email FPT để tạo tài khoản trong vài giây. Không cần xác nhận thủ công.",
    color: "#FF6B00", glow: "rgba(255,107,0,0.10)", border: "rgba(255,107,0,0.20)",
  },
  {
    num: "02", icon: Search,
    title: "Khám Phá & Tham Gia",
    desc: "Tìm CLB phù hợp với đam mê của bạn và gửi đơn đăng ký trong 1 click.",
    color: "#378ADD", glow: "rgba(55,138,221,0.10)", border: "rgba(55,138,221,0.20)",
  },
  {
    num: "03", icon: Rocket,
    title: "Phát Triển Bản Thân",
    desc: "Tham gia sự kiện, kết nối cộng đồng sinh viên và tích lũy kỹ năng thực tế.",
    color: "#2ECC71", glow: "rgba(46,204,113,0.10)", border: "rgba(46,204,113,0.20)",
  },
];

function HowItWorks() {
  return (
    <section className="px-[5%] py-28 overflow-hidden" style={{ background: "#F7F8FC" }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Left-aligned heading — no eyebrow */}
        <div className="mb-16">
          <h2
            className="font-black mb-3"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#0D1B3E", letterSpacing: "-2px", lineHeight: 1.05 }}
          >
            Chỉ 3 Bước Đơn Giản
          </h2>
          <p className="text-[15px] leading-[1.7] max-w-[380px]" style={{ color: "#4B5674" }}>
            Từ đăng ký đến tham gia, nhanh, dễ, không rào cản.
          </p>
        </div>

        {/* Steps row */}
        <div className="relative flex flex-col md:flex-row gap-10 md:gap-0">

          {HOW_STEPS.map((step) => (
            <div key={step.num} className="flex-1 relative">
              {/* Ghost step number */}
              <div
                className="absolute -top-4 left-0 font-black pointer-events-none select-none leading-none"
                style={{
                  fontSize: "clamp(5rem, 10vw, 7rem)",
                  color: step.color,
                  opacity: 0.06,
                  letterSpacing: "-4px",
                }}
              >
                {step.num}
              </div>

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-5 relative z-10 border"
                style={{ background: step.glow, borderColor: step.border }}
              >
                <step.icon size={26} style={{ color: step.color }} />
              </div>

              <div className="relative z-10 md:pr-10">
                <h3 className="text-[17px] font-extrabold mb-2" style={{ color: "#0D1B3E", letterSpacing: "-0.4px" }}>
                  {step.title}
                </h3>
                <p className="text-[13.5px] leading-[1.7]" style={{ color: "#4B5674" }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features — bento grid ─────────────────────────── */
const FEATURES = [
  {
    icon: Calendar,
    title: "Quản Lý Sự Kiện",
    desc: "Tạo, theo dõi và tham gia sự kiện CLB, tất cả trong một nơi duy nhất.",
    color: "#FF8C33", bg: "rgba(255,107,0,0.10)", border: "rgba(255,107,0,0.20)",
    glow: "rgba(255,107,0,0.22)",
  },
  {
    icon: Users,
    title: "Quản Lý Thành Viên",
    desc: "Phân quyền rõ ràng từ Leader đến Member, dễ dàng kiểm soát và theo dõi.",
    color: "#60A5FA", bg: "rgba(55,138,221,0.10)", border: "rgba(55,138,221,0.20)",
  },
  {
    icon: Bot,
    title: "AI Hỗ Trợ 24/7",
    desc: "Chatbot thông minh giải đáp thắc mắc và hỗ trợ sinh viên mọi lúc mọi nơi.",
    color: "#4ADE80", bg: "rgba(46,204,113,0.10)", border: "rgba(46,204,113,0.20)",
  },
  {
    icon: BarChart2,
    title: "Báo Cáo Minh Bạch",
    desc: "Dashboard thống kê hoạt động CLB theo kỳ học, trực quan và chi tiết.",
    color: "#C4B5FD", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.20)",
  },
];

function FeaturesSection() {
  const [large, ...rest] = FEATURES;
  return (
    <section
      id="features"
      className="px-[5%] py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(150deg, #0D1B3E 0%, #132150 60%, #1a2a5e 100%)" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,107,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto">
        {/* Split header: eyebrow+title left, desc right */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="inline-block text-[12px] font-bold tracking-[3px] uppercase mb-3" style={{ color: "#FF8C33" }}>
              Nền Tảng
            </span>
            <h2
              className="font-black text-white"
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", letterSpacing: "-2px", lineHeight: 1.05 }}
            >
              Tính Năng Nổi Bật
            </h2>
          </div>
          <p className="text-[14px] leading-[1.75] max-w-[320px]" style={{ color: "rgba(255,255,255,0.44)" }}>
            Mọi công cụ bạn cần để quản lý và phát triển câu lạc bộ hiệu quả.
          </p>
        </div>

        {/* Bento: 1 large left + 3 compact right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Large card */}
          <div
            className="rounded-[22px] p-8 relative overflow-hidden cursor-default transition-transform duration-300 hover:-translate-y-1"
            style={{ background: large.bg, border: `1px solid ${large.border}` }}
          >
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-6 border"
              style={{ background: "rgba(255,107,0,0.12)", borderColor: "rgba(255,107,0,0.22)" }}
            >
              <large.icon size={26} style={{ color: large.color }} />
            </div>
            <h3 className="text-[22px] font-extrabold text-white mb-3" style={{ letterSpacing: "-0.5px" }}>
              {large.title}
            </h3>
            <p className="text-[14px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.48)" }}>
              {large.desc}
            </p>
            {/* Radial glow */}
            <div
              className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full blur-[64px] pointer-events-none"
              style={{ background: `radial-gradient(circle, ${large.glow} 0%, transparent 70%)` }}
            />
          </div>

          {/* Right column — 3 compact cards */}
          <div className="flex flex-col gap-4">
            {rest.map((f) => (
              <div
                key={f.title}
                className="rounded-[18px] p-5 relative overflow-hidden cursor-default transition-transform duration-300 hover:-translate-y-0.5 flex items-start gap-4"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
              >
                <div
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 border"
                  style={{ background: f.bg, borderColor: f.border }}
                >
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-white mb-1" style={{ letterSpacing: "-0.3px" }}>
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.46)" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA Banner — asymmetric flex ─────────────────── */
function CTABanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <section className="px-[5%] py-28 relative overflow-hidden" style={{ background: "#F7F8FC" }}>
      {/* Ambient glow */}
      <div
        className="absolute -left-24 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 70%)" }}
      />

      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Left: heading + sub */}
          <div className="max-w-[540px]">
            <h2
              className="font-black mb-4"
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
                color: "#0D1B3E",
                letterSpacing: "-2px",
                lineHeight: 1.05,
              }}
            >
              Sẵn Sàng Trở Thành<br />
              <span style={{ color: "#F37021" }}>Một Phần Của Cộng Đồng?</span>
            </h2>
            <p className="text-[15px] leading-[1.75]" style={{ color: "#4B5674" }}>
              Tham gia ngay hôm nay để kết nối với hàng nghìn sinh viên FPT,
              phát triển kỹ năng và tạo ra những kỷ niệm đáng nhớ.
            </p>
          </div>

          {/* Right: CTA button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => !user && navigate("/register")}
              disabled={!!user}
              className="inline-flex items-center gap-2.5 px-9 py-4 text-white font-bold text-[16px] rounded-2xl border-none transition-all duration-200"
              style={{
                background: user
                  ? "linear-gradient(135deg, #ccc, #bbb)"
                  : "linear-gradient(135deg, #FF6B00, #FF8C33)",
                boxShadow: user ? "none" : "0 8px 40px rgba(255,107,0,0.28)",
                cursor: user ? "not-allowed" : "pointer",
                opacity: user ? 0.5 : 1,
              }}
            >
              Đăng Ký Miễn Phí <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Accent divider */}
        <div className="mt-16 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "#E4E6EF" }} />
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F37021" }} />
          <div className="h-px flex-1" style={{ background: "#E4E6EF" }} />
        </div>
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <ClubsSection />
      <FeaturesSection />
      <EventsSection />
      <CTABanner />
      <AiChat />
    </div>
  );
}
