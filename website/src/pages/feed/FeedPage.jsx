import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { eventService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Compass,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Send,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Check,
  Trophy,
  Zap,
  Music,
  SlidersHorizontal,
  Sun,
  Moon,
  X,
  Theater,
  Briefcase,
  ShoppingBag,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoryParam = searchParams.get('category') || '';
  const [category, setCategoryState] = useState(categoryParam);

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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Auto-open create modal if navigated with ?create=true
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateModalOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  // Modals & form state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [commentModalPost, setCommentModalPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [expandedPosts, setExpandedPosts] = useState({});

  const toggleExpandPost = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'hackathon',
    skillsNeeded: '',
    teamSize: 2,
    deadline: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

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
        teamSize: Number(newPost.teamSize),
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
        teamSize: 2,
        deadline: '',
      });
      setFeedback({ type: 'success', message: 'Post published successfully!' });
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
      setFeedback({ type: 'success', message: 'Your application has been sent to the poster!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to apply');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Interest toggle
  const handleInterest = async (eventId) => {
    try {
      await eventService.expressInterest(eventId);
      fetchEvents();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ─── Hero Banner with VGU Campus, Opportunities Title & Filter Bar ─── */}
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

          <Link
            to="/skill-match"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white dark:bg-slate-800 text-[#E95E38] text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer border border-[#E95E38]/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E95E38]" />
            <span>AI Skill Match</span>
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

        {/* ─── Middle Row: Title & Handwritten Slogan ─── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 my-4 sm:my-5">
          <div className="max-w-xl">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8E7E7A] dark:text-amber-200/70 mb-1">
              OPPORTUNITIES
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
              Discover <span className="text-[#E95E38]">Opportunities</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
              Find hackathons, project teams, competitions and more across your campus.
            </p>
          </div>

          {/* Angled handwritten slogan matching mockup */}
          <div className="hidden lg:flex flex-col items-start -rotate-8 select-none my-auto pr-8 xl:pr-20">
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Ideas
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              People
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Possibilities
            </span>
            <svg className="w-24 h-2.5 mt-0.5 text-[#E95E38]" viewBox="0 0 100 8" fill="none">
              <path d="M 2 5 C 30 2, 70 3, 98 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ─── Bottom Row: Category Tabs & Search/Filter Controls ─── */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { label: 'All Topics', value: '' },
              { label: 'Hackathons', value: 'hackathon', icon: Zap, iconColor: 'text-purple-500' },
              { label: 'Project Teams', value: 'project', icon: Users, iconColor: 'text-cyan-600' },
              { label: 'Competitions', value: 'competition', icon: Trophy, iconColor: 'text-amber-500' },
              { label: 'Cultural', value: 'cultural', icon: Music, iconColor: 'text-pink-500' },
            ].map((tab) => {
              const isSelected = category === tab.value;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setCategory(tab.value)}
                  className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E95E38] text-white font-bold shadow-xs'
                      : 'bg-white/90 dark:bg-black/30 hover:bg-white text-gray-800 dark:text-slate-200 font-semibold shadow-2xs border border-white/60 dark:border-white/10 hover:shadow-xs'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : tab.iconColor}`} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Filter Button */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex-1 lg:flex-initial flex items-center bg-white/95 dark:bg-[#151D2C]/95 backdrop-blur-xs border border-[#F0DDD3] dark:border-slate-700/80 rounded-full px-4 py-2 shadow-xs w-full sm:w-72 md:w-80 lg:w-84 transition-all focus-within:ring-2 focus-within:ring-[#E95E38]/40">
              <Search className="w-4 h-4 text-[#8E7E7A] mr-2.5 flex-shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities, skills, tags..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#1D1819] dark:text-white placeholder-[#8E7E7A] font-medium focus:outline-none"
              />
              {searchQuery && (
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
              type="button"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="p-2.5 rounded-full bg-[#F7C8B8] hover:bg-[#F2B9A6] active:scale-95 text-[#A63C1E] dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-200 shadow-xs transition-all cursor-pointer flex-shrink-0"
              title="Filter settings"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Options Panel */}
        {filterMenuOpen && (
          <div className="relative z-10 mt-4 pt-3 border-t border-[#F0DDD3] dark:border-slate-700/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-[#5C504D] dark:text-slate-300">Quick Filters:</span>
            <button
              type="button"
              onClick={() => { setCategory(''); setSearchQuery(''); }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white cursor-pointer border border-gray-200 dark:border-slate-700"
            >
              Reset All
            </button>
            <span className="text-xs text-[#8E7E7A]">Showing all verified campus posts from Vivekananda Global University (VGU)</span>
          </div>
        )}
      </div>

      {/* Active Search Filter Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#BCB5A3]/20 border border-[#BCB5A3]/40 text-xs sm:text-sm text-[#1D1819] dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#1D1819] dark:text-amber-300" />
            <span>Showing results for: <strong>"{searchQuery}"</strong></span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}


      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
              : 'bg-rose-50 border-rose-200 text-rose-600 font-semibold'
          }`}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ─── Main Feed Posts (Full Width) ─── */}
      <div className="w-full space-y-4">
        {loading ? (
          <LoadingSpinner message="Fetching campus posts..." />
        ) : events.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 text-gray-900 flex items-center justify-center mx-auto shadow-xs">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-gray-950 tracking-tight">No posts found</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto font-normal">
              {search || category
                ? 'Try adjusting your search keywords or topic filter.'
                : 'Be the first one to create a team post for hackathons or projects!'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="font-display inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] hover:bg-black text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Create Post
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-7 w-full my-6">
            {events.map((post) => {
              const isOwner = user && post.createdBy?._id === user._id;
              const hasApplied =
                user &&
                (post.applicants || []).some(
                  (a) => (a.user?._id || a.user) === user._id
                );
              const myApplication =
                user &&
                (post.applicants || []).find(
                  (a) => (a.user?._id || a.user) === user._id
                );

              const categoryConfig = {
                hackathon: {
                  label: 'Hackathon',
                  icon: Zap,
                  style: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
                  iconColor: 'text-purple-600 dark:text-purple-400',
                },
                project: {
                  label: 'Project Team',
                  icon: Users,
                  style: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
                  iconColor: 'text-sky-600 dark:text-sky-400',
                },
                competition: {
                  label: 'Competition',
                  icon: Trophy,
                  style: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
                  iconColor: 'text-amber-600 dark:text-amber-400',
                },
                cultural: {
                  label: 'Cultural',
                  icon: Music,
                  style: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/60',
                  iconColor: 'text-pink-600 dark:text-pink-400',
                },
              };

              const currentCat = categoryConfig[post.category] || {
                label: post.category || 'General',
                icon: Sparkles,
                style: 'bg-[#F5F2EE] dark:bg-slate-800 text-[#554745] dark:text-slate-300 border-[#E8E2DC] dark:border-slate-700',
                iconColor: 'text-[#8E7E7A]',
              };
              const CatIcon = currentCat.icon;

              const isExpanded = !!expandedPosts[post._id];

              // Calculate personal AI skill match
              const userSkillsLower = (user?.skills || []).map((s) => s.toLowerCase());
              const postSkills = post.skillsNeeded || [];
              const matchedCount = postSkills.filter((s) =>
                userSkillsLower.some((u) => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))
              ).length;
              const matchScore = postSkills.length
                ? Math.min(100, Math.round((matchedCount / postSkills.length) * 85 + (matchedCount > 0 ? 15 : 0)))
                : 0;

              return (
                <div
                  key={post._id}
                  onClick={() => toggleExpandPost(post._id)}
                  className="w-full bg-white dark:bg-[#111726] hover:bg-[#FCFAF8] dark:hover:bg-[#141C2E] border border-[#E8E2DC] dark:border-slate-800/80 hover:border-[#D8CEC5] dark:hover:border-slate-700 rounded-3xl p-7 sm:p-8 md:p-9 transition-all duration-300 ease-out shadow-xs hover:shadow-xl hover:shadow-black/[0.04] dark:hover:shadow-black/50 hover:-translate-y-1 group cursor-pointer space-y-5 sm:space-y-6 relative overflow-hidden"
                >
                  {/* Top: Title, Category Badge & Expand Chevron */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <h2 className="font-medium text-[19px] sm:text-[21px] text-[#1E1917] dark:text-[#F3F4F6] group-hover:text-[#E95E38] transition-colors leading-relaxed tracking-normal">
                        {post.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {matchedCount > 0 && (
                        <span
                          title={`AI calculates ${matchScore}% skill compatibility with your profile!`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs animate-pulse"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{matchScore}% Match</span>
                        </span>
                      )}

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategory(post.category);
                        }}
                        title={`Filter by ${currentCat.label}`}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-normal tracking-wide shadow-2xs cursor-pointer hover:brightness-95 transition-all ${currentCat.style}`}
                      >
                        <CatIcon className={`w-3.5 h-3.5 ${currentCat.iconColor}`} />
                        <span>{currentCat.label}</span>
                      </span>

                      <div
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-[#8E7E7A] hover:text-[#1E1917] dark:hover:text-white transition-colors"
                        title={isExpanded ? 'Collapse post description' : 'Click to expand description'}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#E95E38]' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* ─── Expandable Description (Hidden by default, revealed on click) ─── */}
                  {isExpanded && (
                    <div className="pt-2 pb-1 border-t border-[#F0ECE7] dark:border-slate-800/80 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {post.description && (
                        <p className="text-[15px] text-[#4A3E3C] dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line tracking-normal">
                          {post.description}
                        </p>
                      )}

                      {post.skillsNeeded && post.skillsNeeded.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <p className="text-xs font-normal uppercase tracking-wider text-[#8E7E7A] dark:text-slate-400">
                            Required Skills & Expertise:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {post.skillsNeeded.map((skill, i) => (
                              <span
                                key={i}
                                className="text-xs font-normal px-3.5 py-1.5 rounded-full bg-[#F7F4F0] dark:bg-slate-800 text-[#374151] dark:text-slate-200 border border-[#EAE3DC] dark:border-slate-700 shadow-2xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Tags Pill Row & Capacity Badges ─── */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {post.skillsNeeded && post.skillsNeeded.slice(0, 4).map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs font-normal px-3.5 py-1.5 rounded-full bg-[#F7F4F0] dark:bg-slate-800 text-[#4A3E3C] dark:text-slate-200 border border-[#EAE3DC] dark:border-slate-700/80 shadow-2xs tracking-normal"
                      >
                        {skill}
                      </span>
                    ))}
                    {post.skillsNeeded && post.skillsNeeded.length > 4 && (
                      <span className="text-xs font-normal text-[#8E7E7A] dark:text-slate-400 px-3 py-1.5 rounded-full bg-[#FBF9F7] dark:bg-slate-800/60 border border-[#EAE3DC]/60 dark:border-slate-700/50">
                        +{post.skillsNeeded.length - 4} more
                      </span>
                    )}

                    {post.deadline && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-normal text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 px-3.5 py-1.5 rounded-full tracking-normal">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Deadline: {new Date(post.deadline).toLocaleDateString()}</span>
                      </span>
                    )}

                    {post.teamSize && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-normal text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-full tracking-normal ml-auto">
                        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Team of {post.teamSize}</span>
                      </span>
                    )}
                  </div>

                  {/* ─── Bottom Footer: Poster Info & Actions ─── */}
                  <div className="pt-5 border-t border-[#F0ECE7] dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E95E38]/20 to-[#FCEAE1] dark:from-slate-700 dark:to-slate-800 border border-[#F3DFD5] dark:border-slate-700 flex items-center justify-center font-medium text-[#A63C1E] dark:text-amber-300 flex-shrink-0 text-xs shadow-2xs">
                        {post.createdBy?.name ? post.createdBy.name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#1E1917] dark:text-[#F3F4F6] truncate tracking-normal">
                          {post.createdBy?.name || 'Campus Student'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#8E7E7A] dark:text-slate-400 font-normal tracking-normal">
                          {post.createdBy?.branch && (
                            <span className="font-normal px-2 py-0.5 rounded-full bg-[#F5F2EE] dark:bg-slate-800 text-[#4A3E3C] dark:text-slate-300">
                              {post.createdBy.branch}
                            </span>
                          )}
                          <span>•</span>
                          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {/* Interested Heart / ThumbsUp Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInterest(post._id);
                        }}
                        className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-normal ${
                          post.interested && post.interested.includes(user?._id)
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 shadow-2xs'
                            : 'bg-[#FAF7F5] dark:bg-slate-800 hover:bg-[#F3EFEA] dark:hover:bg-slate-700 text-[#5C504D] dark:text-slate-300 border-[#EBE5E0] dark:border-slate-700'
                        }`}
                        title="Show Interest"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.interested?.length || 0}</span>
                      </button>

                      {/* Comments Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentModalPost(post);
                        }}
                        className="px-3.5 py-1.5 rounded-full border border-[#EBE5E0] dark:border-slate-700 bg-[#FAF7F5] dark:bg-slate-800 hover:bg-[#F3EFEA] dark:hover:bg-slate-700 text-[#5C504D] dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-normal"
                        title="View comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>

                      {/* Apply Button */}
                      {isOwner ? (
                        <Link
                          to={`/events/${post._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-full text-xs font-normal bg-[#554745] hover:bg-[#433735] text-white shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span>Manage</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                            {post.applicants?.length || 0}
                          </span>
                        </Link>
                      ) : hasApplied ? (
                        <span
                          className={`px-4 py-2 rounded-full text-xs font-normal inline-flex items-center gap-1.5 whitespace-nowrap border ${
                            myApplication?.status === 'accepted'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : myApplication?.status === 'rejected'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {myApplication?.status === 'accepted' ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Accepted
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" /> {myApplication?.status || 'Pending'}
                            </>
                          )}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(post);
                            setApplyModalOpen(true);
                          }}
                          className="px-5 py-2 rounded-full text-xs font-normal bg-[#E95E38] hover:bg-[#D7522D] active:scale-95 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap tracking-normal"
                        >
                          <span>Apply Now</span>
                          
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

      {/* ─── Create Team Post Modal ─── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Team Formation Post"
        maxWidth="max-w-xl"
        isLight={true}
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Post Title
            </label>
            <input
              type="text"
              required
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="e.g. Smart India Hackathon: Need Frontend & ML Teammate"
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] font-medium"
            />
          </div>
          
          <div>
            <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Description &amp; Requirements
            </label>
            <textarea
              required
              rows={3}
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
              placeholder="Describe the problem, hackathon theme, and what skills you are looking for..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
                Category
              </label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0B1528] cursor-pointer font-medium"
              >
                <option value="hackathon">Hackathon</option>
                <option value="project">Course / Capstone Project</option>
                <option value="competition">Competition</option>
                <option value="cultural">Cultural</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
                Teammates Needed
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={newPost.teamSize}
                onChange={(e) => setNewPost({ ...newPost, teamSize: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0B1528] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Skills Needed (Comma-separated)
            </label>
            <input
              type="text"
              value={newPost.skillsNeeded}
              onChange={(e) => setNewPost({ ...newPost, skillsNeeded: e.target.value })}
              placeholder="React, Flutter, Python, Figma, Pitching"
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] font-medium"
            />
          </div>

          <div>
            <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Deadline (Optional)
            </label>
            <input
              type="date"
              value={newPost.deadline}
              onChange={(e) => setNewPost({ ...newPost, deadline: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0B1528] font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="font-display px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors tracking-tight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="font-display px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B1528] hover:bg-black text-white shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 tracking-tight"
            >
              {actionLoading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Apply to Team Modal ─── */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply to "${selectedEvent?.title}"`}
        isLight={true}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Introduce yourself and tell the team owner why you&apos;re a good fit. If they accept your request, a direct chat will open!
          </p>
          <div>
            <label className="font-display block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">
              Pitch / Message
            </label>
            <textarea
              required
              rows={4}
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Hi! I am a 3rd-year CSE student with strong React & Node experience. I have built 2 hackathon projects previously..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="font-display px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors tracking-tight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="font-display px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B1528] hover:bg-black text-white shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 tracking-tight"
            >
              {actionLoading ? 'Sending...' : 'Send Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Comments / Discussion Modal ─── */}
      <Modal
        isOpen={!!commentModalPost}
        onClose={() => setCommentModalPost(null)}
        title={`Discussion (${commentModalPost?.comments?.length || 0})`}
        maxWidth="max-w-lg"
        isLight={true}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
            <h4 className="font-bold text-sm text-gray-950 line-clamp-1">{commentModalPost?.title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Host: <span className="font-semibold text-gray-800">{commentModalPost?.createdBy?.name || 'Student'}</span>
            </p>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {commentModalPost?.comments && commentModalPost.comments.length > 0 ? (
              commentModalPost.comments.map((comment, idx) => (
                <div
                  key={idx}
                  className="flex gap-2.5 text-xs bg-white border border-gray-200/90 p-3 rounded-2xl shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-900 border border-gray-200 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {comment.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-gray-950">
                      {comment.user?.name || 'Student'}
                    </span>
                    <p className="text-gray-600 font-normal leading-relaxed">{comment.text}</p>
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
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 font-normal"
              />
              <button
                onClick={() => handleAddComment(commentModalPost._id)}
                className="px-4 py-2.5 rounded-xl bg-[#0B1528] hover:bg-black text-white font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
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
