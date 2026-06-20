import { useState, useEffect } from "react";

export function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (!ids.length) return;

    const onScroll = () => {
      // Đường trigger: 30% từ đầu màn hình
      const triggerY = window.innerHeight * 0.3;

      // Lấy section cuối cùng có top edge đã vượt qua đường trigger
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= triggerY) {
          current = id;
        }
      }
      setActive(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // chạy ngay lần đầu để khởi tạo đúng
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}
