import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Plus,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }){
  const location = useLocation();

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      isActive: () => location.pathname === '/' || location.pathname.startsWith('/events'),
    },
    {
      name: 'Skill Match',
      path: '/skill-match',
      icon: Sparkles,
      badge: 'AI',
      isActive: () => location.pathname.startsWith('/skill-match'),
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
      // Custom shopping tote/bag icon matching the mockup
      icon: (props) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M4 8h16l-1.5 12H5.5L4 8z" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
          <rect x="10" y="11" width="4" height="4" rx="1" strokeWidth="1.8" />
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
      // Custom speech bubble icon with center dash matching the mockup
      icon: (props) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="13" y2="10" strokeWidth="2.5" strokeLinecap="round" />
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
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pt-1 pb-5 px-1">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3.5 group"
            >
              {/* White circular badge with compass icon */}
              <div
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: '#ffffff' }}
              >
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                  <circle cx="16" cy="16" r="11" stroke="#2B2321" strokeWidth="2.2" />
                  {/* Needle tilted ~45 degrees top-left to bottom-right */}
                  <path
                    d="M 11.5 11.5 L 14.8 18.2 L 20.5 20.5 L 17.2 13.8 Z"
                    fill="#2B2321"
                    stroke="#2B2321"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="16" r="1.8" fill="white" />
                </svg>
              </div>

              <div>
                <span className="font-bold text-white text-[20px] tracking-tight block leading-tight">
                  Campus Bond
                </span>
                <span className="text-[10px] text-[#B8AEA7] font-semibold tracking-wider uppercase block mt-1">
                  STUDENT NETWORK
                </span>
              </div>
            </Link>

            {/* Close button for mobile drawer */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-xl text-[#B8AEA7] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>


          {/* Navigation Items */}
          <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive();

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-full text-[15px] transition-all duration-150 ${
                  active
                    ? 'bg-[#BCB5A3] text-[#1D1819] font-semibold shadow-xs'
                    : 'text-[#F5F4F3] hover:text-white hover:bg-white/[0.08] font-medium'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active ? 'text-[#1D1819] stroke-[2.2]' : 'text-[#F5F4F3] stroke-[2]'
                  }`}
                />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    active
                      ? 'bg-[#1D1819] text-white'
                      : 'bg-[#E95E38] text-white shadow-2xs'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#615451] my-4 mx-1" />

        {/* Quick Actions */}
        <div className="space-y-2.5 px-0.5">
          <p className="text-[13px] font-medium text-[#B8AEA7] px-1 tracking-tight">
            Quick Actions
          </p>
          <button
            type="button"
            onClick={handleCreatePost}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#E95E38] hover:bg-[#D7522D] active:scale-[0.98] text-white font-bold text-[15px] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.8]" />
            <span>Create Post</span>
          </button>
        </div>

        {/* Quote Card */}
        <div className="bg-[#554745] rounded-3xl p-5 relative my-4 overflow-hidden shadow-xs">
          <div className="text-[#8E7E7A] text-3xl font-serif leading-none select-none mb-3">
            “
          </div>
          <div className="space-y-0.5 text-[#F5F4F3] text-[15px] font-medium leading-snug">
            <p>Connect</p>
            <p>Collaborate</p>
            <p>Grow Together</p>
          </div>
          {/* Paper airplane */}
          <div className="absolute bottom-5 right-5 text-white/90">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform rotate-12">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Waves & Slogan ─── */}
      <div className="relative pt-4 pb-2 mt-auto">
        {/* Organic wave background curves */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-44 -mx-5">
          <svg
            className="w-full h-full"
            viewBox="0 0 280 180"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 50 Q 80 40 140 100 T 280 110 L 280 180 L 0 180 Z"
              fill="#433735"
              opacity="0.6"
            />
            <path
              d="M 0 85 C 50 85 90 120 150 135 C 200 150 240 130 280 140 L 280 180 L 0 180 Z"
              fill="#3D3230"
              opacity="0.8"
            />
            <path
              d="M 0 115 C 60 115 100 140 160 150 C 210 160 250 150 280 155 L 280 180 L 0 180 Z"
              fill="#352B29"
            />
          </svg>
        </div>

        {/* Slogan */}
        <div className="relative z-10 px-1">
          <div className="font-handwriting text-[#F0ECE9] text-[26px] leading-[1.12] select-none tracking-wide">
            <p>Better</p>
            <p>Students</p>
            <p>Brighter Tomorrow</p>
          </div>
          <svg className="w-28 h-3 mt-1.5 text-[#E95E38]" viewBox="0 0 110 10" fill="none">
            <path
              d="M 2 7 C 35 2.5, 75 3, 108 5"
              stroke="currentColor"
              strokeWidth="2.8"
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
      <aside className="campus-sidebar hidden md:flex flex-col w-[279px] shrink-0 bg-[#4C403D] text-[#F5F4F3] border-r border-[#3E3432] h-screen sticky top-0 px-5 py-6 z-30 overflow-y-auto">
        <NavContent />
      </aside>

      {/* ─── Mobile Slide-out Drawer ─── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="campus-sidebar fixed inset-y-0 left-0 w-[279px] max-w-[85vw] bg-[#4C403D] text-[#F5F4F3] p-5 shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200 overflow-y-auto">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
