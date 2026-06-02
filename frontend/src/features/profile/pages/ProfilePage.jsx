import { useState, useEffect } from "react";
import { Mail, Phone, Monitor, ChevronRight, Edit3, Users } from "lucide-react";
import "../../../assets/css/ProfilePage.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockProfile = {
      name: "Nguyễn Văn An",
      studentId: "SE123456",
      faculty: "Kỹ thuật phần mềm",
      email: "an@gmail.com",
      phone: "0987 654 321",
      major: "Kỹ thuật phần mềm",
      clubs: [
        { id: 1, name: "FPTU IT Club", tag: "IT" },
      ],
      timeline: [
        { id: 1, status: "active", period: "Hôm nay",       event: "Đăng nhập hệ thống",                      sub: "Xem thông tin CLB"   },
        { id: 2, status: "past",   period: "Tháng 5, 2026", event: 'Tham gia sự kiện "Tech Talk: AI & LLM"',   sub: "Đã check-in"         },
        { id: 3, status: "past",   period: "Tháng 9, 2022", event: "Gia nhập IT Club",                         sub: "Vai trò: Thành viên" },
      ],
    };
    setProfile(mockProfile);
    setLoading(false);
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;

  const initial = profile.name.split(" ").pop()[0].toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-layout">

        {/* ── LEFT COLUMN ── */}
        <div className="profile-left">
          <div className="side-card">
            <div className="side-body">
              <div className="side-avatar">{initial}</div>
              <div className="side-name">{profile.name}</div>
              <div className="side-sub">{profile.studentId} · {profile.faculty}</div>

              <div className="profile-badge-blue">
                <Users size={12} /> {profile.clubs[0]?.name}
              </div>

              <button className="side-edit-btn">Chỉnh sửa hồ sơ</button>
            </div>
          </div>

          <div className="clubs-section">
            <h3 className="section-title">CLB đang tham gia</h3>
            <div className="r-card">
              {profile.clubs.map((club) => (
                <div key={club.id} className="club-item">
                  <div className="club-thumb">
                    <Monitor size={18} color="#fff" />
                  </div>
                  <div className="club-info-text">
                    <div className="club-name">{club.name}</div>
                    <div className="club-tag">{club.tag}</div>
                  </div>
                  <ChevronRight size={16} className="arrow-gray" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="profile-right">
          <div className="info-card">
            <div className="info-card-header">
              <div className="title-with-icon">
                <Edit3 size={18} className="icon-orange" />
                <span className="info-card-title">Thông tin cá nhân</span>
              </div>
              <button className="info-card-edit">Sửa</button>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Chuyên ngành</label>
                <div className="info-value">{profile.major}</div>
              </div>
              <div className="info-item">
                <label>Mã sinh viên</label>
                <div className="info-value">{profile.studentId}</div>
              </div>
              <div className="info-item">
                <label><Mail size={14} className="label-icon" /> Email</label>
                <div className="info-value">{profile.email}</div>
              </div>
              <div className="info-item">
                <label><Phone size={14} className="label-icon" /> Số điện thoại</label>
                <div className="info-value">{profile.phone}</div>
              </div>
            </div>
          </div>

          <div className="r-card history-card">
            <h3 className="r-card-title">Lịch sử hoạt động</h3>
            <div className="timeline">
              {profile.timeline.map((item, idx) => (
                <div key={item.id} className="tl-item">
                  <div className="tl-dot-col">
                    <div className={`tl-dot ${item.status}`} />
                    {idx < profile.timeline.length - 1 && <div className="tl-line" />}
                  </div>
                  <div className="tl-content">
                    <div className={`tl-period ${item.status}`}>{item.period}</div>
                    <div className="tl-event">{item.event}</div>
                    <div className="tl-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
