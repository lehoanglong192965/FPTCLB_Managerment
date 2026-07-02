import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Calculator, Send, Lock } from 'lucide-react';
import { MOCK_COMPETITIONS, MOCK_COMPETITION_SCORES } from '../../constants/mockData';

// TODO Sprint 8: thay bằng competitionService.getById(competitionId)

const STATUS_BADGE = {
  Draft:     'bg-gray-100 text-gray-600',
  Approved:  'bg-blue-100 text-blue-700',
  Published: 'bg-green-100 text-green-700',
  Closed:    'bg-red-100 text-red-600',
};

export default function IcpdpCompetitionDetail() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const data = { ...MOCK_COMPETITIONS[0], scores: MOCK_COMPETITION_SCORES };

  const SCORE_COLS = [
    { key: 'activity',      label: 'Hoạt động (25đ)' },
    { key: 'feedback',      label: 'Phản hồi (20đ)' },
    { key: 'participation', label: 'Tham gia (15đ)' },
    { key: 'engagement',    label: 'Gắn kết (25đ)' },
    { key: 'compliance',    label: 'Tuân thủ (15đ)' },
  ];

  return (
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate('/icpdp/competition')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Danh sách cuộc thi
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={24} className="text-yellow-500" />
            {data.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{data.semester}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE[data.status]}`}>
          {data.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => alert('[Sprint 8] Tính điểm')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Calculator size={15} /> Tính điểm
        </button>
        <button
          onClick={() => alert('[Sprint 8] Phê duyệt')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send size={15} /> Phê duyệt & Công bố
        </button>
        <button
          onClick={() => alert('[Sprint 8] Khoá cuộc thi')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <Lock size={15} /> Khoá
        </button>
      </div>

      {/* Score table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
            {data.scores.map((row, i) => (
              <tr key={row.clubId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
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
                    {row[c.key]}
                  </td>
                ))}
                <td className="text-center px-4 py-3 font-bold text-gray-900">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
