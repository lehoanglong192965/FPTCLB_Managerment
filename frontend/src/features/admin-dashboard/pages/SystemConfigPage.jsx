import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Edit3, X, Check } from "lucide-react";
import systemConfigApi from "../api/systemConfigApi";

export default function SystemConfigPage() {
  const [configs, setConfigs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState({}); // { [configKey]: tempValue }
  const [saving, setSaving]     = useState({});  // { [configKey]: bool }
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await systemConfigApi.getAll();
      setConfigs(Array.isArray(data) ? data : Object.entries(data ?? {}).map(([k, v]) => ({ configKey: k, configValue: v })));
    } catch {
      showToast("Không thể tải cấu hình hệ thống.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfigs(); }, []);

  const startEdit = (cfg) =>
    setEditing((p) => ({ ...p, [cfg.configKey]: cfg.configValue ?? "" }));

  const cancelEdit = (key) =>
    setEditing((p) => { const n = { ...p }; delete n[key]; return n; });

  const handleSave = async (key) => {
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await systemConfigApi.update(key, editing[key]);
      setConfigs((prev) =>
        prev.map((c) => c.configKey === key ? { ...c, configValue: editing[key] } : c)
      );
      cancelEdit(key);
      showToast(`Đã cập nhật "${key}".`);
    } catch (err) {
      showToast(err?.response?.data?.error ?? "Cập nhật thất bại.", "error");
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cấu Hình Hệ Thống</h1>
        <p className="page-subtitle">Quản lý các tham số cấu hình toàn hệ thống</p>
      </div>

      {toast && <div className={`co-toast co-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="content-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button
            className="pr-btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
            onClick={loadConfigs}
            disabled={loading}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        {loading ? (
          <p className="approval-empty">Đang tải...</p>
        ) : configs.length === 0 ? (
          <p className="approval-empty">Không có cấu hình nào.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {configs.map((cfg) => {
              const isEditing = cfg.configKey in editing;
              const isSaving  = saving[cfg.configKey];
              return (
                <div key={cfg.configKey} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1.25rem", borderRadius: 12,
                  border: "1.5px solid #f0f0f0", background: "#fff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <Settings size={16} color="#9ca3af" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: "#374151", margin: "0 0 4px" }}>
                      {cfg.configKey}
                    </p>
                    {isEditing ? (
                      <input
                        value={editing[cfg.configKey]}
                        onChange={(e) =>
                          setEditing((p) => ({ ...p, [cfg.configKey]: e.target.value }))
                        }
                        style={{
                          width: "100%", padding: "6px 10px",
                          border: "1.5px solid #E6430A", borderRadius: 8,
                          fontSize: 13, outline: "none",
                        }}
                        autoFocus
                        disabled={isSaving}
                      />
                    ) : (
                      <p style={{ fontSize: 14, color: "#111827", margin: 0 }}>
                        {cfg.configValue ?? <span style={{ color: "#9ca3af" }}>—</span>}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(cfg.configKey)}
                          disabled={isSaving}
                          style={{
                            background: "#E6430A", color: "#fff", border: "none",
                            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                            fontSize: 13, display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          <Check size={14} />
                          {isSaving ? "Lưu..." : "Lưu"}
                        </button>
                        <button
                          onClick={() => cancelEdit(cfg.configKey)}
                          disabled={isSaving}
                          style={{
                            background: "none", border: "1.5px solid #e5e7eb",
                            borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                            color: "#6b7280",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(cfg)}
                        style={{
                          background: "none", border: "1.5px solid #e5e7eb",
                          borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                          color: "#6b7280", display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <Edit3 size={14} /> Sửa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
