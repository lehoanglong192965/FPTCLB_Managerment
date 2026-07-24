import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Upload, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import reportApi from '../../services/api/report/reportApi';
import eventApi from '../../services/api/events/eventApi';
import { buildEventCsvFileName, downloadCsvFile, getDownloadErrorMessage } from '../../utils/csvDownload';
import { useToast } from '../../contexts/ToastContext';
import EventReportStatisticsPanel from '../../components/EventReportStatisticsPanel';

export default function ReportSubmitPage({ eventId: eventIdProp, embedded = false, onSubmitted } = {}) {
  const { eventId: eventIdParam } = useParams();
  const eventId = eventIdProp ?? eventIdParam;
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [existing, setExisting] = useState(null); // existing report if any
  const [statistics, setStatistics] = useState(null);
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportingAttendance, setExportingAttendance] = useState(false);
  const [exportingRegistrations, setExportingRegistrations] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [evRes, repRes, statisticsRes] = await Promise.allSettled([
          eventApi.getEventById(eventId),
          reportApi.getByEventId(eventId),
          reportApi.getStatistics(eventId),
        ]);
        if (cancelled) return;
        if (evRes.status === 'fulfilled') {
          setEvent(evRes.value?.data ?? evRes.value);
        } else if (evRes.reason?.code !== 'ERR_CANCELED' && evRes.reason?.name !== 'CanceledError') {
          toast.error('Không thể tải thông tin sự kiện.');
        }
        if (repRes.status === 'fulfilled') {
          const rep = repRes.value?.data ?? repRes.value;
          if (rep) {
            setExisting(rep);
            setSummary(rep.summary || '');
          }
        }
        if (statisticsRes.status === 'fulfilled') {
          setStatistics(statisticsRes.value?.data ?? statisticsRes.value);
        } else if (statisticsRes.reason?.code !== 'ERR_CANCELED' && statisticsRes.reason?.name !== 'CanceledError') {
          toast.error('Không thể tải dữ liệu tổng hợp của sự kiện.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [eventId, toast]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    try {
      const isResubmit = existing?.status === 'REJECTED';
      if (isResubmit) {
        await reportApi.resubmit(eventId, { file, summary });
        toast.success('Đã nộp lại báo cáo thành công!');
      } else {
        await reportApi.submit(eventId, { file, summary });
        toast.success('Đã nộp báo cáo thành công!');
      }
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nộp báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleExportAttendance = async () => {
    if (!eventId || exportingAttendance) return;

    setExportingAttendance(true);
    try {
      const csvData = await eventApi.exportAttendance(eventId);
      downloadCsvFile(csvData, buildEventCsvFileName(eventId, 'attendance'));
      toast.success('\u0110\u00e3 t\u1ea3i CSV \u0111i\u1ec3m danh.');
    } catch (err) {
      toast.error(await getDownloadErrorMessage(
        err,
        'Kh\u00f4ng th\u1ec3 xu\u1ea5t CSV \u0111i\u1ec3m danh.',
      ));
    } finally {
      setExportingAttendance(false);
    }
  };

  const handleExportRegistrations = async () => {
    if (!eventId || exportingRegistrations) return;

    setExportingRegistrations(true);
    try {
      const csvData = await eventApi.exportRegistrations(eventId);
      downloadCsvFile(csvData, buildEventCsvFileName(eventId, 'registrations'));
      toast.success('Đã tải CSV đăng ký.');
    } catch (err) {
      toast.error(await getDownloadErrorMessage(
        err,
        'Không thể xuất CSV đăng ký.',
      ));
    } finally {
      setExportingRegistrations(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-sm text-gray-400">Đang tải...</div>;
  }

  if (submitted) {
    return (
      <div className={embedded ? "flex items-center justify-center py-16" : "p-6 flex items-center justify-center min-h-[60vh]"}>
        <div className="text-center">
          <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Nộp báo cáo thành công!</h2>
          <p className="text-gray-500 text-sm mt-2">ICPDP sẽ xem xét và phê duyệt báo cáo của bạn.</p>
          {!embedded && (
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Về quản lý sự kiện
            </button>
          )}
        </div>
      </div>
    );
  }

  const isResubmit = existing?.status === 'REJECTED';
  const isCompleted = event?.status === 'COMPLETED' || event?.eventStatus === 'COMPLETED';
  const canSubmit = isCompleted || isResubmit;
  const dataReadyToSubmit = Boolean(statistics)
    && statistics.attendanceSessionsClosed
    && Number(statistics.pendingPaymentCount ?? 0) === 0;

  return (
    <div className={embedded ? "" : "p-6 max-w-2xl"}>
      {embedded ? (
        <p className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-1.5 m-0">
          <FileText size={16} className="text-blue-600" /> {isResubmit ? 'Nộp lại báo cáo' : 'Nộp báo cáo sự kiện'}
        </p>
      ) : (<>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={22} className="text-blue-600" />
            {isResubmit ? 'Nộp Lại Báo Cáo' : 'Nộp Báo Cáo Sự Kiện'}
          </h1>
          {event && (
            <p className="text-sm text-gray-500 mt-1">
              {event.eventName}
              {event.endDate && (
                <> &mdash; Kết thúc: {new Date(event.endDate).toLocaleDateString('vi-VN')}</>
              )}
            </p>
          )}
        </div>
      </>)}

      {/* Rejection reason banner */}
      {isResubmit && existing?.rejectionReason && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Báo cáo bị từ chối:</p>
            <p className="text-red-600 mt-0.5">{existing.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Status of existing report */}
      {existing && existing.status !== 'REJECTED' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
          <RefreshCw size={15} />
          Báo cáo hiện tại: <strong>{existing.status === 'UPLOADED' ? 'Đang chờ duyệt' : existing.status}</strong>
        </div>
      )}

      {event && !canSubmit && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-yellow-800">
            Chỉ được nộp báo cáo khi sự kiện đã kết thúc (Completed) hoặc báo cáo trước đó bị từ chối (Report Rejected).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <EventReportStatisticsPanel statistics={statistics} />

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File báo cáo (PDF) *
          </label>
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
            {file ? (
              <div className="text-center">
                <FileText size={32} className="text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click để chọn file hoặc kéo thả vào đây</p>
                <p className="text-xs text-gray-400 mt-1">PDF — tối đa 10MB</p>
              </div>
            )}
            <input type="file" className="hidden" accept=".pdf,application/pdf" onChange={handleFileChange} />
          </label>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt báo cáo</label>
          <textarea
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Mô tả ngắn về kết quả, số người tham gia, điểm nổi bật của sự kiện..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportRegistrations}
            disabled={!eventId || exportingRegistrations}
            className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={15} />
            {exportingRegistrations
              ? 'Đang xuất...'
              : 'Xuất CSV đăng ký'}
          </button>
          <button
            type="button"
            onClick={handleExportAttendance}
            disabled={!eventId || exportingAttendance}
            className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={15} />
            {exportingAttendance
              ? '\u0110ang xu\u1ea5t...'
              : 'Xu\u1ea5t CSV \u0111i\u1ec3m danh'}
          </button>
          <button
            type="submit"
            disabled={!file || uploading || !canSubmit || !dataReadyToSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <><i className="fas fa-spinner fa-spin" /> Đang nộp...</>
            ) : (
              <><Upload size={15} /> {isResubmit ? 'Nộp lại báo cáo' : 'Nộp báo cáo'}</>
            )}
          </button>
          {!embedded && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Huỷ
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
