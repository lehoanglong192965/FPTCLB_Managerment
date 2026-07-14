import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Award, AlertCircle, Star } from 'lucide-react';
import competitionApi from '../../services/api/competitions/competitionApi';

const RANK_COLOR = {
  1: 'from-yellow-50 to-yellow-100 border-yellow-200',
  2: 'from-gray-50 to-gray-100 border-gray-200',
  3: 'from-orange-50 to-orange-100 border-orange-200',
};

const RANK_ICON_COLOR = {
  1: 'text-yellow-500',
  2: 'text-gray-500',
  3: 'text-orange-500',
};

export default function CompetitionAwardsPage() {
  const { competitionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;
    competitionApi.getAwards(competitionId)
      .then((res) => setData(res?.data ?? res))
      .catch(() => setError('Không thể tải danh sách giải thưởng.'))
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

  const title = data?.competitionTitle ?? data?.title ?? 'Giải thưởng';
  const awards = data?.awards ?? (Array.isArray(data) ? data : []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Giải Thưởng</h1>
          <p className="text-gray-500 text-sm mt-1">{title}</p>
        </div>

        {awards.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Trophy size={48} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có giải thưởng được công bố.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {awards.map((award, i) => {
              const rank = award.rank ?? i + 1;
              const gradientClass = RANK_COLOR[rank] ?? 'from-blue-50 to-blue-100 border-blue-200';
              const iconClass = RANK_ICON_COLOR[rank] ?? 'text-blue-500';
              const members = award.members ?? award.recipients ?? [];

              return (
                <div
                  key={award.clubId ?? i}
                  className={`bg-gradient-to-br ${gradientClass} border rounded-xl p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                        {rank <= 3 ? (
                          <Trophy size={26} className={iconClass} />
                        ) : (
                          <Star size={26} className={iconClass} />
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wide ${iconClass}`}>
                          Hạng #{rank}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">{award.clubName}</h2>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Tổng điểm: <strong>{award.totalScore ?? award.total ?? '–'}</strong>
                      </p>

                      {award.awardTitle && (
                        <p className="text-sm font-semibold text-gray-700 mt-2 bg-white/60 rounded-lg px-3 py-1.5 inline-block">
                          {award.awardTitle}
                        </p>
                      )}

                      {/* Award recipients (Leader/Vice) */}
                      {members.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 font-medium mb-1.5">Nhận giải thưởng:</p>
                          <div className="flex flex-wrap gap-2">
                            {members.map((m, mi) => (
                              <div
                                key={mi}
                                className="flex items-center gap-1.5 bg-white/70 rounded-lg px-3 py-1.5 text-sm"
                              >
                                <span className="font-medium text-gray-800">{m.fullName ?? m.name}</span>
                                {m.role && (
                                  <span className="text-xs text-gray-500">({m.role})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
