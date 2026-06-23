import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import eventService from "../../services/api/events/eventService";

export default function PersonnelAssignmentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form states
  const [newUserId, setNewUserId] = useState("");
  const [newRoleId, setNewRoleId] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await eventService.getAssignments(eventId);
        setAssignments(Array.isArray(response) ? response : (response.data || []));
      } catch (error) {
        console.error("Lỗi khi tải phân công:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [eventId]);

  const handleAddAssignment = async () => {
    setAdding(true);
    try {
      await eventService.addAssignment(eventId, { userID: parseInt(newUserId), eventRoleID: parseInt(newRoleId) });
      alert("Đã phân công thành viên thành công.");
      setNewUserId("");
      setNewRoleId("");
      // Refresh assignments list here
    } catch (error) {
      alert("Lỗi khi phân công: " + error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAssignment = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phân công này?")) return;
    try {
      await eventService.removeAssignment(eventId, userId);
      alert("Đã xóa phân công.");
      // Refresh assignments list here
    } catch (error) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> Đang tải...</div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer border-none bg-transparent">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <h1 className="page-title m-0">Phân công Nhân sự</h1>
      </div>

      <div className="content-card mt-6">
        <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <input type="number" placeholder="ID Thành viên" value={newUserId} onChange={e => setNewUserId(e.target.value)} className="border rounded px-3 py-2" />
          <input type="number" placeholder="ID Vai trò" value={newRoleId} onChange={e => setNewRoleId(e.target.value)} className="border rounded px-3 py-2" />
          <button onClick={handleAddAssignment} disabled={adding} className="bg-[#E6430A] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer border-none">
            <Plus size={16} /> Thêm
          </button>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">User ID</th>
              <th className="px-6 py-3">Role ID</th>
              <th className="px-6 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.userID} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{a.userID}</td>
                <td className="px-6 py-4">{a.eventRoleID}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleRemoveAssignment(a.userID)} className="text-red-600 hover:text-red-800 cursor-pointer border-none bg-transparent">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
