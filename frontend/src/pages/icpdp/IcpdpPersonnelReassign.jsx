import { useState, useEffect } from "react";
import {
  AlertOctagon, ChevronDown, UserCheck, ArrowRightLeft,
  CheckCircle, Search, Loader2,
} from "lucide-react";
import clubApi from "../../services/api/clubs/clubApi";
import memberApi from "../../services/api/clubs/memberApi";
import icpdpStatsApi from "../../services/api/icpdp/statsApi";
import { useToast } from "../../contexts/ToastContext";

const DISCIPLINE_LEVELS = [
  { value: "warning",    label: "Nhắc nhở" },
  { value: "discipline", label: "Kỷ luật" },
  { value: "dismiss",    label: "Cách chức" },
];

const INITIAL_FORM = {
  clubId:   "",
  position: "leader",
  reason:   "",
  level:    "dismiss",
  newPersonId: "",
};

const selectCls = "w-full py-2.5 pl-3 pr-9 border border-gray-300 rounded-lg text-[13.5px] text-gray-900 bg-white appearance-none outline-none cursor-pointer transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)]";

export default function IcpdpPersonnelReassign() {
  const toast = useToast();
  const [clubs, setClubs]         = useState([]);
  const [history, setHistory]     = useState([]);
  const [clubMembers, setClubMembers] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [step, setStep]           = useState(1);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    clubApi.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        setClubs(list.map((c) => ({
          id:   c.clubId   ?? c.id,
          name: c.clubName ?? c.name ?? "—",
        })));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        toast.error("Không thể tải danh sách CLB.");
      })
      .finally(() => setLoadingClubs(false));

    icpdpStatsApi.getPersonnelHistory()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        setHistory(list.map((h) => ({
          id:     h.id       ?? h.historyId,
          date:   h.date     ?? h.createdAt ?? "",
          club:   h.clubName ?? h.club      ?? "—",
          action: h.action   ?? (h.position === "leader" ? "replace_leader" : "replace_vice"),
          from:   h.fromName ?? h.from      ?? "—",
          to:     h.toName   ?? h.to        ?? "—",
          reason: h.reason   ?? "",
          by:     h.by       ?? "IC-PDP",
          status: h.status   ?? "completed",
        })));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        toast.error(err?.response?.data?.message ?? "Không thể tải lịch sử điều động.");
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    if (!form.clubId) { setClubMembers([]); return; }
    memberApi.getAll(form.clubId, { page: 0, size: 100 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
        setClubMembers(list.map((m) => ({
          id:        m.membershipId ?? m.id,
          userId:    m.userId       ?? m.userID,
          name:      m.fullName     ?? m.name   ?? "—",
          studentId: m.studentCode  ?? m.studentId ?? "",
          role:      (m.clubRoleName ?? m.roleName ?? "member").toLowerCase(),
        })));
      })
      .catch((err) => {
        setClubMembers([]);
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        toast.error(err?.response?.data?.message ?? "Không thể tải danh sách thành viên CLB.");
      });
  }, [form.clubId, toast]);

  const selectedClub = clubs.find((c) => c.id === Number(form.clubId));

  const leaderMember  = clubMembers.find((m) => m.role === "leader" || m.role === "trưởng clb");
  const viceMember    = clubMembers.find((m) => m.role === "vice_leader" || m.role === "vice" || m.role === "phó trưởng clb");
  const currentHolder = form.position === "leader" ? leaderMember : viceMember;
  const candidates    = clubMembers.filter((m) => m.id !== currentHolder?.id);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value, ...(field === "clubId" ? { newPersonId: "" } : {}) }));

  const canProceed = form.clubId && form.newPersonId && form.reason.trim().length >= 10;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await icpdpStatsApi.reassign({
        clubId:      Number(form.clubId),
        position:    form.position,
        newPersonId: Number(form.newPersonId),
        level:       form.level,
        reason:      form.reason,
      });
      const newPerson = candidates.find((c) => c.id === Number(form.newPersonId));
      setHistory((prev) => [
        {
          id:     Date.now(),
          date:   new Date().toLocaleDateString("vi-VN"),
          club:   selectedClub?.name ?? "—",
          action: form.position === "leader" ? "replace_leader" : "replace_vice",
          from:   currentHolder?.name ?? "—",
          to:     newPerson?.name ?? "—",
          reason: form.reason,
          by:     "IC-PDP",
          status: "completed",
        },
        ...prev,
      ]);
      setStep(3);
      toast.success(`Đã điều động ${form.position === "leader" ? "Trưởng CLB" : "Phó Trưởng CLB"} ${selectedClub?.name ?? ""} thành công.`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(1);
  };

  const filteredHistory = history.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.club.toLowerCase().includes(q) ||
      h.from.toLowerCase().includes(q) ||
      h.to.toLowerCase().includes(q)
    );
  });

  const STEPS = ["Thông tin", "Xác nhận", "Hoàn tất"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Điều Động Nhân Sự Khẩn Cấp</h1>
        <p className="page-subtitle">
          Can thiệp thủ công thay thế Trưởng / Phó Trưởng CLB giữa kỳ do kỷ luật
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">
        <div className="content-card">
          <div className="flex items-center gap-2.5 mb-5.5">
            <AlertOctagon size={18} className="text-[#e6430a] flex-shrink-0" />
            <h2 className="content-card-title m-0">Can Thiệp Điều Động</h2>
          </div>

          <div className="flex items-center mb-7 gap-0">
            {STEPS.map((label, i) => (
              <div key={label} className={`flex items-center gap-1.5 relative ${i < 2 ? "flex-1" : "flex-none"}`}>
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 border-2 transition-all duration-200 ${
                  step === i + 1
                    ? "bg-[#e6430a] text-white border-[#e6430a]"
                    : step > i + 1
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  step === i + 1 ? "text-[#e6430a] font-semibold" : step > i + 1 ? "text-green-500" : "text-gray-400"
                }`}>
                  {label}
                </span>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-4.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">Câu lạc bộ</label>
                <div className="relative">
                  {loadingClubs ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-gray-400 text-[13.5px]">
                      <Loader2 size={14} className="animate-spin" /> Đang tải...
                    </div>
                  ) : (
                    <>
                      <select className={selectCls} value={form.clubId} onChange={set("clubId")}>
                        <option value="">-- Chọn CLB --</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">Vị trí cần thay thế</label>
                <div className="flex gap-2.5">
                  {[
                    { value: "leader", label: "Trưởng CLB" },
                    { value: "vice",   label: "Phó Trưởng CLB" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 px-4 py-2 border-[1.5px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-all duration-150 select-none ${
                        form.position === opt.value
                          ? "border-[#e6430a] bg-[#fff8f5] text-[#e6430a]"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="position"
                        value={opt.value}
                        checked={form.position === opt.value}
                        onChange={set("position")}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {currentHolder && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-3">
                  <p className="text-xs text-gray-500 m-0 mb-2">Người đang giữ chức vụ:</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 bg-red-100 text-red-600">
                      {currentHolder.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{currentHolder.name}</div>
                      <div className="text-xs text-gray-400">{currentHolder.studentId}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">Mức độ vi phạm</label>
                <div className="relative">
                  <select className={selectCls} value={form.level} onChange={set("level")}>
                    {DISCIPLINE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {form.clubId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-medium text-gray-700">Người thay thế</label>
                  <div className="relative">
                    <select className={selectCls} value={form.newPersonId} onChange={set("newPersonId")}>
                      <option value="">-- Chọn thành viên --</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.studentId ? ` — ${c.studentId}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-medium text-gray-700">
                  Lý do điều động
                  <span className="text-xs text-gray-400 font-normal"> (tối thiểu 10 ký tự)</span>
                </label>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none resize-y font-[inherit] leading-relaxed transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border"
                  placeholder="Mô tả vi phạm và lý do điều động khẩn cấp..."
                  value={form.reason}
                  onChange={set("reason")}
                  rows={4}
                />
                <span className="text-xs text-gray-400 text-right">{form.reason.length} ký tự</span>
              </div>

              <button
                className="flex items-center justify-center gap-2 w-full px-5.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] disabled:bg-[#f3a07a] disabled:cursor-not-allowed text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                disabled={!canProceed}
                onClick={() => setStep(2)}
              >
                <ArrowRightLeft size={15} />
                Tiếp tục xác nhận
              </button>
            </div>
          )}

          {step === 2 && selectedClub && (
            <div className="flex flex-col gap-4.5">
              <div className="flex gap-3 bg-[#fff8e6] border border-yellow-300 rounded-lg px-4 py-3.5 text-[13.5px] text-yellow-900 leading-relaxed">
                <AlertOctagon size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="m-0">
                  Hành động này sẽ <strong>lập tức có hiệu lực</strong> và được ghi nhận
                  vào nhật ký điều động. Vui lòng kiểm tra kỹ trước khi xác nhận.
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1">
                  <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-2">Bị thay thế</p>
                  {currentHolder ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 bg-red-100 text-red-600">
                        {currentHolder.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{currentHolder.name}</div>
                        <div className="text-xs text-gray-400">{currentHolder.studentId}</div>
                      </div>
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </div>

                <ArrowRightLeft size={20} className="text-gray-400 flex-shrink-0" />

                <div className="flex-1">
                  <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-2">Người thay thế</p>
                  {(() => {
                    const p = candidates.find((c) => c.id === Number(form.newPersonId));
                    return p ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 bg-green-100 text-green-700">
                          {p.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.studentId}</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="flex flex-col gap-2 px-4 py-3.5 bg-gray-50 rounded-lg border border-gray-200">
                {[
                  ["CLB",          selectedClub.name],
                  ["Vị trí",       form.position === "leader" ? "Trưởng CLB" : "Phó Trưởng CLB"],
                  ["Mức vi phạm",  DISCIPLINE_LEVELS.find((l) => l.value === form.level)?.label],
                  ["Lý do",        form.reason],
                ].map(([key, val]) => (
                  <div key={key} className="flex gap-3 text-[13.5px]">
                    <span className="font-semibold text-gray-500 min-w-[90px] flex-shrink-0">{key}</span>
                    <span className="text-gray-900">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5">
                <button
                  className="px-5.5 py-2.5 bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-gray-900 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                  onClick={() => setStep(1)}
                >
                  Quay lại
                </button>
                <button
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5.5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                  onClick={handleConfirm}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                  {submitting ? "Đang xử lý..." : "Xác nhận điều động"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center gap-4.5 py-5">
              <CheckCircle size={52} className="text-green-500" />
              <h3 className="text-xl font-bold text-gray-900 m-0">Điều động thành công!</h3>
              <p className="text-[13.5px] text-gray-500 m-0 leading-relaxed">
                Lệnh điều động đã được ghi nhận và sẽ được thông báo đến các bên liên quan.
              </p>
              <button
                className="flex items-center justify-center gap-2 w-full px-5.5 py-2.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-150"
                onClick={reset}
              >
                Tạo lệnh điều động mới
              </button>
            </div>
          )}
        </div>

        <div className="content-card">
          <div className="flex items-center justify-between gap-3 mb-4.5">
            <h2 className="content-card-title m-0">Lịch Sử Điều Động</h2>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="py-2 pl-8 pr-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none w-[180px] transition-colors duration-150 focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)]"
                placeholder="Tìm CLB, tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="text-center py-16 text-gray-400 text-sm">
              {history.length === 0 ? "Chưa có lịch sử điều động." : "Không tìm thấy kết quả."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredHistory.map((h) => (
                <div
                  key={h.id}
                  className="px-4 py-3.5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-1.5 transition-colors duration-150 hover:border-gray-200 hover:bg-white"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[13.5px] font-bold text-gray-900">{h.club}</span>
                    <span className="text-xs text-gray-400">{h.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-red-600 font-semibold">{h.from}</span>
                    <ArrowRightLeft size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-green-600 font-semibold">{h.to}</span>
                  </div>
                  <p className="text-[12.5px] text-gray-500 leading-snug m-0">{h.reason}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="inline-block px-2.5 py-0.5 bg-[#fff8f5] text-[#e6430a] border border-[#fdd9cc] rounded-full text-[11.5px] font-semibold">
                      {h.action === "replace_leader" ? "Thay trưởng CLB" : "Thay phó trưởng CLB"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle size={11} /> Hoàn tất
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
