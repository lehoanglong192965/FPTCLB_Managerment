import { useState, useMemo } from "react";
import { Search, ShieldOff, ShieldCheck } from "lucide-react";
import "../../../assets/css/userManagement.css";

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
    <span className={`um-status ${isActive ? "um-status--active" : "um-status--suspended"}`}>
      <span className="um-status-dot" />
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
    <div className="um-action-wrap">
      {isActive ? (
        <button className="um-btn-suspend" onClick={() => onToggle(user, "suspend")}>
          <ShieldOff size={13} /> Tạm khóa
        </button>
      ) : (
        <button className="um-btn-activate" onClick={() => onToggle(user, "activate")}>
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
      <div className="um-header">
        <h1 className="page-title">Quản lý Người Dùng</h1>
        <div className="um-controls">
          <div className="um-search-wrap">
            <Search size={15} className="um-search-icon" />
            <input
              className="um-search"
              type="text"
              placeholder="Tìm tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="um-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="suspended">Tạm khóa</option>
          </select>
        </div>
      </div>

      <p className="um-count">
        Hiển thị <strong>{filtered.length}</strong> / {users.length} người dùng
      </p>

      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Chuyên ngành</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="um-empty">Không tìm thấy người dùng nào.</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.userID}>
                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar">{u.fullName?.[0]?.toUpperCase() ?? "?"}</div>
                      <div>
                        <p className="um-user-name">{u.fullName ?? "—"}</p>
                        <p className="um-user-email">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{u.major ?? "—"}</td>
                  <td>{ROLE_LABEL[u.roleID] ?? u.roleID}</td>
                  <td><StatusBadge status={u.accountStatus} /></td>
                  <td>{u.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td><ActionCell user={u} onToggle={handleToggle} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}