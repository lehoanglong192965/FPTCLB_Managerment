import {
  IconFacebook, IconTwitter, IconInstagram, IconLinkedin,
  IconMapPin, IconPhone, IconMail
} from "../assets/icons/icons";

const FOOTER_LINKS = {
  "Khám Phá": ["Trang Chủ", "Câu Lạc Bộ", "Sự Kiện", "Về Chúng Tôi"],
  "Hỗ Trợ":   ["Hướng Dẫn", "FAQ", "Liên Hệ", "Chính Sách"],
};

const SOCIAL_ICONS = [
  { icon: <IconFacebook />, label: "Facebook"  },
  { icon: <IconTwitter />,  label: "Twitter"   },
  { icon: <IconInstagram />,label: "Instagram" },
  { icon: <IconLinkedin />, label: "LinkedIn"  },
];

const CONTACT_ITEMS = [
  { icon: <IconMapPin />, text: "7 Đ. D1, Tăng Nhơn Phú, Hồ Chí Minh 700000, Việt Nam" },
  { icon: <IconPhone />,  text: "1900 6735"            },
  { icon: <IconMail />,   text: "fptuclubs@fpt.edu.vn" },
];

export default function Footer() {
  return (
    <footer
      className="bg-[var(--navy)] border-t border-white/[0.06] pt-14 px-[5%] pb-7"
    >
      <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr] gap-10 max-w-[1200px] mx-auto mb-12 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">

        <div className="footer__brand">
          <a href="/" className="flex items-center gap-[10px] no-underline">
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
          <p className="text-[13px] leading-[1.7] max-w-[230px] mt-[14px] mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Nền tảng quản lý câu lạc bộ sinh viên chính thức của Đại học FPT
            — kết nối đam mê, xây dựng cộng đồng.
          </p>
          <div className="flex gap-[10px]">
            {SOCIAL_ICONS.map((s) => (
              <button
                key={s.label}
                className="w-9 h-9 rounded-sm bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[15px] cursor-pointer transition-all duration-200 hover:bg-[var(--orange)] hover:border-[var(--orange)] hover:-translate-y-0.5"
                aria-label={s.label}
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="text-[13px] font-extrabold text-white/85 tracking-[0.3px] mb-4">{heading}</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-[10px]">
              {links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-[13px] font-medium no-underline transition-colors duration-200 hover:text-[var(--orange-light)]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-[13px] font-extrabold text-white/85 tracking-[0.3px] mb-4">Liên Hệ</h4>
          {CONTACT_ITEMS.map((item) => (
            <div key={item.text} className="flex items-start gap-2 text-[13px] font-medium mb-[10px] leading-[1.5]" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="flex-shrink-0 mt-[1px]">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

      </div>

      <div className="max-w-[1200px] mx-auto pt-6 border-t border-white/[0.07] flex items-center justify-between flex-wrap gap-3">
        <p className="text-[12px] text-white/30 font-medium m-0">© 2026 FPTU Clubs · Đại học FPT. All rights reserved.</p>
        <span className="text-[11px] font-bold text-white/25 tracking-[0.5px]">Made by FPT Students</span>
      </div>
    </footer>
  );
}
