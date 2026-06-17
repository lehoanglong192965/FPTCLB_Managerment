import { createContext, useContext, useState } from "react";

const ApplicationsContext = createContext(null);

// Mock — chưa có API trả về danh sách đơn ứng tuyển của thành viên.
// Context này giữ state chung để trang "Khám Phá CLB" (nộp đơn) và
// trang "Đơn Ứng Tuyển" (xem danh sách/chi tiết) dùng chung dữ liệu.
const initialApplications = [
  {
    id: 301,
    clubName: "FPTU Music Club",
    clubEmoji: "🎵",
    clubColor: "#7c3aed",
    status: "PENDING",
    createdAt: "2026-06-10T09:30:00",
    introduction: "Em đam mê âm nhạc và đã tham gia ban nhạc trường cấp 3, mong muốn được giao lưu và phát triển kỹ năng biểu diễn tại CLB.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-1",
  },
  {
    id: 298,
    clubName: "FPTU Science Club",
    clubEmoji: "🔬",
    clubColor: "#0284c7",
    status: "APPROVED",
    createdAt: "2026-05-22T14:00:00",
    updatedAt: "2026-05-25T10:15:00",
    introduction: "Em từng tham gia cuộc thi nghiên cứu khoa học cấp trường và muốn tiếp tục phát triển đam mê nghiên cứu tại CLB.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-2",
    icpdpComment: "Hồ sơ phù hợp với định hướng CLB. Chào mừng bạn!",
  },
  {
    id: 290,
    clubName: "FPTU Sport Club",
    clubEmoji: "⚽",
    clubColor: "#d97706",
    status: "REJECTED",
    createdAt: "2026-05-02T08:00:00",
    updatedAt: "2026-05-06T09:00:00",
    introduction: "Em muốn tham gia các hoạt động thể thao và rèn luyện sức khoẻ cùng CLB.",
    cvUrl: "",
    icpdpComment: "CLB đã đủ chỉ tiêu thành viên trong học kỳ này.",
  },
];

export function ApplicationsProvider({ children }) {
  const [applications, setApplications] = useState(initialApplications);

  const addApplication = ({ clubName, clubEmoji, clubColor, introduction, cvUrl }) => {
    const newApp = {
      id: Date.now(),
      clubName,
      clubEmoji,
      clubColor,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      introduction,
      cvUrl: cvUrl || "",
    };
    setApplications((prev) => [newApp, ...prev]);
    return newApp;
  };

  const updateApplication = (id, patch) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ...patch } : app)));
  };

  return (
    <ApplicationsContext.Provider value={{ applications, addApplication, updateApplication }}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplications must be used within an ApplicationsProvider");
  return ctx;
}
