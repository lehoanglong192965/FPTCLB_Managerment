import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Rocket, Calendar, Users, Bot, BarChart2 } from "lucide-react";
import ClubsSection from "../../components/clubs/ClubsSection";
import EventsSection from "../../components/events/EventsSection";
import AiChat from "../../components/AiChat";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/* ── Hero ─────────────────────────────────────────── */
function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-[5%] pb-20"
      style={{
        paddingTop: "calc(68px + 40px)",
        background: "linear-gradient(150deg, #0D1B3E 0%, #132150 55%, #1a2a5e 100%)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.22) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(26,111,196,0.20) 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 left-[30%] w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(39,174,96,0.12) 0%, transparent 70%)" }} />

      {/* Content */}
      <div className="relative z-10 text-center max-w-[820px] mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-[18px] py-[6px] text-xs font-bold tracking-[0.5px] uppercase mb-7 border"
          style={{
            background: "rgba(255,107,0,0.12)",
            borderColor: "rgba(255,107,0,0.35)",
            color: "#FF8C33",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#FF6B00" }}
          />
          Đại Học FPT – Hệ Thống Câu Lạc Bộ
        </div>

        {/* Title */}
        <h1
          className="font-black leading-[1.08] text-white mb-6"
          style={{ fontSize: "clamp(2.6rem, 6.5vw, 5rem)", letterSpacing: "-2.5px" }}
        >
          Kết Nối. Phát Triển.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #FF6B00, #FF8C33 60%, #FFD580)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Toả Sáng.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-[17px] leading-[1.75] max-w-[560px] mx-auto mb-10"
          style={{ color: "rgba(255,255,255,0.60)" }}
        >
          Nền tảng quản lý và tham gia câu lạc bộ dành riêng cho sinh viên FPT —
          nơi đam mê gặp gỡ cơ hội và cộng đồng.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-3.5 justify-center flex-wrap mb-14">
          <button
            onClick={() => scrollTo("clubs")}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-bold text-[15px] rounded-xl border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FF6B00, #FF8C33)",
              boxShadow: "0 8px 32px rgba(255,107,0,0.35)",
            }}
          >
            Khám Phá CLB 
          </button>
          <button
            onClick={() => scrollTo("events")}
            className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-[15px] rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.85)",
              border: "1.5px solid rgba(255,255,255,0.18)",
            }}
          >
            Xem Sự Kiện
          </button>
        </div>

      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────────────── */
const HOW_STEPS = [
  {
    num: "01", icon: UserPlus,
    title: "Đăng Ký Tài Khoản",
    desc: "Dùng email FPT để tạo tài khoản trong vài giây. Không cần xác nhận thủ công.",
    color: "#FF6B00", glow: "rgba(255,107,0,0.12)", border: "rgba(255,107,0,0.25)",
  },
  {
    num: "02", icon: Search,
    title: "Khám Phá & Tham Gia",
    desc: "Tìm CLB phù hợp với đam mê của bạn và gửi đơn đăng ký trong 1 click.",
    color: "#378ADD", glow: "rgba(55,138,221,0.12)", border: "rgba(55,138,221,0.25)",
  },
  {
    num: "03", icon: Rocket,
    title: "Phát Triển Bản Thân",
    desc: "Tham gia sự kiện, kết nối cộng đồng sinh viên và tích lũy kỹ năng thực tế.",
    color: "#2ECC71", glow: "rgba(46,204,113,0.12)", border: "rgba(46,204,113,0.25)",
  },
];

