import { useEffect, useState } from "react";
import {
  Tabs, Table, Button, InputNumber, DatePicker,
  Modal, Tag, Popconfirm, Input,
} from "antd";
import { Plus, Trash2, RotateCcw, Eye } from "lucide-react";
import DynamicForm from "../../components/ui/DynamicForm";
import { useToast } from "../../contexts/ToastContext";
import axiosClient from "../../services/api/axiosClient";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONFIG = {
  submitThresholdDays: 7,
  minPoints: 10,
  maxFileSize: 10,
  fileSizeUnit: "MB",
};

const MOCK_MULTIPLIERS = [
  { id: 1, condition: "Thứ 7",   multiplier: 2 },
  { id: 2, condition: "Chủ nhật", multiplier: 2 },
];

const MOCK_HOLIDAYS = [
  { id: 1, date: "30/04/2025", name: "Ngày Giải Phóng Miền Nam" },
  { id: 2, date: "01/05/2025", name: "Ngày Quốc tế Lao động" },
  { id: 3, date: "02/09/2025", name: "Quốc khánh" },
];

const MOCK_VERSIONS = [
  {
    version: 2, changedBy: "Admin B", changedAt: "15/06/2025",
    config: { submitThresholdDays: 5, minPoints: 8, maxFileSize: 5, fileSizeUnit: "MB" },
  },
  {
    version: 1, changedBy: "Admin A", changedAt: "10/06/2025",
    config: { submitThresholdDays: 3, minPoints: 5, maxFileSize: 10, fileSizeUnit: "MB" },
  },
];

const CONFIG_LABELS = {
  submitThresholdDays:    "Ngưỡng ngày submit",
  minPoints:              "Điểm tối thiểu",
  maxFileSize:            "Giới hạn file",
  fileSizeUnit:           "Đơn vị file",
};

// ─── General Config Schema (dùng cho DynamicForm) ────────────────────────────

