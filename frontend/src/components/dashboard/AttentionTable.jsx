import { translateAttentionReason, translateStatus } from "../../utils/dashboardTranslations";
import { toneClasses } from "./statusTone";

const REASON_TONE = {
  TOP: "good",
  LOW_SCORE: "risk",
  NO_ACTIVITY: "risk",
  MISSING_REPORT: "risk",
  REPORT_REJECTED: "risk",
  CONTRIBUTION_NOT_FINALIZED: "watch",
};

export default function AttentionTable({ rows = [], emptyText = "Không có dữ liệu" }) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rows.slice(0, 8).map((row) => {
        const tone = toneClasses(REASON_TONE[row.status] ?? "info");
        return (
          <div
            key={`${row.id}-${row.status}-${row.title}`}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-50"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[13.5px] font-semibold text-gray-900">{row.title}</p>
              <p className="m-0 mt-0.5 truncate text-[11.5px] text-gray-400">
                {[row.subtitle && translateStatus(row.subtitle), translateAttentionReason(row.reason)].filter(Boolean).join(" · ")}
              </p>
            </div>
            {row.value !== undefined && row.value !== null && (
              <span className="shrink-0 text-sm font-bold text-gray-900">{row.value}</span>
            )}
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${tone.text} ${tone.bg}`}>
              {translateStatus(row.status)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
