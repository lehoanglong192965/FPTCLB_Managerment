import { useState, useEffect } from "react";
import { Star, Calendar, Loader2 } from "lucide-react";
import clubService from "../../services/api/clubs/clubService";

const COLORS = ["#1d4ed8", "#059669", "#7c3aed", "#9a3412", "#0284c7"];

export default function AlumniClubs() {
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clubService.getMyClubs()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? res?.clubs ?? []);
        setClubs(list.map((c, i) => ({
          id:      c.clubId   ?? c.id,
          name:    c.clubName ?? c.name ?? "—",
          tag:     c.category ?? c.type ?? "CLB",
          color:   COLORS[i % COLORS.length],
          period:  c.joinPeriod ?? (c.joinedDate ? `${new Date(c.joinedDate).getFullYear()}` : ""),
          role:    c.clubRoleName ?? c.roleName ?? "Thành viên",
        })));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Câu Lạc Bộ Cũ</h1>
        <p className="page-subtitle">Các CLB bạn từng tham gia tại FPTU</p>
      </div>

      <div className="content-card">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
            <Star size={40} strokeWidth={1.2} />
            <p className="text-[13px] m-0">Chưa có dữ liệu CLB</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {clubs.map((club) => (
              <div key={club.id} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[#f0f0f0] bg-white">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ background: club.color + "18" }}
                >
                  🏫
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 m-0 mb-0.5">{club.name}</p>
                  {club.period && (
                    <p className="text-xs text-gray-400 m-0 flex items-center gap-1.5">
                      <Calendar size={11} /> {club.period}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: club.color + "18", color: club.color }}>
                    {club.tag}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    {club.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
