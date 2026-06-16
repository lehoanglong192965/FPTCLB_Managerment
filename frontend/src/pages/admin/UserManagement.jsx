import { useState, useMemo } from "react";
import { Search, ShieldOff, ShieldCheck } from "lucide-react";

const ROLE_LABEL = { 1: "Admin", 2: "ICPDP", 3: "Student" };

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

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-600" : "bg-red-600"}`} />
      {isActive ? "Hoạt động" : "Tạm khóa"}
    </span>
  );
}

function ActionCell({ user, onToggle }) {
  if (user.roleID === 1) {
    return <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>;
  }

  const isActive = user.accountStatus === "Active";
  return (
    <div className="flex gap-1.5">
      {isActive ? (
        <button
          className="inline-flex items-center gap-1 px-3 py-1 border border-amber-400 rounded-md bg-white text-xs font-semibold text-amber-700 cursor-pointer transition-colors whitespace-nowrap hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onToggle(user, "suspend")}
        >
          <ShieldOff size={13} /> Tạm khóa
        </button>
      ) : (
        <button
          className="inline-flex items-center gap-1 px-3 py-1 border border-emerald-400 rounded-md bg-white text-xs font-semibold text-emerald-600 cursor-pointer transition-colors whitespace-nowrap hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onToggle(user, "activate")}
        >
          <ShieldCheck size={13} /> Mở khóa
        </button>
      )}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers]   = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  function handleToggle(user, type) {
    const msg = type === "suspend"
      ? `Tạm khóa tài khoản "${user.fullName}"?`
      : `Mở khóa tài khoản "${user.fullName}"?`;
    if (!window.confirm(msg)) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.userID === user.userID
          ? { ...u, accountStatus: type === "suspend" ? "Suspended" : "Active" }
          : u
      )
    );
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

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h1 className="page-title">Quản lý Người Dùng</h1>
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
        Hiển thị <strong>{filtered.length}</strong> / {users.length} người dùng
      </p>

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
                <td colSpan={6} className="text-center py-12 px-4 text-gray-400 text-[14px]">Không tìm thấy người dùng nào.</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.userID} className="border-b border-gray-100 last:border-b-0 hover:[&>td]:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-[13px] font-bold text-gray-700 flex-shrink-0">
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
                  <td className="px-4 py-3 text-gray-700 align-middle"><ActionCell user={u} onToggle={handleToggle} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
