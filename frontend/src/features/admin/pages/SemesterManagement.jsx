import { useState, useEffect } from "react";
import { Plus, Zap, Loader, Edit2, Trash2, CheckCircle } from "lucide-react";
import "../../../assets/css/semesterManagement.css";
import semesterApi from "../api/semesterApi";

function SemesterCard({ sem, onEnd, onActivate, onEdit, onDelete }) {
  const isActive = sem.isActive === true;

  return (
    <div className={`sm-card${isActive ? " sm-card--active" : " sm-card--closed"}`}>
      <div className="sm-card-header">
        <div>
          {isActive ? (
            <span className="sm-badge sm-badge--active">Đang hoạt động</span>
          ) : (
            <span className="sm-badge sm-badge--closed">Đã đóng</span>
          )}
        </div>

        <div className="sm-card-actions">
          {isActive ? (
            <button className="sm-btn-end" onClick={() => onEnd(sem)}>
              ↩ Kết thúc
            </button>
          ) : (
            <button className="sm-btn-activate" onClick={() => onActivate(sem)}>
              <CheckCircle size={13} /> Kích hoạt
            </button>
          )}
          <button className="sm-btn-icon" onClick={() => onEdit(sem)} title="Sửa học kỳ">
            <Edit2 size={14} />
          </button>
          {!isActive && (
            <button className="sm-btn-icon sm-btn-icon--danger" onClick={() => onDelete(sem)} title="Xoá học kỳ">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <h2 className="sm-card-name">{sem.semesterCode}</h2>
      <p className="sm-card-date">📅 {sem.startDate} – {sem.endDate}</p>
    </div>
  );
}

const EMPTY_FORM = { semesterCode: "", startDate: "", endDate: "", isActive: false };

export default function SemesterManagement() {
  const [semesters, setSemesters]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [modalMode, setModalMode]     = useState(null); // null | "create" | "edit"
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
    if (!window.confirm(`Kết thúc học kỳ "${sem.semesterCode}"?`)) return;
    try {
      await semesterApi.update(sem.semesterID, { ...sem, isActive: false });
      await fetchSemesters();
    } catch {
      alert("Kết thúc học kỳ thất bại. Vui lòng thử lại.");
    }
  }

  async function handleActivate(sem) {
    if (!window.confirm(`Kích hoạt học kỳ "${sem.semesterCode}"?`)) return;
    try {
      await semesterApi.update(sem.semesterID, { ...sem, isActive: true });
      await fetchSemesters();
    } catch {
      alert("Kích hoạt học kỳ thất bại. Vui lòng thử lại.");
    }
  }

  async function handleDelete(sem) {
    if (!window.confirm(`Xoá học kỳ "${sem.semesterCode}"?\nThao tác này không thể hoàn tác.`)) return;
    try {
      await semesterApi.delete(sem.semesterID);
      await fetchSemesters();
    } catch {
      alert("Xoá học kỳ thất bại. Vui lòng thử lại.");
    }
  }

  const isOpen = modalMode !== null;

  return (
    <div>
      <div className="sm-page-header">
        <div>
          <h1 className="page-title">Quản lý Học Kỳ</h1>
        </div>
        <div className="sm-header-actions">
          <button className="sm-btn-create" onClick={openCreateModal}>
            <Plus size={16} /> Tạo học kỳ mới
          </button>
          <button className="sm-btn-emergency">
            <Zap size={16} /> Emergency Leader Exit
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", padding: "40px 0" }}>
          <Loader size={18} /> Đang tải...
        </div>
      )}

      {error && (
        <div className="sm-warning" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {!loading && !error && semesters.length === 0 && (
        <div className="page-placeholder">
          <p className="page-placeholder-label">Chưa có học kỳ nào</p>
          <p className="page-placeholder-desc">Nhấn "Tạo học kỳ mới" để bắt đầu.</p>
        </div>
      )}

      {!loading && semesters.length > 0 && (
        <div className="sm-grid">
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
        <div className="sm-modal-overlay" onClick={closeModal}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sm-modal-title">
              {modalMode === "create" ? "Tạo học kỳ mới" : `Chỉnh sửa: ${editTarget?.semesterCode}`}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="sm-form-label">Mã học kỳ</label>
                <input
                  type="text"
                  className="sm-form-input"
                  placeholder="VD: SU2026"
                  value={form.semesterCode}
                  onChange={(e) => setForm((f) => ({ ...f, semesterCode: e.target.value }))}
                />
              </div>

              <div>
                <label className="sm-form-label">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="sm-form-input"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="sm-form-label">Ngày kết thúc</label>
                <input
                  type="date"
                  className="sm-form-input"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>

              <label className="sm-form-check">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Kích hoạt học kỳ này
              </label>

              {formError && (
                <div className="sm-warning" style={{ whiteSpace: "pre-line" }}>{formError}</div>
              )}

              <div className="sm-modal-footer">
                <button type="button" className="sm-btn-create" onClick={closeModal} disabled={submitting}>
                  Huỷ
                </button>
                <button type="submit" className="sm-btn-emergency" disabled={submitting}>
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
