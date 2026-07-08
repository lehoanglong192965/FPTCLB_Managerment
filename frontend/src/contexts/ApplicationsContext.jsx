import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import applicationApi from "../services/api/member/applicationApi";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";

const ApplicationsContext = createContext(null);

export function ApplicationsProvider({ children }) {
  const toast = useToast();
  const { user } = useAuth();
  const [memberApplications, setMemberApplications] = useState([]);
  const [clubApplications, setClubApplications]     = useState([]);

  useEffect(() => {
    if (!user || user.role !== "MEMBER") return;
    applicationApi.getMyApplications()
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setMemberApplications(data);
      })
      .catch(() => {});
  }, [user]);

  // Member nộp đơn → tạo entry ở cả 2 phía
  const addApplication = useCallback(({ clubId, clubName, clubEmoji, clubColor, introduction, cvUrl, memberName, memberEmail, studentId }) => {
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
        .catch((err) => {
          setMemberApplications((prev) => prev.filter((a) => a.id !== id));
          setClubApplications((prev) => prev.filter((a) => a.id !== id));
          toast.error(err?.response?.data?.message || "Nộp đơn thất bại. Vui lòng thử lại.");
        });
    }

    return { id };
  }, [memberApplications, toast]);

  const updateApplication = useCallback((id, patch) => {
    setMemberApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...patch } : app))
    );
  }, []);

  const updateClubApplication = useCallback((id, patch) => {
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
  }, []);

  const value = useMemo(
    () => ({ applications: memberApplications, addApplication, updateApplication, clubApplications, updateClubApplication }),
    [memberApplications, addApplication, updateApplication, clubApplications, updateClubApplication],
  );

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplications must be used within an ApplicationsProvider");
  return ctx;
}
