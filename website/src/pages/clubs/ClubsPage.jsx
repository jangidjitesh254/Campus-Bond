import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { clubService, chatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  UserPlus,
  UserMinus,
  Sparkles,
  Trash2,
  ChevronDown,
  Filter,
  Check,
  Theater,
  Music,
  Trophy,
  GraduationCap,
  Palette,
  Camera,
  Heart,
  MoreVertical,
  MessageSquare,
  ExternalLink,
  Calendar,
  Sun,
  Moon,
  X,
  SlidersHorizontal,
} from 'lucide-react';

const getCategoryStyle = (category = '') => {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'tech':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Tech & Coding',
      };
    case 'cultural':
      return {
        badge: 'bg-[#FDF2F8] text-[#D946EF] border-[#D946EF]/30',
        label: 'Cultural & Drama',
      };
    case 'sports':
      return {
        badge: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30',
        label: 'Sports & Athletics',
      };
    case 'academic':
      return {
        badge: 'bg-[#EEF2FF] text-[#4F46E5] border-[#6366F1]/30',
        label: 'Academic & Research',
      };
    case 'arts':
      return {
        badge: 'bg-[#FDF2F8] text-[#D946EF] border-[#D946EF]/30',
        label: 'Arts & Photography',
      };
    case 'social':
      return {
        badge: 'bg-teal-50 text-teal-700 border-teal-200',
        label: 'Social & NGO',
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        label: 'Campus Club',
      };
  }
};

const getClubSign = (category = '', name = '', image = null) => {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // Tech & Coding: </>
  if (
    cat === 'tech' ||
    n.includes('code') ||
    n.includes('coding') ||
    n.includes('program') ||
    n.includes('dev') ||
    n.includes('hack') ||
    n.includes('web') ||
    n.includes('ai') ||
    n.includes('cyber') ||
    n.includes('software') ||
    n.includes('tech')
  ) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-300 text-gray-950 flex items-center justify-center font-mono font-black text-sm tracking-tighter shadow-xs flex-shrink-0">
        &lt;/&gt;
      </div>
    );
  }

  // Cultural, Drama & Music
  if (
    cat === 'cultural' ||
    n.includes('drama') ||
    n.includes('theater') ||
    n.includes('theatre') ||
    n.includes('act') ||
    n.includes('nukkad') ||
    n.includes('music') ||
    n.includes('dance') ||
    n.includes('sing') ||
    n.includes('band')
  ) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] border border-[#D946EF]/20 text-[#D946EF] flex items-center justify-center shadow-xs flex-shrink-0">
        {n.includes('music') || n.includes('sing') || n.includes('band') ? (
          <Music className="w-5 h-5 text-[#D946EF]" />
        ) : (
          <Theater className="w-5 h-5 text-[#D946EF]" />
        )}
      </div>
    );
  }

  // Sports & Athletics
  if (
    cat === 'sports' ||
    n.includes('sport') ||
    n.includes('cricket') ||
    n.includes('football') ||
    n.includes('athlet') ||
    n.includes('badminton') ||
    n.includes('fitness') ||
    n.includes('gym')
  ) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/20 text-[#D97706] flex items-center justify-center shadow-xs flex-shrink-0">
        <Trophy className="w-5 h-5 text-[#D97706]" />
      </div>
    );
  }

  // Academic & Research
  if (
    cat === 'academic' ||
    n.includes('research') ||
    n.includes('study') ||
    n.includes('science') ||
    n.includes('robot') ||
    n.includes('math') ||
    n.includes('physics') ||
    n.includes('innovat')
  ) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#6366F1]/20 text-[#4F46E5] flex items-center justify-center shadow-xs flex-shrink-0">
        <GraduationCap className="w-5 h-5 text-[#4F46E5]" />
      </div>
    );
  }

  // Arts & Photography
  if (
    cat === 'arts' ||
    n.includes('photo') ||
    n.includes('camera') ||
    n.includes('art') ||
    n.includes('design') ||
    n.includes('paint') ||
    n.includes('sketch') ||
    n.includes('film')
  ) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] border border-[#D946EF]/20 text-[#D946EF] flex items-center justify-center shadow-xs flex-shrink-0">
        {n.includes('photo') || n.includes('camera') ? (
          <Camera className="w-5 h-5 text-[#D946EF]" />
        ) : (
          <Palette className="w-5 h-5 text-[#D946EF]" />
        )}
      </div>
    );
  }

  // Social & NGO
  if (
    cat === 'social' ||
    n.includes('social') ||
    n.includes('ngo') ||
    n.includes('volunteer') ||
    n.includes('rotaract') ||
    n.includes('help') ||
    n.includes('nature') ||
    n.includes('green')
  ) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs flex-shrink-0">
        <Heart className="w-5 h-5 text-teal-700" />
      </div>
    );
  }

  // Default / Other
  return (
    <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center shadow-xs flex-shrink-0">
      <Sparkles className="w-5 h-5 text-gray-600" />
    </div>
  );
};

