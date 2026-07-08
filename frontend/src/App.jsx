import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { ApplicationsProvider } from "./contexts/ApplicationsContext";
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
              <ApplicationsProvider>
                <MainLayout />
              </ApplicationsProvider>
            </NotificationsProvider>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}