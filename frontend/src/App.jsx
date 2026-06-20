import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { ApplicationsProvider } from "./contexts/ApplicationsContext";
import { EventsProvider } from "./contexts/EventsContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";

export default function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <EventsProvider>
          <ApplicationsProvider>
            <MainLayout />
          </ApplicationsProvider>
        </EventsProvider>
      </NotificationsProvider>
    </BrowserRouter>
  );
}