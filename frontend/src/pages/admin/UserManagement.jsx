import { useState, useMemo, useEffect, useCallback } from "react";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import {
  Search, X, Plus, ShieldAlert, Clock, Users, UserCheck, UserX,
  CheckCircle2, FileText, ChevronLeft, Mail, GraduationCap, Calendar, Loader2,
} from "lucide-react";
import SuspendButton from "../../components/admin/SuspendButton";
import adminApi from "../../services/api/admin/adminApi";
import semesterApi from "../../services/api/admin/semesterApi";
import { getInitials } from "../../utils/avatar";

const ROLE_LABEL = { 1: "Admin", 2: "ICPDP", 3: "Sinh viên" };
const ROLE_CHIP = {
  1: "bg-violet-50 text-violet-700 border-violet-200",
  2: "bg-blue-50 text-blue-700 border-blue-200",
  3: "bg-slate-100 text-slate-600 border-slate-200",
};

const PANEL_TABS = [
  { key: "info", label: "Thông tin" },
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

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-950 m-0 leading-none">{value}</p>
        <p className="text-xs font-medium text-gray-500 m-0 mt-1">{label}</p>
      </div>
    </div>
  );
}

function UserCard({ user, onOpen, onToggle }) {
  return (
    <div
      onClick={() => onOpen(user)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3.5 cursor-pointer hover:border-[#e6430a]/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e6430a] to-[#ff8c5a] flex items-center justify-center text-[15px] font-bold text-white shrink-0">
          {getInitials(user.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 m-0 text-[14.5px] truncate">{user.fullName}</p>
          <p className="text-xs text-gray-400 m-0 mt-0.5 truncate flex items-center gap-1">
            <Mail size={11} className="shrink-0" /> {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_CHIP[user.roleID]}`}>
          {ROLE_LABEL[user.roleID] ?? user.roleID}
        </span>
        <StatusBadge status={user.accountStatus} />
      </div>

      {user.major && (
        <p className="text-xs text-gray-500 m-0 flex items-center gap-1.5">
          <GraduationCap size={13} className="text-gray-400" /> {user.major}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
        <button
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-md bg-white text-[11.5px] font-semibold text-gray-500 cursor-pointer hover:border-[#e6430a] hover:text-[#e6430a] transition-colors"
          onClick={() => onOpen(user, "discipline")}
        >
          <ShieldAlert size={12} /> Kỷ luật
        </button>
        <SuspendButton user={user} onToggle={onToggle} variant="compact" />
      </div>
    </div>
  );
}

export default function UserManagement() {
  const confirm = useConfirm();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [disciplinesMap, setDisciplinesMap] = useState({});
  const [semesters, setSemesters] = useState([]);
  const [disciplineLoading, setDisciplineLoading] = useState(true);
  const [disciplineSaving, setDisciplineSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState("");

  const [showIcpdpForm, setShowIcpdpForm] = useState(false);
  const [icpdpForm, setIcpdpForm] = useState({ email: "", fullName: "" });
  const [isIcpdpLoading, setIsIcpdpLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const data = await adminApi.getAllUsers();
      const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
      setUsers(list);
      return true;
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        return false;
      }
      setUsersError(err?.response?.data?.message ?? "Không thể tải danh sách người dùng.");
      return false;
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadDisciplines = useCallback(async () => {
    setDisciplineLoading(true);
    try {
      const [logsResponse, semesterResponse] = await Promise.all([
        adminApi.getDisciplineLogs(),
        semesterApi.getAll(),
      ]);
      const logs = Array.isArray(logsResponse) ? logsResponse : (logsResponse?.data ?? []);
      const semesterList = Array.isArray(semesterResponse) ? semesterResponse : (semesterResponse?.data ?? []);
      setSemesters(semesterList);

      const semesterCodeById = new Map(
        semesterList.map((semester) => [semester.semesterID, semester.semesterCode]),
      );
      const grouped = {};
      logs.forEach((log) => {
        const item = {
          id: log.disciplineID,
          userID: log.userID,
          semesterID: log.semesterID,
          semester: semesterCodeById.get(log.semesterID) ?? `#${log.semesterID}`,
          reason: log.reason,
          status: log.disciplineStatus === "Expired" ? "Resolved" : log.disciplineStatus,
          createdAt: log.createdAt,
        };
        grouped[log.userID] = [...(grouped[log.userID] ?? []), item];
      });
      Object.values(grouped).forEach((items) =>
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      );
      setDisciplinesMap(grouped);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể tải nhật ký kỷ luật.");
    } finally {
      setDisciplineLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDisciplines();
  }, [loadDisciplines]);

  const closeIcpdpForm = () => {
    if (isIcpdpLoading) return;
    setShowIcpdpForm(false);
    setIcpdpForm({ email: "", fullName: "" });
  };

  const handleCreateIcpdp = async (e) => {
    e.preventDefault();
    if (!icpdpForm.email.trim() || !icpdpForm.fullName.trim()) {
      toast.error("Vui lòng điền đầy đủ Email và Họ tên.");
      return;
    }
    setIsIcpdpLoading(true);
    try {
      const res = await adminApi.createIcpdpAccount(icpdpForm);
      const data = res?.data ?? res;
      switch (data.action) {
        case "CREATED":
          toast.success("Đã tạo và cấp trước tài khoản ICPDP.");
          break;
        case "UPGRADED":
          toast.success("Đã nâng cấp tài khoản hiện có lên ICPDP.");
          break;
        case "ALREADY_ICPDP":
          toast.success("Tài khoản đã có quyền ICPDP. Thông tin đã được cập nhật.");
          break;
        default:
          toast.success("Thao tác thành công.");
      }
      await loadUsers();
      closeIcpdpForm();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.email || error?.response?.data?.fullName || "Có lỗi xảy ra khi cấp tài khoản ICPDP.";
      toast.error(msg);
    } finally {
      setIsIcpdpLoading(false);
    }
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

  async function handleToggle(user, type) {
    const msg = type === "suspend"
      ? `Tạm khóa tài khoản "${user.fullName}"?`
      : `Mở khóa tài khoản "${user.fullName}"?`;
    if (!(await confirm(msg))) return;

    try {
      if (type === "suspend") {
        await adminApi.suspendUser(user.userID);
      } else {
        await adminApi.activateUser(user.userID);
      }
      const newStatus = type === "suspend" ? "Suspended" : "Active";
      setUsers((prev) => prev.map((u) => u.userID === user.userID ? { ...u, accountStatus: newStatus } : u));
      if (selectedUser?.userID === user.userID) {
        setSelectedUser((prev) => ({ ...prev, accountStatus: newStatus }));
      }
      toast.success(type === "suspend"
        ? `Đã tạm khóa tài khoản "${user.fullName}".`
        : `Đã mở khóa tài khoản "${user.fullName}".`
      );
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Thao tác thất bại. Vui lòng thử lại.");
    }
  }

  async function handleAddDiscipline() {
    if (!addForm.reason.trim() || !addForm.semester.trim()) {
      setAddError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    const semester = semesters.find(
      (item) => item.semesterCode?.toLowerCase() === addForm.semester.trim().toLowerCase(),
    );
    if (!semester) {
      setAddError("Mã học kỳ không tồn tại. Vui lòng nhập đúng mã học kỳ.");
      return;
    }

    setDisciplineSaving(true);
    try {
      await adminApi.createDisciplineLog({
        userID: selectedUser.userID,
        semesterID: semester.semesterID,
        reason: addForm.reason.trim(),
        disciplineStatus: "Active",
      });
      await Promise.all([loadDisciplines(), loadUsers()]);
      setSelectedUser((current) => current ? { ...current, accountStatus: "Suspended" } : current);
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      setAddError("");
      toast.success("Đã ghi nhận vi phạm kỷ luật thành công.");
    } catch (err) {
      setAddError(err?.response?.data?.message ?? "Không thể lưu vi phạm.");
    } finally {
      setDisciplineSaving(false);
    }
  }

  async function resolveLog(logId) {
    const log = (disciplinesMap[selectedUser.userID] ?? []).find((item) => item.id === logId);
    if (!log) return;
    try {
      await adminApi.updateDisciplineLog(logId, {
        userID: log.userID,
        semesterID: log.semesterID,
        reason: log.reason,
        disciplineStatus: "Expired",
      });
      await loadDisciplines();
      toast.success("Đã đánh dấu vi phạm là Đã giải quyết.");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật vi phạm.");
    }
  }

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.accountStatus === "Active").length,
    suspended: users.filter((u) => u.accountStatus === "Suspended").length,
    staff: users.filter((u) => u.roleID === 1 || u.roleID === 2).length,
  }), [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || String(u.roleID) === roleFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.accountStatus === "Active") ||
        (statusFilter === "suspended" && u.accountStatus === "Suspended");
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const selectedDisciplines = selectedUser ? (disciplinesMap[selectedUser.userID] ?? []) : [];
  const activeViolations = selectedDisciplines.filter((d) => d.status === "Active").length;

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] text-gray-900 bg-white outline-none transition-colors focus:border-[#e6430a] focus:shadow-[0_0_0_3px_rgba(230,67,10,0.08)] box-border";
  const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-[13.5px] bg-white text-gray-700 outline-none cursor-pointer transition-colors focus:border-[#e6430a]";

  return (
    <div>
      {/* Page header */}
      <div className="page-header flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Quản Lý Người Dùng</h1>
          <p className="page-subtitle">Xem và quản lý tài khoản, kỷ luật người dùng trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowIcpdpForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer transition-colors shadow-sm"
        >
          <Plus size={16} /> Cấp tài khoản ICPDP
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard icon={Users} label="Tổng người dùng" value={stats.total} tint="bg-orange-50 text-[#e6430a]" />
        <StatCard icon={UserCheck} label="Đang hoạt động" value={stats.active} tint="bg-emerald-50 text-emerald-600" />
        <StatCard icon={UserX} label="Đang tạm khóa" value={stats.suspended} tint="bg-red-50 text-red-500" />
        <StatCard icon={ShieldAlert} label="Admin / ICPDP" value={stats.staff} tint="bg-violet-50 text-violet-600" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-[13.5px] outline-none transition-colors focus:border-[#e6430a]"
            type="text"
            placeholder="Tìm tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={selectCls} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Tất cả vai trò</option>
          <option value="1">Admin</option>
          <option value="2">ICPDP</option>
          <option value="3">Sinh viên</option>
        </select>
        <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="suspended">Tạm khóa</option>
        </select>
      </div>

      <p className="text-[13px] text-gray-500 mb-3">
        Hiển thị <strong>{filtered.length}</strong> / {users.length} người dùng · Nhấp vào thẻ để xem hồ sơ
      </p>

      {/* User grid */}
      {usersLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex justify-center">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : usersError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 py-16 text-center text-red-500 text-sm">
          {usersError}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center text-gray-400 text-sm">
          Không tìm thấy người dùng nào.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((u) => (
            <UserCard key={u.userID} user={u} onOpen={openUser} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* ── Right drawer ──────────────────────────────────────────────── */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/25 z-40" onClick={closePanel} />

          <div className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-white z-50 flex flex-col"
            style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.14)" }}>

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

            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-white flex-shrink-0">
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e6430a] to-[#ff8c5a] flex items-center justify-center text-[20px] font-extrabold text-white flex-shrink-0 select-none">
                  {getInitials(selectedUser.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold text-gray-900 m-0 mb-0.5 leading-tight">{selectedUser.fullName}</p>
                  <p className="text-[12.5px] text-gray-500 m-0 mb-2.5">{selectedUser.email}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_CHIP[selectedUser.roleID]}`}>
                      {ROLE_LABEL[selectedUser.roleID]}
                    </span>
                    {selectedUser.major && (
                      <span className="text-[11.5px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                        {selectedUser.major}
                      </span>
                    )}
                    <StatusBadge status={selectedUser.accountStatus} />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <SuspendButton user={selectedUser} onToggle={handleToggle} />
              </div>
            </div>

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

            <div className="flex-1 overflow-y-auto px-6 py-5">

              {activeTab === "info" && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["User ID", `#${selectedUser.userID}`],
                      ["Họ và tên", selectedUser.fullName],
                      ["Chuyên ngành", selectedUser.major ?? "—"],
                      ["Vai trò", ROLE_LABEL[selectedUser.roleID]],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-1 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{k}</span>
                        <span className="text-[13.5px] font-semibold text-gray-900 break-all">{v}</span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-1 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Calendar size={11} /> Ngày tạo
                      </span>
                      <span className="text-[13.5px] font-semibold text-gray-900">{formatDate(selectedUser.createdAt)}</span>
                    </div>
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

              {activeTab === "discipline" && (
                <div className="flex flex-col gap-4">
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
                            disabled={disciplineSaving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#e6430a] hover:bg-[#d13d09] text-white border-none rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors"
                          >
                            {disciplineSaving
                              ? <><Loader2 size={12} className="animate-spin" /> Đang lưu...</>
                              : <><FileText size={12} /> Lưu vi phạm</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {disciplineLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-[13px]">
                      <Loader2 size={16} className="animate-spin" /> Đang tải nhật ký...
                    </div>
                  ) : selectedDisciplines.length === 0 ? (
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

      {/* ICPDP Creation Modal */}
      {showIcpdpForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-lg font-bold text-gray-900 m-0">Cấp quyền ICPDP</h2>
              <button
                onClick={closeIcpdpForm}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 border-none cursor-pointer transition-colors"
                disabled={isIcpdpLoading}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateIcpdp} className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[12.5px] text-blue-800 m-0 leading-relaxed">
                  Nếu email đã tồn tại với vai trò Sinh viên, tài khoản sẽ được nâng cấp thành ICPDP. Tài khoản Admin hoặc tài khoản đang bị tạm khóa sẽ không được thay đổi tự động.
                </p>
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={isIcpdpLoading}
                  placeholder="VD: canbo@fe.edu.vn"
                  className={inputCls}
                  value={icpdpForm.email}
                  onChange={(e) => setIcpdpForm({ ...icpdpForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-gray-700 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isIcpdpLoading}
                  placeholder="VD: Nguyễn Văn A"
                  className={inputCls}
                  value={icpdpForm.fullName}
                  onChange={(e) => setIcpdpForm({ ...icpdpForm, fullName: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeIcpdpForm}
                  disabled={isIcpdpLoading}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-[13.5px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isIcpdpLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#e6430a] text-white border-none rounded-lg text-[13.5px] font-semibold cursor-pointer hover:bg-[#d13d09] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isIcpdpLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    "Cấp quyền ICPDP"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
