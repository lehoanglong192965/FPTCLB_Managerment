import { useState } from "react";
import { Save } from "lucide-react";
import { translateDecision, translateDashboardText } from "../../utils/dashboardTranslations";

const DECISIONS = [
  "Continue",
  "Continue with Improvement Plan",
  "Warning",
  "Suspend",
  "Close",
];

function initialForm(evaluation, suggestion) {
  return {
    finalDecision: evaluation?.finalDecision ?? suggestion?.decision ?? "Continue",
    overallComment: evaluation?.overallComment ?? "",
    strengths: evaluation?.strengths ?? "",
    weaknesses: evaluation?.weaknesses ?? "",
    improvementRequirements: evaluation?.improvementRequirements ?? "",
    improvementDeadline: evaluation?.improvementDeadline ?? "",
    decisionReason: evaluation?.decisionReason ?? "",
  };
}

export default function EvaluationPanel({ dashboard, canEdit, onSave, saving }) {
  const [form, setForm] = useState(() => initialForm(dashboard?.latestEvaluation, dashboard?.suggestedDecision));

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave(form, dashboard?.latestEvaluation?.evaluationID);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-500">Đề xuất hệ thống</p>
        <p className="m-0 mt-1 text-xl font-bold text-gray-900">{translateDecision(dashboard?.suggestedDecision?.decision)}</p>
        <p className="m-0 mt-1 text-sm text-gray-500">{translateDashboardText(dashboard?.suggestedDecision?.confidenceNote)}</p>
      </div>

      <label className="block text-xs font-semibold text-gray-500">
        Quyết định cuối cùng
        <select
          className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#e6430a]"
          value={form.finalDecision}
          onChange={update("finalDecision")}
          disabled={!canEdit}
        >
          {DECISIONS.map((decision) => (
            <option key={decision} value={decision}>{translateDecision(decision)}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs font-semibold text-gray-500">
          Điểm mạnh
          <textarea className="mt-1 min-h-[86px] w-full rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-[#e6430a]" value={form.strengths} onChange={update("strengths")} disabled={!canEdit} />
        </label>
        <label className="block text-xs font-semibold text-gray-500">
          Điểm yếu
          <textarea className="mt-1 min-h-[86px] w-full rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-[#e6430a]" value={form.weaknesses} onChange={update("weaknesses")} disabled={!canEdit} />
        </label>
      </div>

      <label className="block text-xs font-semibold text-gray-500">
        Yêu cầu cải thiện
        <textarea className="mt-1 min-h-[86px] w-full rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-[#e6430a]" value={form.improvementRequirements} onChange={update("improvementRequirements")} disabled={!canEdit} />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs font-semibold text-gray-500">
          Hạn cải thiện
          <input className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#e6430a]" type="date" value={form.improvementDeadline ?? ""} onChange={update("improvementDeadline")} disabled={!canEdit} />
        </label>
        <label className="block text-xs font-semibold text-gray-500">
          Lý do quyết định
          <input className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#e6430a]" value={form.decisionReason} onChange={update("decisionReason")} disabled={!canEdit} />
        </label>
      </div>

      <label className="block text-xs font-semibold text-gray-500">
        Nhận xét tổng quan
        <textarea className="mt-1 min-h-[86px] w-full rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-[#e6430a]" value={form.overallComment} onChange={update("overallComment")} disabled={!canEdit} />
      </label>

      {canEdit && (
        <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#e6430a] px-4 text-sm font-semibold text-white hover:bg-[#cf3c09] disabled:cursor-not-allowed disabled:opacity-60">
          <Save size={16} />
          {saving ? "Đang lưu..." : "Lưu đánh giá"}
        </button>
      )}
    </form>
  );
}