function HowItWorks() {
  return (
    <section
      className="relative overflow-hidden px-[5%] py-24"
      style={{ background: "linear-gradient(150deg, #0D1B3E 0%, #132150 60%, #1a2a5e 100%)" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 50%, transparent 100%)",
        }}
      />

      {/* Section header */}
      <div className="relative z-10 text-center mb-16">
        <span className="inline-block text-[13px] font-bold tracking-[3px] uppercase mb-3" style={{ color: "#FF8C33" }}>
          Bắt Đầu Ngay
        </span>
        <h2
          className="font-black text-white mb-4"
          style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", letterSpacing: "-1.5px", lineHeight: 1.1 }}
        >
          Chỉ 3 Bước Đơn Giản
        </h2>
        <p className="text-[15px] max-w-[460px] mx-auto leading-[1.7]" style={{ color: "rgba(255,255,255,0.50)" }}>
          Từ đăng ký đến tham gia — nhanh, dễ, không rào cản.
        </p>
      </div>

      {/* Steps */}
      <div className="relative z-10 flex flex-col md:flex-row items-start justify-center gap-0 max-w-[900px] mx-auto">
        {HOW_STEPS.map((step, i) => (
          <div key={step.num} className="flex-1 flex flex-col items-center text-center px-6 relative group">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:-translate-y-1 border"
              style={{ background: step.glow, borderColor: step.border }}
            >
              <step.icon size={26} style={{ color: step.color }} />
            </div>
            {/* Number */}
            <span className="text-[11px] font-black tracking-[2px] uppercase mb-2.5 opacity-70" style={{ color: step.color }}>
              {step.num}
            </span>
            <h3 className="text-[16px] font-bold text-white mb-2.5" style={{ letterSpacing: "-0.3px" }}>
              {step.title}
            </h3>
            <p className="text-[13.5px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.48)" }}>
              {step.desc}
            </p>
            {/* Arrow connector */}
            {i < HOW_STEPS.length - 1 && (
              <span className="hidden md:block absolute top-8 right-[-14px] text-[22px] z-10" style={{ color: "rgba(255,255,255,0.15)" }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: Calendar,
    title: "Quản Lý Sự Kiện",
    desc: "Tạo, theo dõi và tham gia sự kiện CLB — tất cả trong một nơi duy nhất.",
    color: "#FF6B00", bg: "rgba(255,107,0,0.08)", border: "rgba(255,107,0,0.18)",
  },
  {
    icon: Users,
    title: "Quản Lý Thành Viên",
    desc: "Phân quyền rõ ràng từ Leader đến Member, dễ dàng kiểm soát và theo dõi.",
    color: "#378ADD", bg: "rgba(55,138,221,0.08)", border: "rgba(55,138,221,0.18)",
  },
  {
    icon: Bot,
    title: "AI Hỗ Trợ 24/7",
    desc: "Chatbot thông minh giải đáp thắc mắc và hỗ trợ sinh viên mọi lúc mọi nơi.",
    color: "#2ECC71", bg: "rgba(46,204,113,0.08)", border: "rgba(46,204,113,0.18)",
  },
  {
    icon: BarChart2,
    title: "Báo Cáo Minh Bạch",
    desc: "Dashboard thống kê hoạt động CLB theo kỳ học, trực quan và chi tiết.",
    color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.18)",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="px-[5%] py-24" style={{ background: "#F7F8FC" }}>
      {/* Header */}
      <div className="text-center mb-14">
        <span
          className="inline-block text-[13px] font-bold tracking-[3px] uppercase mb-3"
          style={{ color: "#FF6B00" }}
        >
          Nền Tảng
        </span>
        <h2
          className="font-black mb-3.5"
          style={{
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            color: "#0D1B3E",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          Tính Năng Nổi Bật
        </h2>
        <p className="text-[15px] max-w-[480px] mx-auto leading-[1.7]" style={{ color: "#4B5674" }}>
          Mọi công cụ bạn cần để quản lý và phát triển câu lạc bộ hiệu quả.
        </p>
      </div>

      {/* Grid */}
      <div
        className="grid gap-5 max-w-[1100px] mx-auto"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-[20px] p-7 relative overflow-hidden transition-all duration-200 hover:-translate-y-1.5 group"
            style={{ border: `1.5px solid #E8EAF0`, boxShadow: "0 2px 8px rgba(13,27,62,0.05)" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,27,62,0.10)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,27,62,0.05)"}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-[13px] flex items-center justify-center mb-[18px] border"
              style={{ background: f.bg, borderColor: f.border }}
            >
              <f.icon size={22} style={{ color: f.color }} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-2.5" style={{ color: "#0D1B3E", letterSpacing: "-0.3px" }}>
              {f.title}
            </h3>
            <p className="text-[13.5px] leading-[1.65]" style={{ color: "#4B5674" }}>
              {f.desc}
            </p>
            {/* Animated bottom line */}
            <div
              className="absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-300 ease-out rounded-tr-sm"
              style={{ background: f.color }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA Banner ───────────────────────────────────── */
function CTABanner() {
  const navigate = useNavigate();
  return (
    <section className="px-[5%] py-24" style={{ background: "#F7F8FC" }}>
      <div
        className="max-w-[760px] mx-auto text-center rounded-[28px] px-12 py-[72px] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #1C2F6E 100%)", boxShadow: "0 16px 48px rgba(13,27,62,0.14)" }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[28px]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,107,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.05) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        {/* Blob */}
        <div
          className="absolute w-[320px] h-[320px] rounded-full blur-[70px] pointer-events-none top-[-90px] right-[-70px]"
          style={{ background: "radial-gradient(circle, rgba(255,107,0,0.20) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full blur-[60px] pointer-events-none bottom-[-100px] left-[-60px]"
          style={{ background: "radial-gradient(circle, rgba(26,111,196,0.18) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <h2
            className="font-black text-white mb-4"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-1px", lineHeight: 1.12 }}
          >
            Sẵn Sàng Trở Thành<br />
            Một Phần Của Cộng Đồng?
          </h2>
          <p className="text-[15px] leading-[1.7] mb-9 max-w-[440px] mx-auto" style={{ color: "rgba(255,255,255,0.58)" }}>
            Tham gia ngay hôm nay để kết nối với hàng nghìn sinh viên FPT,
            phát triển kỹ năng và tạo ra những kỷ niệm đáng nhớ.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-2 px-9 py-3.5 text-white font-bold text-[15px] rounded-xl border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FF6B00, #FF8C33)",
              boxShadow: "0 8px 32px rgba(255,107,0,0.35)",
            }}
          >
            Đăng Ký Miễn Phí →
          </button>
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
      <ClubsSection />
      <EventsSection />
      <HowItWorks />
      <FeaturesSection />
      <CTABanner />
      <AiChat />
    </div>
  );
}
