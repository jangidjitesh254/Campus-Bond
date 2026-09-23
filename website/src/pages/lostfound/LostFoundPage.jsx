import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { lostFoundService, chatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Search,
  Plus,
  MapPin,
  Phone,
  CheckCircle,
  CheckCircle2,
  Tag,
  AlertTriangle,
  Sparkles,
  Camera,
  Trash2,
  ChevronDown,
  Filter,
  Check,
  Sun,
  Moon,
  X,
  SlidersHorizontal,
  Calendar,
  MessageCircle,
  ArrowRight,
  Eye,
  MessageSquare,
  Send,
} from 'lucide-react';

function LostFoundCardImage({ item }) {
  const [hasError, setHasError] = useState(false);

  if (!item.image || hasError) {
    return null;
  }

  const src = item.image.startsWith('http') ? item.image : `${item.image}`;

  return (
    <div className="h-48 sm:h-64 w-full rounded-2xl bg-gray-100 dark:bg-slate-800/50 overflow-hidden border border-gray-200/80 dark:border-slate-800 relative">
      <img
        src={src}
        alt={item.title}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
      />
      {item.status === 'resolved' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white border border-white/30 px-3.5 py-1.5 rounded-xl bg-emerald-700/90 shadow-lg">
            Resolved
          </span>
        </div>
      )}
    </div>
  );
}

function LostFoundModalImage({ item }) {
  const [hasError, setHasError] = useState(false);

  if (!item.image || hasError) {
    return (
      <div className="py-8 sm:py-10 bg-[#FDF3ED]/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#F0DDD3] dark:border-slate-700 flex flex-col items-center justify-center text-[#8E7E7A] gap-2">
        <Tag className="w-10 h-10 text-[#E95E38]/60" />
        <span className="text-xs font-semibold text-[#5C504D] dark:text-slate-300">
          No photo available for this item report
        </span>
      </div>
    );
  }

  const src = item.image.startsWith('http') ? item.image : `${item.image}`;

  return (
    <div className="w-full bg-stone-100 dark:bg-[#151D2C] rounded-2xl overflow-hidden border border-[#F0DDD3] dark:border-slate-800 relative flex items-center justify-center max-h-80 sm:max-h-96">
      <img
        src={src}
        alt={item.title}
        onError={() => setHasError(true)}
        className="w-full h-full max-h-80 sm:max-h-96 object-contain"
      />
      {item.status === 'resolved' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white border border-white/30 px-4 py-2 rounded-xl bg-emerald-600/90 shadow-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> RESOLVED / RECOVERED
          </span>
        </div>
      )}
    </div>
  );
}

