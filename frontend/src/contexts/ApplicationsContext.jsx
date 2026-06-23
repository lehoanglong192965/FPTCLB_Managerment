import { createContext, useContext, useState, useEffect } from "react";
import applicationApi from "../services/api/member/applicationApi";

const ApplicationsContext = createContext(null);

// Mock đơn ứng tuyển từ phía member (những đơn member đã nộp đến các CLB)
const initialMemberApplications = [
  {
    id: 301,
    clubId: "music",
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
    clubId: "science",
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
    clubId: "sport",
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

// Mock đơn ứng tuyển từ phía club leader (những đơn CLB nhận được)
const initialClubApplications = [
  {
    id: 1001,
    memberName: "Nguyễn Minh Khoa",
    memberEmail: "khoaNM@fpt.edu.vn",
    studentId: "SE180123",
    introduction: "Em đam mê lĩnh vực này và đã có kinh nghiệm 2 năm hoạt động ngoại khóa. Em muốn đóng góp cho sự phát triển của CLB và học hỏi thêm từ các anh chị.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-khoa",
    status: "PENDING",
    createdAt: "2026-06-15T09:30:00",
    updatedAt: null,
    note: "",
  },
  {
    id: 1002,
    memberName: "Trần Thị Lan Anh",
    memberEmail: "anhTTL@fpt.edu.vn",
    studentId: "SE180456",
    introduction: "Em đã theo dõi hoạt động của CLB từ lâu và rất ngưỡng mộ những gì CLB đã làm được. Em muốn được trở thành một phần của đội ngũ và cùng nhau xây dựng những dự án ý nghĩa.",
    cvUrl: "",
    status: "PENDING",
    createdAt: "2026-06-14T14:20:00",
    updatedAt: null,
    note: "",
  },
  {
    id: 1003,
    memberName: "Phạm Quốc Bảo",
    memberEmail: "baoPQ@fpt.edu.vn",
    studentId: "SE180789",
    introduction: "Em có nền tảng vững chắc trong lĩnh vực liên quan và muốn áp dụng kỹ năng của mình để phục vụ cộng đồng CLB.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-bao",
    status: "APPROVED",
    createdAt: "2026-06-10T10:00:00",
    updatedAt: "2026-06-12T08:30:00",
    note: "Hồ sơ tốt, chào mừng bạn gia nhập CLB!",
  },
  {
    id: 1004,
    memberName: "Lê Ngọc Hương",
    memberEmail: "huongLN@fpt.edu.vn",
    studentId: "SE181011",
    introduction: "Em là sinh viên năm 2, rất năng động và nhiệt tình. Em muốn tham gia CLB để mở rộng mạng lưới quan hệ và phát triển kỹ năng mềm.",
    cvUrl: "",
    status: "REJECTED",
    createdAt: "2026-06-08T16:45:00",
    updatedAt: "2026-06-11T11:00:00",
    note: "CLB hiện đã đủ chỉ tiêu thành viên cho học kỳ này. Mời bạn đăng ký lại vào học kỳ sau.",
  },
  {
    id: 1005,
    memberName: "Vũ Đức Thắng",
    memberEmail: "thangVD@fpt.edu.vn",
    studentId: "SE181234",
    introduction: "Em từng tham gia nhiều hoạt động xã hội và mong muốn tiếp tục phát triển bản thân thông qua môi trường CLB chuyên nghiệp.",
    cvUrl: "https://drive.google.com/file/d/mock-cv-thang",
    status: "PENDING",
    createdAt: "2026-06-16T08:00:00",
    updatedAt: null,
    note: "",
  },
];

export function ApplicationsProvider({ children }) {
  // Xóa session storage cũ để tránh mock data cũ gây bug
  sessionStorage.removeItem("mock_member_apps");
  sessionStorage.removeItem("mock_club_apps");

  const [memberApplications, setMemberApplications] = useState([]);
  const [clubApplications, setClubApplications]     = useState([]);

  // Member nộp đơn → tạo entry ở cả 2 phía
  const addApplication = ({ clubId, clubName, clubEmoji, clubColor, introduction, cvUrl, memberName, memberEmail, studentId }) => {
    const duplicate = memberApplications.some(
      (a) => a.clubId === clubId && a.status === "PENDING"
    );
    if (duplicate) return { duplicate: true };

    const id  = Date.now();
    const now = new Date().toISOString();

    setMemberApplications((prev) => [
      { id, clubId, clubName, clubEmoji, clubColor, status: "PENDING", createdAt: now, introduction, cvUrl: cvUrl || "" },
      ...prev,
    ]);

    setClubApplications((prev) => [
      {
        id,
        memberName:  memberName  || "Thành viên",
        memberEmail: memberEmail || "",
        studentId:   studentId   || "N/A",
        introduction,
        cvUrl: cvUrl || "",
        status: "PENDING",
        createdAt: now,
        updatedAt: null,
        note: "",
      },
      ...prev,
    ]);

    // Nếu clubId là số nguyên hợp lệ → nộp đơn lên backend thật, lưu apiId để club leader có thể gọi API duyệt
    if (Number.isInteger(clubId) && clubId > 0) {
      applicationApi.apply({ clubID: clubId, introduction, cvUrl })
        .then((res) => {
          const apiId = res?.applicationId ?? res?.id ?? res?.applicationID;
          if (!apiId) return;
          const patchApiId = (prev) =>
            prev.map((a) => (a.id === id ? { ...a, apiId } : a));
          setMemberApplications(patchApiId);
          setClubApplications(patchApiId);
        })
        .catch(() => {
          // Bỏ qua nếu backend lỗi — mock vẫn hoạt động
        });
    }

    return { id };
  };

  // Member hủy đơn (chỉ cập nhật phía member)
  const updateApplication = (id, patch) => {
    setMemberApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...patch } : app))
    );
  };

  // Club leader duyệt/từ chối → cập nhật cả 2 phía để member thấy kết quả
  const updateClubApplication = (id, patch) => {
    setClubApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
    if (patch.status) {
      setMemberApplications((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: patch.status, updatedAt: patch.updatedAt, icpdpComment: patch.note }
            : a
        )
      );
    }
  };

  return (
    <ApplicationsContext.Provider
      value={{ applications: memberApplications, addApplication, updateApplication, clubApplications, updateClubApplication }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplications must be used within an ApplicationsProvider");
  return ctx;
}
