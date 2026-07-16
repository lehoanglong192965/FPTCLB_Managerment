import { RefreshCw } from "lucide-react";

export default function DashboardFilterBar({
  clubs,
  semesters,
  selectedClubId,
  selectedSemesterId,
  forcedClubId,
  onChange,
  onRefresh,
  loading,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-semibold text-gray-500">
        CLB
        <select
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#e6430a]"
          value={selectedClubId ?? ""}
          disabled={Boolean(forcedClubId)}
          onChange={(event) => onChange({ clubId: event.target.value })}
        >
          {clubs.map((club) => (
            <option key={club.value} value={club.value}>{club.label}</option>
          ))}
        </select>
      </label>

      <label className="flex min-w-[180px] flex-col gap-1 text-xs font-semibold text-gray-500">
        Học kỳ
        <select
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#e6430a]"
          value={selectedSemesterId ?? ""}
          onChange={(event) => onChange({ semesterId: event.target.value })}
        >
          {semesters.map((semester) => (
            <option key={semester.semesterID} value={semester.semesterID}>
              {semester.semesterCode}{semester.isActive ? " (Đang diễn ra)" : ""}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        Làm mới
      </button>
    </div>
  );
}
