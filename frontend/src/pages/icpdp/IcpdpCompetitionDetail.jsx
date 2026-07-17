import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Calculator, CheckCircle2, Send, Lock, Eye, RefreshCw } from 'lucide-react';
import competitionApi from '../../services/api/competitions/competitionApi';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';

const STATUS_BADGE = {
  DRAFT:      'bg-gray-100 text-gray-600',
  CALCULATED: 'bg-yellow-100 text-yellow-700',
  APPROVED:   'bg-blue-100 text-blue-700',
  PUBLISHED:  'bg-green-100 text-green-700',
  REJECTED:   'bg-red-100 text-red-600',
  OPEN:       'bg-cyan-100 text-cyan-700',
  CLOSED:     'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  DRAFT:      'Nháp',
  CALCULATED: 'Đã tính điểm',
  APPROVED:   'Đã duyệt',
  PUBLISHED:  'Đã công bố',
  REJECTED:   'Bị từ chối',
  OPEN:       'Đang mở',
  CLOSED:     'Đã kết thúc',
};

const SCORE_COLS = [
  { key: 'activityScore',      label: 'Hoạt động (25đ)' },
  { key: 'feedbackScore',      label: 'Phản hồi (20đ)' },
  { key: 'participationScore', label: 'Tham gia (15đ)' },
  { key: 'engagementScore',    label: 'Gắn kết (25đ)' },
  { key: 'complianceScore',    label: 'Tuân thủ (15đ)' },
];

export default function IcpdpCompetitionDetail() {
  const confirm = useConfirm();
  const toast = useToast();
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    competitionApi.getById(competitionId)
      .then((res) => setData(res?.data ?? res))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        toast.error(err?.response?.data?.message ?? 'Không thể tải thông tin cuộc thi.');
      })
      .finally(() => setLoading(false));
  }, [competitionId, toast]);

  useEffect(load, [load]);

  const doAction = async (action, confirmMsg, fn) => {
    if (!(await confirm(confirmMsg))) return;
    setActing(action);
    try {
      await fn();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Có lỗi xảy ra.');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="p-6 text-center text-sm text-gray-400">Đang tải...</div>;
  if (!data) return <div className="p-6 text-sm text-red-500">Không tìm thấy cuộc thi.</div>;

  const scores = data.scores ?? data.clubScores ?? [];
  const status = data.status;

  return (
    <div className="p-6 max-w-5xl">
      <button
        onClick={() => navigate('/icpdp/competition')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Danh sách cuộc thi
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={24} className="text-yellow-500" />
            {data.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{data.semester ?? data.semesterId}</p>
          {data.description && <p className="text-sm text-gray-400 mt-0.5">{data.description}</p>}
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {/* Action buttons — conditioned on status */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(status === 'DRAFT' || status === 'CALCULATED') && (
          <button
            disabled={acting === 'calculate'}
            onClick={() => doAction('calculate', 'Tính điểm cho tất cả CLB? Hành động này sẽ ghi đè kết quả cũ.', () => competitionApi.calculate(competitionId))}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {acting === 'calculate' ? <RefreshCw size={15} className="animate-spin" /> : <Calculator size={15} />}
            {acting === 'calculate' ? 'Đang tính...' : 'Tính điểm'}
          </button>
        )}

        {status === 'CALCULATED' && (
          <button
            disabled={acting === 'approve'}
            onClick={() => doAction('approve', 'Phê duyệt kết quả tính điểm?', () => competitionApi.approve(competitionId))}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <CheckCircle2 size={15} />
            {acting === 'approve' ? 'Đang duyệt...' : 'Phê duyệt kết quả'}
          </button>
        )}

        {status === 'APPROVED' && (
          <button
            disabled={acting === 'publish'}
            onClick={() => doAction('publish', 'Công bố kết quả? Thành viên sẽ nhận được thông báo.', () => competitionApi.publish(competitionId))}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Send size={15} />
            {acting === 'publish' ? 'Đang công bố...' : 'Công bố kết quả'}
          </button>
        )}

        {(status === 'PUBLISHED') && (
          <>
            <button
              onClick={() => navigate(`/competitions/${competitionId}/ranking`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Eye size={15} /> Xem bảng xếp hạng công khai
            </button>
            <button
              disabled={acting === 'close'}
              onClick={() => doAction('close', 'Khoá cuộc thi? Hành động không thể hoàn tác.', () => competitionApi.close(competitionId))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Lock size={15} />
              {acting === 'close' ? 'Đang khoá...' : 'Khoá cuộc thi'}
            </button>
          </>
        )}
      </div>

      {/* Score table */}
      {scores.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hạng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Câu lạc bộ</th>
                {SCORE_COLS.map((c) => (
                  <th key={c.key} className="text-center px-3 py-3 font-semibold text-gray-600">
                    {c.label}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Tổng (100đ)</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row, i) => (
                <tr key={row.clubId ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3">
                    {row.rank <= 3 ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        row.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        row.rank === 2 ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        #{row.rank}
                      </span>
                    ) : (
                      <span className="text-gray-500">#{row.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.clubName}</td>
                  {SCORE_COLS.map((c) => (
                    <td key={c.key} className="text-center px-3 py-3 text-gray-600">
                      {row[c.key] ?? '–'}
                    </td>
                  ))}
                  <td className="text-center px-4 py-3 font-bold text-gray-900">{row.totalScore ?? row.total ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Calculator size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có điểm. Nhấn "Tính điểm" để bắt đầu.</p>
        </div>
      )}
    </div>
  );
}
