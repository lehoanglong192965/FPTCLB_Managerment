import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function IcpdpEmergencyOverrideLookup() {
  const navigate = useNavigate();
  const [eventId, setEventId] = useState('');

  const handleGo = (e) => {
    e.preventDefault();
    const id = eventId.trim();
    if (id) navigate(`/icpdp/events/${id}/emergency-override`);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Emergency Override Check-in</h1>
        <p className="page-subtitle">
          Bypass giới hạn capacity — chỉ dùng khi được ủy quyền
        </p>
      </div>

      <div className="max-w-sm">
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          Hành động này ghi vào audit log và không thể hoàn tác. Chỉ sử dụng trong trường hợp khẩn cấp.
        </div>

        <form onSubmit={handleGo} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID sự kiện cần override *
            </label>
            <input
              type="number"
              min={1}
              required
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="VD: 42"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Event ID có thể lấy từ URL hoặc từ trang quản lý sự kiện.
            </p>
          </div>

          <button
            type="submit"
            disabled={!eventId.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Tiếp tục <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
