import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Loader2, Lock, RefreshCw, Unlock } from "lucide-react";
import recruitmentApi from "../../services/api/icpdp/recruitmentApi";
import { TokenService } from "../../services/api/axiosClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

const EMPTY_FORM = { title: "", startDate: new Date().toISOString().slice(0, 10) };

export default function RecruitmentCycleMgmtPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const clubId = TokenService.getClubId();
  const [cycles, setCycles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const data = await recruitmentApi.getByClub(clubId);
      setCycles(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể tải các đợt tuyển thành viên.");
    } finally {
      setLoading(false);
    }
  }, [clubId, toast]);

  useEffect(() => { load(); }, [load]);

  const openCycle = async () => {
    if (!form.title.trim() || !form.startDate) {
      toast.error("Vui lòng nhập tên đợt tuyển và ngày bắt đầu.");
      return;
    }
    setSaving(true);
    try {
      await recruitmentApi.createForClub(clubId, {
        title: form.title.trim(),
        startDate: form.startDate,
        status: "Open",
        questionsJson: "[]",
      });
      setForm(EMPTY_FORM);
      toast.success("Đã mở đợt tuyển thành viên.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể mở đợt tuyển thành viên.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (cycle, status) => {
    const action = status === "Closed" ? "đóng" : "mở lại";
    if (!(await confirm(`Bạn có chắc muốn ${action} đợt “${cycle.title}”?`, {
      danger: status === "Closed", confirmLabel: status === "Closed" ? "Đóng tuyển" : "Mở tuyển",
    }))) return;
    setSaving(true);
    try {
      await recruitmentApi.changeStatus(cycle.cycleID, status);
      toast.success(status === "Closed" ? "Đã đóng tuyển thành viên." : "Đã mở lại đợt tuyển thành viên.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? `Không thể ${action} đợt tuyển.`);
    } finally {
      setSaving(false);
    }
  };

  if (!clubId) {
    return <div className="content-card text-sm text-red-600">Tài khoản chưa được gắn với câu lạc bộ.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mở / Đóng Tuyển Thành Viên</h1>
        <p className="page-subtitle">Quản lý thời gian nhận đơn ứng tuyển của câu lạc bộ</p>
      </div>

      <div className="content-card mb-5">
        <h2 className="m-0 mb-4 text-base font-bold text-gray-900">Mở đợt tuyển mới</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_190px_auto]">
          <input className="pr-select" placeholder="VD: Tuyển thành viên Summer 2026"
            value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <input className="pr-select" type="date" value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
          <button className="pr-btn-primary flex items-center justify-center gap-2" onClick={openCycle} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CalendarPlus size={15} />} Mở tuyển
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-base font-bold text-gray-900">Lịch sử đợt tuyển</h2>
          <button className="pr-btn-ghost flex items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : cycles.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">CLB chưa có đợt tuyển thành viên nào.</p>
        ) : (
          <div className="space-y-3">
            {cycles.map((cycle) => {
              const isOpen = cycle.status === "Open";
              return (
                <div key={cycle.cycleID} className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 font-semibold text-gray-900">{cycle.title}</p>
                    <p className="m-0 mt-1 text-xs text-gray-400">
                      Bắt đầu {new Date(cycle.startDate).toLocaleDateString("vi-VN")}
                      {cycle.closedAt ? ` · Đóng ${new Date(cycle.closedAt).toLocaleString("vi-VN")}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOpen ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                    {isOpen ? "Đang mở" : "Đã đóng"}
                  </span>
                  <button className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${isOpen ? "border-red-200 text-red-600" : "border-emerald-200 text-emerald-600"}`}
                    onClick={() => changeStatus(cycle, isOpen ? "Closed" : "Open")} disabled={saving}>
                    {isOpen ? <Lock size={14} /> : <Unlock size={14} />}{isOpen ? "Đóng tuyển" : "Mở lại"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
