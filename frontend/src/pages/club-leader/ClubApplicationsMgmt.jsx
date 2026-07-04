import { useState, useEffect, useCallback } from "react";
import { Calendar, FileText, CheckCircle, XCircle, Clock, Inbox, User, Mail, RefreshCw, MessageSquare } from "lucide-react";
import { useClubData } from "../../contexts/ClubDataContext";
import { TokenService } from "../../services/api/axiosClient";
import applicationApi from "../../services/api/member/applicationApi";

const STATUS_MAP = {
  Submitted:  { label: "Chờ duyệt CV",   cls: "bg-amber-100 text-amber-700" },
  Reviewing:  { label: "Đang xem xét",   cls: "bg-blue-100 text-blue-700" },
  ACCEPTED:   { label: "Chờ phỏng vấn",  cls: "bg-purple-100 text-purple-700" },
  PASSED:     { label: "Đã vào CLB",     cls: "bg-emerald-100 text-emerald-700" },
  REJECTED:   { label: "Từ chối CV",     cls: "bg-red-100 text-red-500" },
  FAILED:     { label: "Rớt phỏng vấn",  cls: "bg-red-100 text-red-500" },
  Withdrawn:  { label: "Đã rút đơn",    cls: "bg-gray-100 text-gray-500" },
};

const isCVPending   = (s) => s === "Submitted" || s === "Reviewing";
const isIVPending   = (s) => s === "ACCEPTED";
const needsAction   = (s) => isCVPending(s) || isIVPending(s);

const FILTER_TABS = [
  { key: "ALL",       label: "Tất cả" },
  { key: "CV",        label: "Duyệt CV" },
  { key: "INTERVIEW", label: "Phỏng vấn" },
  { key: "DONE",      label: "Đã xử lý" },
];

