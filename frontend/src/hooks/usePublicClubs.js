import { useState, useEffect } from "react";
import clubService from "../services/api/clubs/clubService";

// Map từ giá trị lưu trong DB → nhãn hiển thị tiếng Việt
export const CATEGORY_LABEL = {
  "Công nghệ":  "Công nghệ",
  "Thiết kế":   "Thiết kế",
  "Kỹ năng":    "Kỹ năng",
  "AI & Data":  "AI & Dữ liệu",
  "Business":   "Kinh doanh",
  "Ngôn ngữ":   "Ngôn ngữ",
  "Nghệ thuật": "Nghệ thuật",
  "Thể thao":   "Thể thao",
};

export const displayCategory = (tag) => CATEGORY_LABEL[tag] ?? tag;

//Hàm chuyển đổi dữ liệu từ backend sang format frontend dùng được.
export function normalizeClub(raw) {
  return {
    id:           raw.clubID      ?? raw.id,
    abbr:         raw.abbr        ?? raw.clubCode     ?? String(raw.clubID ?? raw.id ?? ""),
    name:         raw.name        ?? raw.clubName     ?? "",
    desc:         raw.desc        ?? raw.description  ?? "",
    members:      raw.members     ?? raw.memberCount  ?? raw.totalMembers ?? 0,
    tag:          raw.tag         ?? raw.categoryName ?? raw.category ?? "",
    recruiting:   raw.recruiting  ?? raw.isRecruiting ?? false,
    color:        raw.color       ?? raw.themeColor   ?? "#1A6FC4",
    emoji:        raw.emoji       ?? "🏛️",
    clubImage:    raw.clubImage   ?? raw.imageUrl     ?? raw.logoUrl ?? raw.avatarUrl ?? raw.image ?? raw.logo ?? null,
    contactEmail: raw.contactEmail ?? null,
    contactPhone: raw.contactPhone ?? null,
    facebookUrl:  raw.facebookUrl  ?? null,
  };
}

//Đây là custom hook để lấy danh sách các câu lạc bộ công khai từ backend. 
// Nó trả về một object gồm danh sách câu lạc bộ, trạng thái loading và lỗi (nếu có).
export function usePublicClubs() {
  const [clubs, setClubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
//Khi component vừa hiện ra màn hình → bật loading, xóa lỗi cũ.
  useEffect(() => {
    setLoading(true);
    setError("");
    //Gọi API để lấy danh sách câu lạc bộ công khai. 
    // Nếu thành công, chuyển đổi dữ liệu và lưu vào state. 
    // Nếu thất bại, lưu lỗi vào state. Cuối cùng, tắt loading.
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
