import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldAlert, Plus, Search, X,
  CheckCircle2, FileText, Clock, RefreshCw,
} from "lucide-react";
import disciplineLogApi from "../../services/api/icpdp/disciplineLogApi";
import { useToast } from "../../contexts/ToastContext";

const STATUS_CONFIG = {
  Active:  { label: "Đang xử lý",    color: "orange" },
  Expired: { label: "Đã giải quyết", color: "green"  },
};

const TABS = [
  { key: "all",      label: "Tất cả" },
  { key: "Active",   label: "Đang xử lý" },
  { key: "Expired", label: "Đã giải quyết" },
];

const INIT_FORM = { userID: "", semesterID: "", reason: "" };

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

const LOG_COLORS = {
  orange: {
    border: "border-l-[#e6430a]",
    icon: "bg-[#fff8f5] text-[#e6430a]",
    badge: "bg-[#fff8f5] text-[#e6430a] border border-[#fdd9cc]",
  },
  green: {
    border: "border-l-green-500",
    icon: "bg-green-50 text-green-600",
    badge: "bg-green-100 text-green-700",
  },
};

export default function IcpdpDisciplineLog() {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setTab]         = useState("all");
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [detail, setDetail]         = useState(null);
  const [form, setForm]             = useState(INIT_FORM);
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await disciplineLogApi.getAll();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải dữ liệu nhật ký.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async () => {
    if (!form.userID || !form.semesterID || !form.reason.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setSubmitting(true);
    try {
      await disciplineLogApi.create({
        userID: parseInt(form.userID, 10),
        semesterID: parseInt(form.semesterID, 10),
        reason: form.reason.trim(),
        disciplineStatus: "Active",
      });
      setForm(INIT_FORM);
      setShowModal(false);
      toast.success("Đã ghi nhận vi phạm vào nhật ký.");
      loadLogs();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Ghi nhận thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async (log) => {
    try {
      await disciplineLogApi.update(log.disciplineID, {
        userID: log.userID,
        semesterID: log.semesterID,
        reason: log.reason,
        disciplineStatus: "Expired",
      });
      setDetail(null);
      toast.success("Đã đánh dấu vi phạm là Đã giải quyết.");
      loadLogs();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Cập nhật thất bại.");
    }
  };

  const filtered = useMemo(() => {
    let list = logs;
    if (activeTab !== "all") list = list.filter((l) => l.disciplineStatus === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          String(l.userID).includes(q) ||
          l.reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, activeTab, search]);

  const tabCount = (key) => {
    if (key === "all") return logs.length;
    return logs.filter((l) => l.disciplineStatus === key).length;
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Nhật Ký Kỷ Luật</h1>
        <p className="page-subtitle">
          Ghi nhận và tra cứu lịch sử vi phạm của sinh viên trong hệ thống CLB
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <div className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-xl shadow-sm border-l-4 border-l-[#e6430a]">
          <ShieldAlert size={22} className="flex-shrink-0 opacity-75 text-[#e6430a]" />
          <div>
            <p className="text-[12.5px] text-gray-500 m-0 mb-0.5">Đang xử lý</p>
            <p className="text-[26px] font-bold text-gray-900 m-0 leading-none">{logs.filter((l) => l.disciplineStatus === "Active").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-xl shadow-sm border-l-4 border-l-green-500">
          <CheckCircle2 size={22} className="flex-shrink-0 opacity-75 text-green-500" />
          <div>
            <p className="text-[12.5px] text-gray-500 m-0 mb-0.5">Đã giải quyết</p>
            <p className="text-[26px] font-bold text-gray-900 m-0 leading-none">{logs.filter((l) => l.disciplineStatus === "Expired").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-xl shadow-sm border-l-4 border-l-green-500">
          <FileText size={22} className="flex-shrink-0 opacity-75 text-green-500" />
          <div>
            <p className="text-[12.5px] text-gray-500 m-0 mb-0.5">Tổng cộng</p>
            <p className="text-[26px] font-bold text-gray-900 m-0 leading-none">{logs.length}</p>
          </div>
        </div>
        <div />
      </div>

      <div className="content-card">
        <div className="flex items-center justify-between gap-3 mb-4.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="py-2 pl-8 pr-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none w-[220px] transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)]"
                placeholder="Tìm User ID, lý do..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-5.5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-gray-900 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
              onClick={loadLogs}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
          <button
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
            onClick={() => setShowModal(true)}
          >
            <Plus size={15} /> Ghi nhận vi phạm
          </button>
        </div>

        <div className="flex gap-0 border-b-2 border-gray-200 mb-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCount(tab.key);
            return (
              <button
                key={tab.key}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? "text-[#e6430a] border-[#e6430a] font-semibold"
                    : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
                onClick={() => setTab(tab.key)}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${isActive ? "bg-[#e6430a]" : "bg-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-center py-16 text-gray-400 text-sm">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-gray-400 text-sm">Không có vi phạm nào phù hợp.</p>
        ) : (
          <div className="flex flex-col gap-2.5 mt-1">
            {filtered.map((log) => {
              const statusCfg = STATUS_CONFIG[log.disciplineStatus] ?? STATUS_CONFIG.Active;
              const colors = LOG_COLORS[statusCfg.color] ?? LOG_COLORS.orange;
              return (
                <div
                  key={log.disciplineID}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border border-l-[3px] bg-white cursor-pointer transition-all duration-150 hover:border-gray-200 hover:shadow-md ${colors.border}`}
                  onClick={() => setDetail(log)}
                >
                  <div className={`flex items-center justify-center w-[38px] h-[38px] rounded-full flex-shrink-0 mt-0.5 ${colors.icon}`}>
                    <ShieldAlert size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[14.5px] font-bold text-gray-900">User #{log.userID}</span>
                        <span className="text-xs text-gray-400">Học kỳ #{log.semesterID}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${colors.badge}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed m-0 mb-2 line-clamp-2">{log.reason}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/35 z-[200] flex items-center justify-center p-6 animate-[fadeIn_0.15s_ease]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[14px] w-full max-w-[620px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.18s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={18} className="text-[#e6430a]" />
                <h3 className="text-base font-bold text-gray-900 m-0">Ghi nhận vi phạm mới</h3>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-gray-500 rounded-md cursor-pointer transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4 flex-1">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-medium text-gray-700">User ID <span className="text-red-500">*</span></label>
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="VD: 42"
                    value={form.userID}
                    onChange={set("userID")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-medium text-gray-700">Học kỳ ID <span className="text-red-500">*</span></label>
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="VD: 1"
                    value={form.semesterID}
                    onChange={set("semesterID")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">Lý do vi phạm <span className="text-red-500">*</span></label>
                <textarea
                  className={inputCls + " resize-y font-[inherit] leading-relaxed"}
                  rows={4}
                  placeholder="Mô tả chi tiết hành vi vi phạm..."
                  value={form.reason}
                  onChange={set("reason")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                className="px-5.5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-gray-900 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="flex items-center gap-2 px-5.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                onClick={handleAdd}
                disabled={submitting}
              >
                <FileText size={15} />
                {submitting ? "Đang lưu..." : "Lưu vào nhật ký"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 bg-black/35 z-[200] flex items-center justify-center p-6 animate-[fadeIn_0.15s_ease]"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-[14px] w-[420px] max-w-[95vw] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col max-h-[90vh] animate-[slideUp_0.18s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5.5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-[15px] font-bold text-gray-900 m-0">Chi tiết vi phạm</h3>
              <button
                className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-gray-500 rounded-md cursor-pointer transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5.5 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-2 px-4 py-3.5 bg-gray-50 rounded-lg border border-gray-200">
                {[
                  ["Mã vi phạm",  `#${detail.disciplineID}`],
                  ["User ID",     `#${detail.userID}`],
                  ["Học kỳ ID",   `#${detail.semesterID}`],
                  ["Trạng thái",  STATUS_CONFIG[detail.disciplineStatus]?.label ?? detail.disciplineStatus],
                  ["Ngày tạo",    formatDate(detail.createdAt)],
                ].map(([key, val]) => (
                  <div key={key} className="flex gap-3 text-[13.5px]">
                    <span className="font-semibold text-gray-500 min-w-[90px] flex-shrink-0">{key}</span>
                    <span className="text-gray-900">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[13.5px] font-medium text-gray-700 m-0">Lý do vi phạm</p>
                <p className="text-[13.5px] text-gray-700 leading-relaxed m-0 px-3.5 py-3 bg-gray-50 rounded-lg border border-gray-200">{detail.reason}</p>
              </div>
            </div>

            {detail.disciplineStatus === "Active" && (
              <div className="px-5.5 py-4 border-t border-gray-100 flex-shrink-0">
                <button
                  className="flex items-center justify-center gap-2 w-full px-5.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                  onClick={() => resolve(detail)}
                >
                  <CheckCircle2 size={15} />
                  Đánh dấu đã giải quyết
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
