import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Medal, AlertCircle } from 'lucide-react';
import competitionService from '../../services/api/competitions/competitionService';

const RANK_STYLE = {
  1: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  2: 'bg-gray-100 text-gray-600 border-gray-200',
  3: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function CompetitionRankingPage() {
  const { competitionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;
    competitionService.getPublicRanking(competitionId)
      .then((res) => setData(res?.data ?? res))
      .catch(() => setError('Không thể tải bảng xếp hạng.'))
      .finally(() => setLoading(false));
  }, [competitionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const title = data?.title ?? 'Bảng xếp hạng CLB';
  const semester = data?.semester ?? data?.semesterId ?? '';
  const rankings = data?.rankings ?? data?.scores ?? data?.clubScores ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {semester && <p className="text-gray-500 text-sm mt-1">{semester}</p>}
          <p className="text-sm text-green-600 font-medium mt-2">Kết quả chính thức</p>
        </div>

        {/* Podium top 3 */}
        {rankings.length >= 1 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 2nd */}
            {rankings[1] && (
              <div className="text-center w-28">
                <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center mx-auto mb-2">
                  <Medal size={24} className="text-gray-500" />
                </div>
                <p className="font-semibold text-sm text-gray-800 truncate">{rankings[1].clubName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{rankings[1].totalScore ?? rankings[1].total ?? '–'}đ</p>
                <div className="h-16 bg-gray-100 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-500">#2</span>
                </div>
              </div>
            )}
            {/* 1st */}
            <div className="text-center w-32">
              <div className="w-20 h-20 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center mx-auto mb-2">
                <Trophy size={28} className="text-yellow-500" />
              </div>
              <p className="font-bold text-sm text-gray-900 truncate">{rankings[0].clubName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{rankings[0].totalScore ?? rankings[0].total ?? '–'}đ</p>
              <div className="h-24 bg-yellow-100 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">#1</span>
              </div>
            </div>
            {/* 3rd */}
            {rankings[2] && (
              <div className="text-center w-28">
                <div className="w-16 h-16 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center mx-auto mb-2">
                  <Medal size={24} className="text-orange-500" />
                </div>
                <p className="font-semibold text-sm text-gray-800 truncate">{rankings[2].clubName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{rankings[2].totalScore ?? rankings[2].total ?? '–'}đ</p>
                <div className="h-10 bg-orange-100 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-600">#3</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full ranking table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Bảng xếp hạng đầy đủ</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-center w-16 px-4 py-3 font-semibold text-gray-600">Hạng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Câu lạc bộ</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Tổng điểm</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, i) => (
                <tr key={row.clubId ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                  <td className="text-center px-4 py-3">
                    {row.rank <= 3 ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${RANK_STYLE[row.rank]}`}>
                        #{row.rank}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">#{row.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.clubName}</td>
                  <td className="text-center px-4 py-3 font-bold text-gray-900">
                    {row.totalScore ?? row.total ?? '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rankings.length === 0 && (
            <p className="text-center py-10 text-gray-400 text-sm">Chưa có dữ liệu xếp hạng.</p>
          )}
        </div>
      </div>
    </div>
  );
}
