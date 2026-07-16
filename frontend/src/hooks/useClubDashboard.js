import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dashboardApi from "../services/api/clubs/dashboardApi";
import clubApi from "../services/api/clubs/clubApi";
import semesterApi from "../services/api/admin/semesterApi";
import { TokenService } from "../services/api/axiosClient";
import { translateApiMessage } from "../utils/dashboardTranslations";

function normalizeClub(raw) {
  return {
    value: raw.clubID ?? raw.clubId ?? raw.id,
    label: raw.clubName ?? raw.name ?? raw.abbr ?? "CLB",
    status: raw.clubStatus ?? raw.status ?? "",
  };
}

function normalizeSemester(raw) {
  return {
    semesterID: raw.semesterID ?? raw.semesterId ?? raw.id,
    semesterCode: raw.semesterCode ?? raw.code ?? "Học kỳ",
    startDate: raw.startDate,
    endDate: raw.endDate,
    isActive: raw.isActive,
  };
}

export function useClubDashboard(userRole) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clubs, setClubs] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const forcedClubId = ["CLUB_LEADER", "VICE_LEADER"].includes(userRole)
    ? TokenService.getClubId()
    : null;

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([clubApi.getAll(), semesterApi.getAll()])
      .then(([clubResult, semesterResult]) => {
        if (cancelled) return;
        const rawClubs = clubResult.status === "fulfilled"
          ? Array.isArray(clubResult.value) ? clubResult.value : (clubResult.value?.data ?? clubResult.value?.content ?? [])
          : [];
        const rawSemesters = semesterResult.status === "fulfilled"
          ? Array.isArray(semesterResult.value) ? semesterResult.value : (semesterResult.value?.data ?? semesterResult.value?.content ?? [])
          : [];
        setClubs(rawClubs.map(normalizeClub).filter((club) => club.value));
        setSemesters(rawSemesters.map(normalizeSemester).filter((semester) => semester.semesterID));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setError("Không thể tải bộ lọc dashboard.");
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const activeSemesterId = useMemo(
    () => semesters.find((semester) => semester.isActive)?.semesterID ?? semesters[0]?.semesterID ?? null,
    [semesters]
  );

  const selectedClubId = useMemo(() => {
    if (forcedClubId) return forcedClubId;
    const queryClubId = Number(searchParams.get("clubId"));
    return Number.isFinite(queryClubId) && queryClubId > 0
      ? queryClubId
      : clubs[0]?.value ?? null;
  }, [clubs, forcedClubId, searchParams]);

  const selectedSemesterId = useMemo(() => {
    const querySemesterId = Number(searchParams.get("semesterId"));
    return Number.isFinite(querySemesterId) && querySemesterId > 0
      ? querySemesterId
      : activeSemesterId;
  }, [activeSemesterId, searchParams]);

  const setFilters = useCallback((next) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next.clubId) params.set("clubId", String(next.clubId));
      if (next.semesterId) params.set("semesterId", String(next.semesterId));
      return params;
    });
  }, [setSearchParams]);

  const fetchDashboard = useCallback(async () => {
    if (!selectedClubId || metaLoading) return;
    setLoading(true);
    setError("");
    try {
      const params = selectedSemesterId ? { semesterId: selectedSemesterId } : undefined;
      const data = await dashboardApi.getDashboard(selectedClubId, params);
      setDashboard(data);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError(translateApiMessage(err?.response?.data?.message ?? err?.message ?? "Cannot load dashboard."));
    } finally {
      setLoading(false);
    }
  }, [metaLoading, selectedClubId, selectedSemesterId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchDashboard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboard]);

  return {
    clubs: dashboard?.availableClubs?.length ? dashboard.availableClubs : clubs,
    semesters: dashboard?.availableSemesters?.length ? dashboard.availableSemesters : semesters,
    dashboard,
    selectedClubId,
    selectedSemesterId,
    forcedClubId,
    loading: loading || metaLoading,
    error,
    setFilters,
    refresh: fetchDashboard,
  };
}
