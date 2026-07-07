import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import axiosClient from "../../services/api/axiosClient";

const LS_KEY = "fptclb_notif_settings";

const DEFAULT_SETTINGS = {
  approval:           true,
  event:              true,
  recruit:            true,
  reminder_1h:        true,
  reminder_24h:       false,
  general:            true,
  quietHoursEnabled:  false,
  quietFrom:          "22:00",
  quietTo:            "07:00",
};

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") }; }
  catch { return DEFAULT_SETTINGS; }
}

/* ── Toggle ─────────────────────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 border-0 cursor-pointer flex-shrink-0 ${
        disabled  ? "bg-gray-200 cursor-not-allowed" :
        checked   ? "bg-[#E6430A]" : "bg-gray-200 hover:bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-[3px] left-0 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[21px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/* ── Setting Row ─────────────────────────────────────────────────── */

function SettingRow({ label, desc, settingKey, settings, onChange, locked }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[#F3F4F6] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-gray-800 m-0 mb-0.5">{label}</p>
        {desc && <p className="text-[12.5px] text-gray-400 m-0 leading-relaxed">{desc}</p>}
      </div>
      {locked ? (
        <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
          <Lock size={13} />
          <span className="text-[11.5px] font-medium">Không thể tắt</span>
        </div>
      ) : (
        <Toggle
          checked={settings[settingKey]}
          onChange={(val) => onChange(settingKey, val)}
        />
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export default function MemberNotificationSettings() {
  const navigate             = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [saved,    setSaved]    = useState(false);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
    try {
      await axiosClient.put("/member/notification-settings", settings);
    } catch {
      // localStorage save succeeded; server sync is best-effort
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          className="w-9 h-9 rounded-[10px] border border-gray-200 bg-white flex items-center justify-center text-gray-500 cursor-pointer hover:border-[#E6430A] hover:text-[#E6430A] transition-colors"
          onClick={() => navigate("/member/notifications")}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title mb-0">Cài Đặt Thông Báo</h1>
          <p className="page-subtitle m-0">Kiểm soát loại thông báo bạn muốn nhận.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Group 1: Critical */}
        <div className="bg-white rounded-[14px] border border-[#F0F0F0] px-5 py-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-4 pb-2 m-0">
            Thông báo quan trọng
          </p>
          <SettingRow
            label="Hạn chót & báo cáo"
            desc="Nhắc nhở khi đến hạn nộp báo cáo hoặc gia hạn thành viên."
            settingKey="deadline"
            settings={settings}
            onChange={handleChange}
            locked
          />
        </div>

        {/* Group 2: Events & Clubs */}
        <div className="bg-white rounded-[14px] border border-[#F0F0F0] px-5 py-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-4 pb-2 m-0">
            Sự kiện & câu lạc bộ
          </p>
          <SettingRow
            label="Sự kiện mới"
            desc="Khi câu lạc bộ bạn tham gia tổ chức sự kiện mới."
            settingKey="event"
            settings={settings}
            onChange={handleChange}
          />
          <SettingRow
            label="Mở đơn tuyển thành viên"
            desc="Khi câu lạc bộ mở đơn tuyển gen mới."
            settingKey="recruit"
            settings={settings}
            onChange={handleChange}
          />
        </div>

        {/* Group 3: General */}
        <div className="bg-white rounded-[14px] border border-[#F0F0F0] px-5 py-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-4 pb-2 m-0">
            Thông báo chung
          </p>
          <SettingRow
            label="Tin tức & thông báo từ câu lạc bộ"
            desc="Các thông báo thủ công từ trưởng câu lạc bộ."
            settingKey="general"
            settings={settings}
            onChange={handleChange}
          />
        </div>


        {/* Save */}
        <div className="flex items-center gap-3 pt-1 pb-4">
          <button
            className="flex items-center gap-2 px-6 py-[10px] rounded-[10px] bg-[#E6430A] text-white text-[13.5px] font-bold border-0 cursor-pointer font-[inherit] hover:bg-[#c73a08] transition-colors"
            onClick={handleSave}
          >
            {saved ? <CheckCircle2 size={15} /> : null}
            {saved ? "Đã lưu!" : "Lưu thay đổi"}
          </button>
          <button
            className="px-5 py-[10px] rounded-[10px] border border-gray-200 bg-white text-gray-600 text-[13.5px] font-medium cursor-pointer font-[inherit] hover:border-gray-300 transition-colors"
            onClick={() => { setSettings(loadSettings()); setSaved(false); }}
          >
            Hoàn tác
          </button>
        </div>
      </div>
    </div>
  );
}
