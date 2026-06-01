import "../assets/css/footer.css";
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
    <footer className="footer">
      <div className="footer__grid">

        {/* Brand */}
        <div className="footer__brand">
          <a href="/" className="header__logo">
            <div className="header__logo-icon">F</div>
            <div className="header__logo-text">
              <span>FPTU Clubs</span>
            </div>
          </a>
          <p>
            Nền tảng quản lý câu lạc bộ sinh viên chính thức của Đại học FPT
            — kết nối đam mê, xây dựng cộng đồng.
          </p>
          <div className="footer__socials">
            {SOCIAL_ICONS.map((s) => (
              <button key={s.label} className="footer__social-btn" aria-label={s.label}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="footer__col">
            <h4>{heading}</h4>
            <ul className="footer__links">
              {links.map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        <div className="footer__col">
          <h4>Liên Hệ</h4>
          {CONTACT_ITEMS.map((item) => (
            <div key={item.text} className="footer__contact-item">
              <span className="footer__contact-icon">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

      </div>

      <div className="footer__bottom">
        <p>© 2026 FPTU Clubs · Đại học FPT. All rights reserved.</p>
        <span className="footer__bottom-badge">Made by FPT Students</span>
      </div>
    </footer>
  );
}