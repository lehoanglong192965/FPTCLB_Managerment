import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import eventService from "../../services/api/events/eventService";

export default function ContributionManagementPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const response = await eventService.getContributions(eventId);
        const data = response?.data ?? response ?? [];
        setContributions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách đóng góp:", error);
        setContributions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, [eventId]);

  const handleTypeChange = (userId, newType) => {
    setContributions((prev) =>
      prev.map((c) => (c.userID === userId ? { ...c, contributionType: newType } : c))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await eventService.saveContributions(eventId, contributions);
      alert("Đã lưu danh sách đóng góp!");
      navigate("../events", { relative: "path" });
    } catch (error) {
      alert("Lỗi khi lưu: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> Đang tải...</div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer border-none bg-transparent">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <h1 className="page-title m-0">Chốt Bảng Đóng Góp</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#E6430A] text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer border-none">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Lưu thay đổi
        </button>
      </div>

      <div className="content-card mt-6">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Tên thành viên</th>
              <th className="px-6 py-3">Loại đóng góp</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c) => (
              <tr key={c.userID} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{c.userName}</td>
                <td className="px-6 py-4">
                  <select
                    value={c.contributionType}
                    onChange={(e) => handleTypeChange(c.userID, e.target.value)}
                    className="border rounded p-1.5 outline-none"
                  >
                    <option value="CORE_TEAM">Core Team</option>
                    <option value="SUPPORT_ORGANIZER">Support</option>
                    <option value="PARTICIPANT">Participant</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
