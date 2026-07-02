import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { ApplicationsProvider } from "./contexts/ApplicationsContext";
import { EventsProvider } from "./contexts/EventsContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ToastProvider } from "./contexts/ToastContext";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <NotificationsProvider>
          <EventsProvider>
            <ApplicationsProvider>
              <MainLayout />
            </ApplicationsProvider>
          </EventsProvider>
        </NotificationsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}