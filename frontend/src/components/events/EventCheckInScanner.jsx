import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Search, User, Users, XCircle } from "lucide-react";
import attendanceApi from "../../services/api/attendance/attendanceApi";
import QrCheckInPanel from "./QrCheckInPanel";

function ResultBanner({ result }) {
  if (!result) return null;
  return (
    <div className={`mt-4 flex items-center gap-3 rounded-xl border p-4 ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role={result.success ? "status" : "alert"}>
      {result.success ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
      <div>
        <p className="font-semibold">{result.success ? "Điểm danh thành công" : "Điểm danh thất bại"}</p>
        {result.success ? (
          <>
            <p className="text-sm">{result.name}</p>
            {result.studentId && <p className="text-sm">{result.studentId}</p>}
          </>
        ) : (
          <p className="text-sm">{result.message}</p>
        )}
      </div>
    </div>
  );
}

export default function EventCheckInScanner({ eventId, sessionId, sessionStatus }) {
  const [mode, setMode] = useState("qr");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [checkingKey, setCheckingKey] = useState(null);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [listSearch, setListSearch] = useState("");
  const searchTimeout = useRef(null);

  const fetchSummary = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await attendanceApi.getSessionSummary(sessionId);
      setSummary(response?.data ?? response);
    } catch {
      setSummary(null);
    }
  }, [sessionId]);

  useEffect(() => { void fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    if (!query.trim() || !sessionId || mode !== "manual") {
      setParticipants([]);
      return undefined;
    }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await attendanceApi.searchParticipants(sessionId, query.trim());
        setParticipants(Array.isArray(response) ? response : response?.data ?? response?.content ?? []);
      } catch {
        setParticipants([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [eventId, mode, query, sessionId]);

  if (sessionStatus !== "OPEN") {
    return <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center text-sm text-yellow-700">Phiên điểm danh này đã đóng. Hãy mở phiên trước khi điểm danh người tham gia.</div>;
  }

  const showSuccess = (payload, fallbackName) => {
    setResult({
      success: true,
      name: payload?.fullName ?? payload?.participantName ?? fallbackName ?? "Người tham gia",
      studentId: payload?.studentId,
      participantType: payload?.participantType
    });
  };

  const handleManualCheckIn = async (participant) => {
    const guestRegistrationId = participant.guestRegistrationId ?? participant.guestRegistrationID;
    const registrationId = guestRegistrationId ?? participant.registrationId ?? participant.id;
    const participantKey = participant.participantKey ?? (guestRegistrationId ? "guest-" + guestRegistrationId : "fptu-" + registrationId);
    setCheckingKey(participantKey);
    setResult(null);
    try {
      const response = await attendanceApi.checkIn(sessionId, { registrationId: guestRegistrationId ? undefined : registrationId, guestRegistrationId, verificationMethod: "MANUAL" });
      showSuccess(response?.data ?? response, participant.fullName ?? participant.name);
      setQuery("");
      setParticipants([]);
      void fetchSummary();
    } catch (error) {
      setResult({ success: false, message: error?.response?.data?.message ?? "Không thể điểm danh người tham gia này." });
    } finally {
      setCheckingKey(null);
    }
  };

  const handleQrTicketCheckIn = async (ticketCode) => {
    setCheckingKey("qr-ticket");
    setResult(null);
    try {
      const response = await attendanceApi.checkIn(sessionId, { verificationMethod: "QR_TICKET", verificationValue: ticketCode });
      const payload = response?.data ?? response;
      showSuccess(payload);
      void fetchSummary();
      return payload;
    } catch (error) {
      const message = error?.response?.data?.message ?? "Không thể điểm danh vé này.";
      setResult({ success: false, message });
      throw error;
    } finally {
      setCheckingKey(null);
    }
  };

  const checkedIn = (summary?.records ?? []).filter((record) => (record.status ?? record.attendanceStatus) === "PRESENT");
  const checkedInKeys = new Set(checkedIn.map((record) => record.participantKey).filter(Boolean));
  const visibleCheckedIn = checkedIn.filter((record) => {
    const value = listSearch.toLowerCase();
    return (record.fullName ?? record.name ?? "").toLowerCase().includes(value) || (record.studentId ?? "").toLowerCase().includes(value);
  });

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-blue-50 p-4 text-center"><p className="text-2xl font-bold text-blue-700">{summary.totalRegistered ?? "-"}</p><p className="mt-1 text-xs text-blue-600">Đã đăng ký</p></div>
          <div className="rounded-xl bg-green-50 p-4 text-center"><p className="text-2xl font-bold text-green-700">{summary.totalCheckedIn ?? 0}</p><p className="mt-1 text-xs text-green-600">Đã điểm danh</p></div>
          <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-2xl font-bold text-gray-700">{summary.totalAbsent ?? "-"}</p><p className="mt-1 text-xs text-gray-500">Vắng mặt</p></div>
        </div>
      )}

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex gap-2 border-b border-gray-200">
          <button type="button" onClick={() => { setMode("qr"); setResult(null); }} className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${mode === "qr" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-blue-700"}`}>Quét vé QR</button>
          <button type="button" onClick={() => { setMode("manual"); setResult(null); }} className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${mode === "manual" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-blue-700"}`}>Tìm kiếm thủ công</button>
        </div>

        {mode === "qr" ? (
          <><QrCheckInPanel onTicketRead={handleQrTicketCheckIn} /><ResultBanner result={result} /></>
        ) : (
          <>
            <h3 className="border-b pb-3 text-lg font-bold text-gray-800">Điểm danh thủ công</h3>
            <p className="mb-5 mt-2 text-sm text-gray-500">Tìm kiếm theo tên, mã số sinh viên hoặc số điện thoại.</p>
            <div className="relative mx-auto max-w-2xl">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setResult(null); }} placeholder="Nhập từ khóa tìm kiếm người tham gia..." className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-base outline-none shadow-sm focus:ring-2 focus:ring-blue-400" />
              {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Đang tìm...</span>}
            </div>

            {participants.length > 0 && (
              <div className="mx-auto mt-3 max-w-2xl divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                {participants.map((participant) => {
                  const guestRegistrationId = participant.guestRegistrationId ?? participant.guestRegistrationID;
                  const registrationId = guestRegistrationId ?? participant.registrationId ?? participant.id;
                  const participantKey = participant.participantKey ?? (guestRegistrationId ? "guest-" + guestRegistrationId : "fptu-" + registrationId);
                  const alreadyCheckedIn = checkedInKeys.has(participantKey);
                  return (
                    <div key={participantKey} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100"><User size={16} className="text-blue-600" /></div><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-900">{participant.fullName ?? participant.name}</p><p className="text-xs text-gray-500">{participant.studentId ?? participant.phone ?? "-"}</p></div></div>
                      {alreadyCheckedIn ? <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">Đã điểm danh</span> : <button type="button" onClick={() => { void handleManualCheckIn(participant); }} disabled={checkingKey === participantKey} className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{checkingKey === participantKey ? "..." : "Điểm danh"}</button>}
                    </div>
                  );
                })}
              </div>
            )}
            {query.trim() && !searching && participants.length === 0 && <p className="mt-4 text-center text-sm text-gray-400">Không tìm thấy thông tin đăng ký phù hợp.</p>}
            <ResultBanner result={result} />
          </>
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-gray-800"><Users size={18} className="text-blue-600" /> Danh sách đã điểm danh</h3><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">{checkedIn.length}</span></div>
        <div className="relative mb-4 max-w-xs"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={listSearch} onChange={(event) => setListSearch(event.target.value)} placeholder="Lọc danh sách đã điểm danh..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white" /></div>
        {visibleCheckedIn.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">Chưa có người tham gia nào được điểm danh.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-2">#</th><th className="px-4 py-2">Họ tên</th><th className="px-4 py-2">MSSV / Email</th></tr></thead><tbody>{visibleCheckedIn.map((record, index) => <tr key={record.participantKey ?? record.recordId ?? index} className="border-t border-gray-100"><td className="px-4 py-3 text-gray-400">{index + 1}</td><td className="px-4 py-3 font-medium text-gray-800">{record.fullName ?? record.name ?? "-"}</td><td className="px-4 py-3 font-mono text-gray-600">{record.studentId ?? record.email ?? "-"}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
