import { useEffect, useState } from "react";
import {
  Tabs, Table, Button, InputNumber, DatePicker,
  Modal, Tag, Popconfirm, Input, Select,
} from "antd";
import { Plus, Trash2, RotateCcw, Eye } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import axiosClient from "../../services/api/axiosClient";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONFIG = {
  submitThresholdDays: 7,
  minPoints: 10,
  maxFileSize: 10,
  fileSizeUnit: "MB",
  eventSubmissionMaxAttempts: 3,
  eventSubmissionCooldownHours: 24,
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

const CONFIG_LABELS = {
  submitThresholdDays:    "Ngưỡng ngày submit",
  minPoints:              "Điểm tối thiểu",
  maxFileSize:            "Giới hạn file",
  fileSizeUnit:           "Đơn vị file",
  eventSubmissionMaxAttempts: "Số lần submit Event tối đa",
  eventSubmissionCooldownHours: "Thời gian chờ submit Event",
};

const PERSISTED_CONFIG_KEYS = {
  general: "ADMIN_GENERAL_CONFIG",
  multipliers: "ADMIN_POINT_MULTIPLIERS",
  holidays: "ADMIN_PUBLIC_HOLIDAYS",
  versions: "ADMIN_CONFIG_VERSIONS",
  eventSubmissionMaxAttempts: "EVENT_SUBMISSION_MAX_ATTEMPTS",
  eventSubmissionCooldownHours: "EVENT_SUBMISSION_COOLDOWN_HOURS",
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
  const [configDraft, setConfigDraft] = useState(MOCK_CONFIG);
  const [multipliers, setMultipliers] = useState(MOCK_MULTIPLIERS);
  const [holidays, setHolidays]       = useState(MOCK_HOLIDAYS);
  const [versions, setVersions]       = useState([]);

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
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  const saveJsonConfig = async (key, value) => {
    await axiosClient.put(`/admin/system-configs/${key}`, {
      configValue: JSON.stringify(value),
    });
  };

  const saveScalarConfig = async (key, value) => {
    await axiosClient.put(`/admin/system-configs/${key}`, {
      configValue: String(value),
    });
  };

  useEffect(() => {
    let cancelled = false;
    const loadPersistedConfig = async () => {
      setConfigLoading(true);
      try {
        const response = await axiosClient.get("/admin/system-configs");
        const items = Array.isArray(response) ? response : (response?.data ?? []);
        const byKey = new Map(items.map((item) => [item.configKey, item.configValue]));
        const parse = (key, fallback) => {
          const raw = byKey.get(key);
          if (!raw) return fallback;
          try {
            return JSON.parse(raw);
          } catch {
            return fallback;
          }
        };
        if (!cancelled) {
          const persistedGeneral = {
            ...MOCK_CONFIG,
            ...parse(PERSISTED_CONFIG_KEYS.general, MOCK_CONFIG),
          };
          const maxAttempts = Number(byKey.get(PERSISTED_CONFIG_KEYS.eventSubmissionMaxAttempts));
          const cooldownHours = Number(byKey.get(PERSISTED_CONFIG_KEYS.eventSubmissionCooldownHours));
          if (Number.isInteger(maxAttempts) && maxAttempts > 0) {
            persistedGeneral.eventSubmissionMaxAttempts = maxAttempts;
          }
          if (Number.isInteger(cooldownHours) && cooldownHours > 0) {
            persistedGeneral.eventSubmissionCooldownHours = cooldownHours;
          }
          setConfig(persistedGeneral);
          setConfigDraft(persistedGeneral);
          setMultipliers(parse(PERSISTED_CONFIG_KEYS.multipliers, MOCK_MULTIPLIERS));
          setHolidays(parse(PERSISTED_CONFIG_KEYS.holidays, MOCK_HOLIDAYS));
          setVersions(parse(PERSISTED_CONFIG_KEYS.versions, []));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message ?? "Không thể tải cấu hình hệ thống.");
        }
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    };
    loadPersistedConfig();
    return () => {
      cancelled = true;
    };
  }, [toast]);

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

  const handleSaveConfig = async () => {
    const values = configDraft;
    const normalized = {
      submitThresholdDays: Number(values?.submitThresholdDays),
      minPoints: Number(values?.minPoints),
      maxFileSize: Number(values?.maxFileSize),
      fileSizeUnit: values?.fileSizeUnit,
      eventSubmissionMaxAttempts: Number(values?.eventSubmissionMaxAttempts),
      eventSubmissionCooldownHours: Number(values?.eventSubmissionCooldownHours),
    };

    if (values?.submitThresholdDays === undefined
      || values?.submitThresholdDays === null
      || values?.submitThresholdDays === ""
      || !Number.isInteger(normalized.submitThresholdDays)
      || normalized.submitThresholdDays < 1
      || normalized.submitThresholdDays > 365) {
      toast.error("Ngưỡng ngày submit là bắt buộc và phải là số nguyên từ 1 đến 365.");
      return;
    }
    if (values?.minPoints === undefined
      || values?.minPoints === null
      || values?.minPoints === ""
      || !Number.isInteger(normalized.minPoints)
      || normalized.minPoints < 0) {
      toast.error("Điểm tối thiểu là bắt buộc và phải là số nguyên không âm.");
      return;
    }
    if (values?.maxFileSize === undefined
      || values?.maxFileSize === null
      || values?.maxFileSize === ""
      || !Number.isInteger(normalized.maxFileSize)
      || normalized.maxFileSize < 1) {
      toast.error("Giới hạn kích thước file là bắt buộc và phải là số nguyên lớn hơn 0.");
      return;
    }
    if (!Number.isInteger(normalized.eventSubmissionMaxAttempts)
      || normalized.eventSubmissionMaxAttempts < 1
      || normalized.eventSubmissionMaxAttempts > 20) {
      toast.error("Số lần submit Event tối đa phải là số nguyên từ 1 đến 20.");
      return;
    }
    if (!Number.isInteger(normalized.eventSubmissionCooldownHours)
      || normalized.eventSubmissionCooldownHours < 1
      || normalized.eventSubmissionCooldownHours > 720) {
      toast.error("Thời gian chờ submit Event phải là số giờ nguyên từ 1 đến 720.");
      return;
    }
    if (!["KB", "MB", "GB"].includes(normalized.fileSizeUnit)) {
      toast.error("Vui lòng chọn đơn vị file hợp lệ.");
      return;
    }

    const hasChanges = Object.keys(CONFIG_LABELS).some(
      (key) => String(config[key]) !== String(normalized[key]),
    );
    if (!hasChanges) {
      toast.success("Cấu hình không có thay đổi.");
      return;
    }

    const snapshot = {
      version:   (versions[0]?.version ?? 0) + 1,
      changedBy: "Admin",
      changedAt: new Date().toLocaleDateString("vi-VN"),
      config:    { ...normalized },
    };
    const nextVersions = [snapshot, ...versions].slice(0, 20);
    setConfigSaving(true);
    try {
      await Promise.all([
        saveJsonConfig(PERSISTED_CONFIG_KEYS.general, normalized),
        saveJsonConfig(PERSISTED_CONFIG_KEYS.versions, nextVersions),
        saveScalarConfig(
          PERSISTED_CONFIG_KEYS.eventSubmissionMaxAttempts,
          normalized.eventSubmissionMaxAttempts,
        ),
        saveScalarConfig(
          PERSISTED_CONFIG_KEYS.eventSubmissionCooldownHours,
          normalized.eventSubmissionCooldownHours,
        ),
      ]);
      setVersions(nextVersions);
      setConfig(normalized);
      setConfigDraft(normalized);
      toast.success("Đã lưu cấu hình thành công.");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể lưu cấu hình hệ thống.");
    } finally {
      setConfigSaving(false);
    }
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

  const addMultiplier = async () => {
    if (!newCondition.trim())
      return toast.error("Vui lòng nhập điều kiện.");
    if (!newMultiplier || newMultiplier <= 0)
      return toast.error("Hệ số nhân phải lớn hơn 0.");
    const next = [
      ...multipliers,
      { id: Date.now(), condition: newCondition.trim(), multiplier: newMultiplier },
    ];
    try {
      await saveJsonConfig(PERSISTED_CONFIG_KEYS.multipliers, next);
      setMultipliers(next);
      setNewCondition("");
      setNewMultiplier(2);
      toast.success("Đã thêm quy tắc nhân điểm.");
    } catch {
      toast.error("Không thể lưu quy tắc nhân điểm.");
    }
  };

  const deleteMultiplier = async (id) => {
    const next = multipliers.filter((m) => m.id !== id);
    try {
      await saveJsonConfig(PERSISTED_CONFIG_KEYS.multipliers, next);
      setMultipliers(next);
      toast.success("Đã xóa quy tắc.");
    } catch {
      toast.error("Không thể xóa quy tắc.");
    }
  };

  // ── Tab 3: Ngày lễ công cộng ──────────────────────────────────────────────

  const addHoliday = async () => {
    if (!newHolidayDate)
      return toast.error("Vui lòng chọn ngày.");
    if (!newHolidayName.trim())
      return toast.error("Vui lòng nhập tên ngày lễ.");
    const next = [
      ...holidays,
      {
        id:   Date.now(),
        date: newHolidayDate.format("DD/MM/YYYY"),
        name: newHolidayName.trim(),
      },
    ];
    try {
      await saveJsonConfig(PERSISTED_CONFIG_KEYS.holidays, next);
      setHolidays(next);
      setNewHolidayDate(null);
      setNewHolidayName("");
      toast.success("Đã thêm ngày lễ.");
    } catch {
      toast.error("Không thể lưu ngày lễ.");
    }
  };

  const deleteHoliday = async (id) => {
    const next = holidays.filter((h) => h.id !== id);
    try {
      await saveJsonConfig(PERSISTED_CONFIG_KEYS.holidays, next);
      setHolidays(next);
      toast.success("Đã xóa ngày lễ.");
    } catch {
      toast.error("Không thể xóa ngày lễ.");
    }
  };

  // ── Tab 4: Lịch sử phiên bản ──────────────────────────────────────────────

  const handleRollback = async (ver) => {
    const snapshot = {
      version:   (versions[0]?.version ?? 0) + 1,
      changedBy: "Admin (Rollback)",
      changedAt: new Date().toLocaleDateString("vi-VN"),
      config:    { ...config },
    };
    const nextVersions = [snapshot, ...versions].slice(0, 20);
    try {
      await Promise.all([
        saveJsonConfig(PERSISTED_CONFIG_KEYS.general, ver.config),
        saveJsonConfig(PERSISTED_CONFIG_KEYS.versions, nextVersions),
      ]);
      setVersions(nextVersions);
      setConfig(ver.config);
      setConfigDraft(ver.config);
      toast.success(`Đã khôi phục về phiên bản ${ver.version}.`);
    } catch {
      toast.error("Không thể khôi phục phiên bản cấu hình.");
    }
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
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                <span className="text-red-500">*</span> Ngưỡng ngày submit
              </label>
              <InputNumber
                value={configDraft.submitThresholdDays}
                onChange={(value) => setConfigDraft((current) => ({
                  ...current,
                  submitThresholdDays: value,
                }))}
                min={1}
                max={365}
                precision={0}
                placeholder="VD: 7"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                <span className="text-red-500">*</span> Điểm tối thiểu
              </label>
              <InputNumber
                value={configDraft.minPoints}
                onChange={(value) => setConfigDraft((current) => ({
                  ...current,
                  minPoints: value,
                }))}
                min={0}
                precision={0}
                placeholder="VD: 10"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                <span className="text-red-500">*</span> Giới hạn kích thước file
              </label>
              <InputNumber
                value={configDraft.maxFileSize}
                onChange={(value) => setConfigDraft((current) => ({
                  ...current,
                  maxFileSize: value,
                }))}
                min={1}
                precision={0}
                placeholder="VD: 10"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                <span className="text-red-500">*</span> Đơn vị file
              </label>
              <Select
                value={configDraft.fileSizeUnit}
                onChange={(value) => setConfigDraft((current) => ({
                  ...current,
                  fileSizeUnit: value,
                }))}
                options={[
                  { value: "KB", label: "KB" },
                  { value: "MB", label: "MB" },
                  { value: "GB", label: "GB" },
                ]}
                placeholder="Chọn đơn vị"
                allowClear
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                <span className="text-red-500">*</span> Số lần submit Event tối đa
              </label>
              <InputNumber
                value={configDraft.eventSubmissionMaxAttempts}
                onChange={(value) => setConfigDraft((current) => ({
                  ...current,
                  eventSubmissionMaxAttempts: value,
                }))}
                min={1}
                max={20}
                precision={0}
                placeholder="VD: 3"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                <span className="text-red-500">*</span> Thời gian chờ sau khi vượt ngưỡng (giờ)
              </label>
              <InputNumber
                value={configDraft.eventSubmissionCooldownHours}
                onChange={(value) => setConfigDraft((current) => ({
                  ...current,
                  eventSubmissionCooldownHours: value,
                }))}
                min={1}
                max={720}
                precision={0}
                placeholder="VD: 24"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <Button
            type="primary"
            onClick={handleSaveConfig}
            loading={configLoading || configSaving}
            className="mt-5"
            style={{ background: "#E6430A", borderColor: "#E6430A" }}
          >
            Lưu cấu hình
          </Button>

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
