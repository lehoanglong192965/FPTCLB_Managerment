import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastContext";
import memberApi from "../services/api/clubs/memberApi";
import clubBoardApi from "../services/api/club-leader/clubBoardApi";
import blacklistApi from "../services/api/icpdp/blacklistApi";
import { TokenService } from "../services/api/axiosClient";

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
  const toast = useToast();
  const [members, setMembers]     = useState([]);
  const [blacklist, setBlacklist] = useState([]);
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

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    blacklistApi.getAll(clubId)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.data ?? res?.content ?? []);
        setBlacklist(list.map((b) => ({
          blacklistID:  b.blacklistId  ?? b.blacklistID  ?? b.id,
          userID:       b.userId       ?? b.userID,
          fullName:     b.fullName     ?? b.studentName  ?? "",
          studentCode:  b.studentCode  ?? b.studentId    ?? "",
          major:        b.major        ?? "",
          clubRoleName: b.clubRoleName ?? b.roleName     ?? "Member",
          reason:       b.reason       ?? "",
          bannedDate:   b.bannedDate   ?? b.createdAt    ?? "",
        })));
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        console.warn("[ClubData] blacklist fetch failed:", err?.response?.status);
      });
    return () => { cancelled = true; };
  }, [clubId]);

  const expelMember = (member) => {
    memberApi.remove(clubId, member.membershipID)
      .then(() => {
        setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Không thể xóa thành viên. Vui lòng thử lại.");
      });
  };

  const addToBlacklist = async (member, reason) => {
    // Bước 1: Khai trừ khỏi CLB
    try {
      await memberApi.remove(clubId, member.membershipID);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể khai trừ thành viên. Vui lòng thử lại.");
      return;
    }
    // Bước 1 thành công → cập nhật UI ngay để tránh trạng thái không nhất quán
    setMembers((prev) => prev.filter((m) => m.membershipID !== member.membershipID));

    // Bước 2: Thêm vào danh sách đen
    try {
      const entry = await blacklistApi.add(clubId, { userID: member.userID, reason });
      setBlacklist((prev) => [
        {
          blacklistID:  entry?.blacklistId ?? entry?.id ?? entry?.blacklistID ?? Date.now(),
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
    } catch (err) {
      // Thành viên đã bị khai trừ khỏi CLB nhưng chưa vào danh sách đen
      toast.error(err?.response?.data?.message || "Đã khai trừ thành viên nhưng không thể thêm vào danh sách đen. Vui lòng thêm thủ công.");
    }
  };

  const removeFromBlacklist = async (blacklistID) => {
    try {
      await blacklistApi.remove(clubId, blacklistID);
      setBlacklist((prev) => prev.filter((b) => b.blacklistID !== blacklistID));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể gỡ khai trừ. Vui lòng thử lại.");
    }
  };

  return (
    <ClubDataContext.Provider value={{ members, blacklist, loading, error, fetchMembers, expelMember, addToBlacklist, removeFromBlacklist }}>
      {children}
    </ClubDataContext.Provider>
  );
}

export const useClubData = () => useContext(ClubDataContext);
