// Bảng tông màu trạng thái dùng chung cho toàn bộ Dashboard CLB (thẻ KPI, badge quyết định,
// danh sách cảnh báo...) để không mỗi component tự chọn 1 bộ màu khác nhau.
// Class Tailwind phải viết literal (không ghép chuỗi runtime) để JIT scan thấy được.
const TONES = {
  good:  { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", borderL: "border-l-emerald-400" },
  watch: { dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   borderL: "border-l-amber-400" },
  risk:  { dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     borderL: "border-l-red-400" },
  info:  { dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200",   borderL: "border-l-slate-300" },
  empty: { dot: "bg-slate-300",   text: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-200",   borderL: "border-l-slate-200" },
};

const KPI_STATUS_TONE = {
  GOOD: "good",
  WATCH: "watch",
  RISK: "risk",
  INFO: "info",
  EMPTY: "empty",
};

const SEVERITY_TONE = {
  CRITICAL: "risk",
  HIGH: "watch",
  MEDIUM: "watch",
  LOW: "info",
};

export function toneClasses(tone) {
  return TONES[tone] ?? TONES.info;
}

export function kpiStatusTone(status) {
  return KPI_STATUS_TONE[status] ?? "info";
}

export function severityTone(severity) {
  return SEVERITY_TONE[severity] ?? "info";
}
