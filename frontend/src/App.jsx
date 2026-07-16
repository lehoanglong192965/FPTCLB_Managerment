import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <NotificationsProvider>
              <MainLayout />
            </NotificationsProvider>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}