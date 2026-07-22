import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import ErrorBoundary from "./components/ErrorBoundary";

/* Nội dung app giữ nguyên như cũ — chỉ bọc trong 1 route splat của data router
   thay vì <BrowserRouter>, để useBlocker() hoạt động được cho mọi điều hướng
   (kể cả bấm menu sidebar), trong khi routes/index.jsx vẫn giữ nguyên <Routes> con. */
function AppShell() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <NotificationsProvider>
          <MainLayout />
        </NotificationsProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

const router = createBrowserRouter([{ path: "*", element: <AppShell /> }]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
