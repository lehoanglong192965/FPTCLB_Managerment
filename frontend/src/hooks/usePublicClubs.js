import { useState, useEffect } from "react";
import clubService from "../services/api/clubs/clubService";

// Field mapping: ClubResponseDTO (backend) → ClubCard props
// Backend fields: clubID, abbr, name, desc, tag, emoji, color, members, recruiting, clubStatus
export function normalizeClub(raw) {
  return {
    abbr:       raw.abbr       ?? raw.clubCode     ?? String(raw.clubID ?? raw.id ?? ""),
    name:       raw.name       ?? raw.clubName     ?? "",
    desc:       raw.desc       ?? raw.description  ?? "",
    members:    raw.members    ?? raw.memberCount  ?? raw.totalMembers ?? 0,
    tag:        raw.tag        ?? raw.categoryName ?? raw.category ?? "",
    recruiting: raw.recruiting ?? raw.isRecruiting ?? false,
    color:      raw.color      ?? raw.themeColor   ?? "#1A6FC4",
    emoji:      raw.emoji      ?? "🏛️",
  };
}

export function usePublicClubs() {
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    clubService.getAllPublic()
      .then((res) => {
        const raw = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
        setClubs(raw.map(normalizeClub));
      })
      .catch((err) => {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setError(err?.message ?? "Không thể tải danh sách câu lạc bộ");
      })
      .finally(() => setLoading(false));
  }, []);

  return { clubs, loading, error };
}