export default function LostFoundPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { searchQuery: search, debouncedSearch, setSearchQuery } = useSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlType = searchParams.get('type') || '';
  const urlCategory = searchParams.get('category') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(urlType);
  const [categoryFilter, setCategoryFilter] = useState(urlCategory);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Selected item for rich detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();
  const [chatPromptOpen, setChatPromptOpen] = useState(false);
  const [chatRequestNote, setChatRequestNote] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Sync default chat message when an item is selected
  useEffect(() => {
    if (selectedItem) {
      setChatPromptOpen(false);
      const otherName = selectedItem.createdBy?.name?.split(' ')[0] || 'there';
      if (selectedItem.type === 'found') {
        setChatRequestNote(
          `Hi ${otherName}, I saw your report about "${selectedItem.title}". I think this item belongs to me.`
        );
      } else {
        setChatRequestNote(
          `Hi ${otherName}, I saw your report about "${selectedItem.title}". I have details / found something matching it.`
        );
      }
    }
  }, [selectedItem]);

  const handleStartChat = async () => {
    const targetUserId = selectedItem?.createdBy?._id || selectedItem?.createdBy;
    if (!targetUserId) {
      alert('Could not find user details to chat.');
      return;
    }
    if (String(targetUserId) === String(user?._id)) {
      alert('You are the reporter of this item.');
      return;
    }

    setChatLoading(true);
    try {
      const res = await chatService.openConversation(
        targetUserId,
        null,
        chatRequestNote.trim()
      );
      const conversationId = res.data.conversation?._id;
      setSelectedItem(null);
      navigate('/chat', { state: { conversationId } });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start chat');
    } finally {
      setChatLoading(false);
    }
  };

  // Keep state in sync with URL searchParams
  useEffect(() => {
    const t = searchParams.get('type') || '';
    const c = searchParams.get('category') || '';
    setTypeFilter(t);
    setCategoryFilter(c);
  }, [searchParams]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal & form
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: 'electronics',
    location: '',
    contact: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const res = await lostFoundService.getLostItems(params);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, categoryFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('location', formData.location);
      data.append('contact', formData.contact);
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      await lostFoundService.createLostItem(data);
      setModalOpen(false);
      setFormData({
        type: 'lost',
        title: '',
        description: '',
        category: 'electronics',
        location: '',
        contact: '',
      });
      setSelectedFile(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'open' ? 'resolved' : 'open';
      await lostFoundService.updateLostStatus(id, nextStatus);
      if (selectedItem && selectedItem._id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await lostFoundService.deleteLostItem(id);
      if (selectedItem && selectedItem._id === id) {
        setSelectedItem(null);
      }
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };


  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ─── Hero Banner with VGU Campus, Lost & Found Title & Controls ─── */}
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
              LOST & FOUND
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
              Lost & <span className="text-[#E95E38]">Found Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
              Report lost belongings or check found items across Vivekananda Global University campus.
            </p>
          </div>

          {/* Angled handwritten slogan */}
          <div className="hidden lg:flex flex-col items-start -rotate-8 select-none my-auto pr-8 xl:pr-20">
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Report
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Connect
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Recover
            </span>
            <svg className="w-24 h-2.5 mt-0.5 text-[#E95E38]" viewBox="0 0 100 8" fill="none">
              <path d="M 2 5 C 30 2, 70 3, 98 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ─── Bottom Row: Type Tabs, Search, Filter & Report Button ─── */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { label: 'All Reports', value: '' },
              { label: 'Lost Items', value: 'lost' },
              { label: 'Found Items', value: 'found' },
            ].map((tab) => {
              const isSelected = typeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTypeFilter(tab.value)}
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
          </div>

          {/* Search, Filter Button & Report Item Button */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex-1 lg:flex-initial flex items-center bg-white/95 dark:bg-[#151D2C]/95 backdrop-blur-xs border border-[#F0DDD3] dark:border-slate-700/80 rounded-full px-4 py-2 shadow-xs w-full sm:w-64 md:w-72 transition-all focus-within:ring-2 focus-within:ring-[#E95E38]/40">
              <Search className="w-4 h-4 text-[#8E7E7A] mr-2.5 flex-shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lost items, places..."
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
              type="button"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="p-2.5 rounded-full bg-[#F7C8B8] hover:bg-[#F2B9A6] active:scale-95 text-[#A63C1E] dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-200 shadow-xs transition-all cursor-pointer flex-shrink-0"
              title="Filter by category"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Report Item</span>
            </button>
          </div>
        </div>

        {/* Collapsible Category Filter Panel */}
        {filterMenuOpen && (
          <div className="relative z-10 mt-4 pt-3 border-t border-[#F0DDD3] dark:border-slate-700/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-[#5C504D] dark:text-slate-300">Category Filter:</span>
            {[
              { label: 'All Categories', value: '' },
              { label: 'Electronics', value: 'electronics' },
              { label: 'ID Cards', value: 'id-card' },
              { label: 'Accessories', value: 'accessories' },
              { label: 'Books & Stationery', value: 'books-stationary' },
              { label: 'Clothing', value: 'clothing' },
              { label: 'Other', value: 'other' },
            ].map((cat) => {
              const isSelected = categoryFilter === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E95E38] text-white font-bold'
                      : 'bg-white/80 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setTypeFilter('');
                setCategoryFilter('');
                setSearchQuery('');
              }}
              className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white cursor-pointer border border-gray-200 dark:border-slate-700"
            >
              Reset Filters
            </button>
          </div>
        )}
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

      {/* ─── Reports Feed (Full Width, Matching Home) ─── */}
      <div className="w-full space-y-4">
        {loading ? (
          <LoadingSpinner message="Loading lost & found reports..." />
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center mx-auto shadow-xs">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-gray-950 tracking-tight">No reports found</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto font-normal">
              {search || categoryFilter || typeFilter
                ? 'Try adjusting your search keywords or topic filter.'
                : 'No items currently reported. You can post a report anytime.'}
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="font-display inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Report Item
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5 w-full">
            {items.map((item) => {
              const isOwner = user && (item.createdBy?._id || item.createdBy) === user._id;

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800/90 hover:border-[#E95E38] rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 ease-out space-y-4 sm:space-y-5 shadow-xs hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative"
                >
                  {/* Top: Title & Type/Category Badges */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg sm:text-xl text-gray-950 dark:text-white group-hover:text-[#E95E38] dark:group-hover:text-[#F3704B] transition-colors leading-snug tracking-tight truncate">
                          {item.title}
                        </h3>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#E95E38] dark:text-[#F3704B] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-slate-400 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#E95E38] dark:text-[#F3704B] flex-shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`font-mono-code text-[10.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${
                          item.type === 'lost'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        {item.type === 'lost' ? '🔍 Lost' : '✨ Found'}
                      </span>
                      <span className="font-mono-code text-[10.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700">
                        {item.category}
                      </span>
                      {item.status === 'resolved' && (
                        <span className="font-mono-code text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Photo if present */}
                  <LostFoundCardImage item={item} />

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed font-normal line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Bottom Footer: Reporter Info & Actions */}
                  <div className="pt-4 sm:pt-5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EDE7E3] to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-[#F0DDD3] dark:border-slate-700 flex items-center justify-center font-bold text-gray-700 dark:text-slate-300 flex-shrink-0 text-xs shadow-2xs overflow-hidden">
                        {item.createdBy?.avatar ? (
                          <img src={item.createdBy.avatar} alt={item.createdBy.name} className="w-full h-full object-cover" />
                        ) : (
                          item.createdBy?.name ? item.createdBy.name[0].toUpperCase() : 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.createdBy?.name || 'Campus Student'}
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-slate-400 truncate">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-slate-300 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setChatPromptOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#E95E38] hover:bg-[#D7522D] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs hover:shadow-md active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      )}

                      {item.contact && (
                        <a
                          href={`tel:${item.contact.replace(/[^0-9+]/g, '')}`}
                          className="font-display inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FDF3ED] dark:bg-amber-950/40 hover:bg-[#FBE8DE] text-[#E95E38] dark:text-[#F3704B] border border-[#F0DDD3] dark:border-amber-900/40 transition-all cursor-pointer active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.contact}</span>
                        </a>
                      )}

                      {isOwner && (
                        <button
                          onClick={() => handleToggleStatus(item._id, item.status)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            item.status === 'resolved'
                              ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-200'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                          }`}
                        >
                          {item.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                        </button>
                      )}

                      {isOwner && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Report Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report a Lost or Found Item"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'lost' })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                formData.type === 'lost'
                  ? 'bg-[#FDF2F8] text-[#D946EF] border-[#D946EF] shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              I Lost Something
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'found' })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                formData.type === 'found'
                  ? 'bg-[#0B1528] text-white border-[#0B1528] shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              I Found Something
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Item Name / Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Casio fx-991EX Calculator with black pouch"
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="electronics">Electronics</option>
                <option value="id-card">ID Card</option>
                <option value="keys">Keys</option>
                <option value="books">Books</option>
                <option value="accessories">Accessories</option>
                <option value="clothing">Clothing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                Campus Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Central Library, 2nd Fl"
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Contact Info (Phone, WhatsApp, or Hostel Room)
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="e.g. +91 9876543210 or Room 204 B-Block"
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Distinctive marks, stickers, color, time seen..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#E95E38] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Upload Photo (Optional)
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
              {actionLoading ? 'Submitting...' : 'Post Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Rich Detail Modal for Selected Lost/Found Item ─── */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={
          selectedItem
            ? selectedItem.type === 'lost'
              ? '🔍 Lost Item Details'
              : '✨ Found Item Details'
            : 'Report Details'
        }
        maxWidth="max-w-2xl"
      >
        {selectedItem && (() => {
          const isOwner = Boolean(
            user && (selectedItem.createdBy?._id || selectedItem.createdBy) === user._id
          );
          const cleanPhone = (selectedItem.contact || '').replace(/[^0-9]/g, '');
          const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

          return (
            <div className="space-y-5">
              {/* Product / Item Media */}
              <LostFoundModalImage item={selectedItem} />

              {/* Badges, Type, Category & Title */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${
                        selectedItem.type === 'lost'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      {selectedItem.type === 'lost' ? '🔍 Lost Item' : '✨ Found Item'}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        selectedItem.status === 'resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      {selectedItem.status === 'resolved' ? 'Status: Resolved' : 'Status: Active / Open'}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                      {selectedItem.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {selectedItem.createdAt
                        ? new Date(selectedItem.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white leading-snug">
                  {selectedItem.title}
                </h2>

                {selectedItem.location && (
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#E95E38] dark:text-[#F3704B] font-semibold bg-[#FDF3ED] dark:bg-amber-950/30 px-3.5 py-1.5 rounded-xl border border-[#F0DDD3] dark:border-amber-900/40">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>Location: {selectedItem.location}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Description & Details
                </div>
                <div className="bg-stone-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-slate-700/80 text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                  {selectedItem.description || 'No additional description provided for this item.'}
                </div>
              </div>

              {/* Reporter Info & Contact */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Reported By & Contact
                </div>
                <div className="bg-stone-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#EDE7E3] to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-[#F0DDD3] dark:border-slate-600 flex items-center justify-center text-gray-800 dark:text-slate-200 font-bold text-base flex-shrink-0 overflow-hidden shadow-2xs">
                      {selectedItem.createdBy?.avatar ? (
                        <img
                          src={selectedItem.createdBy.avatar}
                          alt={selectedItem.createdBy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (selectedItem.createdBy?.name?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-950 dark:text-white text-sm">
                        {selectedItem.createdBy?.name || 'Campus Student'}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-slate-400">
                        {selectedItem.createdBy?.branch
                          ? `${selectedItem.createdBy.branch}${
                              selectedItem.createdBy.semester ? ` • Sem ${selectedItem.createdBy.semester}` : ''
                            }`
                          : 'Vivekananda Global University'}
                        {selectedItem.createdBy?.email ? ` • ${selectedItem.createdBy.email}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => setChatPromptOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{selectedItem.type === 'found' ? 'Chat with Finder' : 'Chat with Reporter'}</span>
                      </button>
                    )}

                    {selectedItem.contact && cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-stone-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                    {selectedItem.contact && waNumber && waNumber.length >= 10 && (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Inline Chat Prompt */}
                {chatPromptOpen && !isOwner && (
                  <div className="p-4 bg-orange-50/70 dark:bg-amber-950/30 border border-orange-200 dark:border-amber-800/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-950 dark:text-white flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#E95E38]" />
                        Message {selectedItem.createdBy?.name || 'Student'} on Campus Bond
                      </span>
                      <button
                        type="button"
                        onClick={() => setChatPromptOpen(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11.5px] text-gray-600 dark:text-slate-300 leading-relaxed">
                      Saamne wale student ke paas Campus Bond Messages me direct chat request chali jayegi:
                    </p>
                    <textarea
                      rows={2}
                      value={chatRequestNote}
                      onChange={(e) => setChatRequestNote(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E95E38] resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setChatPromptOpen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-black/5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={chatLoading || !chatRequestNote.trim()}
                        onClick={handleStartChat}
                        className="px-4 py-1.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {chatLoading ? (
                          <span>Sending...</span>
                        ) : (
                          <>
                            <span>Send & Open Chat</span>
                            <Send className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                {isOwner ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(selectedItem._id, selectedItem.status)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedItem.status === 'resolved'
                          ? 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{selectedItem.status === 'resolved' ? 'Reopen Report' : 'Mark as Resolved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(selectedItem._id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Report</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-500 dark:text-slate-400">
                    Campus Safety: Verify ownership details before handing over items.
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => setChatPromptOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E95E38] hover:bg-[#D7522D] text-white flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{selectedItem.type === 'found' ? 'Claim Item / Chat' : 'Chat with Reporter'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
