import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Bell, X, ChevronDown, Loader2, Lock, Play, Users } from "lucide-react";
import recruitmentApi from "../../services/api/icpdp/recruitmentApi";
import semesterApi from "../../services/api/admin/semesterApi";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

const STATUS_CONFIG = {
  Open:   { label: "Đang mở",   color: "#059669", bg: "#ecfdf5" },
  Closed: { label: "Đã đóng",   color: "#6b7280", bg: "#f3f4f6" },
  Draft:  { label: "Nháp",      color: "#d97706", bg: "#fffbeb" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

const INIT_FORM = { title: "", startDate: "", endDate: "", semesterID: "", status: "Open", questionsJson: "" };

export default function IcpdpRecruitment() {
  const toast = useToast();
  const confirm = useConfirm();
  const [cycles, setCycles]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reminding, setReminding]   = useState({});
  const [changing, setChanging]     = useState({});
  const [semesters, setSemesters]   = useState([]);
  const [seasonClubs, setSeasonClubs] = useState({});
  const [expandedSeason, setExpandedSeason] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, semesterData] = await Promise.all([recruitmentApi.getAll(), semesterApi.getAll()]);
      setCycles(Array.isArray(data) ? data : []);
      const semesterRows = Array.isArray(semesterData) ? semesterData : (semesterData?.data ?? []);
      setSemesters(semesterRows);
      const active = semesterRows.find((item) => item.isActive) ?? semesterRows[0];
      setForm((current) => ({
        ...current,
        semesterID: current.semesterID || String(active?.semesterID ?? active?.id ?? ""),
      }));
    } catch {
      toast.error("Không thể tải danh sách đợt tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate || !form.semesterID) {
      toast.error("Vui lòng điền tiêu đề, học kỳ, ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      return;
    }
    const questions = form.questionsJson
      .split("\n")
      .map((question) => question.trim())
      .filter(Boolean)
      .map((label, index) => ({ key: `question_${index + 1}`, label, type: "textarea", required: false }));
    const questionsJson = JSON.stringify(questions);
    setSubmitting(true);
    try {
      await recruitmentApi.create({
        title: form.title.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        semesterID: Number(form.semesterID),
        status: form.status,
        questionsJson,
      });
      setForm(INIT_FORM);
      setShowModal(false);
      toast.success("Đã tạo đợt tuyển dụng mới.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Tạo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cycle) => {
    if (!(await confirm(`Xóa đợt tuyển dụng "${cycle.title}"?`, { danger: true, confirmLabel: "Xóa" }))) return;
    try {
      await recruitmentApi.delete(cycle.cycleID);
      toast.success("Đã xóa đợt tuyển dụng.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Xóa thất bại.");
    }
  };

  const handleRemind = async (cycle) => {
    setReminding((p) => ({ ...p, [cycle.cycleID]: true }));
    try {
      await recruitmentApi.sendReminder(cycle.cycleID);
      toast.success(`Đã gửi nhắc cho đợt "${cycle.title}".`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Gửi nhắc thất bại.");
    } finally {
      setReminding((p) => ({ ...p, [cycle.cycleID]: false }));
    }
  };

  const handleStatusChange = async (cycle, status) => {
    const opening = status === "Open";
    const action = opening ? "mở" : "đóng";
    if (!(await confirm(`Bạn có chắc muốn ${action} đợt tuyển dụng “${cycle.title}”?`, {
      danger: !opening,
      confirmLabel: opening ? "Mở tuyển" : "Đóng tuyển",
    }))) return;

    setChanging((current) => ({ ...current, [cycle.cycleID]: true }));
    try {
      await recruitmentApi.update(cycle.cycleID, {
        title: cycle.title,
        questionsJson: cycle.questionsJson || "[]",
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        semesterID: cycle.semesterID,
        status,
      });
      toast.success(opening ? "Đã mở đợt tuyển dụng." : "Đã đóng đợt tuyển dụng.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? `Không thể ${action} đợt tuyển dụng.`);
    } finally {
      setChanging((current) => ({ ...current, [cycle.cycleID]: false }));
    }
  };

  const toggleSeasonClubs = async (cycle) => {
    if (expandedSeason === cycle.cycleID) {
      setExpandedSeason(null);
      return;
    }
    setExpandedSeason(cycle.cycleID);
    if (seasonClubs[cycle.cycleID]) return;
    try {
      const data = await recruitmentApi.getSeasonClubs(cycle.cycleID);
      setSeasonClubs((current) => ({ ...current, [cycle.cycleID]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể tải danh sách CLB tham gia.");
    }
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản Lý Tuyển Dụng</h1>
        <p className="page-subtitle">Tạo và quản lý các đợt tuyển thành viên CLB</p>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <button className="pr-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="dl-btn-add" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Tạo đợt mới
          </button>
        </div>

        {loading ? (
          <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>
        ) : cycles.length === 0 ? (
          <p className="text-center py-16 text-gray-400 text-sm">Chưa có đợt tuyển dụng nào.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {cycles.map((c) => (
              <div key={c.cycleID} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0.875rem 1.25rem",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 4px" }}>{c.title}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                    Học kỳ: {c.semesterCode ?? "Chưa gắn"} · {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    {c.closedAt && ` · Đóng lúc: ${formatDate(c.closedAt)}`}
                  </p>
                </div>
                <StatusBadge status={c.status} />
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    title="Xem CLB tham gia"
                    onClick={() => toggleSeasonClubs(c)}
                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600"
                  >
                    <Users size={13} /> CLB tham gia
                  </button>
                  {c.status === "Draft" && (
                    <>
                      <button
                        title="Mở tuyển"
                        onClick={() => handleStatusChange(c, "Open")}
                        disabled={changing[c.cycleID]}
                        className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 disabled:opacity-50"
                      >
                        {changing[c.cycleID] ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Mở tuyển
                      </button>
                      <button
                        title="Đóng đợt"
                        onClick={() => handleStatusChange(c, "Closed")}
                        disabled={changing[c.cycleID]}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-50"
                      >
                        <Lock size={13} /> Đóng
                      </button>
                    </>
                  )}
                  {c.status === "Open" && (
                    <button
                      title="Đóng tuyển"
                      onClick={() => handleStatusChange(c, "Closed")}
                      disabled={changing[c.cycleID]}
                      className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                    >
                      {changing[c.cycleID] ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Đóng tuyển
                    </button>
                  )}
                  {c.status === "Closed" && (
                    <button
                      title="Mở lại"
                      onClick={() => handleStatusChange(c, "Open")}
                      disabled={changing[c.cycleID]}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 disabled:opacity-50"
                    >
                      {changing[c.cycleID] ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Mở lại
                    </button>
                  )}
                  <button
                    title="Gửi nhắc"
                    onClick={() => handleRemind(c)}
                    disabled={reminding[c.cycleID]}
                    style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                  >
                    <Bell size={13} /> {reminding[c.cycleID] ? "..." : "Nhắc"}
                  </button>
                  <button
                    title="Xóa"
                    onClick={() => handleDelete(c)}
                    style={{ background: "none", border: "1.5px solid #fee2e2", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#ef4444" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expandedSeason === c.cycleID && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  {!seasonClubs[c.cycleID] ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={14} className="animate-spin" /> Đang tải...</div>
                  ) : seasonClubs[c.cycleID].length === 0 ? (
                    <p className="m-0 text-xs text-gray-400">Chưa có CLB nào mở tuyển trong mùa này.</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {seasonClubs[c.cycleID].map((clubCycle) => (
                        <div key={clubCycle.cycleID} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
                          <div>
                            <p className="m-0 text-xs font-semibold text-gray-800">{clubCycle.clubName ?? `CLB #${clubCycle.clubID}`}</p>
                            <p className="m-0 mt-0.5 text-[11px] text-gray-400">{clubCycle.title}</p>
                          </div>
                          <StatusBadge status={clubCycle.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="w-full max-w-[620px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-recruitment-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#E6430A]">
                  <Plus size={18} />
                </span>
                <div>
                  <h3 id="create-recruitment-title" className="m-0 text-base font-bold text-gray-950">Tạo đợt tuyển dụng mới</h3>
                  <p className="m-0 mt-0.5 text-xs text-gray-400">Thiết lập thời gian và trạng thái nhận đơn</p>
                </div>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                onClick={() => setShowModal(false)} disabled={submitting} aria-label="Đóng"
              ><X size={18} /></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                <input className="w-full box-border rounded-[10px] border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E6430A] focus:ring-2 focus:ring-orange-100" placeholder="VD: Tuyển thành viên HK1 2026" value={form.title} onChange={set("title")} autoFocus />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">Học kỳ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-[#E6430A] focus:ring-2 focus:ring-orange-100" value={form.semesterID} onChange={set("semesterID")}>
                    <option value="">Chọn học kỳ</option>
                    {semesters.map((semester) => (
                      <option key={semester.semesterID ?? semester.id} value={semester.semesterID ?? semester.id}>
                        {semester.semesterCode ?? semester.code}{semester.isActive ? " (Đang diễn ra)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input className="w-full box-border rounded-[10px] border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E6430A] focus:ring-2 focus:ring-orange-100" type="date" value={form.startDate} onChange={set("startDate")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input className="w-full box-border rounded-[10px] border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E6430A] focus:ring-2 focus:ring-orange-100" type="date" min={form.startDate || undefined} value={form.endDate} onChange={set("endDate")} />
                </div>
              </div>

              <div className="mb-4">
                  <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">Trạng thái</label>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-[#E6430A] focus:ring-2 focus:ring-orange-100" value={form.status} onChange={set("status")}>
                      <option value="Open">Đang mở</option>
                      <option value="Draft">Nháp</option>
                      <option value="Closed">Đã đóng</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">Câu hỏi bổ sung</label>
                <textarea className="w-full box-border resize-y rounded-[10px] border border-gray-200 px-3 py-2.5 text-[13px] outline-none focus:border-[#E6430A] focus:ring-2 focus:ring-orange-100" rows={4} placeholder={"Tại sao bạn muốn tham gia CLB?\nBạn mong muốn đóng góp điều gì?"} value={form.questionsJson} onChange={set("questionsJson")} />
                <p className="m-0 mt-1.5 text-xs text-gray-400">Mỗi dòng là một câu hỏi. Có thể để trống nếu không cần câu hỏi bổ sung.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button className="rounded-[10px] border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100" onClick={() => setShowModal(false)} disabled={submitting}>Hủy</button>
              <button className="flex min-w-[170px] items-center justify-center gap-2 rounded-[10px] border-0 bg-[#E6430A] px-4 py-2 text-sm font-bold text-white hover:bg-[#c93808] disabled:cursor-not-allowed disabled:opacity-60" onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? "Đang tạo..." : "Tạo đợt tuyển dụng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
