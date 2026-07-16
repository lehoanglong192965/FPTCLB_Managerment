import { translateChartLabel } from "../../utils/dashboardTranslations";

function maxValue(data) {
  return Math.max(1, ...data.map((item) => Number(item.value ?? 0)));
}

export default function SimpleBarChart({ data = [], emptyText = "Không có dữ liệu" }) {
  const max = maxValue(data);

  if (!data.length) {
    return (
      <div className="flex min-h-[148px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 10).map((item) => {
        const value = Number(item.value ?? 0);
        const width = `${Math.max(4, (value / max) * 100)}%`;
        return (
          <div key={`${item.label}-${value}`} className="grid grid-cols-[minmax(92px,150px)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-gray-600" title={translateChartLabel(item.label)}>{translateChartLabel(item.label)}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[#e6430a]" style={{ width }} />
            </div>
            <span className="min-w-10 text-right font-semibold text-gray-900">{value.toFixed(value % 1 ? 1 : 0)}</span>
          </div>
        );
      })}
    </div>
  );
}
