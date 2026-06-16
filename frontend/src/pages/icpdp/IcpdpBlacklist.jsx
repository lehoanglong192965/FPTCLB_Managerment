import { useState } from "react";
import { Ban, Plus, Trash2, RefreshCw, X, Search, ShieldOff } from "lucide-react";
import blacklistApi from "../../services/api/icpdp/blacklistApi";

const INIT_FORM = { userID: "", reason: "" };

const inputCls =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-[9px] text-sm text-gray-900 bg-white outline-none transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border";

function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/35 z-[200] flex items-center justify-center p-6 animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export default function IcpdpBlacklist() {
  const [clubID, setClubID]         = useState("");
  const [queried, setQueried]       = useState(false);
  const [list, setList]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = async (id) => {
    const cid = id ?? clubID;
    if (!cid) return;
    setLoading(true);
    setQueried(true);
    try {
      const data = await blacklistApi.getAll(cid);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Không thể tải danh sách blacklist.", "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async () => {
    if (!form.userID || !form.reason.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await blacklistApi.add(clubID, { userID: parseInt(form.userID, 10), reason: form.reason.trim() });
      setForm(INIT_FORM);
      setShowModal(false);
      showToast("Đã thêm vào danh sách đen.");
      load();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Thêm thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (item) => {
    if (!window.confirm(`Xóa User #${item.userID} khỏi blacklist?`)) return;
    try {
      await blacklistApi.remove(clubID, item.blacklistID ?? item.id);
      showToast("Đã xóa khỏi danh sách đen.");
      load();
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Xóa thất bại.", "error");
    }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-5 right-7 z-[999] px-5 py-3 rounded-lg text-[13.5px] font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B3E] m-0 mb-1">Danh Sách Đen CLB</h1>
          <p className="text-sm text-[#4B5674] m-0">IC-PDP — Quản lý sinh viên bị cấm tham gia câu lạc bộ</p>
        </div>

        {queried && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={() => load()}
              disabled={loading}
            >
              <RefreshCw size={14} /> Tải lại
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
              onClick={() => setShowModal(true)}
            >
              <Plus size={15} /> Thêm vào blacklist
            </button>
          </div>
        )}
      </div>

      {/* Club ID selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-5">
        <label className="text-[13.5px] font-medium text-gray-700 block mb-1.5">Mã câu lạc bộ (Club ID)</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="number"
              placeholder="VD: 3"
              value={clubID}
              onChange={(e) => setClubID(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className={inputCls + " pl-[34px]"}
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] disabled:opacity-50 disabled:cursor-not-allowed text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
            onClick={() => load()}
            disabled={!clubID || loading}
          >
            Xem blacklist
          </button>
        </div>
      </div>

      {queried && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          {loading ? (
            <p className="text-center py-16 text-gray-400 text-sm m-0">Đang tải...</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-300">
              <ShieldOff size={40} />
              <p className="text-sm text-gray-400 m-0">Danh sách đen của CLB này trống.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((item, idx) => (
                <div
                  key={item.blacklistID ?? item.id ?? idx}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-red-200 bg-red-50/60 transition-colors hover:bg-red-50"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Ban size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 m-0 mb-0.5">User #{item.userID}</p>
                    <p className="text-[13px] text-gray-600 m-0 truncate">{item.reason}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item)}
                    className="flex items-center justify-center w-9 h-9 bg-white border-[1.5px] border-red-200 text-red-500 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-red-100 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <div className="bg-white rounded-[14px] w-full max-w-[440px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col max-h-[90vh] overflow-hidden animate-[slideUp_0.18s_ease]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Ban size={18} className="text-red-500" />
                <h3 className="text-base font-bold text-gray-900 m-0">Thêm vào danh sách đen</h3>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 border-none bg-transparent text-gray-500 rounded-md cursor-pointer transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">
                  User ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="VD: 42"
                  value={form.userID}
                  onChange={set("userID")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">
                  Lý do <span className="text-red-600">*</span>
                </label>
                <textarea
                  className={inputCls + " resize-y font-[inherit] leading-relaxed"}
                  rows={3}
                  placeholder="Lý do đưa vào danh sách đen..."
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
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] disabled:opacity-60 text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 whitespace-nowrap"
                onClick={handleAdd}
                disabled={submitting}
              >
                {submitting ? "Đang thêm..." : "Thêm vào blacklist"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
