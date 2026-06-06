import React, { useEffect, useState } from 'react';
import {
  Edit3, Mail, Phone, Link2, Briefcase, MapPin, Lock, Clock, Shield
} from 'lucide-react';
import '../assets/css/AlumniProfilePage.css';

export default function AlumniProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    const mock = {
      name: 'Nguyễn Hương',
      intake: 'Khóa 2025',
      skills: ['UI/UX', 'Design Thinking'],
      company: 'FPT Software',
      position: 'UX Designer',
      email: 'huong.ng@alumni.fpt.edu.vn',
      phone: '0934 567 890',
      linkedin: 'linkedin.com/in/nguyenhuong',
      mentorship: true,
      history: [
        {
          id: 1,
          clubName: 'Art Club',
          role: 'Leader',
          semester: 'SP25',
          contributions: ['Dẫn dắt Art Exhibition 2025', 'Xây dựng bộ nhận diện visual cho CLB'],
        },
        {
          id: 2,
          clubName: 'Art Club',
          role: 'Vice Leader',
          semester: 'FA24',
          contributions: ['Tổ chức workshop thiết kế', 'Quản lý fanpage CLB'],
        },
      ],
    };
    setProfile(mock);
    setDraft({ email: mock.email, phone: mock.phone, company: mock.company, position: mock.position, linkedin: mock.linkedin });
    setLoading(false);
  }, []);

  if (loading) return <div className="ap-loading">Đang tải...</div>;
  if (!profile) return null;

  const initials = profile.name.split(' ').slice(-1)[0][0];

  const handleSave = () => {
    setProfile(prev => ({ ...prev, ...draft }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft({ email: profile.email, phone: profile.phone, company: profile.company, position: profile.position, linkedin: profile.linkedin });
    setIsEditing(false);
  };

  return (
    <div className="ap-wrapper">
      {/* Header */}
      <div className="ap-header">
        <div>
          <h1 className="ap-title">Hồ Sơ Cựu Sinh Viên</h1>
          <p className="ap-subtitle">
            Cập nhật thông tin hiện tại
          </p>
        </div>
        <div className="ap-header-actions">
          {!isEditing ? (
            <button className="ap-btn-edit" onClick={() => setIsEditing(true)}>
              <Edit3 size={15} /> Chỉnh sửa
            </button>
          ) : (
            <div className="ap-edit-actions">
              <button className="ap-btn-save" onClick={handleSave}>Lưu</button>
              <button className="ap-btn-cancel" onClick={handleCancel}>Hủy</button>
            </div>
          )}
        </div>
      </div>

      {/* Body grid */}
      <div className="ap-body">
        {/* Left column */}
        <div className="ap-left">
          {/* Avatar card */}
          <div className="ap-card ap-avatar-card">
            <div className="ap-avatar">{initials}</div>
            <div className="ap-name">{profile.name}</div>
            <div className="ap-intake">🎓 {profile.intake}</div>
            <div className="ap-skills">
              {profile.skills.map(s => (
                <span key={s} className={`ap-skill-tag ${s === 'UI/UX' ? 'tag-blue' : 'tag-dark'}`}>{s}</span>
              ))}
            </div>
          </div>

          {/* Mentorship card — READ ONLY, toggle bị khoá */}
          <div className="ap-card ap-mentorship-card">
            <div className="ap-mentorship-info">
              <div className="ap-mentorship-title">Nhận Mentorship</div>
              <div className="ap-mentorship-sub">Cho phép sinh viên đặt lịch mentor</div>
            </div>
            {/* Toggle chỉ hiển thị, không thể click */}
            <div className={`ap-toggle on ap-toggle-readonly`} aria-disabled="true">
              <span className="ap-toggle-knob" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="ap-right">
          {/* Current info card */}
          <div className="ap-card">
            <div className="ap-card-head">
              <div className="ap-card-title-row">
                <Edit3 size={16} className="ap-card-icon" />
                <span className="ap-card-title">Thông tin hiện tại</span>
              </div>
              {isEditing && <span className="ap-editing-badge">Đang chỉnh sửa</span>}
            </div>

            <div className="ap-info-grid">
              <div className="ap-info-item">
                <label className="ap-info-label"><Briefcase size={13} /> Công ty hiện tại</label>
                {isEditing
                  ? <input className="ap-input" value={draft.company} onChange={e => setDraft(d => ({ ...d, company: e.target.value }))} />
                  : <div className="ap-info-value">{profile.company}</div>}
              </div>

              <div className="ap-info-item">
                <label className="ap-info-label"><MapPin size={13} /> Vị trí</label>
                {isEditing
                  ? <input className="ap-input" value={draft.position} onChange={e => setDraft(d => ({ ...d, position: e.target.value }))} />
                  : <div className="ap-info-value">{profile.position}</div>}
              </div>

              <div className="ap-info-item">
                <label className="ap-info-label"><Mail size={13} /> Email</label>
                {isEditing
                  ? <input className="ap-input" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
                  : <div className="ap-info-value">{profile.email}</div>}
              </div>

              <div className="ap-info-item">
                <label className="ap-info-label"><Phone size={13} /> Số điện thoại</label>
                {isEditing
                  ? <input className="ap-input" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
                  : <div className="ap-info-value">{profile.phone}</div>}
              </div>

              <div className="ap-info-item ap-info-full">
                <label className="ap-info-label"><Link2 size={13} /> LinkedIn</label>
                {isEditing
                  ? <input className="ap-input" value={draft.linkedin} onChange={e => setDraft(d => ({ ...d, linkedin: e.target.value }))} />
                  : <div className="ap-info-value">{profile.linkedin}</div>}
              </div>
            </div>
          </div>

          {/* Contribution history card */}
          <div className="ap-card ap-history-card">
            <div className="ap-card-head">
              <div className="ap-card-title-row">
                <Lock size={16} className="ap-card-icon-purple" />
                <span className="ap-card-title">Lịch sử cống hiến</span>
              </div>
              <div className="ap-history-badges">
                
                <span className="ap-badge-readonly">Xem</span>
              </div>
            </div>

            <div className="ap-readonly-notice">
              <Shield size={13} className="ap-notice-icon" />
              <span>
                Chỉ có thể xem, không thể chỉnh sửa.
              </span>
            </div>

            <div className="ap-history-list">
              {profile.history.map(h => (
                <div key={h.id} className="ap-history-item">
                  <div className="ap-history-top">
                    <div className="ap-history-left">
                      <div className="ap-clock-wrap">
                        <Clock size={13} className="ap-clock-icon" />
                      </div>
                      <div className="ap-history-meta">
                        <div className="ap-history-club">
                          <span className="ap-club-name">{h.clubName}</span>
                          <span className="ap-role-tag role-white">{h.role}</span>
                          <span className="ap-sem-tag sem-gray">{h.semester}</span>
                        </div>
                        <ul className="ap-contrib-list">
                          {h.contributions.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="ap-frozen-badge"><Lock size={9} /> Khóa</div>
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