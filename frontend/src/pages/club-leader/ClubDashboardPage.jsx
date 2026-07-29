import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowLeft, Award, BarChart3, CalendarDays,
  ClipboardList, History, Loader2, ShieldAlert, ShieldCheck, TrendingUp, Users,
} from "lucide-react";
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
import { toneClasses } from "../../components/dashboard/statusTone";
import {
  decisionTone,
  translateApiMessage,
  translateDecision,
  translateMetricLabel,
  translateStatus,
} from "../../utils/dashboardTranslations";

// Gom 12 chỉ số overviewMetrics theo đúng 4 mảng nghiệp vụ ICPDP cần nhìn khi đánh giá 1 CLB.
// Mỗi nhóm 1 màu nhận diện riêng (đã kiểm tra phân biệt được qua validate_palette.js),
// tách biệt hoàn toàn với bộ màu trạng thái tốt/cảnh báo/rủi ro (emerald/amber/red) để không lẫn ý nghĩa.
const KPI_GROUPS = [
  { title: "Thành viên", icon: Users, chipClass: "bg-blue-50 text-blue-600", keys: ["totalMembers", "activeMembers", "activeMemberRate"] },
  { title: "Sự kiện & Tham dự", icon: CalendarDays, chipClass: "bg-teal-50 text-teal-600", keys: ["approvedEvents", "completedEvents", "eventCompletionRate", "attendanceRate"] },
  { title: "Đóng góp & Tuân thủ", icon: ShieldCheck, chipClass: "bg-fuchsia-50 text-fuchsia-600", keys: ["averageContributionScore", "overdueReports", "activeViolations"] },
  { title: "Kết luận", icon: Award, chipClass: "bg-[#FFF3EE] text-[#E6430A]", keys: ["clubKpiScore", "evaluationStatus"] },
];

