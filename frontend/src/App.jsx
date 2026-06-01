import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useScrollSpy } from './hook/useScrollSpy'
import { NAV_ITEMS } from './components/header'
import Header from './components/header'
import Footer from './components/footer'
import LandingPage from './page/landingPage'
import ClubListPage from './page/clubListPage'
import EventListPage from './page/eventListPage'

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const activeSection = useScrollSpy(isHome ? NAV_ITEMS.map(n => n.href) : []);

  return (
    <>
      <Header activeSection={activeSection} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/clubs" element={<ClubListPage />} />
        <Route path="/events" element={<EventListPage />} />
      </Routes>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App