const GENERAL_CONFIG_SCHEMA = {
  submitText: "Lưu cấu hình",
  fields: [
    {
      type: "number", name: "submitThresholdDays", label: "Ngưỡng ngày submit",
      required: true, span: 12, min: 1, max: 365,
      placeholder: "VD: 7",
    },
    {
      type: "number", name: "minPoints", label: "Điểm tối thiểu",
      required: true, span: 12, min: 0,
      placeholder: "VD: 10",
    },
    {
      type: "number", name: "maxFileSize", label: "Giới hạn kích thước file",
      required: true, span: 12, min: 1,
      placeholder: "VD: 10",
    },
    {
      type: "select", name: "fileSizeUnit", label: "Đơn vị file",
      required: true, span: 12,
      options: [
        { value: "KB", label: "KB" },
        { value: "MB", label: "MB" },
        { value: "GB", label: "GB" },
      ],
    },
  ],
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const thStyle = {
  padding: "8px 14px", textAlign: "left", fontWeight: 600,
  borderBottom: "1.5px solid #e5e7eb", color: "#374151", fontSize: 13,
};
const tdStyle = {
  padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 13,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemConfigPage() {
  const toast = useToast();
  const [config, setConfig]           = useState(MOCK_CONFIG);
  const [formKey, setFormKey]         = useState(0);
  const [multipliers, setMultipliers] = useState(MOCK_MULTIPLIERS);
  const [holidays, setHolidays]       = useState(MOCK_HOLIDAYS);
  const [versions, setVersions]       = useState(MOCK_VERSIONS);

  // Add multiplier form
  const [newCondition, setNewCondition]   = useState("");
  const [newMultiplier, setNewMultiplier] = useState(2);

  // Add holiday form
  const [newHolidayDate, setNewHolidayDate] = useState(null);
  const [newHolidayName, setNewHolidayName] = useState("");

  // Diff modal
  const [diffVersion, setDiffVersion] = useState(null);

  const [aiRuntimeConfig, setAiRuntimeConfig] = useState({
    confidenceThreshold: "",
    fallbackMessage: "",
  });
  const [savedAiRuntimeConfig, setSavedAiRuntimeConfig] = useState(null);
  const [aiRuntimeLoading, setAiRuntimeLoading] = useState(true);
  const [aiRuntimeSaving, setAiRuntimeSaving] = useState(false);
  const [aiRuntimeError, setAiRuntimeError] = useState("");
  const [aiRuntimeReload, setAiRuntimeReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAiRuntimeConfig = async () => {
      setAiRuntimeLoading(true);
      setAiRuntimeError("");

      try {
        const configs = await axiosClient.get("/admin/system-configs");
        const configsByKey = new Map(
          (Array.isArray(configs) ? configs : []).map((item) => [
            item.configKey,
            item.configValue,
          ]),
        );
        const nextConfig = {
          confidenceThreshold: configsByKey.get("AI_CONFIDENCE_THRESHOLD") ?? "",
          fallbackMessage: configsByKey.get("RAG_FALLBACK_MESSAGE") ?? "",
        };

        if (!nextConfig.confidenceThreshold || !nextConfig.fallbackMessage) {
          throw new Error("AI_RUNTIME_CONFIG_MISSING");
        }

        if (!cancelled) {
          setAiRuntimeConfig(nextConfig);
          setSavedAiRuntimeConfig(nextConfig);
        }
      } catch {
        if (!cancelled) {
          setAiRuntimeError("Không thể tải cấu hình AI/RAG đang chạy.");
        }
      } finally {
        if (!cancelled) {
          setAiRuntimeLoading(false);
        }
      }
    };

    loadAiRuntimeConfig();
    return () => {
      cancelled = true;
    };
  }, [aiRuntimeReload]);

  // ── Tab 1: Cấu hình chung ─────────────────────────────────────────────────

  const handleSaveConfig = (values) => {
    const snapshot = {
      version:   (versions[0]?.version ?? 0) + 1,
      changedBy: "Admin",
      changedAt: new Date().toLocaleDateString("vi-VN"),
      config:    { ...config },
    };
    setVersions((prev) => [snapshot, ...prev]);
    setConfig(values);
    toast.success("Đã lưu cấu hình thành công.");
  };

  const handleSaveAiRuntimeConfig = async () => {
    if (!savedAiRuntimeConfig) {
      toast.error("Cấu hình AI/RAG chưa sẵn sàng để lưu.");
      return;
    }

    const thresholdValue = String(aiRuntimeConfig.confidenceThreshold ?? "").trim();
    const confidenceThreshold = Number(thresholdValue);
    const fallbackMessage = aiRuntimeConfig.fallbackMessage.trim();

    if (!thresholdValue || !Number.isFinite(confidenceThreshold)
      || confidenceThreshold < 0 || confidenceThreshold > 1) {
      toast.error("Ngưỡng độ tin cậy AI phải nằm trong khoảng 0 đến 1.");
      return;
    }

    if (!fallbackMessage) {
      toast.error("Vui lòng nhập thông điệp dự phòng.");
      return;
    }

    if (fallbackMessage.length > 500) {
      toast.error("Thông điệp dự phòng không được vượt quá 500 ký tự.");
      return;
    }

    const updates = [];
    if (confidenceThreshold !== Number(savedAiRuntimeConfig.confidenceThreshold)) {
      updates.push({ key: "AI_CONFIDENCE_THRESHOLD", value: String(confidenceThreshold) });
    }
    if (fallbackMessage !== savedAiRuntimeConfig.fallbackMessage) {
      updates.push({ key: "RAG_FALLBACK_MESSAGE", value: fallbackMessage });
    }

    if (updates.length === 0) {
      toast.success("Cấu hình AI/RAG không có thay đổi.");
      return;
    }

    setAiRuntimeSaving(true);
    try {
      for (const update of updates) {
        await axiosClient.put(`/admin/system-configs/${update.key}`, {
          configValue: update.value,
        });
      }

      const nextConfig = {
        confidenceThreshold: confidenceThreshold === Number(savedAiRuntimeConfig.confidenceThreshold)
          ? savedAiRuntimeConfig.confidenceThreshold
          : String(confidenceThreshold),
        fallbackMessage,
      };
      setAiRuntimeConfig(nextConfig);
      setSavedAiRuntimeConfig(nextConfig);
      toast.success("Đã lưu cấu hình AI/RAG. Yêu cầu chat mới sẽ dùng giá trị này ngay.");
    } catch {
      toast.error("Không thể lưu cấu hình AI/RAG. Dữ liệu đã được tải lại để tránh trạng thái không đồng bộ.");
      setAiRuntimeReload((current) => current + 1);
    } finally {
      setAiRuntimeSaving(false);
    }
  };

  // ── Tab 2: Hệ số nhân điểm ────────────────────────────────────────────────

  const addMultiplier = () => {
    if (!newCondition.trim())
      return toast.error("Vui lòng nhập điều kiện.");
    if (!newMultiplier || newMultiplier <= 0)
      return toast.error("Hệ số nhân phải lớn hơn 0.");
    setMultipliers((prev) => [
      ...prev,
      { id: Date.now(), condition: newCondition.trim(), multiplier: newMultiplier },
    ]);
    setNewCondition("");
    setNewMultiplier(2);
    toast.success("Đã thêm quy tắc nhân điểm.");
  };

  const deleteMultiplier = (id) => {
    setMultipliers((prev) => prev.filter((m) => m.id !== id));
    toast.success("Đã xóa quy tắc.");
  };

  // ── Tab 3: Ngày lễ công cộng ──────────────────────────────────────────────

  const addHoliday = () => {
    if (!newHolidayDate)
      return toast.error("Vui lòng chọn ngày.");
    if (!newHolidayName.trim())
      return toast.error("Vui lòng nhập tên ngày lễ.");
    setHolidays((prev) => [
      ...prev,
      {
        id:   Date.now(),
        date: newHolidayDate.format("DD/MM/YYYY"),
        name: newHolidayName.trim(),
      },
    ]);
    setNewHolidayDate(null);
    setNewHolidayName("");
    toast.success("Đã thêm ngày lễ.");
  };

  const deleteHoliday = (id) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    toast.success("Đã xóa ngày lễ.");
  };

  // ── Tab 4: Lịch sử phiên bản ──────────────────────────────────────────────

  const handleRollback = (ver) => {
    const snapshot = {
      version:   (versions[0]?.version ?? 0) + 1,
      changedBy: "Admin (Rollback)",
      changedAt: new Date().toLocaleDateString("vi-VN"),
      config:    { ...config },
    };
    setVersions((prev) => [snapshot, ...prev]);
    setConfig(ver.config);
    setFormKey((k) => k + 1); // force DynamicForm re-mount với initialValues mới
    toast.success(`Đã khôi phục về phiên bản ${ver.version}.`);
  };

  // ── Diff helpers ──────────────────────────────────────────────────────────

  const getDiff = (oldCfg) =>
    Object.keys(CONFIG_LABELS).map((key) => ({
      key,
      label:   CONFIG_LABELS[key],
      current: String(config[key]),
      old:     String(oldCfg[key]),
      changed: String(config[key]) !== String(oldCfg[key]),
    }));

  // ── Table columns ─────────────────────────────────────────────────────────

  const multiplierColumns = [
    { title: "Điều kiện",  dataIndex: "condition",  key: "condition" },
    {
      title: "Hệ số nhân", dataIndex: "multiplier", key: "multiplier",
      render: (v) => <Tag color="orange">×{v}</Tag>,
    },
    {
      title: "", key: "action", width: 56,
      render: (_, row) => (
        <Popconfirm
          title="Xóa quy tắc này?"
          onConfirm={() => deleteMultiplier(row.id)}
          okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
        >
          <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
        </Popconfirm>
      ),
    },
  ];

  const versionColumns = [
    {
      title: "Phiên bản", dataIndex: "version", key: "version", width: 110,
      render: (v) => <Tag color="blue">v{v}</Tag>,
    },
    { title: "Sửa bởi",  dataIndex: "changedBy", key: "changedBy" },
    { title: "Ngày sửa", dataIndex: "changedAt", key: "changedAt" },
    {
      title: "Hành động", key: "action",
      render: (_, row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            size="small"
            icon={<Eye size={13} />}
            onClick={() => setDiffVersion(row)}
          >
            Xem chi tiết
          </Button>
          <Popconfirm
            title={`Khôi phục về phiên bản ${row.version}?`}
            description="Cấu hình hiện tại sẽ bị thay thế bởi phiên bản này."
            onConfirm={() => handleRollback(row)}
            okText="Khôi phục" cancelText="Hủy"
          >
            <Button size="small" icon={<RotateCcw size={13} />}>
              Khôi phục
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabItems = [
    {
      key: "general",
      label: "Cấu hình chung",
      children: (
        <div className="content-card">
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
            Các thông số được nhận từ hệ thống và hiển thị tự động qua JSON schema.
          </p>
          <DynamicForm
            key={formKey}
            schema={GENERAL_CONFIG_SCHEMA}
            initialValues={config}
            onSubmit={handleSaveConfig}
          />

          <section className="mt-7 rounded-xl border border-orange-100 bg-orange-50/40 p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-800">Cấu hình AI/RAG đang chạy</h2>
              <p className="mt-1 text-sm text-slate-600">
                Hai giá trị này được đọc và lưu trực tiếp qua backend. Sau khi lưu, các yêu cầu chat mới dùng giá trị mới mà không cần khởi động lại backend.
              </p>
            </div>

            {aiRuntimeLoading ? (
              <p className="text-sm text-slate-500">Đang tải cấu hình AI/RAG…</p>
            ) : aiRuntimeError ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="m-0 text-sm text-red-600">{aiRuntimeError}</p>
                <Button onClick={() => setAiRuntimeReload((current) => current + 1)}>
                  Tải lại
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ai-confidence-threshold">
                    Ngưỡng độ tin cậy AI (0 – 1)
                  </label>
                  <InputNumber
                    id="ai-confidence-threshold"
                    value={aiRuntimeConfig.confidenceThreshold}
                    onChange={(value) => setAiRuntimeConfig((current) => ({
                      ...current,
                      confidenceThreshold: value == null ? "" : String(value),
                    }))}
                    min={0}
                    max={1}
                    step={0.01}
                    stringMode
                    className="w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="rag-fallback-message">
                    Thông điệp dự phòng
                  </label>
                  <Input.TextArea
                    id="rag-fallback-message"
                    value={aiRuntimeConfig.fallbackMessage}
                    onChange={(event) => setAiRuntimeConfig((current) => ({
                      ...current,
                      fallbackMessage: event.target.value,
                    }))}
                    maxLength={500}
                    showCount
                    rows={4}
                  />
                </div>

                <div>
                  <Button
                    type="primary"
                    loading={aiRuntimeSaving}
                    onClick={handleSaveAiRuntimeConfig}
                    style={{ background: "#E6430A", borderColor: "#E6430A" }}
                  >
                    Lưu cấu hình AI/RAG
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      ),
    },
    {
      key: "multipliers",
      label: "Hệ số nhân điểm",
      children: (
        <div className="content-card">
          {/* Add form */}
          <div style={{
            display: "flex", gap: 12, marginBottom: 20,
            padding: "14px 16px", borderRadius: 10,
            background: "#f9fafb", border: "1.5px solid #f0f0f0",
            alignItems: "flex-end", flexWrap: "wrap",
          }}>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>
                Điều kiện
              </p>
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="VD: Thứ 7, Chủ nhật..."
                style={{ width: 200 }}
                onPressEnter={addMultiplier}
              />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>
                Hệ số nhân
              </p>
              <InputNumber
                value={newMultiplier}
                onChange={setNewMultiplier}
                min={0.1} step={0.5}
                style={{ width: 120 }}
              />
            </div>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={addMultiplier}
              style={{ background: "#E6430A", borderColor: "#E6430A" }}
            >
              Thêm quy tắc
            </Button>
          </div>

          <Table
            dataSource={multipliers}
            columns={multiplierColumns}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{ emptyText: "Chưa có quy tắc nào." }}
          />
        </div>
      ),
    },
    {
      key: "holidays",
      label: "Ngày lễ công cộng",
      children: (
        <div className="content-card">
          {/* Add form */}
          <div style={{
            display: "flex", gap: 12, marginBottom: 20,
            padding: "14px 16px", borderRadius: 10,
            background: "#f9fafb", border: "1.5px solid #f0f0f0",
            alignItems: "flex-end", flexWrap: "wrap",
          }}>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>Ngày</p>
              <DatePicker
                value={newHolidayDate}
                onChange={setNewHolidayDate}
                format="DD/MM/YYYY"
                style={{ width: 160 }}
                placeholder="Chọn ngày"
              />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>Tên ngày lễ</p>
              <Input
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="VD: Ngày Quốc khánh"
                style={{ width: 260 }}
                onPressEnter={addHoliday}
              />
            </div>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={addHoliday}
              style={{ background: "#E6430A", borderColor: "#E6430A" }}
            >
              Thêm ngày lễ
            </Button>
          </div>

          {/* Holiday list */}
          {holidays.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
              Chưa có ngày lễ nào.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {holidays
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((h) => (
                  <div key={h.id} style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px", borderRadius: 10,
                    border: "1.5px solid #f0f0f0", background: "#fff",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Tag color="red" style={{ margin: 0, fontWeight: 600 }}>{h.date}</Tag>
                      <span style={{ fontSize: 14 }}>{h.name}</span>
                    </div>
                    <Popconfirm
                      title="Xóa ngày lễ này?"
                      onConfirm={() => deleteHoliday(h.id)}
                      okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
                    </Popconfirm>
                  </div>
                ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "history",
      label: "Lịch sử phiên bản",
      children: (
        <div className="content-card">
          {versions.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
              Chưa có lịch sử thay đổi.
            </p>
          ) : (
            <Table
              dataSource={versions}
              columns={versionColumns}
              rowKey="version"
              pagination={false}
              size="small"
            />
          )}
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cấu Hình Hệ Thống</h1>
        <p className="page-subtitle">Quản lý các tham số cấu hình toàn hệ thống</p>
      </div>

      <Tabs items={tabItems} />

      {/* Diff Modal */}
      <Modal
        open={!!diffVersion}
        onCancel={() => setDiffVersion(null)}
        footer={
          <Button onClick={() => setDiffVersion(null)}>Đóng</Button>
        }
        title={`So sánh: Hiện tại vs Phiên bản ${diffVersion?.version}`}
        width={580}
      >
        {diffVersion && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={thStyle}>Thông số</th>
                <th style={thStyle}>Phiên bản {diffVersion.version}</th>
                <th style={thStyle}>Hiện tại</th>
              </tr>
            </thead>
            <tbody>
              {getDiff(diffVersion.config).map((row) => (
                <tr
                  key={row.key}
                  style={{ background: row.changed ? "#fff7ed" : "transparent" }}
                >
                  <td style={tdStyle}>{row.label}</td>
                  <td style={{ ...tdStyle, color: row.changed ? "#dc2626" : "#374151" }}>
                    {row.old}
                  </td>
                  <td style={{
                    ...tdStyle,
                    color: row.changed ? "#16a34a" : "#374151",
                    fontWeight: row.changed ? 600 : 400,
                  }}>
                    {row.current}
                    {row.changed && (
                      <Tag color="green" style={{ marginLeft: 6, fontSize: 11 }}>Đã sửa</Tag>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
