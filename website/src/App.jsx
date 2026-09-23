import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SearchProvider } from './context/SearchContext';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationBell from './components/NotificationBell';
import { Menu, Sun, Moon } from 'lucide-react';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import FeedPage from './pages/feed/FeedPage';
import EventDetailPage from './pages/feed/EventDetailPage';
import LostFoundPage from './pages/lostfound/LostFoundPage';
import MarketPage from './pages/market/MarketPage';
import ClubsPage from './pages/clubs/ClubsPage';
import ChatPage from './pages/chat/ChatPage';
import ProfilePage from './pages/profile/ProfilePage';
import CampusAssistantPage from './pages/assistant/CampusAssistantPage';
import SkillMatchPage from './pages/skillmatch/SkillMatchPage';

// Protected Route wrapper: requires authenticated user
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Guest Route wrapper: redirects to / if already logged in
function GuestRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
        <LoadingSpinner message="Restoring session..." />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-[#F6F8FA]">
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F6F3] dark:bg-[#0C0A09] text-[#1E1917] dark:text-[#F1F5F9] transition-colors duration-200">
      {/* ─── Persistent Desktop Left Sidebar + Mobile Drawer ─── */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── Desktop Header: AI, Theme Toggle & Profile (shown on pages without Hero banner) ─── */}
        {!['/', '/market', '/lostfound', '/clubs', '/profile', '/skill-match'].includes(location.pathname) && (
          <header className="hidden md:flex sticky top-0 z-20 bg-white/90 dark:bg-[#0E1626]/90 backdrop-blur-md border-b border-gray-200/70 dark:border-slate-800/80 px-8 py-3 items-center justify-end gap-3 transition-colors">
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              <NotificationBell buttonClassName="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors cursor-pointer relative" />

              <Link
                to="/assistant"
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-[#E95E38] hover:bg-[#D7522D] text-white shadow-xs hover:shadow-md transition-all"
              >
                <span>Campus AI</span>
              </Link>

              {user && (
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-full bg-[#EDE7E3] dark:bg-slate-700 text-[#1E1917] dark:text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-gray-300 dark:border-slate-600 shadow-xs hover:scale-105 transition-all cursor-pointer"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user.name || user.email || 'V').charAt(0).toUpperCase()}</span>
                  )}
                </Link>
              )}
            </div>
          </header>
        )}

        {/* ─── Mobile Header (only on screens < md) ─── */}
        <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 py-2.5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="font-display font-black text-lg text-gray-950 dark:text-white">
              Campus Bond
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell buttonClassName="p-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/10 text-gray-700 dark:text-slate-200 transition-colors relative cursor-pointer" />
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 flex items-center justify-center text-gray-950 dark:text-white font-bold text-xs shadow-2xs"
              >
                {user?.name?.charAt(0) || 'U'}
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Main Content Canvas ─── */}
        <main className="flex-1 pb-16 md:pb-8">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <FeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lostfound"
              element={
                <ProtectedRoute>
                  <LostFoundPage />
                </ProtectedRoute>
              }
            />
            <Route path="/lost-found" element={<Navigate to="/lostfound" replace />} />
            <Route
              path="/market"
              element={
                <ProtectedRoute>
                  <MarketPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs"
              element={
                <ProtectedRoute>
                  <ClubsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/messages" element={<Navigate to="/chat" replace />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <CampusAssistantPage />
                </ProtectedRoute>
              }
            />
            <Route path="/campus-assistant" element={<Navigate to="/assistant" replace />} />
            <Route
              path="/skill-match"
              element={
                <ProtectedRoute>
                  <SkillMatchPage />
                </ProtectedRoute>
              }
            />
            <Route path="/skill-matching" element={<Navigate to="/skill-match" replace />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SearchProvider>
            <AppLayout />
          </SearchProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
