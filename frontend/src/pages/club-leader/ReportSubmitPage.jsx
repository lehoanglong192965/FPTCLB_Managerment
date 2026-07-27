/**
 * Trang / Component nộp báo cáo tổng kết sự kiện cho Trưởng/Phó CLB.
 * Layer: Frontend Page Component.
 * Trách nhiệm chính: Hỗ trợ 2 luồng nộp báo cáo (Tự động & Upload PDF thủ công). Hiển thị bảng tổng hợp chỉ số, cảnh báo độ sẵn sàng, cho phép nhập 6 mục nhận xét, xem trước PDF trực tiếp và nộp báo cáo chính thức.
 * Gọi API: reportApi (getAutoData, previewAuto, submitAuto, getByEventId, submitReport) và eventApi (exportRegistrations, exportAttendance).
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Upload, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Download, Eye, Sparkles, AlertTriangle, ShieldCheck, X } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState('auto'); // 'auto' | 'manual'
  const [event, setEvent] = useState(null);
  const [existing, setExisting] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [autoSnapshot, setAutoSnapshot] = useState(null);

  // Manual tab state
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);

  // Auto tab comments state
  const [comments, setComments] = useState({
    overallResult: '',
    objectiveEvaluation: '',
    challenges: '',
    financialExplanation: '',
    lessonsLearned: '',
    recommendations: '',
  });

  const [previewing, setPreviewing] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

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
        const [evRes, repRes, statisticsRes, autoDataRes] = await Promise.allSettled([
          eventApi.getEventById(eventId),
          reportApi.getByEventId(eventId),
          reportApi.getStatistics(eventId),
          reportApi.getAutoData(eventId),
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
        }

        if (autoDataRes.status === 'fulfilled') {
          setAutoSnapshot(autoDataRes.value?.data ?? autoDataRes.value);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [eventId, toast]);

  const handleCommentChange = (field, val) => {
    setComments((prev) => ({ ...prev, [field]: val }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    try {
      const isResubmit = existing?.status === 'REJECTED';
      if (isResubmit) {
        await reportApi.resubmit(eventId, { file, summary });
        toast.success('Đã nộp lại báo cáo thủ công thành công!');
      } else {
        await reportApi.submit(eventId, { file, summary });
        toast.success('Đã nộp báo cáo thủ công thành công!');
      }
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nộp báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleAutoSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setUploading(true);
    try {
      await reportApi.submitAuto(eventId, comments);
      toast.success('Đã tự động nộp báo cáo sự kiện thành công!');
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tự động nộp báo cáo thất bại. Vui lòng kiểm tra lại điều kiện.');
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (previewing) return;
    setPreviewing(true);
    try {
      const resBlob = await reportApi.previewAuto(eventId, comments);
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      const url = URL.createObjectURL(resBlob.data ?? resBlob);
      setPreviewPdfUrl(url);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tạo xem trước PDF.');
    } finally {
      setPreviewing(false);
    }
  };

  const closePreviewModal = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleExportAttendance = async () => {
    if (!eventId || exportingAttendance) return;
    setExportingAttendance(true);
    try {
      const csvData = await eventApi.exportAttendance(eventId);
      downloadCsvFile(csvData, buildEventCsvFileName(eventId, 'attendance'));
      toast.success('Đã tải CSV điểm danh.');
    } catch (err) {
      toast.error(await getDownloadErrorMessage(err, 'Không thể xuất CSV điểm danh.'));
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
      toast.error(await getDownloadErrorMessage(err, 'Không thể xuất CSV đăng ký.'));
    } finally {
      setExportingRegistrations(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-sm text-gray-400">Đang tải dữ liệu báo cáo...</div>;
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
  const readiness = autoSnapshot?.readiness;
  const autoReady = Boolean(readiness?.isReady);

  return (
    <div className={embedded ? "" : "p-6 max-w-4xl mx-auto"}>
      {!embedded && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={22} className="text-blue-600" />
          {isResubmit ? 'Nộp Lại Báo Cáo Sự Kiện' : 'Nộp Báo Cáo Tổng Kết Sự Kiện'}
        </h1>
        {event && (
          <p className="text-sm text-gray-500 mt-1">
            {event.eventName}
            {event.endDate && <> &mdash; Kết thúc: {new Date(event.endDate).toLocaleDateString('vi-VN')}</>}
          </p>
        )}
      </div>

      {/* Rejection reason banner */}
      {isResubmit && existing?.rejectionReason && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Báo cáo bị từ chối trước đó:</p>
            <p className="text-red-600 mt-0.5">{existing.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Existing status */}
      {existing && existing.status !== 'REJECTED' && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
          <RefreshCw size={15} />
          Trạng thái báo cáo hiện tại: <strong>{existing.status === 'UPLOADED' ? 'Đang chờ duyệt' : existing.status}</strong>
        </div>
      )}

      {!canSubmit && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-yellow-800">
            Chỉ được nộp báo cáo khi sự kiện đã kết thúc (Completed) hoặc báo cáo trước đó bị từ chối (Report Rejected).
          </p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('auto')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'auto'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Sparkles size={16} /> Tạo Báo Cáo Tự Động
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Upload size={16} /> Upload PDF Thủ Công
        </button>
      </div>

      {/* TAB 1: AUTOMATIC REPORT GENERATION */}
      {activeTab === 'auto' && (
        <div className="space-y-6">
          {/* Readiness Banner */}
          {autoSnapshot && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              autoReady ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {autoReady ? <ShieldCheck size={20} className="text-green-600 shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />}
              <div>
                <h4 className="font-bold text-sm">
                  {autoReady ? 'Dữ liệu sẵn sàng nộp báo cáo tự động' : 'Dữ liệu chưa đủ điều kiện tự động nộp báo cáo'}
                </h4>
                <p className="text-xs mt-1">
                  {autoReady
                    ? 'Hệ thống đã tổng hợp đầy đủ số liệu đăng ký, điểm danh và tài chính. Bạn có thể nhập nhận xét, xem trước PDF và nộp ngay.'
                    : 'Vui lòng kiểm tra các cảnh báo chặn dưới đây (ví dụ: cần đóng tất cả phiên điểm danh và xử lý các giao dịch chờ thanh toán).'}
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Summary Grid */}
          {autoSnapshot && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <span className="text-xs font-medium text-gray-500 uppercase">Đăng ký hợp lệ</span>
                <div className="text-xl font-bold text-gray-900 mt-1">{autoSnapshot.registrations?.confirmedRegistrations ?? 0}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <span className="text-xs font-medium text-gray-500 uppercase">Tham dự thực tế</span>
                <div className="text-xl font-bold text-gray-900 mt-1">{autoSnapshot.attendance?.presentParticipants ?? 0}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <span className="text-xs font-medium text-gray-500 uppercase">Tỷ lệ tham dự</span>
                <div className="text-xl font-bold text-blue-600 mt-1">{autoSnapshot.attendance?.attendanceRate ?? 0}%</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                <span className="text-xs font-medium text-gray-500 uppercase">Thực thu tài chính</span>
                <div className="text-xl font-bold text-green-600 mt-1">
                  {autoSnapshot.payments?.totalAmountPaid ?? 0} {autoSnapshot.event?.currency ?? 'VND'}
                </div>
              </div>
            </div>
          )}

          {/* System Data Warnings Table */}
          {autoSnapshot?.warnings && autoSnapshot.warnings.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Cảnh Báo Dữ Liệu Hệ Thống ({autoSnapshot.warnings.length})
              </h3>
              <div className="divide-y divide-gray-100">
                {autoSnapshot.warnings.map((w, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className={`font-semibold px-2 py-0.5 rounded mr-2 ${
                        w.severity === 'BLOCKING' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {w.severity}
                      </span>
                      <strong className="text-gray-800">{w.title}:</strong> <span className="text-gray-600">{w.description}</span>
                    </div>
                    <span className="text-gray-500 font-medium">SL: {w.affectedCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leader Comments Form */}
          <form onSubmit={handleAutoSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              Nhận Xét & Đánh Giá Của Ban Tổ Chức (Dành cho PDF Báo Cáo)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">1. Kết quả nổi bật sự kiện</label>
              <textarea
                rows={3}
                maxLength={3000}
                value={comments.overallResult}
                onChange={(e) => handleCommentChange('overallResult', e.target.value)}
                placeholder="Tóm tắt điểm nổi bật, quy mô, phản hồi tích cực..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">2. Mức độ đạt mục tiêu đề ra</label>
              <textarea
                rows={2}
                maxLength={3000}
                value={comments.objectiveEvaluation}
                onChange={(e) => handleCommentChange('objectiveEvaluation', e.target.value)}
                placeholder="Đánh giá mức độ đạt được so với mục tiêu trong bản đề xuất..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">3. Khó khăn & Vấn đề phát sinh</label>
              <textarea
                rows={2}
                maxLength={3000}
                value={comments.challenges}
                onChange={(e) => handleCommentChange('challenges', e.target.value)}
                placeholder="Những khó khăn về nhân sự, thời gian, kỹ thuật..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">4. Giải trình tài chính / Chi phí</label>
              <textarea
                rows={2}
                maxLength={3000}
                value={comments.financialExplanation}
                onChange={(e) => handleCommentChange('financialExplanation', e.target.value)}
                placeholder="Giải trình thực thu so với ngân sách dự kiến..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">5. Bài học kinh nghiệm & Đề xuất cải tiến</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={comments.lessonsLearned}
                  onChange={(e) => handleCommentChange('lessonsLearned', e.target.value)}
                  placeholder="Bài học kinh nghiệm..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={comments.recommendations}
                  onChange={(e) => handleCommentChange('recommendations', e.target.value)}
                  placeholder="Đề xuất cho các sự kiện tiếp theo..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleExportRegistrations}
                disabled={!eventId || exportingRegistrations}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5"
              >
                <Download size={14} /> {exportingRegistrations ? 'Đang xuất...' : 'Xuất CSV đăng ký'}
              </button>
              <button
                type="button"
                onClick={handleExportAttendance}
                disabled={!eventId || exportingAttendance}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1.5"
              >
                <Download size={14} /> {exportingAttendance ? 'Đang xuất...' : 'Xuất CSV điểm danh'}
              </button>
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={previewing}
                className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Eye size={14} /> {previewing ? 'Đang tạo PDF...' : 'Xem trước PDF Báo Cáo'}
              </button>

              <button
                type="submit"
                disabled={uploading || !canSubmit || !autoReady}
                className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
              >
                {uploading ? (
                  <>Đang xử lý nộp...</>
                ) : (
                  <><Sparkles size={14} /> {isResubmit ? 'Nộp lại báo cáo tự động' : 'Nộp Báo Cáo Tự Động'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANUAL PDF UPLOAD */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <EventReportStatisticsPanel statistics={statistics} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File báo cáo thủ công (PDF) *</label>
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
                  <p className="text-sm text-gray-500">Click để chọn file PDF báo cáo hoặc kéo thả vào đây</p>
                  <p className="text-xs text-gray-400 mt-1">Dung lượng tối đa: 10MB</p>
                </div>
              )}
              <input type="file" className="hidden" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt ngắn báo cáo</label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Mô tả tóm tắt nội dung báo cáo thủ công..."
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!file || uploading || !canSubmit}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-2"
            >
              {uploading ? 'Đang nộp...' : isResubmit ? 'Nộp lại báo cáo thủ công' : 'Nộp báo cáo thủ công'}
            </button>
          </div>
        </form>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText size={18} className="text-blue-400" /> Xem Trước PDF Báo Cáo Tự Động
              </h3>
              <button onClick={closePreviewModal} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-gray-100">
              <iframe src={previewPdfUrl} className="w-full h-full border-none" title="PDF Report Preview" />
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button onClick={closePreviewModal} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-xs rounded-lg">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
