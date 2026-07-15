// Danh mục (tag) câu lạc bộ dùng chung toàn hệ thống.
// value = giá trị lưu trong DB (không đổi để khớp dữ liệu cũ), label = nhãn hiển thị tiếng Việt.
export const CLUB_CATEGORIES = [
  { value: "Công nghệ",  label: "Công nghệ" },
  { value: "Thiết kế",   label: "Thiết kế" },
  { value: "Kỹ năng",    label: "Kỹ năng" },
  { value: "AI & Data",  label: "AI & Dữ liệu" },
  { value: "Business",   label: "Kinh doanh" },
  { value: "Ngôn ngữ",   label: "Ngôn ngữ" },
  { value: "Nghệ thuật", label: "Nghệ thuật" },
  { value: "Thể thao",   label: "Thể thao" },
];

// Map từ giá trị DB → nhãn hiển thị tiếng Việt
export const CATEGORY_LABEL = Object.fromEntries(
  CLUB_CATEGORIES.map((c) => [c.value, c.label])
);

export const displayCategory = (tag) => CATEGORY_LABEL[tag] ?? tag;
