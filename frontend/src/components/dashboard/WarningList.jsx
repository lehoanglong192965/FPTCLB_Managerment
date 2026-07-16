import {
  translateSeverity,
  translateStatus,
  translateWarningMessage,
  translateWarningType,
} from "../../utils/dashboardTranslations";

const SEVERITY_CLASS = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function WarningList({ warnings = [] }) {
  if (!warnings.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400">
        Không có cảnh báo cho bộ lọc đã chọn.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-3">Mức độ</th>
            <th className="py-2 pr-3">Loại</th>
            <th className="py-2 pr-3">Nội dung</th>
            <th className="py-2 pr-3">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {warnings.map((warning, index) => (
            <tr key={`${warning.type}-${index}`} className="border-b border-gray-50">
              <td className="py-3 pr-3">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_CLASS[warning.severity] ?? SEVERITY_CLASS.LOW}`}>
                  {translateSeverity(warning.severity)}
                </span>
              </td>
              <td className="py-3 pr-3 font-semibold text-gray-900">{translateWarningType(warning.type)}</td>
              <td className="py-3 pr-3 text-gray-600">{translateWarningMessage(warning.message)}</td>
              <td className="py-3 pr-3 text-gray-500">{translateStatus(warning.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
