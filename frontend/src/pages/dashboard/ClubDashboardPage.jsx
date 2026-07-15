import { useMemo, useState } from "react";
import { Activity, AlertCircle, BarChart3, ClipboardList, Loader2, ShieldAlert, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useClubDashboard } from "../../hooks/useClubDashboard";
import dashboardApi from "../../services/api/clubs/dashboardApi";
import DashboardFilterBar from "../../components/dashboard/DashboardFilterBar";
import KpiCard from "../../components/dashboard/KpiCard";
import SectionPanel from "../../components/dashboard/SectionPanel";
import SimpleBarChart from "../../components/dashboard/SimpleBarChart";
import WarningList from "../../components/dashboard/WarningList";
import AttentionTable from "../../components/dashboard/AttentionTable";
import EvaluationPanel from "../../components/dashboard/EvaluationPanel";
import {
  translateApiMessage,
  translateDecision,
  translateMetricLabel,
  translateStatus,
} from "../../utils/dashboardTranslations";

function fmt(value, suffix = "") {
  if (value === null || value === undefined) return "Chưa có";
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}${suffix}`;
  return `${number.toFixed(number % 1 ? 1 : 0)}${suffix}`;
}

function StatLine({ label, value, suffix }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="m-0 mt-1 text-xl font-bold text-gray-950">{fmt(value, suffix)}</p>
    </div>
  );
}

export default function ClubDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const {
    clubs,
    semesters,
    dashboard,
    selectedClubId,
    selectedSemesterId,
    forcedClubId,
    loading,
    error,
    setFilters,
    refresh,
  } = useClubDashboard(user?.role);

  const canEditEvaluation = ["ICPDP", "ADMIN"].includes(user?.role);

  const headerTitle = dashboard?.club?.clubName ?? "Dashboard CLB";
  const semesterLabel = dashboard?.semester?.semesterCode ?? "Chưa chọn học kỳ";

  const comparisonChart = useMemo(
    () => (dashboard?.semesterComparison ?? []).map((item) => ({
      label: translateMetricLabel(item.key, item.label),
      value: item.currentValue ?? 0,
      secondaryValue: item.previousValue ?? 0,
    })),
    [dashboard]
  );

  const handleSaveEvaluation = async (payload, evaluationId) => {
    if (!selectedClubId) return;
    setSaving(true);
    try {
      const requestPayload = {
        ...payload,
        semesterId: selectedSemesterId,
      };
      if (evaluationId) {
        await dashboardApi.updateEvaluation(selectedClubId, evaluationId, requestPayload);
      } else {
        await dashboardApi.createEvaluation(selectedClubId, requestPayload);
      }
      toast.success("Đã lưu đánh giá.");
      refresh();
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      toast.error(translateApiMessage(err?.response?.data?.message ?? "Cannot save evaluation."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold text-gray-950">{headerTitle}</h1>
          <p className="m-0 mt-1 text-sm text-gray-500">
            Học kỳ {semesterLabel} - Trạng thái {translateStatus(dashboard?.club?.clubStatus)} - Cập nhật lần cuối {dashboard?.lastUpdatedAt ? new Date(dashboard.lastUpdatedAt).toLocaleString("vi-VN") : "Chưa có"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 text-right shadow-sm">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-500">Đề xuất hệ thống</p>
          <p className="m-0 mt-1 text-lg font-bold text-gray-950">{translateDecision(dashboard?.suggestedDecision?.decision)}</p>
        </div>
      </div>

      <DashboardFilterBar
        clubs={clubs}
        semesters={semesters}
        selectedClubId={selectedClubId}
        selectedSemesterId={selectedSemesterId}
        forcedClubId={forcedClubId}
        onChange={setFilters}
        onRefresh={refresh}
        loading={loading}
      />

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="flex min-h-[360px] items-center justify-center text-gray-400">
          <Loader2 size={30} className="animate-spin" />
        </div>
      ) : dashboard ? (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(dashboard.overviewMetrics ?? []).map((metric) => (
              <KpiCard key={metric.key} metric={metric} />
            ))}
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-4">
            <StatLine label="Tổng thành viên" value={dashboard.memberMetrics?.totalMembers} />
            <StatLine label="Tỷ lệ hoạt động" value={dashboard.memberMetrics?.activeMemberRate} suffix="%" />
            <StatLine label="Sự kiện hoàn thành" value={dashboard.eventMetrics?.completedEvents} />
            <StatLine label="Tỷ lệ tham dự" value={dashboard.attendanceMetrics?.attendanceRate} suffix="%" />
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-2">
            <SectionPanel title="Cơ cấu thành viên">
              <SimpleBarChart data={dashboard.memberMetrics?.roleDistribution ?? []} />
            </SectionPanel>

            <SectionPanel title="Phân bố trạng thái sự kiện">
              <SimpleBarChart data={dashboard.eventMetrics?.statusDistribution ?? []} />
            </SectionPanel>

            <SectionPanel title="Điểm danh theo sự kiện">
              <SimpleBarChart data={dashboard.attendanceMetrics?.attendanceByEvent ?? []} />
            </SectionPanel>

            <SectionPanel title="Phân bố điểm đóng góp">
              <SimpleBarChart data={dashboard.contributionMetrics?.scoreDistribution ?? []} />
            </SectionPanel>
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionPanel
              title="Cơ cấu điểm KPI"
              action={<BarChart3 size={18} className="text-gray-400" />}
            >
              <div className="space-y-3">
                {(dashboard.kpiBreakdown ?? []).map((item) => (
                  <div key={item.key} className="grid grid-cols-[minmax(120px,190px)_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate font-medium text-gray-700">{translateMetricLabel(item.key, item.label)}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (Number(item.actualScore) / Math.max(1, Number(item.maxScore))) * 100)}%` }} />
                    </div>
                    <span className="text-right font-bold text-gray-950">{fmt(item.actualScore)} / {fmt(item.maxScore)}</span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            <SectionPanel title="So sánh học kỳ">
              <SimpleBarChart data={comparisonChart} emptyText="Không có học kỳ trước" />
            </SectionPanel>
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-3">
            <SectionPanel title="Thành viên cần chú ý" action={<Users size={18} className="text-gray-400" />}>
              <AttentionTable rows={dashboard.memberMetrics?.membersNeedAttention ?? []} />
            </SectionPanel>
            <SectionPanel title="Sự kiện cần chú ý" action={<Activity size={18} className="text-gray-400" />}>
              <AttentionTable rows={dashboard.eventMetrics?.eventsNeedAttention ?? []} />
            </SectionPanel>
            <SectionPanel title="Báo cáo cần chú ý" action={<ClipboardList size={18} className="text-gray-400" />}>
              <AttentionTable rows={dashboard.reportMetrics?.reportsNeedAttention ?? []} />
            </SectionPanel>
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <SectionPanel title="Cảnh báo rủi ro" action={<ShieldAlert size={18} className="text-gray-400" />}>
              <WarningList warnings={dashboard.warnings ?? []} />
            </SectionPanel>

            <SectionPanel title="Đánh giá của ICPDP">
              <EvaluationPanel
                key={`${dashboard.latestEvaluation?.evaluationID ?? "new"}-${dashboard.suggestedDecision?.decision ?? "none"}`}
                dashboard={dashboard}
                canEdit={canEditEvaluation}
                onSave={handleSaveEvaluation}
                saving={saving}
              />
            </SectionPanel>
          </div>

          <SectionPanel title="Lịch sử đánh giá">
            {(dashboard.evaluationHistory ?? []).length ? (
              <div className="space-y-3">
                {(dashboard.evaluationHistory ?? []).slice(0, 8).map((item) => (
                  <div key={item.evaluationID} className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 font-semibold text-gray-900">{translateDecision(item.finalDecision)}</p>
                      <span className="text-xs text-gray-400">{item.evaluatedAt ? new Date(item.evaluatedAt).toLocaleString("vi-VN") : "Chưa có"}</span>
                    </div>
                    <p className="m-0 mt-1">Người đánh giá: {item.evaluatedByName ?? "Chưa có"} - KPI {fmt(item.kpiScore)}</p>
                    <p className="m-0 mt-2">{item.overallComment ?? "Chưa có nhận xét"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                Chưa có đánh giá nào được lưu cho học kỳ này.
              </div>
            )}
          </SectionPanel>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Chọn CLB và học kỳ để tải dữ liệu dashboard.
        </div>
      )}
    </div>
  );
}
