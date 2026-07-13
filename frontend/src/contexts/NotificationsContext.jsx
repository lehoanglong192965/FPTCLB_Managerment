import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import notificationUserApi from "../services/api/notification/notificationUserApi";

const loadLS = (key, fallback) => {
  if (!key) return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
};

function mapNotification(n) {
  return {
    id:          n.notificationId ?? n.id,
    type:        (n.type ?? n.notificationType ?? "general").toLowerCase(),
    title:       n.title ?? "",
    content:     n.content ?? n.message ?? n.body ?? "",
    clubName:    n.senderName ?? n.fromClub ?? n.clubName ?? "Hệ thống",
    actionUrl:   n.actionUrl ?? null,
    actionLabel: n.actionLabel ?? null,
    createdAt:   n.createdAt ?? new Date().toISOString(),
    isRead:      n.isRead ?? n.read ?? false,
  };
}

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const lsKey = user?.email ? `fptclb_notifications_${user.email}` : null;

  const [apiNotifications, setApiNotifications] = useState([]);
  const [pushed,           setPushed]           = useState([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    setPushed(loadLS(lsKey, []));
  }, [lsKey]);

  useEffect(() => {
    if (!user || user.role === "ADMIN") { setApiNotifications([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    notificationUserApi.getAll()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        setApiNotifications(list.map(mapNotification));
      })
      .catch(() => { if (!cancelled) setApiNotifications([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const notifications = useMemo(() => {
    const visiblePushed = pushed.map((n) => ({
      ...n,
      isRead:      n.isRead ?? false,
      type:        n.type ?? "general",
      clubName:    n.clubName ?? "CLB",
      actionUrl:   n.actionUrl ?? null,
      actionLabel: n.actionLabel ?? null,
    }));
    return [...visiblePushed, ...apiNotifications];
  }, [pushed, apiNotifications]);

  const markRead = useCallback((id) => {
    setApiNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setPushed((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
      if (lsKey) localStorage.setItem(lsKey, JSON.stringify(updated));
      return updated;
    });
    notificationUserApi.markRead(id).catch((err) => {
      toast.error(err?.response?.data?.message ?? "Không thể đánh dấu đã đọc. Vui lòng thử lại.");
    });
  }, [lsKey, toast]);

  const markAllRead = useCallback(() => {
    const unread = apiNotifications.filter((n) => !n.isRead);
    Promise.all(unread.map((n) => notificationUserApi.markRead(n.id))).catch((err) => {
      toast.error(err?.response?.data?.message ?? "Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.");
    });
    setApiNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setPushed((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      if (lsKey) localStorage.setItem(lsKey, JSON.stringify(updated));
      return updated;
    });
  }, [apiNotifications, lsKey, toast]);

  const isRead = useCallback((id) => {
    const apiN = apiNotifications.find((n) => n.id === id);
    if (apiN) return apiN.isRead;
    return pushed.find((n) => n.id === id)?.isRead ?? false;
  }, [apiNotifications, pushed]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const addNotification = useCallback(({ title, content, clubId, clubName }) => {
    const item = {
      id:          Date.now(),
      title,
      content,
      clubId:      clubId ?? null,
      clubName:    clubName ?? "CLB",
      type:        "general",
      actionUrl:   null,
      actionLabel: null,
      createdAt:   new Date().toISOString(),
      isRead:      false,
    };
    setPushed((prev) => {
      const next = [item, ...prev];
      if (lsKey) localStorage.setItem(lsKey, JSON.stringify(next));
      return next;
    });
    return item;
  }, [lsKey]);

  const value = useMemo(
    () => ({ notifications, addNotification, markRead, markAllRead, isRead, unreadCount, loading }),
    [notifications, addNotification, markRead, markAllRead, isRead, unreadCount, loading],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
