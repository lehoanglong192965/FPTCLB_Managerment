import { createContext, useContext, useState, useEffect, useCallback } from "react";
import memberApi from "../services/api/clubs/memberApi";
import clubBoardApi from "../services/api/club-leader/clubBoardApi";
import { TokenService } from "../services/api/axiosClient";

// Blacklist vẫn dùng mock vì chưa có API endpoint
const MOCK_BLACKLIST = [
  { blacklistID: 1, userID: 109, fullName: "Bùi Văn Khánh",   studentCode: "SE180009", major: "Software Engineering",  clubRoleName: "Member", reason: "Vi phạm quy tắc ứng xử CLB nhiều lần.",                             bannedDate: "10/05/2025" },
  { blacklistID: 2, userID: 110, fullName: "Đinh Thị Phương", studentCode: "SE180010", major: "Information Technology", clubRoleName: "Member", reason: "Không tham gia hoạt động trong 2 học kỳ liên tiếp và không thông báo.", bannedDate: "01/06/2025" },
];

function normalizeMember(raw) {
  return {
    membershipID: raw.membershipId  ?? raw.membershipID  ?? raw.id,
    userID:       raw.userId        ?? raw.userID        ?? raw.user?.id,
    fullName:     raw.fullName      ?? raw.name          ?? raw.user?.fullName ?? "",
    email:        raw.email         ?? raw.user?.email   ?? "",
    phone:        raw.phone         ?? raw.phoneNumber   ?? raw.user?.phone ?? "",
    studentCode:  raw.studentCode   ?? raw.studentId     ?? raw.user?.studentCode ?? "",
    major:        raw.major         ?? raw.user?.major   ?? "",
    clubRoleName: raw.clubRoleName  ?? raw.roleName      ?? raw.role ?? "Member",
    semesterCode: raw.semesterCode  ?? raw.semester      ?? "",
    joinedDate:   raw.joinedDate    ?? raw.joinDate      ?? raw.createdAt ?? null,
  };
}

const ClubDataContext = createContext(null);

export function ClubDataProvider({ children }) {
  const [members, setMembers]     = useState([]);
  const [blacklist, setBlacklist] = useState(MOCK_BLACKLIST);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const clubId = TokenService.getClubId();

  const fetchMembers = useCallback(async () => {
    if (!clubId) {
      setLoading(false);
      setError("Không tìm thấy thông tin câu lạc bộ.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Thử /members trước
      const res = await memberApi.getAll(clubId, { page: 0, size: 200 });
      const raw = Array.isArray(res) ? res : (res?.content ?? res?.data ?? res?.members ?? []);
      setMembers(raw.map(normalizeMember));
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.warn("[ClubData] /members lỗi, fallback /board:", err?.response?.status);
      // Fallback sang /board
      try {
        const data = await clubBoardApi.getBoard(clubId);
        const raw = Array.isArray(data) ? data : [];
        setMembers(raw.map(normalizeMember));
      } catch (err2) {
        if (err2?.code === "ERR_CANCELED" || err2?.name === "CanceledError") return;
        setError(err2?.response?.data?.message ?? err2?.message ?? "Không thể tải danh sách thành viên.");
      }
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const expelMember = (member) => {
    memberApi.remove(clubId, member.membershipID)
      .then(() => {
        setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));
      })
      .catch(() => {
        // fallback: cập nhật UI trước, lỗi thì reload lại
        setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));
      });
  };

  const addToBlacklist = (member, reason) => {
    // Khai trừ qua API
    memberApi.remove(clubId, member.membershipID).catch(() => {});
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

  const removeFromBlacklist = (blacklistID) => {
    setBlacklist((prev) => prev.filter((b) => b.blacklistID !== blacklistID));
  };

  return (
    <ClubDataContext.Provider value={{ members, blacklist, loading, error, fetchMembers, expelMember, addToBlacklist, removeFromBlacklist }}>
      {children}
    </ClubDataContext.Provider>
  );
}

export const useClubData = () => useContext(ClubDataContext);
