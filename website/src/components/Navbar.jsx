import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
  ShoppingBag,
  Search,
  Users,
  MessageSquare,
  Sparkles,
  User,
  LogOut,
  Plus,
  Award,
  Sun,
  Moon,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const displayName = (user?.name && user.name !== 'Test Student') ? user.name : 'Vikash';
  const isEditorial = location.pathname === '/' || location.pathname.startsWith('/events');

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Clubs', path: '/clubs', icon: Users },
    { name: 'Market', path: '/market', icon: ShoppingBag },
    { name: 'Lost & Found', path: '/lostfound', icon: Search },
    { name: 'Messages', path: '/chat', icon: MessageSquare },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/events');
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* ─── Top Header ─── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Clean Brand Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <span className="font-display text-gray-950 font-black text-xl sm:text-2xl tracking-[-0.03em] whitespace-nowrap">
                  Campus Bond
                </span>
              </Link>
            </div>

            {/* Center: Clean Systematic Tab Navigation */}
            <nav className="hidden md:flex items-center justify-center flex-1 mx-2 lg:mx-4">
              <div className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`font-display flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-tight transition-all ${
                        active
                          ? 'bg-[#0B1528] text-white font-bold shadow-xs'
                          : 'text-gray-500 hover:text-black font-semibold hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Right: Clean Student Profile Avatar */}
            <div className="flex items-center justify-end flex-shrink-0">
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    title={displayName}
                    aria-label="User Profile"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 border-2 border-gray-300 hover:border-[#0B1528] focus:outline-none transition-all cursor-pointer overflow-hidden flex items-center justify-center p-0.5 active:scale-95 shadow-sm"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={displayName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="font-bold text-xs sm:text-sm text-gray-900">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>

                  {/* Clean Profile Details Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 bg-white border-2 border-gray-200 text-gray-900">
                      <div className="p-3 border-b border-gray-100 mb-1.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-sm bg-gray-100 text-gray-950 border border-gray-300">
                          {user.avatar ? (
                            <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{displayName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xs sm:text-sm font-bold truncate text-gray-950 tracking-tight">
                            {displayName}
                          </p>
                          <p className="text-[11px] truncate text-gray-500 font-medium">
                            {user.email}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-mono-code text-[10px] px-2 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {user.branch || 'CSE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="font-display flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-colors text-gray-700 hover:text-black hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span>My Profile &amp; Activity</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="font-display flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-colors text-gray-700 hover:text-black hover:bg-gray-100"
                      >
                        <Award className="w-4 h-4 text-[#F59E0B]" />
                        <span>Campus Score</span>
                      </Link>

                      <div className="my-1 border-t border-gray-100 dark:border-white/10" />

                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="font-display w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-colors text-gray-700 dark:text-gray-200 hover:text-black hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {theme === 'dark' ? (
                            <Moon className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Sun className="w-4 h-4 text-amber-500" />
                          )}
                          <span>Theme: {theme === 'dark' ? 'Dark' : 'White'}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 font-bold capitalize text-gray-600 dark:text-gray-300">
                          {theme === 'dark' ? 'Dark' : 'White'}
                        </span>
                      </button>

                      <div className="my-1 border-t border-gray-100 dark:border-white/10" />

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="font-display w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="font-display px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold tracking-tight transition-colors text-gray-700 hover:text-black"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="font-display px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight bg-[#0B1528] text-white hover:bg-black transition-all shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation Bar (< md) ─── */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t px-2 sm:px-4 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.65rem)] shadow-2xl bg-white/95 border-gray-200 text-gray-900">
          <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
            {/* 1. Home */}
            <Link
              to="/"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                location.pathname === '/' || location.pathname.startsWith('/events')
                  ? 'text-[#0B1528] font-bold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-display text-[10px] font-bold tracking-tight mt-0.5">Home</span>
            </Link>

            {/* 2. Club */}
            <Link
              to="/clubs"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                location.pathname.startsWith('/clubs')
                  ? 'text-[#0B1528] font-bold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-display text-[10px] font-bold tracking-tight mt-0.5">Club</span>
            </Link>

            {/* 3. Center + Action Button */}
            <div className="flex justify-center items-center">
              <Link
                to="/?create=true"
                className="w-10 h-10 rounded-full bg-[#0B1528] hover:bg-black text-white flex items-center justify-center shadow-lg transition-all group active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[3] group-hover:scale-110 transition-transform" />
              </Link>
            </div>

            {/* 4. Market */}
            <Link
              to="/market"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                location.pathname.startsWith('/market')
                  ? 'text-[#0B1528] font-bold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-display text-[10px] font-bold tracking-tight mt-0.5">Market</span>
            </Link>

            {/* 5. More (Profile & Activities) */}
            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                location.pathname.startsWith('/profile') ||
                location.pathname.startsWith('/lostfound') ||
                location.pathname.startsWith('/chat')
                  ? 'text-[#0B1528] font-bold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <div className="flex items-center gap-0.5 my-1">
                <span className="w-1 h-1 rounded-full bg-current" />
                <span className="w-1 h-1 rounded-full bg-current" />
                <span className="w-1 h-1 rounded-full bg-current" />
              </div>
              <span className="font-display text-[10px] font-bold tracking-tight mt-0.5">More</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
