import { AlertTriangle } from "lucide-react";
import {
  translateSeverity,
  translateStatus,
  translateWarningMessage,
  translateWarningType,
} from "../../utils/dashboardTranslations";
import { severityTone, toneClasses } from "./statusTone";

export default function WarningList({ warnings = [] }) {
  if (!warnings.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400">
        Không có cảnh báo cho bộ lọc đã chọn.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {warnings.map((warning, index) => {
        const tone = toneClasses(severityTone(warning.severity));
        return (
          <div
            key={`${warning.type}-${index}`}
            className={`flex items-start gap-3 rounded-lg border border-l-4 ${tone.border} ${tone.borderL} ${tone.bg} p-3.5`}
          >
            <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${tone.text}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="m-0 text-[13.5px] font-bold text-gray-900">{translateWarningType(warning.type)}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${tone.text} ${tone.bg} border ${tone.border}`}>
                  {translateSeverity(warning.severity)}
                </span>
              </div>
              <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-gray-600">{translateWarningMessage(warning.message)}</p>
              {warning.status && (
                <p className="m-0 mt-1 text-[11px] font-medium text-gray-400">{translateStatus(warning.status)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
