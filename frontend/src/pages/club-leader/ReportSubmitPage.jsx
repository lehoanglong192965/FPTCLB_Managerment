import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';

// Mock — thay bằng reportService.getByEventId(eventId) trong Sprint 6
const MOCK_EVENT = {
  eventId: 1,
  eventName: 'Hackathon FPT 2026 – Build The Future',
  endDate: '15/08/2026',
  status: 'Completed',
};

export default function ReportSubmitPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    // TODO Sprint 6: reportService.submit(eventId, { file, summary })
    setTimeout(() => {
      setUploading(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Nộp báo cáo thành công!</h2>
          <p className="text-gray-500 text-sm mt-2">ICPDP sẽ xem xét và phê duyệt báo cáo của bạn.</p>
          <button
            onClick={() => navigate('/club-leader/events')}
            className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Về quản lý sự kiện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/club-leader/events')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Quản lý sự kiện
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={22} className="text-blue-600" />
          Nộp Báo Cáo Sự Kiện
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {MOCK_EVENT.eventName} &mdash; Kết thúc: {MOCK_EVENT.endDate}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File báo cáo (PDF/DOCX) *
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
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX — tối đa 10MB</p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tóm tắt báo cáo
          </label>
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
            type="submit"
            disabled={!file || uploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <><i className="fas fa-spinner fa-spin" /> Đang nộp...</>
            ) : (
              <><Upload size={15} /> Nộp báo cáo</>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/club-leader/events')}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
