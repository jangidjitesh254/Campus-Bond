import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Plus,
  X,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      isActive: () => location.pathname === '/' || location.pathname.startsWith('/events'),
    },
    {
      name: 'Clubs',
      path: '/clubs',
      icon: Users,
      isActive: () => location.pathname.startsWith('/clubs'),
    },
    {
      name: 'Market',
      path: '/market',
      icon: (props) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M4 8h16l-1.5 12H5.5L4 8z" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
          <rect x="10" y="11" width="4" height="4" rx="1" strokeWidth="1.6" />
        </svg>
      ),
      isActive: () => location.pathname.startsWith('/market'),
    },
    {
      name: 'Lost & Found',
      path: '/lostfound',
      icon: HelpCircle,
      isActive: () => location.pathname.startsWith('/lostfound') || location.pathname.startsWith('/lost-found'),
    },
    {
      name: 'Messages',
      path: '/chat',
      icon: (props) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="13" y2="10" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ),
      isActive: () => location.pathname.startsWith('/chat'),
    },
  ];

  const handleCreatePost = () => {
    if (onClose) onClose();
    window.dispatchEvent(new CustomEvent('open-create-post'));
  };

  const NavContent = () => {
    return (
      <div className="flex flex-col h-full justify-between relative overflow-hidden select-none">
        {/* ─── Top Section: Logo & Nav Links ─── */}
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pt-1 pb-2 px-1">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-9 h-9 text-white stroke-[1.8]" />
              </div>

              <div>
                <span className="font-bold text-white text-[20px] tracking-tight block leading-tight">
                  Campus Bond
                </span>
                <span className="text-[10px] text-[#A3968F] font-bold tracking-[0.2em] uppercase block mt-0.5">
                  STUDENT NETWORK
                </span>
              </div>
            </Link>

            {/* Close button for mobile drawer */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-xl text-[#A3968F] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive();

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-[15px] transition-all duration-150 ${
                    active
                      ? 'bg-[#E5DACB] text-[#221614] font-semibold shadow-xs'
                      : 'text-[#A3968F] hover:text-white hover:bg-white/[0.04] font-medium'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      active ? 'text-[#221614] stroke-[2.2]' : 'text-[#A3968F] stroke-[1.8]'
                    }`}
                  />
                  <span className="flex-1 text-left">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Create Post Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCreatePost}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#EE5933] hover:bg-[#E04B26] active:scale-[0.98] text-white font-bold text-[15px] shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.8]" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Quote Card */}
          <div className="bg-[#2A1D1A]/70 border border-[#3A2A26] rounded-2xl p-4.5 relative overflow-hidden">
            <div className="text-[#8E7E77] text-2xl font-serif leading-none select-none mb-1.5">
              “
            </div>
            <div className="space-y-1 text-[#E5DACB] text-[14px] font-medium leading-snug pl-1">
              <p>Connect</p>
              <p>Collaborate</p>
              <p>Grow Together</p>
            </div>
            <div className="text-[#8E7E77] text-2xl font-serif leading-none select-none mt-1 text-right">
              ”
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Mountain Silhouette & Slogan ─── */}
        <div className="relative pt-6 pb-2 mt-auto">
          {/* Subtle Mountain Outline */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden opacity-40">
            <svg
              className="w-full h-24"
              viewBox="0 0 240 100"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M-20 100 L40 40 L90 75 L150 25 L210 70 L260 30 L280 100 Z"
                fill="#2E201C"
                opacity="0.5"
              />
              <path
                d="M-20 100 L30 55 L80 80 L130 45 L180 85 L230 50 L260 100 Z"
                fill="#382823"
                opacity="0.7"
              />
              <path
                d="M-10 65 L40 40 L90 75 L150 25 L210 70 L260 30"
                stroke="#523B34"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Slogan */}
          <div className="relative z-10 px-1 pt-4">
            <div className="font-handwriting text-[#DDD1C6] text-[22px] leading-[1.15] select-none tracking-wide">
              <p>Better</p>
              <p>Students</p>
              <p>Brighter Tomorrow</p>
            </div>
            <svg className="w-20 h-2.5 mt-1 text-[#EE5933]" viewBox="0 0 90 10" fill="none">
              <path
                d="M 2 7 C 28 2, 60 2.5, 88 5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ─── Desktop Fixed Left Sidebar ─── */}
      <aside className="campus-sidebar hidden md:flex flex-col w-[260px] shrink-0 bg-[#221614] text-[#E5DACB] border-r border-[#2E1F1B] h-screen sticky top-0 px-5 py-6 z-30 overflow-y-auto">
        <NavContent />
      </aside>

      {/* ─── Mobile Slide-out Drawer ─── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="campus-sidebar fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-[#221614] text-[#E5DACB] p-5 shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200 overflow-y-auto">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
