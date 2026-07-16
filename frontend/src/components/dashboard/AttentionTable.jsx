import { translateAttentionReason, translateStatus } from "../../utils/dashboardTranslations";

export default function AttentionTable({ rows = [], emptyText = "Không có dữ liệu" }) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse text-sm">
        <tbody>
          {rows.slice(0, 8).map((row) => (
            <tr key={`${row.id}-${row.status}-${row.title}`} className="border-b border-gray-50 last:border-b-0">
              <td className="py-3 pr-3">
                <p className="m-0 font-semibold text-gray-900">{row.title}</p>
                <p className="m-0 mt-0.5 text-xs text-gray-400">{translateStatus(row.subtitle)}</p>
              </td>
              <td className="py-3 pr-3 text-right text-sm font-bold text-gray-900">
                {row.value ?? ""}
              </td>
              <td className="py-3 pr-3">
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  {translateStatus(row.status)}
                </span>
              </td>
              <td className="py-3 text-gray-500">{translateAttentionReason(row.reason)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
