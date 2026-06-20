import { useState, useMemo } from "react";
import {
  Search, X, Plus, ShieldAlert, Clock,
  CheckCircle2, FileText, ChevronLeft,
} from "lucide-react";
import SuspendButton from "../../components/admin/SuspendButton";

const ROLE_LABEL = { 1: "Admin", 2: "ICPDP", 3: "Sinh viên" };

const INITIAL_USERS = [
  { userID: 1, fullName: "Nguyễn Văn A",  email: "a.nguyenvan@fpt.edu.vn",  roleID: 1, accountStatus: "Active",    major: "SE", createdAt: "2025-09-01" },
  { userID: 2, fullName: "Trần Thị B",    email: "b.tranthi@fpt.edu.vn",    roleID: 3, accountStatus: "Active",    major: "AI", createdAt: "2025-09-05" },
  { userID: 3, fullName: "Lê Văn C",      email: "c.levan@fpt.edu.vn",      roleID: 3, accountStatus: "Suspended", major: "SE", createdAt: "2025-10-01" },
  { userID: 4, fullName: "Phạm Thị D",    email: "d.phamthi@fpt.edu.vn",    roleID: 2, accountStatus: "Active",    major: "BA", createdAt: "2025-08-20" },
  { userID: 5, fullName: "Hoàng Văn E",   email: "e.hoangvan@fpt.edu.vn",   roleID: 3, accountStatus: "Suspended", major: "GD", createdAt: "2025-11-01" },
  { userID: 6, fullName: "Đinh Thị F",    email: "f.dinhthi@fpt.edu.vn",    roleID: 3, accountStatus: "Active",    major: "IA", createdAt: "2025-11-10" },
  { userID: 7, fullName: "Vũ Minh G",     email: "g.vuminh@fpt.edu.vn",     roleID: 3, accountStatus: "Active",    major: "SE", createdAt: "2025-12-01" },
  { userID: 8, fullName: "Bùi Thị H",     email: "h.buithi@fpt.edu.vn",     roleID: 3, accountStatus: "Suspended", major: "AI", createdAt: "2026-01-15" },
];

const INIT_DISCIPLINES = {
  3: [
    { id: 1, reason: "Nghỉ không phép 3 buổi sinh hoạt CLB liên tiếp mà không báo cáo với ban điều hành.", semester: "SP2026", status: "Active",   createdAt: "2026-01-10" },
    { id: 2, reason: "Sử dụng điện thoại trong giờ họp ban điều hành.", semester: "FA2025", status: "Resolved", createdAt: "2025-11-05" },
  ],
  5: [
    { id: 3, reason: "Vi phạm nội quy tổ chức sự kiện — không hoàn thành nhiệm vụ được giao đúng hạn.", semester: "FA2025", status: "Resolved", createdAt: "2025-12-01" },
  ],
  8: [
    { id: 4, reason: "Gây mất trật tự trong buổi workshop, không chấp hành nhắc nhở của MC sự kiện.", semester: "SP2026", status: "Active",   createdAt: "2026-02-15" },
  ],
};

const PANEL_TABS = [
  { key: "info",       label: "Thông tin" },
  { key: "discipline", label: "Quản lý Kỷ luật" },
];

const EMPTY_FORM = { reason: "", semester: "" };

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-600" : "bg-red-600"}`} />
      {isActive ? "Hoạt động" : "Tạm khóa"}
    </span>
  );
}

function formatDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN");
}

