import { ArrowDownRight, ArrowUpRight, HelpCircle, Minus } from "lucide-react";
import {
  translateFormula,
  translateMetricLabel,
  translateStatus,
  translateUnit,
} from "../../utils/dashboardTranslations";

function formatValue(value, unit) {
  if (value === null || value === undefined) return "Chưa có";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (unit === "%") return `${number.toFixed(1)}%`;
  if (unit === "points") return number.toFixed(1);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

const STATUS_CLASS = {
  GOOD: "border-emerald-200 bg-emerald-50 text-emerald-700",
  WATCH: "border-amber-200 bg-amber-50 text-amber-700",
  RISK: "border-red-200 bg-red-50 text-red-700",
  INFO: "border-slate-200 bg-slate-50 text-slate-700",
  EMPTY: "border-slate-200 bg-slate-50 text-slate-500",
};

export default function KpiCard({ metric }) {
  const change = metric?.changePercent;
  const isUp = Number(change) > 0;
  const isDown = Number(change) < 0;
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const formula = metric.formula ? translateFormula(metric.key, metric.formula) : "";

  return (
    <div className="min-h-[132px] rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 truncate text-[12px] font-semibold uppercase tracking-wide text-gray-500">
            {translateMetricLabel(metric.key, metric.label)}
          </p>
          {formula && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-gray-400" title={formula}>
              <HelpCircle size={12} />
              <span className="truncate">{formula}</span>
            </span>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[metric.status] ?? STATUS_CLASS.INFO}`}>
          {translateStatus(metric.note ?? metric.status ?? "INFO")}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="m-0 text-2xl font-bold text-gray-950">
            {formatValue(metric.value, metric.unit)}
          </p>
          {metric.unit && metric.unit !== "%" && (
            <p className="m-0 text-xs text-gray-400">{translateUnit(metric.unit)}</p>
          )}
        </div>

        <div className={`flex items-center gap-1 text-xs font-semibold ${isDown ? "text-red-600" : isUp ? "text-emerald-600" : "text-gray-400"}`}>
          <TrendIcon size={15} />
          <span>{change === null || change === undefined ? "Chưa có" : `${Number(change).toFixed(1)}%`}</span>
        </div>
      </div>
    </div>
  );
}
