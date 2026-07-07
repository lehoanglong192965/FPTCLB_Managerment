import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import eventService from "../../services/api/events/eventService";
import { useClubData } from "../../contexts/ClubDataContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";

const EVENT_ROLES = [
  { id: 1, label: "Trưởng ban tổ chức (Core)" },
  { id: 2, label: "Thành viên hỗ trợ (Support)" },
  { id: 3, label: "Truyền thông" },
  { id: 4, label: "Hậu cần" },
];

export default function PersonnelAssignmentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { members } = useClubData();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form states
  const [newUserId, setNewUserId] = useState("");
  const [newRoleId, setNewRoleId] = useState("");

  const fetchAssignments = async () => {
    try {
      const response = await eventService.getAssignments(eventId);
      const data = Array.isArray(response) ? response : (response.data || []);
      // Lọc các phân công chưa bị xóa mềm (isDeleted === false)
      setAssignments(data.filter(a => !a.isDeleted));
    } catch (error) {
      console.error("Lỗi khi tải phân công:", error);
    } finally {
      setLoading(false);
    }
  };

  const unassignedMembers = members?.filter(
    m => !assignments.some(a => a.userID === m.userID)
  );

  useEffect(() => {
    fetchAssignments();
  }, [eventId]);

  const handleAddAssignment = async () => {
    if (!newUserId || !newRoleId) {
      toast.error("Vui lòng chọn thành viên và vai trò.");
      return;
    }

    setAdding(true);
    try {
      await eventService.addAssignment(eventId, { userID: parseInt(newUserId), eventRoleID: parseInt(newRoleId) });
      toast.success("Đã phân công thành viên thành công.");
      setNewUserId("");
      setNewRoleId("");
      await fetchAssignments(); // Refresh assignments list
    } catch (error) {
      toast.error("Lỗi khi phân công: " + (error.response?.data?.message || error.message));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAssignment = async (userId) => {
    if (!(await confirm("Bạn có chắc chắn muốn xóa phân công này?", { danger: true, confirmLabel: "Xóa" }))) return;
    try {
      await eventService.removeAssignment(eventId, userId);
      toast.success("Đã xóa phân công.");
      await fetchAssignments(); // Refresh assignments list
    } catch (error) {
      toast.error("Lỗi khi xóa: " + (error.response?.data?.message || error.message));
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
        {/* Form Phân công */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thành viên CLB</label>
            <select
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E6430A] focus:border-[#E6430A] outline-none bg-white text-gray-800"
            >
              <option value="">-- Chọn thành viên --</option>
              {unassignedMembers?.map(m => (
                <option key={m.userID} value={m.userID}>{m.fullName} ({m.studentCode})</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò trong Event</label>
            <select
              value={newRoleId}
              onChange={e => setNewRoleId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E6430A] focus:border-[#E6430A] outline-none bg-white text-gray-800"
            >
              <option value="">-- Chọn chức vụ --</option>
              {EVENT_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddAssignment}
              disabled={adding || !newUserId || !newRoleId}
              className="w-full md:w-auto bg-[#E6430A] hover:bg-[#d13a08] text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Thêm
            </button>
          </div>
        </div>

        {/* Danh sách phân công */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-600 uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 font-bold rounded-tl-lg">ID Thành Viên</th>
                <th className="px-6 py-4 font-bold">Role ID</th>
                <th className="px-6 py-4 font-bold rounded-tr-lg">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Chưa có thành viên nào được phân công.
                  </td>
                </tr>
              ) : (
                assignments.map(a => (
                  <tr key={a.userID} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {members?.find(m => m.userID === a.userID)?.fullName || `User ID: ${a.userID}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium text-xs">
                        {EVENT_ROLES.find(r => r.id === a.eventRoleID)?.label || `Role ${a.eventRoleID}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveAssignment(a.userID)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer border-none bg-transparent"
                        title="Xóa phân công"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
