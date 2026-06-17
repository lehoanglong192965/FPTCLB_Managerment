import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { ApplicationsProvider } from "./contexts/ApplicationsContext";

export default function App() {
  return (
    <BrowserRouter>
      <ApplicationsProvider>
        <MainLayout />
      </ApplicationsProvider>
    </BrowserRouter>
  );
}