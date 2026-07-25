import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  translateFormula,
  translateMetricLabel,
  translateStatus,
  translateUnit,
} from "../../utils/dashboardTranslations";
import { kpiStatusTone, toneClasses } from "./statusTone";

function formatValue(value, unit) {
  if (value === null || value === undefined) return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (unit === "%") return `${number.toFixed(1)}%`;
  if (unit === "points") return number.toFixed(1);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

export default function KpiCard({ metric, icon: Icon, chipClass }) {
  const change = metric?.changePercent;
  const isUp = Number(change) > 0;
  const isDown = Number(change) < 0;
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const tone = toneClasses(kpiStatusTone(metric.status));
  const formula = metric.formula ? translateFormula(metric.key, metric.formula) : "";
  const label = translateMetricLabel(metric.key, metric.label);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chipClass ?? "bg-gray-50 text-gray-500"}`}>
            <Icon size={16} />
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${tone.text} ${tone.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {translateStatus(metric.note ?? metric.status ?? "INFO")}
        </span>
      </div>

      <p className="m-0 truncate text-[12px] font-semibold text-gray-500" title={formula || label}>
        {label}
      </p>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="m-0 text-[26px] font-bold leading-tight tracking-tight text-gray-950">
          {formatValue(metric.value, metric.unit)}
          {metric.unit && metric.unit !== "%" && (
            <span className="ml-1.5 text-xs font-medium text-gray-400">{translateUnit(metric.unit)}</span>
          )}
        </p>

        {(change !== null && change !== undefined) && (
          <span className={`inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-bold ${isDown ? "text-red-600" : isUp ? "text-emerald-600" : "text-gray-300"}`}>
            <TrendIcon size={13} />
            {Number(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
