import { createContext, useContext, useState } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS = [
  { membershipID: 1, userID: 101, fullName: "Nguyễn Văn A",   email: "aNV@fpt.edu.vn",    phone: "0901234567", studentCode: "SE180001", major: "Software Engineering",    clubRoleName: "Leader",     semesterCode: "SU26", joinedDate: "2025-09-01" },
  { membershipID: 2, userID: 102, fullName: "Trần Thị Bình",  email: "binhTT@fpt.edu.vn", phone: "0912345678", studentCode: "SE180002", major: "Artificial Intelligence", clubRoleName: "ViceLeader", semesterCode: "SU26", joinedDate: "2025-09-01" },
  { membershipID: 3, userID: 103, fullName: "Lê Hoàng Cường", email: "cuongLH@fpt.edu.vn", phone: "0923456789", studentCode: "SE180003", major: "Information Security",    clubRoleName: "CoreTeam",   semesterCode: "SU26", joinedDate: "2025-09-05" },
  { membershipID: 4, userID: 104, fullName: "Phạm Ngọc Dung", email: "dungPN@fpt.edu.vn", phone: "0934567890", studentCode: "SE180004", major: "Software Engineering",    clubRoleName: "Member",     semesterCode: "SU26", joinedDate: "2025-09-10" },
  { membershipID: 5, userID: 105, fullName: "Hoàng Minh Đức", email: "ducHM@fpt.edu.vn",  phone: "0945678901", studentCode: "SE180005", major: "Business IT",            clubRoleName: "Member",     semesterCode: "SU26", joinedDate: "2025-09-10" },
  { membershipID: 6, userID: 106, fullName: "Vũ Thị Lan",     email: "lanVT@fpt.edu.vn",  phone: "0956789012", studentCode: "SE180006", major: "Digital Art & Design",   clubRoleName: "Member",     semesterCode: "SU26", joinedDate: "2025-09-12" },
  { membershipID: 7, userID: 107, fullName: "Đặng Quốc Hùng", email: "hungDQ@fpt.edu.vn", phone: "0967890123", studentCode: "SE180007", major: "Software Engineering",    clubRoleName: "Member",     semesterCode: "SU26", joinedDate: "2025-09-15" },
  { membershipID: 8, userID: 108, fullName: "Ngô Thị Mai",    email: "maiNT@fpt.edu.vn",  phone: "0978901234", studentCode: "SE180008", major: "Information Technology",  clubRoleName: "Member",     semesterCode: "SU26", joinedDate: "2025-09-18" },
];

const MOCK_BLACKLIST = [
  { blacklistID: 1, userID: 109, fullName: "Bùi Văn Khánh",   studentCode: "SE180009", major: "Software Engineering",  clubRoleName: "Member", reason: "Vi phạm quy tắc ứng xử CLB nhiều lần.",                             bannedDate: "10/05/2025" },
  { blacklistID: 2, userID: 110, fullName: "Đinh Thị Phương", studentCode: "SE180010", major: "Information Technology", clubRoleName: "Member", reason: "Không tham gia hoạt động trong 2 học kỳ liên tiếp và không thông báo.", bannedDate: "01/06/2025" },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const ClubDataContext = createContext(null);

export function ClubDataProvider({ children }) {
  const [members, setMembers]     = useState(MOCK_MEMBERS);
  const [blacklist, setBlacklist] = useState(MOCK_BLACKLIST);

  // Chỉ khai trừ — không thêm vào blacklist
  const expelMember = (member) => {
    setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));
  };

  // Khai trừ + thêm vào blacklist
  const addToBlacklist = (member, reason) => {
    setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));
    setBlacklist((prev) => [
      {
        blacklistID:  Date.now(),
        userID:       member.userID,
        fullName:     member.fullName,
        studentCode:  member.studentCode,
        major:        member.major,
        clubRoleName: member.clubRoleName,
        reason,
        bannedDate:   new Date().toLocaleDateString("vi-VN"),
      },
      ...prev,
    ]);
  };

  // Gỡ khỏi blacklist (không tự động thêm lại vào members)
  const removeFromBlacklist = (blacklistID) => {
    setBlacklist((prev) => prev.filter((b) => b.blacklistID !== blacklistID));
  };

  return (
    <ClubDataContext.Provider value={{ members, blacklist, expelMember, addToBlacklist, removeFromBlacklist }}>
      {children}
    </ClubDataContext.Provider>
  );
}

export const useClubData = () => useContext(ClubDataContext);
