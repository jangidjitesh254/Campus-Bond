import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';

export default function CampusChatbot() {
  const navigate = useNavigate();
  const location = useLocation();

  // If already on /assistant, do not show duplicate floating trigger
  if (location.pathname === '/assistant') {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        onClick={() => navigate('/assistant')}
        aria-label="Open Campus Assistant in full page"
        className="group relative flex items-center gap-2.5 px-4 sm:px-5 py-3 bg-[#0B1528] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-gray-700/50 dark:border-blue-400/30"
      >
        {/* Glowing animated ping dot */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
        </span>

        <div className="flex items-center gap-1.5">
          <Bot className="w-5 h-5 text-white" />
          <span className="font-bold text-sm tracking-tight hidden sm:inline">Campus Assistant</span>
        </div>

        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      </button>
    </div>
  );
}
