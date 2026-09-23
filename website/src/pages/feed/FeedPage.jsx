import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { eventService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationBell from '../../components/NotificationBell';
import {
  Compass,
  Plus,
  Search,
  Users,
  Calendar,
  Heart,
  MessageSquare,
  Sparkles,
  Send,
  Sun,
  Moon,
  ChevronDown,
  X,
  Zap,
  Music,
  Trophy,
  MapPin,
  List,
  LayoutGrid,
  CheckCircle,
  User,
  LogOut,
  ArrowRight,
} from 'lucide-react';

export default function FeedPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoryParam = searchParams.get('category') || '';
  const [category, setCategoryState] = useState(categoryParam);

  const [sortOption, setSortOption] = useState('latest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    setCategoryState(categoryParam);
  }, [categoryParam]);

  const setCategory = (newCat) => {
    setCategoryState(newCat);
    const next = new URLSearchParams(searchParams);
    if (newCat) {
      next.set('category', newCat);
    } else {
      next.delete('category');
    }
    setSearchParams(next, { replace: true });
  };

  const { searchQuery, debouncedSearch, setSearchQuery } = useSearch();

  // Modals & form state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [commentModalPost, setCommentModalPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'hackathon',
    skillsNeeded: '',
    teamSize: 4,
    deadline: '',
    imageUrl: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Auto-open create modal if navigated with ?create=true
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateModalOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  // Listen for create post shortcut from sidebar
  useEffect(() => {
    const handleOpen = () => setCreateModalOpen(true);
    window.addEventListener('open-create-post', handleOpen);
    return () => window.removeEventListener('open-create-post', handleOpen);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await eventService.getEvents(params);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, debouncedSearch]);

  // Handle Create Event
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...newPost,
        teamSize: Number(newPost.teamSize) || 2,
        skillsNeeded: newPost.skillsNeeded
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: newPost.deadline || undefined,
      };
      await eventService.createEvent(payload);
      setCreateModalOpen(false);
      setNewPost({
        title: '',
        description: '',
        category: 'hackathon',
        skillsNeeded: '',
        teamSize: 4,
        deadline: '',
        imageUrl: '',
      });
      setFeedback({ type: 'success', message: 'Opportunity posted successfully!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to create post');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Apply to Event
  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      await eventService.applyToEvent(selectedEvent._id, applyMessage);
      setApplyModalOpen(false);
      setApplyMessage('');
      setFeedback({ type: 'success', message: 'Application submitted! The team host has been notified.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to apply');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Like / Heart
  const handleToggleLike = async (eventId) => {
    try {
      setEvents((prev) =>
        prev.map((item) => {
          if (item._id !== eventId) return item;
          const currentLikes = item.likes || [];
          const currentUserId = user?._id;
          const hasLiked = currentLikes.some((id) => (id._id || id) === currentUserId);
          const nextLikes = hasLiked
            ? currentLikes.filter((id) => (id._id || id) !== currentUserId)
            : [...currentLikes, currentUserId];
          return { ...item, likes: nextLikes };
        })
      );
      await eventService.toggleLike(eventId);
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  // Add comment
  const handleAddComment = async (eventId) => {
    if (!commentText.trim()) return;
    try {
      const res = await eventService.addComment(eventId, commentText);
      const textAdded = commentText;
      setCommentText('');
      if (commentModalPost && commentModalPost._id === eventId) {
        setCommentModalPost((prev) => ({
          ...prev,
          comments: res.data?.comments || [
            ...(prev.comments || []),
            {
              user: { name: user?.name, avatar: user?.avatar },
              text: textAdded,
              createdAt: new Date(),
            },
          ],
        }));
      }
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  // Topic-accurate image resolution helper
  const getCardImage = (post) => {
    if (post.imageUrl) return post.imageUrl;
    const title = (post.title || '').toLowerCase();
    const desc = (post.description || '').toLowerCase();
    const skills = (post.skillsNeeded || []).join(' ').toLowerCase();
    const cat = (post.category || '').toLowerCase();
    const text = `${title} ${desc} ${skills} ${cat}`;

    // 1. Smart India Hackathon
    if (text.includes('smart india') || text.includes('sih')) {
      return '/images/sih_hackathon.jpg';
    }
    // 2. Formula Student EV & Battery
    if (text.includes('formula') || text.includes('bms') || text.includes('battery management') || text.includes('race car') || text.includes('racing') || text.includes('vehicle dynamics')) {
      return '/images/formula_ev_car.jpg';
    }
    // 3. IoT, RFID, Sensors & Hardware
    if (text.includes('iot') || text.includes('rfid') || text.includes('esp32') || text.includes('arduino') || text.includes('sensor') || text.includes('hardware')) {
      return '/images/iot_hardware.jpg';
    }
    // 4. Music, Bands & Cultural Shows
    if (text.includes('band') || text.includes('guitar') || text.includes('drummer') || text.includes('percussion') || text.includes('music') || text.includes('singing')) {
      return '/images/music_band.jpg';
    }
    // 5. AI Placement Prep & Mock Interview Bot
    if (text.includes('interview') || text.includes('placement prep') || text.includes('mock interview') || text.includes('interview bot')) {
      return '/images/ai_interview.jpg';
    }
    // 6. Google Solution Challenge & Disaster Co-ordination
    if (text.includes('google solution') || text.includes('disaster') || text.includes('flood') || text.includes('rescue route') || text.includes('mesh network')) {
      return '/images/google_solution.jpg';
    }
    // 7. Drone, UAV & Robotics
    if (text.includes('drone') || text.includes('uav') || text.includes('quadcopter') || text.includes('obstacle avoidance') || text.includes('px4') || text.includes('robot')) {
      return '/images/drone_robotics.jpg';
    }
    // 8. NASA Space Apps Challenge & Satellite Data
    if (text.includes('space') || text.includes('nasa') || text.includes('satellite') || text.includes('earth observation') || text.includes('copernicus')) {
      return '/images/space_satellite.jpg';
    }
    // 9. Short Film & Cinema Cultural Showcases
    if (text.includes('film') || text.includes('drama') || text.includes('cinema') || text.includes('actor') || text.includes('clapperboard') || text.includes('movie')) {
      return '/images/filmmaking_camera.jpg';
    }
    // 10. Medical Imaging, Radiology & Healthcare AI
    if (text.includes('medical') || text.includes('x-ray') || text.includes('chest') || text.includes('radiology') || text.includes('healthcare') || text.includes('diagnosis')) {
      return '/images/medical_imaging.jpg';
    }
    // 11. CyberSecurity, CTF & Ethical Hacking
    if (text.includes('cyber') || text.includes('ctf') || text.includes('security') || text.includes('hacking') || text.includes('penetration') || text.includes('reverse engineering')) {
      return '/images/cybersecurity_terminal.jpg';
    }
    // 12. Sustainability, Tree Plantation & Nature
    if (text.includes('sustainability') || text.includes('tree plantation') || text.includes('green') || text.includes('tree') || text.includes('environmental') || text.includes('plantation')) {
      return '/images/plant_seedling.jpg';
    }
    // 13. General Coding, Web & Mobile Dev
    return '/images/laptop_code.jpg';
  };

  // CTA button label helper
  const getCardActionLabel = (post) => {
    const title = (post.title || '').toLowerCase();
    const cat = (post.category || '').toLowerCase();
    if (title.includes('band') || cat === 'cultural') return 'Join Now →';
    if (title.includes('sustainability') || title.includes('volunteer')) return "I'm Interested →";
    return 'Apply Now →';
  };

  // Category badge styling helper
  const getCategoryBadge = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'hackathon':
        return {
          label: 'Hackathon',
          icon: Zap,
          bg: 'bg-[#FDF1EC]',
          text: 'text-[#E8582C]',
        };
      case 'cultural':
        return {
          label: 'Cultural',
          icon: Music,
          bg: 'bg-[#FDEEF2]',
          text: 'text-[#D9386E]',
        };
      case 'project':
        return {
          label: 'Project Teams',
          icon: Users,
          bg: 'bg-[#EDF7F2]',
          text: 'text-[#1E824C]',
        };
      case 'competition':
        return {
          label: 'Competition',
          icon: Trophy,
          bg: 'bg-[#FEF7ED]',
          text: 'text-[#D97706]',
        };
      default:
        return {
          label: category || 'Opportunity',
          icon: Sparkles,
          bg: 'bg-[#F3EFEA]',
          text: 'text-[#5C504D]',
        };
    }
  };

  // Date formatting helper: DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '18/09/2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Sorting logic
  const sortedEvents = [...events].sort((a, b) => {
    if (sortOption === 'deadline') {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    }
    if (sortOption === 'team') {
      return (b.teamSize || 0) - (a.teamSize || 0);
    }
    // Default: latest created
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── TOP HEADER BAR ─── */}
      <div className="flex items-center justify-between gap-4 relative">
        {/* Search Bar with Embedded Filters pill */}
        <div className="flex-1 max-w-2xl relative">
          <div className="flex items-center bg-white dark:bg-[#1C1614] border border-[#E8DEC9] dark:border-[#382823] rounded-full px-4 py-2.5 shadow-2xs transition-all focus-within:ring-2 focus-within:ring-[#EE5933]/30">
            <Search className="w-4 h-4 text-[#8E7E7A] mr-3 shrink-0 stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, skills or opportunities..."
              className="w-full bg-transparent text-sm text-[#221614] dark:text-white placeholder-[#9C8E86] font-normal focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#9C8E86] hover:text-[#221614] p-0.5 mr-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Utility Bar: Theme Toggle, Notifications, User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/10 text-[#4A3E3C] dark:text-slate-200 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 stroke-[2]" />
            ) : (
              <Moon className="w-5 h-5 text-[#4A3E3C] stroke-[2]" />
            )}
          </button>

          {/* Interactive Notifications Bell */}
          <NotificationBell />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#E5DACB] text-[#221614] font-bold text-xs flex items-center justify-center border border-[#D5C6B5] shadow-2xs">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{(user?.name || 'Vikash').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="font-semibold text-sm text-[#221614] dark:text-white hidden sm:inline">
                {user?.name || 'Vikash'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E7E7A] stroke-[2.5]" />
            </button>

            {/* Profile Menu Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1C1614] border border-[#E8DEC9] dark:border-[#382823] rounded-2xl py-2 shadow-xl z-30 animate-in fade-in duration-150">
                <Link
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#221614] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <User className="w-3.5 h-3.5 text-[#8E7E7A]" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/assistant"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#EE5933] hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#EE5933]" />
                  <span>Campus AI</span>
                </Link>
                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── HERO BANNER: DISCOVER OPPORTUNITIES ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FDF3ED] via-[#FCEAE1] to-[#F8DDD0] dark:from-[#1E1715] dark:via-[#261D1A] dark:to-[#1C1513] border border-[#F3DFD5] dark:border-amber-950/40 p-6 sm:p-8 lg:p-10 shadow-xs min-h-[340px] sm:min-h-[360px] lg:min-h-[380px] flex flex-col justify-between">
        {/* Real Campus Photo on the Right - Expansive view matching Clubs page */}
        <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-[62%] md:w-[60%] lg:w-[62%] xl:w-[65%] pointer-events-none select-none overflow-hidden">
          <img
            src="/images/vgu_campus_real.jpg?v=5"
            alt="Vivekananda Global University (VGU) Campus"
            className="w-full h-full object-cover object-[center_88%] opacity-90 dark:opacity-40 transition-all"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
            }}
          />
        </div>

        {/* Cursive Handwriting Slogan over Image */}
        <div className="hidden lg:flex flex-col items-start -rotate-8 select-none absolute right-24 xl:right-36 top-10 z-10 pointer-events-none drop-shadow-sm">
          <span className="font-['Caveat'] text-2xl lg:text-3xl xl:text-4xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
            People
          </span>
          <span className="font-['Caveat'] text-2xl lg:text-3xl xl:text-4xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
            Ideas
          </span>
          <span className="font-['Caveat'] text-2xl lg:text-3xl xl:text-4xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
            Possibilities
          </span>
          <svg className="w-24 h-2.5 mt-0.5 text-[#EE5933]" viewBox="0 0 100 8" fill="none">
            <path d="M 2 5 C 30 2, 70 3, 98 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Left Side: Headline & Description */}
        <div className="relative z-10 max-w-xl space-y-2 mb-8">
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8E7E7A] dark:text-amber-200/70 mb-1">
            — OPPORTUNITIES AWAIT
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
            Discover <span className="text-[#EE5933]">Opportunities</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
            Find hackathons, project teams, competitions and more across Vivekananda Global University.
          </p>
        </div>

        {/* Bottom Filter Tabs inside Hero Banner */}
        <div className="relative z-10 flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar pt-4">
          {[
            { label: 'All Topics', value: '' },
            { label: 'Hackathons', value: 'hackathon' },
            { label: 'Project Teams', value: 'project' },
            { label: 'Competitions', value: 'competition' },
            { label: 'Cultural', value: 'cultural' },
          ].map((tab) => {
            const active = category === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCategory(tab.value)}
                className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                  active
                    ? 'text-[#EE5933] font-bold'
                    : 'text-[#6E615D] dark:text-slate-300 hover:text-[#1E1917] dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EE5933] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
              : 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
          }`}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ─── LATEST OPPORTUNITIES SECTION HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1917] dark:text-white tracking-tight">
            Latest Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6E6A] dark:text-slate-400 font-normal mt-0.5">
            Explore and be a part of amazing opportunities around your campus.
          </p>
        </div>

        {/* Sort & View Toggle Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="bg-white dark:bg-[#1C1614] border border-[#E5DACB] dark:border-[#382823] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-[#221614] dark:text-white flex items-center gap-2 shadow-2xs cursor-pointer hover:border-[#D5C6B5]"
            >
              <span>
                Sort by:{' '}
                <strong className="font-semibold">
                  {sortOption === 'deadline'
                    ? 'Deadline Soonest'
                    : sortOption === 'team'
                    ? 'Team Size'
                    : 'Latest'}
                </strong>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E7E7A] stroke-[2.5]" />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1C1614] border border-[#E5DACB] dark:border-[#382823] rounded-xl py-1.5 shadow-xl z-20 animate-in fade-in duration-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSortOption('latest');
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium cursor-pointer ${
                    sortOption === 'latest' ? 'text-[#EE5933] bg-[#FEF4F0]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOption('deadline');
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium cursor-pointer ${
                    sortOption === 'deadline' ? 'text-[#EE5933] bg-[#FEF4F0]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Deadline Soonest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOption('team');
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 font-medium cursor-pointer ${
                    sortOption === 'team' ? 'text-[#EE5933] bg-[#FEF4F0]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Team Size
                </button>
              </div>
            )}
          </div>

          {/* View Mode Switcher (List vs Grid) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'border-[#EE5933] bg-[#FEF4F0] text-[#EE5933] shadow-2xs'
                  : 'border-[#E5DACB] dark:border-[#382823] text-[#8E7E7A] hover:text-[#1E1917] bg-white dark:bg-[#1C1614]'
              }`}
              title="List view"
            >
              <List className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'border-[#EE5933] bg-[#FEF4F0] text-[#EE5933] shadow-2xs'
                  : 'border-[#E5DACB] dark:border-[#382823] text-[#8E7E7A] hover:text-[#1E1917] bg-white dark:bg-[#1C1614]'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── POSTS FEED (LIST & GRID VIEWS) ─── */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner message="Fetching campus opportunities..." />
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1614] border border-[#E8DEC9] dark:border-[#382823] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF4F0] text-[#EE5933] flex items-center justify-center mx-auto shadow-2xs">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#1E1917] dark:text-white tracking-tight">
            No opportunities found
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto font-normal">
            {searchQuery || category
              ? 'Try adjusting your search keywords or topic filter.'
              : 'Be the first to create a team opportunity for hackathons or campus projects!'}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#EE5933] hover:bg-[#E04B26] text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create Post
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── LIST VIEW (Exact Mockup Layout) ─── */
        <div className="space-y-4 sm:space-y-5">
          {sortedEvents.map((post) => {
            const categoryBadge = getCategoryBadge(post.category);
            const CatIcon = categoryBadge.icon;
            const cardImg = getCardImage(post);
            const actionLabel = getCardActionLabel(post);
            const isLiked = (post.likes || []).some((id) => (id._id || id) === user?._id);
            const likeCount = (post.likes || []).length;
            const isOwner = user && post.createdBy?._id === user._id;

            return (
              <div
                key={post._id}
                className="w-full bg-white dark:bg-[#1C1614] border border-[#EADBCE]/80 dark:border-[#332520] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row items-stretch gap-5 group relative"
              >
                {/* Left Thumbnail Image */}
                <div className="w-full md:w-48 lg:w-52 h-40 md:h-auto rounded-xl overflow-hidden shrink-0 bg-[#F5EFEA] relative">
                  <img
                    src={cardImg}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                  {/* Top Row: Title + Category Pill */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <h3 className="font-bold text-[17px] sm:text-[19px] text-[#1E1917] dark:text-white leading-snug group-hover:text-[#EE5933] transition-colors">
                      {post.title}
                    </h3>

                    {/* Category Badge */}
                    <span
                      onClick={() => setCategory(post.category)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${categoryBadge.bg} ${categoryBadge.text} shrink-0 cursor-pointer select-none hover:opacity-90`}
                      title={`Filter by ${categoryBadge.label}`}
                    >
                      <CatIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>{categoryBadge.label}</span>
                    </span>
                  </div>

                  {/* Second Row: Description + Deadline */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <p className="text-xs sm:text-[13px] text-[#6E615D] dark:text-slate-300 line-clamp-2 leading-relaxed font-normal">
                      {post.description}
                    </p>

                    {/* Deadline on the right */}
                    <div className="flex items-center gap-1.5 text-xs text-[#8E7E7A] dark:text-slate-400 font-medium shrink-0 lg:ml-4">
                      <Calendar className="w-3.5 h-3.5 text-[#EE5933]" />
                      <span>Deadline: {formatDate(post.deadline)}</span>
                    </div>
                  </div>

                  {/* Third Row: Skill Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {(post.skillsNeeded || []).slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-[#F5EFE9] dark:bg-white/10 text-xs text-[#5C504D] dark:text-slate-200 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {(post.skillsNeeded || []).length > 4 && (
                      <span className="px-2.5 py-1 rounded-full bg-[#F5EFE9] dark:bg-white/10 text-xs text-[#8E7E7A] dark:text-slate-400 font-medium">
                        +{(post.skillsNeeded || []).length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Bottom Row: Author info & Team/Comments/Likes/CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#F0EAE3] dark:border-white/5">
                    {/* Author Details */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#FCEAE1] text-[#A63C1E] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {post.createdBy?.avatar ? (
                          <img
                            src={post.createdBy.avatar}
                            alt={post.createdBy.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{(post.createdBy?.name || 'S').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-[#1E1917] dark:text-white truncate leading-none">
                          {post.createdBy?.name || 'Campus Student'}
                        </p>
                        <p className="text-[11px] text-[#9C8E86] font-normal leading-none mt-1">
                          {post.createdBy?.branch || 'CSE'} • {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Team Pill, Comments, Likes & CTA Button */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      {/* Team Size Pill */}
                      <span className="px-3 py-1 rounded-full bg-[#EDF7F2] dark:bg-emerald-950/40 text-[#1E824C] dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 select-none">
                        <Users className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Team of {post.teamSize || 4}</span>
                      </span>

                      {/* Comments */}
                      <button
                        type="button"
                        onClick={() => setCommentModalPost(post)}
                        className="flex items-center gap-1.5 text-xs text-[#7A6E6A] hover:text-[#1E1917] dark:hover:text-white transition-colors cursor-pointer"
                        title="View comments"
                      >
                        <MessageSquare className="w-4 h-4 stroke-[1.8]" />
                        <span className="font-medium">{post.comments?.length || 0}</span>
                      </button>

                      {/* Likes */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post._id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                          isLiked
                            ? 'text-rose-600'
                            : 'text-[#7A6E6A] hover:text-rose-600'
                        }`}
                        title="Like post"
                      >
                        <Heart
                          className={`w-4 h-4 ${isLiked ? 'fill-rose-600 stroke-rose-600' : 'stroke-[1.8]'}`}
                        />
                        <span className="font-medium">{likeCount}</span>
                      </button>

                      {/* Primary CTA Button */}
                      {isOwner ? (
                        <Link
                          to={`/events/${post._id}`}
                          className="px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#2E201C] hover:bg-[#1F1614] text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Manage
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEvent(post);
                            setApplyModalOpen(true);
                          }}
                          className="px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#EE5933] hover:bg-[#E04B26] active:scale-95 text-white shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{actionLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── GRID VIEW (Responsive 3-Column Layout) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((post) => {
            const categoryBadge = getCategoryBadge(post.category);
            const CatIcon = categoryBadge.icon;
            const cardImg = getCardImage(post);
            const actionLabel = getCardActionLabel(post);
            const isLiked = (post.likes || []).some((id) => (id._id || id) === user?._id);
            const likeCount = (post.likes || []).length;
            const isOwner = user && post.createdBy?._id === user._id;

            return (
              <div
                key={post._id}
                className="bg-white dark:bg-[#1C1614] border border-[#EADBCE]/80 dark:border-[#332520] rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Image */}
                  <div className="w-full h-44 overflow-hidden relative bg-[#F5EFEA]">
                    <img
                      src={cardImg}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      onClick={() => setCategory(post.category)}
                      className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs ${categoryBadge.bg} ${categoryBadge.text} cursor-pointer select-none`}
                    >
                      <CatIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>{categoryBadge.label}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-[#1E1917] dark:text-white leading-snug group-hover:text-[#EE5933] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#6E615D] dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-[#8E7E7A] dark:text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#EE5933]" />
                      <span>Deadline: {formatDate(post.deadline)}</span>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(post.skillsNeeded || []).slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-[#F5EFE9] dark:bg-white/10 text-[11px] text-[#5C504D] dark:text-slate-200 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-3 border-t border-[#F0EAE3] dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#FCEAE1] text-[#A63C1E] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {(post.createdBy?.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-[#1E1917] dark:text-white truncate">
                        {post.createdBy?.name || 'Campus Student'}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-[#EDF7F2] dark:bg-emerald-950/40 text-[#1E824C] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3" /> Team of {post.teamSize || 4}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCommentModalPost(post)}
                        className="flex items-center gap-1 text-xs text-[#7A6E6A] hover:text-[#1E1917] cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post._id)}
                        className={`flex items-center gap-1 text-xs cursor-pointer ${
                          isLiked ? 'text-rose-600' : 'text-[#7A6E6A] hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                        <span>{likeCount}</span>
                      </button>
                    </div>

                    {isOwner ? (
                      <Link
                        to={`/events/${post._id}`}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2E201C] text-white"
                      >
                        Manage
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEvent(post);
                          setApplyModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EE5933] hover:bg-[#E04B26] text-white transition-colors cursor-pointer"
                      >
                        {actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE OPPORTUNITY MODAL ─── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Team Opportunity"
        maxWidth="max-w-xl"
        isLight={true}
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Title
            </label>
            <input
              type="text"
              required
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="e.g. Smart India Hackathon 2026: Need Frontend & ML Teammates"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#EE5933]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Description &amp; Requirements
            </label>
            <textarea
              required
              rows={3}
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
              placeholder="Describe the opportunity, goals, and who you are looking for..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#EE5933]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
                Category
              </label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#EE5933]"
              >
                <option value="hackathon">Hackathon</option>
                <option value="cultural">Cultural</option>
                <option value="project">Project Teams</option>
                <option value="competition">Competition</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
                Team Size Needed
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={newPost.teamSize}
                onChange={(e) => setNewPost({ ...newPost, teamSize: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#EE5933]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Required Skills (Comma separated)
            </label>
            <input
              type="text"
              value={newPost.skillsNeeded}
              onChange={(e) => setNewPost({ ...newPost, skillsNeeded: e.target.value })}
              placeholder="React, Tailwind, AI/ML, PyTorch"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#EE5933]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Deadline
            </label>
            <input
              type="date"
              value={newPost.deadline}
              onChange={(e) => setNewPost({ ...newPost, deadline: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#EE5933]"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#EE5933] hover:bg-[#E04B26] text-white shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {actionLoading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── APPLY MODAL ─── */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply to "${selectedEvent?.title}"`}
        isLight={true}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Introduce yourself and tell the team host why you are a great fit!
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Pitch / Message
            </label>
            <textarea
              required
              rows={4}
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Hi! I am interested in joining your team for SIH 2026. I have experience with React and AI models..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#EE5933]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#EE5933] hover:bg-[#E04B26] text-white shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {actionLoading ? 'Submitting...' : 'Send Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── COMMENTS / DISCUSSION MODAL ─── */}
      <Modal
        isOpen={!!commentModalPost}
        onClose={() => setCommentModalPost(null)}
        title={`Discussion (${commentModalPost?.comments?.length || 0})`}
        maxWidth="max-w-lg"
        isLight={true}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-sm text-gray-950 line-clamp-1">{commentModalPost?.title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Host: <span className="font-semibold text-gray-800">{commentModalPost?.createdBy?.name || 'Student'}</span>
            </p>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {commentModalPost?.comments && commentModalPost.comments.length > 0 ? (
              commentModalPost.comments.map((comment, idx) => (
                <div key={idx} className="flex gap-2.5 text-xs bg-white border border-gray-200/80 p-3 rounded-2xl shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#FCEAE1] text-[#A63C1E] font-bold flex items-center justify-center shrink-0 text-xs">
                    {comment.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-gray-950">{comment.user?.name || 'Student'}</span>
                    <p className="text-gray-600 leading-relaxed font-normal">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-gray-400">
                No comments yet. Start the conversation!
              </p>
            )}
          </div>

          {user && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(commentModalPost._id);
                  }
                }}
                placeholder="Ask a question or share a thought..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#EE5933]"
              />
              <button
                type="button"
                onClick={() => handleAddComment(commentModalPost._id)}
                className="px-4 py-2.5 rounded-xl bg-[#EE5933] hover:bg-[#E04B26] text-white font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