function Avatar({ name }) {
  return (
    <div style={{
      width: 42, height: 42, borderRadius: "50%",
      background: "#FFF3EE", color: "#E6430A",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 16, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function normalizeApp(app) {
  return {
    id: app.applicationId,
    memberName:   app.memberName  ?? "Không rõ",
    memberEmail:  app.memberEmail ?? "",
    studentId:    app.studentCode ?? "",
    introduction: app.introduction ?? "",
    cvUrl:        app.cvUrl ?? "",
    status:       app.status,
    createdAt:    app.createdAt ?? new Date().toISOString(),
  };
}

function filterByTab(apps, tab) {
  if (tab === "ALL")       return apps;
  if (tab === "CV")        return apps.filter((a) => isCVPending(a.status));
  if (tab === "INTERVIEW") return apps.filter((a) => isIVPending(a.status));
  if (tab === "DONE")      return apps.filter((a) => !needsAction(a.status));
  return apps;
}

export default function ClubApplicationsMgmt() {
  const { fetchMembers } = useClubData();
  const clubId = TokenService.getClubId();

  const [apps, setApps]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selected, setSelected]       = useState(null);
  const [confirmMode, setConfirmMode] = useState(null);
  const [toast, setToast]             = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  // CV Accept fields
  const [interviewTime, setInterviewTime]         = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  // CV Reject field
  const [rejectReason, setRejectReason]   = useState("");
  const [rejectError, setRejectError]     = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadApps = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const data = await applicationApi.getClubApplications(clubId);
      const arr = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
      setApps(arr.map(normalizeApp));
    } catch {
      showToast("Không thể tải danh sách đơn ứng tuyển.", "error");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const actionCount = apps.filter((a) => needsAction(a.status)).length;
  const filtered    = filterByTab(apps, activeFilter);

  const handleSelect = (app) => {
    setSelected(app);
    setConfirmMode(null);
    setInterviewTime("");
    setInterviewLocation("");
    setRejectReason("");
    setRejectError("");
  };

  const openConfirm = (mode) => {
    setConfirmMode(mode);
    setInterviewTime("");
    setInterviewLocation("");
    setRejectReason("");
    setRejectError("");
  };

  const handleReviewCV = async (isAccepted) => {
    if (!isAccepted && !rejectReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }
    if (isAccepted && (!interviewTime || !interviewLocation.trim())) {
      setRejectError("Vui lòng nhập đầy đủ thời gian và địa điểm phỏng vấn.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = isAccepted
        ? {
            applicationId: selected.id,
            isAccepted: true,
            interviewTime: interviewTime,
            interviewLocation: interviewLocation.trim(),
          }
        : {
            applicationId: selected.id,
            isAccepted: false,
            reason: rejectReason.trim(),
          };

      await applicationApi.reviewCV(payload);

      const newStatus = isAccepted ? "ACCEPTED" : "REJECTED";
      setApps((prev) => prev.map((a) => a.id === selected.id ? { ...a, status: newStatus } : a));
      setSelected((prev) => ({ ...prev, status: newStatus }));
      setConfirmMode(null);
      showToast(isAccepted
        ? "Đã duyệt hồ sơ. Email mời phỏng vấn đã được gửi."
        : "Đã từ chối hồ sơ. Email thông báo đã được gửi."
      );
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Không thể kết nối đến máy chủ.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeInterview = async (isPassed) => {
    setSubmitting(true);
    try {
      await applicationApi.gradeInterview({
        applicationId: selected.id,
        isPassed,
      });

      const newStatus = isPassed ? "PASSED" : "FAILED";
      setApps((prev) => prev.map((a) => a.id === selected.id ? { ...a, status: newStatus } : a));
      setSelected((prev) => ({ ...prev, status: newStatus }));
      setConfirmMode(null);
      if (isPassed) {
        showToast("Đậu phỏng vấn! Ứng viên đã được thêm vào CLB.");
        fetchMembers();
      } else {
        showToast("Đã ghi nhận kết quả: Rớt phỏng vấn.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Không thể kết nối đến máy chủ.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Đơn Ứng Tuyển</h1>
        <p className="page-subtitle">Xét duyệt các đơn xin tham gia câu lạc bộ từ sinh viên</p>
      </div>

      {toast && (
        <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="content-card">
        <div className="flex justify-between items-center mb-4">
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {apps.length} đơn tổng cộng
            {actionCount > 0 && (
              <span style={{
                marginLeft: 8, padding: "2px 8px", borderRadius: 99,
                background: "#FFF3EE", color: "#E6430A", fontSize: 12, fontWeight: 700,
              }}>
                {actionCount} cần xử lý
              </span>
            )}
          </p>
          <button
            onClick={loadApps}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-[12px] font-semibold hover:bg-slate-50 cursor-pointer font-[inherit] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border-b-2 border-gray-200 mb-5">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === "CV" ? apps.filter((a) => isCVPending(a.status)).length
                        : tab.key === "INTERVIEW" ? apps.filter((a) => isIVPending(a.status)).length
                        : 0;
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveFilter(tab.key); setSelected(null); }}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                  isActive ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
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

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <Inbox size={40} strokeWidth={1.2} color="#d1d5db" />
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: "0.75rem" }}>
              Không có đơn ứng tuyển nào ở mục này.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 max-md:flex-col">
            {/* List */}
            <div className={`flex flex-col gap-3 ${selected ? "flex-[1.2]" : "flex-1"}`}>
              {filtered.map((app) => {
                const statusInfo = STATUS_MAP[app.status] ?? STATUS_MAP.Submitted;
                const isSelected = selected?.id === app.id;
                const date = new Date(app.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric", month: "long", day: "numeric",
                });
                return (
                  <div
                    key={app.id}
                    onClick={() => handleSelect(app)}
                    className={`rounded-xl p-4 bg-white cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm ${
                      isSelected ? "border-l-4 border-[#E6430A] shadow-sm" : "border border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={app.memberName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[14px] font-semibold text-slate-900 m-0 truncate">{app.memberName}</p>
                          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold uppercase shrink-0 ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-400 m-0 mt-0.5">{app.studentId}</p>
                        <p className="text-[12.5px] text-slate-500 m-0 mt-1.5 line-clamp-2">{app.introduction}</p>
                        <span className="flex items-center gap-1 text-[11.5px] text-slate-400 mt-2">
                          <Calendar size={12} /> Nộp ngày {date}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="flex-1 self-start bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                  <h4 className="text-[14px] font-bold text-slate-900 m-0">Chi tiết đơn ứng tuyển</h4>
                  <button
                    className="bg-none border-none text-slate-500 cursor-pointer text-sm font-[inherit] hover:text-slate-700"
                    onClick={() => setSelected(null)}
                  >
                    Đóng
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={selected.memberName} />
                  <div>
                    <p className="text-[15px] font-bold text-slate-900 m-0">{selected.memberName}</p>
                    <p className="text-[12px] text-slate-400 m-0 flex items-center gap-1 mt-0.5">
                      <Mail size={11} /> {selected.memberEmail}
                    </p>
                    <p className="text-[12px] text-slate-400 m-0 flex items-center gap-1 mt-0.5">
                      <User size={11} /> MSSV: {selected.studentId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${(STATUS_MAP[selected.status] ?? STATUS_MAP.Submitted).cls}`}>
                    {(STATUS_MAP[selected.status] ?? STATUS_MAP.Submitted).label}
                  </span>
                  <span className="text-[11.5px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-[12.5px] font-semibold text-slate-600 mb-1.5">Giới thiệu bản thân</p>
                  <p className="text-[13px] text-slate-700 bg-slate-50 rounded-xl p-3 m-0 leading-relaxed">
                    {selected.introduction}
                  </p>
                </div>

                {selected.cvUrl && (
                  <a
                    href={selected.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#E6430A] no-underline hover:underline mb-4 block"
                  >
                    <FileText size={14} /> Xem CV / Portfolio
                  </a>
                )}

                {/* ── Phase 1: Duyệt CV ─────────────────────────── */}
                {isCVPending(selected.status) && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[12px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                      <MessageSquare size={13} /> Bước 1: Duyệt hồ sơ CV
                    </p>

                    {confirmMode === null && (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => openConfirm("CV_ACCEPT")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] transition-opacity hover:opacity-90"
                          style={{ background: "#10b981" }}
                        >
                          <CheckCircle size={14} /> Chấp nhận hồ sơ
                        </button>
                        <button
                          onClick={() => openConfirm("CV_REJECT")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-red-200 bg-white text-red-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-red-50"
                        >
                          <XCircle size={14} /> Từ chối hồ sơ
                        </button>
                      </div>
                    )}

                    {confirmMode === "CV_ACCEPT" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[13px] font-semibold text-emerald-800 m-0 mb-3 flex items-center gap-1.5">
                          <CheckCircle size={14} /> Mời phỏng vấn — nhập lịch hẹn
                        </p>
                        <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                          Thời gian phỏng vấn <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={interviewTime}
                          onChange={(e) => { setInterviewTime(e.target.value); setRejectError(""); }}
                          style={{
                            width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
                            border: "1.5px solid #a7f3d0", fontSize: 13, outline: "none",
                            boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
                            marginBottom: "0.75rem",
                          }}
                        />
                        <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                          Địa điểm phỏng vấn <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={interviewLocation}
                          onChange={(e) => { setInterviewLocation(e.target.value); setRejectError(""); }}
                          placeholder="VD: Phòng 201, Tòa nhà FPT"
                          style={{
                            width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
                            border: "1.5px solid #a7f3d0", fontSize: 13, outline: "none",
                            boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
                          }}
                        />
                        {rejectError && (
                          <p className="text-[12px] text-red-500 mt-1 m-0">{rejectError}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleReviewCV(true)}
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] disabled:opacity-60"
                            style={{ background: "#10b981" }}
                          >
                            <CheckCircle size={13} /> {submitting ? "Đang gửi..." : "Xác nhận & Gửi mail"}
                          </button>
                          <button
                            onClick={() => setConfirmMode(null)}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-slate-50 disabled:opacity-60"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {confirmMode === "CV_REJECT" && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-[13px] font-semibold text-red-700 m-0 mb-3 flex items-center gap-1.5">
                          <XCircle size={14} /> Từ chối hồ sơ CV
                        </p>
                        <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                          Lý do từ chối <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
                          rows={3}
                          placeholder="Nhập lý do để thông báo cho ứng viên qua email..."
                          style={{
                            width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
                            border: `1.5px solid ${rejectError ? "#ef4444" : "#fca5a5"}`,
                            fontSize: 13, outline: "none",
                            boxSizing: "border-box", fontFamily: "inherit", resize: "vertical",
                            background: "#fff",
                          }}
                        />
                        {rejectError && (
                          <p className="text-[12px] text-red-500 mt-1 m-0">{rejectError}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleReviewCV(false)}
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] disabled:opacity-60"
                            style={{ background: "#ef4444" }}
                          >
                            <XCircle size={13} /> {submitting ? "Đang gửi..." : "Xác nhận & Gửi mail"}
                          </button>
                          <button
                            onClick={() => setConfirmMode(null)}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-slate-50 disabled:opacity-60"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Phase 2: Kết quả phỏng vấn ───────────────── */}
                {isIVPending(selected.status) && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[12px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                      <MessageSquare size={13} /> Bước 2: Kết quả phỏng vấn
                    </p>

                    {confirmMode === null && (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => openConfirm("IV_PASS")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] transition-opacity hover:opacity-90"
                          style={{ background: "#10b981" }}
                        >
                          <CheckCircle size={14} /> Đậu phỏng vấn
                        </button>
                        <button
                          onClick={() => openConfirm("IV_FAIL")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-red-200 bg-white text-red-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-red-50"
                        >
                          <XCircle size={14} /> Rớt phỏng vấn
                        </button>
                      </div>
                    )}

                    {confirmMode === "IV_PASS" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[13px] font-semibold text-emerald-800 m-0 mb-3">
                          Xác nhận ứng viên <strong>{selected.memberName}</strong> đậu phỏng vấn và được thêm vào CLB?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGradeInterview(true)}
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] disabled:opacity-60"
                            style={{ background: "#10b981" }}
                          >
                            <CheckCircle size={13} /> {submitting ? "Đang xử lý..." : "Xác nhận đậu"}
                          </button>
                          <button
                            onClick={() => setConfirmMode(null)}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-slate-50 disabled:opacity-60"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {confirmMode === "IV_FAIL" && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-[13px] font-semibold text-red-700 m-0 mb-3">
                          Xác nhận ứng viên <strong>{selected.memberName}</strong> rớt phỏng vấn?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGradeInterview(false)}
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] disabled:opacity-60"
                            style={{ background: "#ef4444" }}
                          >
                            <XCircle size={13} /> {submitting ? "Đang xử lý..." : "Xác nhận rớt"}
                          </button>
                          <button
                            onClick={() => setConfirmMode(null)}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-slate-50 disabled:opacity-60"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
