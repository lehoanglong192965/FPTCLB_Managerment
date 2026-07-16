import { useState, useEffect } from "react";
import { Plus, Loader, Edit2, Trash2, CheckCircle } from "lucide-react";
import semesterApi from "../../services/api/admin/semesterApi";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";

function SemesterCard({ sem, onEnd, onActivate, onEdit, onDelete }) {
  const isActive = sem.isActive === true;

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-2 ${isActive ? "border-[#e6430a]" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          {isActive ? (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">Đang hoạt động</span>
          ) : (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Đã đóng</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActive ? (
            <button
              className="flex items-center gap-1.5 px-3 py-1 border border-[#e6430a] rounded-md bg-white text-xs font-medium text-[#e6430a] cursor-pointer transition-colors hover:bg-orange-50"
              onClick={() => onEnd(sem)}
            >
              ↩ Kết thúc
            </button>
          ) : (
            <button
              className="flex items-center gap-1 px-3 py-1 border border-emerald-400 rounded-md bg-white text-xs font-medium text-emerald-600 cursor-pointer transition-colors hover:bg-emerald-50"
              onClick={() => onActivate(sem)}
            >
              <CheckCircle size={13} /> Kích hoạt
            </button>
          )}
          <button
            className="flex items-center justify-center w-[30px] h-[30px] border border-gray-300 rounded-md bg-white text-gray-500 cursor-pointer transition-colors hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50"
            onClick={() => onEdit(sem)}
            title="Sửa học kỳ"
          >
            <Edit2 size={14} />
          </button>
          {!isActive && (
            <button
              className="flex items-center justify-center w-[30px] h-[30px] border border-red-300 rounded-md bg-white text-red-600 cursor-pointer transition-colors hover:border-red-400 hover:bg-red-100 hover:text-red-700"
              onClick={() => onDelete(sem)}
              title="Xoá học kỳ"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <h2 className="text-[22px] font-bold text-gray-900 mb-1">{sem.semesterCode}</h2>
      <p className="text-[13px] text-gray-500 mb-0">📅 {sem.startDate} – {sem.endDate}</p>
    </div>
  );
}

const EMPTY_FORM = { semesterCode: "", startDate: "", endDate: "", isActive: false };

export default function SemesterManagement() {
  const confirm = useConfirm();
  const toast = useToast();
  const [semesters, setSemesters]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [modalMode, setModalMode]     = useState(null);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");

  useEffect(() => { fetchSemesters(); }, []);

  async function fetchSemesters() {
    setLoading(true);
    setError("");
    try {
      const data = await semesterApi.getAll();
      setSemesters(data);
      setError("");
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      if (!err.response) {
        setError("Không kết nối được server. Kiểm tra backend có đang chạy không.");
      } else if (err.response.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response.status === 403) {
        setError("Bạn không có quyền xem danh sách học kỳ.");
      } else {
        setError(`Lỗi server (${err.response.status}). Vui lòng thử lại.`);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditTarget(null);
    setModalMode("create");
  }

  function openEditModal(sem) {
    setForm({
      semesterCode: sem.semesterCode,
      startDate: sem.startDate,
      endDate: sem.endDate,
      isActive: sem.isActive ?? false,
    });
    setEditTarget(sem);
    setFormError("");
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.semesterCode || !form.startDate || !form.endDate) {
      setFormError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (form.startDate >= form.endDate) {
      setFormError("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await semesterApi.create(form);
      } else {
        await semesterApi.update(editTarget.semesterID, form);
      }
      closeModal();
      await fetchSemesters();
    } catch (err) {
      const serverMsg = err?.response?.data?.message ?? "";
      if (serverMsg.toLowerCase().includes("overlap")) {
        const taken = semesters
          .map((s) => `• ${s.semesterCode}: ${s.startDate} → ${s.endDate}`)
          .join("\n");
        setFormError(`Ngày bị trùng với học kỳ đã tồn tại.\n\nCác học kỳ hiện có:\n${taken}`);
      } else {
        setFormError(serverMsg || (modalMode === "create" ? "Tạo học kỳ thất bại." : "Cập nhật thất bại.") + " Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnd(sem) {
    if (!(await confirm(`Kết thúc học kỳ "${sem.semesterCode}"?`, { danger: true }))) return;
    try {
      await semesterApi.update(sem.semesterID, { ...sem, isActive: false });
      await fetchSemesters();
    } catch {
      toast.error("Kết thúc học kỳ thất bại. Vui lòng thử lại.");
    }
  }

  async function handleActivate(sem) {
    if (!(await confirm(`Kích hoạt học kỳ "${sem.semesterCode}"?`))) return;
    try {
      await semesterApi.update(sem.semesterID, { ...sem, isActive: true });
      await fetchSemesters();
    } catch {
      toast.error("Kích hoạt học kỳ thất bại. Vui lòng thử lại.");
    }
  }

  async function handleDelete(sem) {
    if (!(await confirm(`Xoá học kỳ "${sem.semesterCode}"? Thao tác này không thể hoàn tác.`, { danger: true, confirmLabel: "Xoá" }))) return;
    try {
      await semesterApi.delete(sem.semesterID);
      await fetchSemesters();
    } catch {
      toast.error("Xoá học kỳ thất bại. Vui lòng thử lại.");
    }
  }

  const isOpen = modalMode !== null;

  return (
    <div>
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Quản Lý Học Kỳ</h1>
          <p className="page-subtitle">Tạo và quản lý các học kỳ trong hệ thống</p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <button className="dl-btn-add" onClick={openCreateModal}>
            <Plus size={15} /> Tạo học kỳ mới
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", padding: "40px 0" }}>
          <Loader size={18} /> Đang tải...
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 text-[13px] text-amber-800 mb-5" style={{ whiteSpace: "pre-line" }}>{error}</div>
      )}

      {!loading && !error && semesters.length === 0 && (
        <div className="page-placeholder">
          <p className="page-placeholder-label">Chưa có học kỳ nào</p>
          <p className="page-placeholder-desc">Nhấn "Tạo học kỳ mới" để bắt đầu.</p>
        </div>
      )}

      {!loading && semesters.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {semesters.map((sem) => (
            <SemesterCard
              key={sem.semesterID}
              sem={sem}
              onEnd={handleEnd}
              onActivate={handleActivate}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-7 w-[440px] max-w-[90vw] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-bold text-gray-900 mb-5">
              {modalMode === "create" ? "Tạo học kỳ mới" : `Chỉnh sửa: ${editTarget?.semesterCode}`}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Mã học kỳ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] box-border outline-none transition-colors focus:border-[#e6430a]"
                  placeholder="VD: SU2026"
                  value={form.semesterCode}
                  onChange={(e) => setForm((f) => ({ ...f, semesterCode: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] box-border outline-none transition-colors focus:border-[#e6430a]"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] box-border outline-none transition-colors focus:border-[#e6430a]"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Kích hoạt học kỳ này
              </label>

              {formError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 text-[13px] text-amber-800" style={{ whiteSpace: "pre-line" }}>{formError}</div>
              )}

              <div className="flex gap-2.5 justify-end mt-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-[13.5px] font-medium text-gray-700 cursor-pointer transition-colors hover:border-[#e6430a] hover:text-[#e6430a]"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 border-0 rounded-lg bg-[#e6430a] text-[13.5px] font-medium text-white cursor-pointer transition-colors hover:bg-[#c93a09] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting
                    ? (modalMode === "create" ? "Đang tạo..." : "Đang lưu...")
                    : (modalMode === "create" ? "Tạo học kỳ" : "Lưu thay đổi")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