export default function UserManagement() {
  const [users,          setUsers]          = useState(INITIAL_USERS);
  const [search,         setSearch]         = useState("");
  const [filter,         setFilter]         = useState("all");
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [activeTab,      setActiveTab]      = useState("info");
  const [disciplinesMap, setDisciplinesMap] = useState(INIT_DISCIPLINES);
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [addForm,        setAddForm]        = useState(EMPTY_FORM);
  const [addError,       setAddError]       = useState("");
  const [toast,          setToast]          = useState(null);

  const pushToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  function openUser(user, tab = "info") {
    setSelectedUser(user);
    setActiveTab(tab);
    setShowAddForm(false);
    setAddForm(EMPTY_FORM);
    setAddError("");
  }

  function closePanel() {
    setSelectedUser(null);
    setShowAddForm(false);
  }

  function handleToggle(user, type) {
    const msg = type === "suspend"
      ? `Tạm khóa tài khoản "${user.fullName}"?`
      : `Mở khóa tài khoản "${user.fullName}"?`;
    if (!window.confirm(msg)) return;

    const newStatus = type === "suspend" ? "Suspended" : "Active";
    setUsers((prev) =>
      prev.map((u) => u.userID === user.userID ? { ...u, accountStatus: newStatus } : u)
    );
    if (selectedUser?.userID === user.userID) {
      setSelectedUser((prev) => ({ ...prev, accountStatus: newStatus }));
    }
    pushToast(
      type === "suspend"
        ? `Đã tạm khóa tài khoản "${user.fullName}".`
        : `Đã mở khóa tài khoản "${user.fullName}".`
    );
  }

  function handleAddDiscipline() {
    if (!addForm.reason.trim() || !addForm.semester.trim()) {
      setAddError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    const newLog = {
      id:        Date.now(),
      reason:    addForm.reason.trim(),
      semester:  addForm.semester.trim(),
      status:    "Active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDisciplinesMap((prev) => ({
      ...prev,
      [selectedUser.userID]: [newLog, ...(prev[selectedUser.userID] ?? [])],
    }));
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
    setAddError("");
    pushToast("Đã ghi nhận vi phạm kỷ luật thành công.");
  }

  function resolveLog(logId) {
    setDisciplinesMap((prev) => ({
      ...prev,
      [selectedUser.userID]: (prev[selectedUser.userID] ?? []).map((d) =>
        d.id === logId ? { ...d, status: "Resolved" } : d
      ),
    }));
    pushToast("Đã đánh dấu vi phạm là Đã giải quyết.");
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active"    && u.accountStatus === "Active") ||
        (filter === "suspended" && u.accountStatus === "Suspended");
      return matchSearch && matchFilter;
    });
  }, [users, search, filter]);

  const selectedDisciplines = selectedUser ? (disciplinesMap[selectedUser.userID] ?? []) : [];
  const activeViolations    = selectedDisciplines.filter((d) => d.status === "Active").length;

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none transition-colors focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border";

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-7 z-[300] px-5 py-3 rounded-lg text-[13.5px] font-medium shadow-lg ${
          toast.type === "success" ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="page-header flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Quản Lý Người Dùng</h1>
          <p className="page-subtitle">Xem và quản lý tài khoản, kỷ luật người dùng trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-[13.5px] w-60 outline-none transition-colors focus:border-[#e6430a]"
              type="text"
              placeholder="Tìm tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-[13.5px] bg-white text-gray-700 outline-none cursor-pointer transition-colors focus:border-[#e6430a]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="suspended">Tạm khóa</option>
          </select>
        </div>
      </div>

      <p className="text-[13px] text-gray-500 mb-3">
        Hiển thị <strong>{filtered.length}</strong> / {users.length} người dùng · Nhấp vào hàng để xem hồ sơ
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-[13.5px]">
          <thead className="bg-slate-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Người dùng</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Chuyên ngành</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vai trò</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Ngày tạo</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 px-4 text-gray-400 text-[14px]">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.userID}
                  className="border-b border-gray-100 last:border-b-0 hover:[&>td]:bg-gray-50 cursor-pointer"
                  onClick={() => openUser(u)}
                >
                  <td className="px-4 py-3 text-gray-700 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#e6430a] to-[#ff8c5a] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                        {u.fullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-0 text-[13.5px]">{u.fullName ?? "—"}</p>
                        <p className="text-xs text-gray-400 mb-0">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 align-middle">{u.major ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700 align-middle">{ROLE_LABEL[u.roleID] ?? u.roleID}</td>
                  <td className="px-4 py-3 text-gray-700 align-middle"><StatusBadge status={u.accountStatus} /></td>
                  <td className="px-4 py-3 text-gray-700 align-middle">{u.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <SuspendButton user={u} onToggle={handleToggle} variant="compact" />
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-md bg-white text-[11.5px] font-semibold text-gray-500 cursor-pointer hover:border-[#e6430a] hover:text-[#e6430a] transition-colors whitespace-nowrap"
                        onClick={() => openUser(u, "discipline")}
                      >
                        <ShieldAlert size={12} /> Kỷ luật
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Right drawer ──────────────────────────────────────────────── */}
      {selectedUser && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/25 z-40"
            onClick={closePanel}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-white z-50 flex flex-col"
            style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.14)" }}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <button
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-900 transition-colors p-0"
                onClick={closePanel}
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md border-none bg-transparent text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors"
                onClick={closePanel}
              >
                <X size={18} />
              </button>
            </div>

            {/* User info card */}
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e6430a] to-[#ff8c5a] flex items-center justify-center text-[18px] font-extrabold text-white flex-shrink-0 select-none">
                  {selectedUser.fullName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-gray-900 m-0 mb-0.5 leading-tight">{selectedUser.fullName}</p>
                  <p className="text-[12.5px] text-gray-500 m-0 mb-2.5">{selectedUser.email}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11.5px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      {ROLE_LABEL[selectedUser.roleID]}
                    </span>
                    <span className="text-[11.5px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      {selectedUser.major}
                    </span>
                    <StatusBadge status={selectedUser.accountStatus} />
                  </div>
                </div>
                {/* FE1 component — imported from components/admin/SuspendButton */}
                <div className="flex-shrink-0">
                  <SuspendButton user={selectedUser} onToggle={handleToggle} />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 flex-shrink-0 bg-white">
              {PANEL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-[13.5px] font-medium border-b-2 -mb-px cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 transition-colors ${
                    activeTab === tab.key
                      ? "text-[#e6430a] border-b-[#e6430a] font-semibold"
                      : "text-gray-500 border-b-transparent hover:text-[#e6430a]"
                  }`}
                >
                  {tab.key === "discipline" && <ShieldAlert size={13} />}
                  {tab.label}
                  {tab.key === "discipline" && activeViolations > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                      {activeViolations}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── Tab: Thông tin ── */}
              {activeTab === "info" && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["User ID",      `#${selectedUser.userID}`],
                      ["Họ và tên",    selectedUser.fullName],
                      ["Chuyên ngành", selectedUser.major ?? "—"],
                      ["Vai trò",      ROLE_LABEL[selectedUser.roleID]],
                      ["Ngày tạo",     formatDate(selectedUser.createdAt)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-1 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{k}</span>
                        <span className="text-[13.5px] font-semibold text-gray-900 break-all">{v}</span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-1 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Trạng thái</span>
                      <StatusBadge status={selectedUser.accountStatus} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email</span>
                    <span className="text-[13.5px] font-semibold text-gray-900 break-all">{selectedUser.email}</span>
                  </div>
                  <div className="mt-1 p-4 bg-[#fff8f5] border border-[#fde0d0] rounded-xl flex items-center gap-3">
                    <ShieldAlert size={18} className="text-[#e6430a] flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800 m-0">
                        {selectedDisciplines.length} vi phạm kỷ luật
                      </p>
                      <p className="text-[12px] text-gray-500 m-0">
                        {activeViolations > 0 ? `${activeViolations} đang xử lý` : "Không có vi phạm đang xử lý"}
                      </p>
                    </div>
                    <button
                      className="ml-auto text-[12px] font-semibold text-[#e6430a] underline cursor-pointer bg-transparent border-none"
                      onClick={() => setActiveTab("discipline")}
                    >
                      Xem →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab: Quản lý Kỷ luật ── */}
              {activeTab === "discipline" && (
                <div className="flex flex-col gap-4">
                  {/* Section header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900 m-0">Nhật ký vi phạm</h3>
                      <p className="text-[12px] text-gray-400 m-0 mt-0.5">
                        {selectedDisciplines.length} bản ghi
                        {activeViolations > 0 && ` · ${activeViolations} đang xử lý`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddForm((v) => !v);
                        setAddError("");
                        setAddForm(EMPTY_FORM);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors"
                    >
                      <Plus size={13} /> Thêm vi phạm
                    </button>
                  </div>

                  {/* Add form */}
                  {showAddForm && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="text-[13px] font-bold text-gray-700 m-0 mb-3 flex items-center gap-1.5">
                        <FileText size={13} className="text-[#e6430a]" />
                        Ghi nhận vi phạm mới
                      </h4>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                            Học kỳ <span className="text-red-500">*</span>
                          </label>
                          <input
                            className={inputCls}
                            placeholder="VD: SP2026, FA2025..."
                            value={addForm.semester}
                            onChange={(e) => { setAddForm((p) => ({ ...p, semester: e.target.value })); setAddError(""); }}
                          />
                        </div>
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                            Lý do vi phạm <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            className={inputCls + " resize-y font-[inherit] leading-relaxed"}
                            rows={3}
                            placeholder="Mô tả chi tiết hành vi vi phạm kỷ luật..."
                            value={addForm.reason}
                            onChange={(e) => { setAddForm((p) => ({ ...p, reason: e.target.value })); setAddError(""); }}
                          />
                        </div>
                        {addError && (
                          <p className="text-[12px] text-red-500 m-0">⚠ {addError}</p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setShowAddForm(false); setAddError(""); setAddForm(EMPTY_FORM); }}
                            className="px-4 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-[12.5px] font-semibold cursor-pointer hover:border-gray-400 transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleAddDiscipline}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors"
                          >
                            <FileText size={12} /> Lưu vi phạm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Log list */}
                  {selectedDisciplines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ShieldAlert size={36} className="text-gray-200 mb-3" />
                      <p className="text-[13.5px] font-semibold text-gray-400 m-0">Không có vi phạm nào</p>
                      <p className="text-[12px] text-gray-300 m-0 mt-1">Nhấn "Thêm vi phạm" để ghi nhận</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {selectedDisciplines.map((d) => {
                        const isActive = d.status === "Active";
                        return (
                          <div
                            key={d.id}
                            className={`p-4 rounded-xl border-l-4 ${
                              isActive
                                ? "border-l-[#e6430a] bg-[#fff8f5] border border-[#fde0d0]"
                                : "border-l-green-500 bg-green-50/60 border border-green-100"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-[13.5px] font-semibold text-gray-900 m-0 leading-snug flex-1">
                                {d.reason}
                              </p>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${
                                isActive ? "bg-[#e6430a] text-white" : "bg-green-600 text-white"
                              }`}>
                                {isActive ? "Đang xử lý" : "Đã giải quyết"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 text-[11.5px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {formatDate(d.createdAt)}
                                </span>
                                <span>· Học kỳ {d.semester}</span>
                              </div>
                              {isActive && (
                                <button
                                  onClick={() => resolveLog(d.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 border border-green-300 bg-white text-green-600 rounded-md text-[11.5px] font-semibold cursor-pointer hover:bg-green-50 transition-colors"
                                >
                                  <CheckCircle2 size={11} /> Giải quyết
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