function ClubLogo({ category = '', name = '', image = null }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (image && !imgFailed) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center">
        <img
          src={image.startsWith('http') ? image : `${image}`}
          alt={name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return getClubSign(category, name);
}

export default function ClubsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlCategory = searchParams.get('category') || '';
  const urlIsMyClubs = searchParams.get('myClubs') === 'true' || urlCategory === 'my-clubs';

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(urlIsMyClubs ? '' : urlCategory);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const { searchQuery: search, debouncedSearch, setSearchQuery } = useSearch();
  const [onlyMyClubs, setOnlyMyClubs] = useState(urlIsMyClubs);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeMenuClubId, setActiveMenuClubId] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const dropdownRef = useRef(null);

  // Keep state in sync with URL searchParams
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const isMyClubs = searchParams.get('myClubs') === 'true' || cat === 'my-clubs';
    if (isMyClubs) {
      setOnlyMyClubs(true);
      setCategoryFilter('');
    } else {
      setOnlyMyClubs(false);
      setCategoryFilter(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (!event.target.closest('.club-menu-container')) {
        setActiveMenuClubId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal & form
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'tech',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const res = await clubService.getClubs(params);
      setClubs(res.data.clubs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [categoryFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      await clubService.createClub(data);
      setModalOpen(false);
      setFormData({ name: '', description: '', category: 'tech' });
      setSelectedFile(null);
      fetchClubs();
    } catch (err) {
      alert(err.message || 'Failed to create club');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await clubService.joinClub(id);
      fetchClubs();
      if (selectedClub && selectedClub._id === id) {
        setSelectedClub((prev) => ({
          ...prev,
          members: [...(prev.members || []), user?._id || user],
          memberCount: (prev.memberCount || (prev.members || []).length) + 1,
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to join club');
    }
  };

  const handleLeave = async (id) => {
    try {
      await clubService.leaveClub(id);
      fetchClubs();
      if (selectedClub && selectedClub._id === id) {
        setSelectedClub((prev) => ({
          ...prev,
          members: (prev.members || []).filter((m) => (m._id || m) !== user?._id),
          memberCount: Math.max(0, (prev.memberCount || 1) - 1),
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to leave club');
    }
  };

  const handleMessageLead = async (club) => {
    const creatorId = club.createdBy?._id || club.createdBy;
    if (!creatorId) return;
    if (user && String(creatorId) === String(user._id)) {
      alert('You are the lead/creator of this club!');
      return;
    }
    try {
      await chatService.openConversation(creatorId);
      navigate('/chat');
    } catch (err) {
      alert(err.message || 'Could not open chat with club lead');
    }
  };

  const handleDelete = async (club) => {
    setActiveMenuClubId(null);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${club.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await clubService.deleteClub(club._id);
      alert(`"${club.name}" has been deleted successfully.`);
      fetchClubs();
    } catch (err) {
      alert(err.message || 'Failed to delete club');
    } finally {
      setActionLoading(false);
    }
  };


  const myClubsCount = user
    ? clubs.filter((c) => (c.members || []).some((m) => (m._id || m) === user._id)).length
    : 0;

  const displayedClubs = onlyMyClubs && user
    ? clubs.filter((c) => (c.members || []).some((m) => (m._id || m) === user._id))
    : clubs;

  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ─── Hero Banner with VGU Campus, Clubs Title & Controls ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FDF3ED] via-[#FCEAE1] to-[#F8DDD0] dark:from-[#1E1715] dark:via-[#261D1A] dark:to-[#1C1513] border border-[#F3DFD5] dark:border-amber-950/40 p-5 sm:p-7 shadow-xs">
        {/* Right background: Real Vivekananda Global University (VGU) campus photo */}
        <div className="absolute right-0 top-0 bottom-0 w-3/5 lg:w-[55%] xl:w-[58%] pointer-events-none overflow-hidden select-none">
          <img
            src="/images/vgu_campus_real.jpg?v=3"
            alt="Vivekananda Global University (VGU) Campus"
            className="w-full h-full object-cover object-[center_88%] opacity-90 dark:opacity-40 transition-all"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
            }}
          />
        </div>

        {/* ─── Top Row: Campus AI, Theme Toggle & Profile ─── */}
        <div className="flex items-center justify-end gap-2.5 relative z-10">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/90 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 text-indigo-600 dark:text-amber-400 shadow-xs border border-white/60 dark:border-white/10 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <Link
            to="/assistant"
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <span>Campus AI</span>
          </Link>

          {user && (
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-[#EDE7E3] dark:bg-slate-700 text-[#1E1917] dark:text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-gray-300/80 dark:border-slate-600 shadow-xs hover:scale-105 transition-all cursor-pointer"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(user.name || user.email || 'V').charAt(0).toUpperCase()}</span>
              )}
            </Link>
          )}
        </div>

        {/* ─── Middle Row: Title & Slogan ─── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 my-4 sm:my-5">
          <div className="max-w-xl">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8E7E7A] dark:text-amber-200/70 mb-1">
              CAMPUS CLUBS & SOCIETIES
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
              Campus <span className="text-[#E95E38]">Clubs & Societies</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
              Explore tech communities, cultural clubs, sports teams, and campus events at Vivekananda Global University.
            </p>
          </div>

          {/* Angled handwritten slogan */}
          <div className="hidden lg:flex flex-col items-start -rotate-8 select-none my-auto pr-8 xl:pr-20">
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Learn
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Network
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Belong
            </span>
            <svg className="w-24 h-2.5 mt-0.5 text-[#E95E38]" viewBox="0 0 100 8" fill="none">
              <path d="M 2 5 C 30 2, 70 3, 98 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ─── Bottom Row: Category Tabs, Search & Register Club Button ─── */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { label: 'All Clubs', value: '' },
              { label: 'Tech & Coding', value: 'tech' },
              { label: 'Cultural & Drama', value: 'cultural' },
              { label: 'Sports & Athletics', value: 'sports' },
              { label: 'Academic & Research', value: 'academic' },
              { label: 'Arts & Media', value: 'arts' },
              { label: 'Social & NGO', value: 'social' },
            ].map((tab) => {
              const isSelected = categoryFilter === tab.value && !onlyMyClubs;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setOnlyMyClubs(false);
                    setCategoryFilter(tab.value);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E95E38] text-white font-bold shadow-xs'
                      : 'bg-white/90 dark:bg-black/30 hover:bg-white text-gray-800 dark:text-slate-200 font-semibold shadow-2xs border border-white/60 dark:border-white/10 hover:shadow-xs'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {user && (
              <button
                type="button"
                onClick={() => {
                  setOnlyMyClubs(!onlyMyClubs);
                  if (!onlyMyClubs) setCategoryFilter('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  onlyMyClubs
                    ? 'bg-[#E95E38] text-white font-bold shadow-xs'
                    : 'bg-white/90 dark:bg-black/30 hover:bg-white text-gray-800 dark:text-slate-200 font-semibold shadow-2xs border border-white/60 dark:border-white/10 hover:shadow-xs'
                }`}
              >
                <span>Joined ({myClubsCount})</span>
              </button>
            )}
          </div>

          {/* Search Input & Register Club Button */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex-1 lg:flex-initial flex items-center bg-white/95 dark:bg-[#151D2C]/95 backdrop-blur-xs border border-[#F0DDD3] dark:border-slate-700/80 rounded-full px-4 py-2 shadow-xs w-full sm:w-64 md:w-72 transition-all focus-within:ring-2 focus-within:ring-[#E95E38]/40">
              <Search className="w-4 h-4 text-[#8E7E7A] mr-2.5 flex-shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clubs, societies, leads..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#1D1819] dark:text-white placeholder-[#8E7E7A] font-medium focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#8E7E7A] hover:text-[#1D1819] p-0.5 ml-1 cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Club</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Search Filter Banner */}
      {search && (
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#BCB5A3]/20 border border-[#BCB5A3]/40 text-xs sm:text-sm text-[#1D1819] dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#1D1819] dark:text-amber-300" />
            <span>Showing results for: <strong>"{search}"</strong></span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* ─── Clubs Feed (Full Width, Matching Home) ─── */}
      <div className="w-full space-y-4">
        {loading ? (
          <LoadingSpinner message="Loading campus clubs..." />
        ) : displayedClubs.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center mx-auto shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-gray-950 tracking-tight">
              {onlyMyClubs ? "You haven't joined any clubs yet" : 'No clubs found'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto font-normal">
              {onlyMyClubs
                ? "Browse all clubs and click 'Join Club' to get involved!"
                : 'Try adjusting your search keywords or topic filter.'}
            </p>
            {onlyMyClubs ? (
              <button
                onClick={() => setOnlyMyClubs(false)}
                className="font-display inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] hover:bg-black text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md cursor-pointer active:scale-95"
              >
                Browse All Clubs
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="font-display inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] hover:bg-black text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Register Club
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5 w-full">
            {displayedClubs.map((club) => {
              const isCreator = Boolean(
                club.isAdmin ||
                (user && String(club.createdBy?._id || club.createdBy) === String(user._id))
              );
              const isMember =
                user &&
                (club.members || []).some(
                  (m) => (m._id || m) === user._id
                );
              const catStyle = getCategoryStyle(club.category);

              return (
                <div
                  key={club._id}
                  onClick={() => setSelectedClub(club)}
                  className="w-full bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800/90 hover:border-[#E95E38]/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 ease-out space-y-4 sm:space-y-5 shadow-xs hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative"
                >
                  {/* Top: Club Icon + Name & Category Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
                        <ClubLogo category={club.category} name={club.name} image={club.image} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg sm:text-xl text-gray-950 dark:text-white group-hover:text-[#E95E38] dark:group-hover:text-[#F3704B] transition-colors leading-snug tracking-tight truncate">
                          {club.name}
                        </h3>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium block mt-0.5">
                          {catStyle.label}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono-code text-[10.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex-shrink-0 shadow-2xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700">
                      {club.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed font-normal">
                    {club.description || 'Official campus community for collaboration, technical discussions, and student activities.'}
                  </p>

                  {/* Tags / Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-medium text-xs px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200/60 dark:border-slate-700">
                      {catStyle.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300 bg-gray-100/70 dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium ml-auto">
                      <Users className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                      <span>{club.memberCount || (club.members || []).length} Members</span>
                    </span>
                  </div>

                  {/* Bottom Footer: Lead / Creator info & Action Button */}
                  <div className="pt-4 sm:pt-5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EDE7E3] to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-[#F0DDD3] dark:border-slate-700 flex items-center justify-center font-bold text-gray-700 dark:text-slate-200 flex-shrink-0 text-xs shadow-2xs">
                        {club.createdBy?.name ? club.createdBy.name[0].toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {club.createdBy?.name ? `Led by ${club.createdBy.name}` : 'Campus Society'}
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-slate-400 truncate">
                          {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : 'Active Society'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isCreator && (
                        <button
                          onClick={() => handleDelete(club)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Club"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {isMember ? (
                        <button
                          onClick={() => handleLeave(club._id)}
                          className="font-display px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-gray-200 dark:border-slate-700 hover:border-rose-200 transition-all cursor-pointer active:scale-95"
                        >
                          Joined (Leave)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(club._id)}
                          className="font-display px-5 py-2 rounded-xl text-xs font-bold tracking-tight bg-[#E95E38] hover:bg-[#D7522D] text-white shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          Join Club
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Club Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register a Campus Club or Society"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Club / Society Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. ACM Student Chapter or Campus Robotics Club"
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 focus:outline-none cursor-pointer"
            >
              <option value="tech">Tech & Coding</option>
              <option value="cultural">Cultural & Drama</option>
              <option value="sports">Sports & Athletics</option>
              <option value="academic">Academic & Research</option>
              <option value="arts">Arts & Photography</option>
              <option value="social">Social & NGO</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Description & Activities
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this club does, regular meetups, activities..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Club Logo / Badge (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-[#E95E38] hover:bg-[#D7522D] text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
            >
              {actionLoading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Club Details Modal (Clickable Club Card) ─── */}
      {selectedClub && (
        <Modal
          isOpen={Boolean(selectedClub)}
          onClose={() => setSelectedClub(null)}
          title={selectedClub.name}
        >
          <div className="space-y-6">
            {/* Top: Icon + Title + Category Badge */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <ClubLogo category={selectedClub.category} name={selectedClub.name} image={selectedClub.image} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-950 dark:text-white leading-tight">
                  {selectedClub.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {getCategoryStyle(selectedClub.category).label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
                    <Users className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                    <span>{selectedClub.memberCount || (selectedClub.members || []).length} Members</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                About Club & Activities
              </h4>
              <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800">
                {selectedClub.description || 'Official campus community for collaboration, technical discussions, and student activities.'}
              </p>
            </div>

            {/* Club Leadership */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 flex items-center justify-center font-bold text-gray-900 dark:text-white text-sm flex-shrink-0">
                  {selectedClub.createdBy?.name ? selectedClub.createdBy.name[0].toUpperCase() : 'C'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Club Organizer / Lead</p>
                  <p className="text-sm font-bold text-gray-950 dark:text-white truncate">
                    {selectedClub.createdBy?.name || 'Campus Student Council'}
                  </p>
                </div>
              </div>

              {user && String(selectedClub.createdBy?._id || selectedClub.createdBy) !== String(user._id) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClub(null);
                    handleMessageLead(selectedClub);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800/60 transition-all cursor-pointer flex-shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Lead</span>
                </button>
              )}
            </div>

            {/* Bottom Actions: Join/Leave & Close */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div>
                {Boolean(
                  selectedClub.isAdmin ||
                  (user && String(selectedClub.createdBy?._id || selectedClub.createdBy) === String(user._id))
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedClub;
                      setSelectedClub(null);
                      handleDelete(c);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Club
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClub(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 cursor-pointer"
                >
                  Close
                </button>

                {user && (selectedClub.members || []).some((m) => (m._id || m) === user._id) ? (
                  <button
                    type="button"
                    onClick={() => handleLeave(selectedClub._id)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-all cursor-pointer active:scale-95"
                  >
                    Leave Club
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(selectedClub._id)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#E95E38] hover:bg-[#D7522D] text-white shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    Join Club
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