function fmt(value, suffix = "") {
  if (value === null || value === undefined) return "Chưa có";
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}${suffix}`;
  return `${number.toFixed(number % 1 ? 1 : 0)}${suffix}`;
}

export default function ClubDashboardPage() {
  const navigate = useNavigate();
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

  const kpiGroups = useMemo(() => {
    const metrics = dashboard?.overviewMetrics ?? [];
    const byKey = new Map(metrics.map((metric) => [metric.key, metric]));
    const grouped = KPI_GROUPS.map((group) => ({
      title: group.title,
      icon: group.icon,
      chipClass: group.chipClass,
      metrics: group.keys.map((key) => byKey.get(key)).filter(Boolean),
    })).filter((group) => group.metrics.length);
    const groupedKeys = new Set(KPI_GROUPS.flatMap((group) => group.keys));
    const rest = metrics.filter((metric) => !groupedKeys.has(metric.key));
    if (rest.length) grouped.push({ title: "Khác", icon: BarChart3, chipClass: "bg-gray-100 text-gray-500", metrics: rest });
    return grouped;
  }, [dashboard]);

  const decision = dashboard?.suggestedDecision?.decision;
  const decisionColors = toneClasses(decisionTone(decision));

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
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer hover:border-[#e6430a] hover:text-[#e6430a] transition-all"
      >
        <ArrowLeft size={15} /> Quay lại
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-2xl font-bold text-gray-950">{headerTitle}</h1>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
              {translateStatus(dashboard?.club?.clubStatus)}
            </span>
          </div>
          <p className="m-0 mt-1.5 text-sm text-gray-500">
            Học kỳ {semesterLabel} · Cập nhật lần cuối {dashboard?.lastUpdatedAt ? new Date(dashboard.lastUpdatedAt).toLocaleString("vi-VN") : "Chưa có"}
          </p>
        </div>
        <div className={`rounded-lg border ${decisionColors.border} ${decisionColors.bg} px-4 py-3 text-right shadow-sm`}>
          <p className={`m-0 text-[11px] font-semibold uppercase tracking-wide ${decisionColors.text} opacity-80`}>Đề xuất hệ thống</p>
          <p className={`m-0 mt-1 flex items-center justify-end gap-1.5 text-lg font-bold ${decisionColors.text}`}>
            <span className={`h-2 w-2 rounded-full ${decisionColors.dot}`} />
            {translateDecision(decision)}
          </p>
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
          <div className="mb-6 space-y-6">
            {kpiGroups.map((group) => (
              <div key={group.title}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${group.chipClass}`}>
                    <group.icon size={13} />
                  </span>
                  <h3 className="m-0 text-[13px] font-bold uppercase tracking-wide text-gray-500">{group.title}</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {group.metrics.map((metric) => (
                    <KpiCard key={metric.key} metric={metric} icon={group.icon} chipClass={group.chipClass} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-2">
            <SectionPanel title="Cơ cấu thành viên" icon={Users} chipClass="bg-blue-50 text-blue-600">
              <SimpleBarChart data={dashboard.memberMetrics?.roleDistribution ?? []} />
            </SectionPanel>

            <SectionPanel title="Phân bố trạng thái sự kiện" icon={CalendarDays} chipClass="bg-teal-50 text-teal-600">
              <SimpleBarChart data={dashboard.eventMetrics?.statusDistribution ?? []} />
            </SectionPanel>

            <SectionPanel title="Điểm danh theo sự kiện" icon={Activity} chipClass="bg-teal-50 text-teal-600">
              <SimpleBarChart data={dashboard.attendanceMetrics?.attendanceByEvent ?? []} />
            </SectionPanel>

            <SectionPanel title="Phân bố điểm đóng góp" icon={TrendingUp} chipClass="bg-fuchsia-50 text-fuchsia-600">
              <SimpleBarChart data={dashboard.contributionMetrics?.scoreDistribution ?? []} />
            </SectionPanel>
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionPanel title="Cơ cấu điểm KPI" icon={BarChart3} chipClass="bg-[#FFF3EE] text-[#E6430A]">
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

            <SectionPanel title="So sánh học kỳ" icon={History} chipClass="bg-gray-100 text-gray-500">
              <SimpleBarChart data={comparisonChart} emptyText="Không có học kỳ trước" />
            </SectionPanel>
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-3">
            <SectionPanel title="Thành viên cần chú ý" icon={Users} chipClass="bg-amber-50 text-amber-600">
              <AttentionTable rows={dashboard.memberMetrics?.membersNeedAttention ?? []} />
            </SectionPanel>
            <SectionPanel title="Sự kiện cần chú ý" icon={Activity} chipClass="bg-amber-50 text-amber-600">
              <AttentionTable rows={dashboard.eventMetrics?.eventsNeedAttention ?? []} />
            </SectionPanel>
            <SectionPanel title="Báo cáo cần chú ý" icon={ClipboardList} chipClass="bg-amber-50 text-amber-600">
              <AttentionTable rows={dashboard.reportMetrics?.reportsNeedAttention ?? []} />
            </SectionPanel>
          </div>

          <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <SectionPanel title="Cảnh báo rủi ro" icon={ShieldAlert} chipClass="bg-red-50 text-red-600">
              <WarningList warnings={dashboard.warnings ?? []} />
            </SectionPanel>

            <SectionPanel title="Đánh giá của ICPDP" icon={Award} chipClass="bg-[#FFF3EE] text-[#E6430A]">
              <EvaluationPanel
                key={`${dashboard.latestEvaluation?.evaluationID ?? "new"}-${dashboard.suggestedDecision?.decision ?? "none"}`}
                dashboard={dashboard}
                canEdit={canEditEvaluation}
                onSave={handleSaveEvaluation}
                saving={saving}
              />
            </SectionPanel>
          </div>

          <SectionPanel title="Lịch sử đánh giá" icon={History} chipClass="bg-gray-100 text-gray-500">
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
