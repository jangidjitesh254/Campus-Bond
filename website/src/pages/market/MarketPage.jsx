import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { marketService, chatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Sparkles,
  ChevronDown,
  Filter,
  Check,
  MoreVertical,
  BookOpen,
  FileText,
  PenTool,
  Laptop,
  Music,
  Home,
  SlidersHorizontal,
  Calendar,
  MessageSquare,
  Send,
  Clock,
  Sun,
  Moon,
  X,
} from 'lucide-react';

const CATEGORY_ICON_MAP = {
  books: BookOpen,
  notes: FileText,
  kit: PenTool,
  electronics: Laptop,
  instruments: Music,
  furniture: Home,
  other: ShoppingBag,
};

function MarketImage({ src, alt, category, className, containerClassName }) {
  const [hasError, setHasError] = useState(false);
  const Icon = CATEGORY_ICON_MAP[(category || '').toLowerCase()] || ShoppingBag;

  if (src && !hasError) {
    return (
      <img
        src={src.startsWith('http') ? src : `${src}`}
        alt={alt}
        onError={() => setHasError(true)}
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 gap-1.5 p-4 text-center w-full h-full ${containerClassName || ''}`}>
      <Icon className="w-8 h-8 stroke-[1.5] text-gray-400 dark:text-slate-500" />
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
        {category || 'Item'}
      </span>
    </div>
  );
}

export default function MarketPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const urlIsMyListings = searchParams.get('myListings') === 'true' || urlCategory === 'my-listings';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(urlIsMyListings ? '' : urlCategory);
  const [conditionFilter, setConditionFilter] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const { searchQuery: search, debouncedSearch, setSearchQuery } = useSearch();
  const [onlyMyListings, setOnlyMyListings] = useState(urlIsMyListings);

  // Keep state in sync with URL searchParams
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const isMy = searchParams.get('myListings') === 'true' || cat === 'my-listings';
    if (isMy) {
      setOnlyMyListings(true);
      setCategoryFilter('');
    } else {
      setOnlyMyListings(false);
      setCategoryFilter(cat);
    }
  }, [searchParams]);

  // Selected item for rich detail modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Chat Request states
  const [chatPromptOpen, setChatPromptOpen] = useState(false);
  const [chatRequestNote, setChatRequestNote] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);
  const [existingChatStatus, setExistingChatStatus] = useState(null);

  useEffect(() => {
    setChatPromptOpen(false);
    setChatSentSuccess(false);
    setChatLoading(false);
    if (selectedItem) {
      setChatRequestNote(
        `Hi ${selectedItem.seller?.name || 'there'}! I'm interested in buying "${selectedItem.title}" (₹${selectedItem.price}). Is it still available?`
      );
      if (user && selectedItem.seller?._id) {
        chatService
          .getConversations()
          .then((res) => {
            const convs = res.data.conversations || [];
            const found = convs.find((c) =>
              c.participants.some(
                (p) => String(p._id || p) === String(selectedItem.seller?._id || selectedItem.seller)
              )
            );
            if (found) {
              setExistingChatStatus(found.status);
            } else {
              setExistingChatStatus(null);
            }
          })
          .catch(() => setExistingChatStatus(null));
      }
    }
  }, [selectedItem, user]);

  const handleSendChatRequest = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const sellerId = selectedItem?.seller?._id || selectedItem?.seller;
    if (!sellerId) return;
    if (String(sellerId) === String(user._id)) {
      alert('You are the seller of this item.');
      return;
    }

    setChatLoading(true);
    try {
      const res = await chatService.openConversation(
        sellerId,
        null,
        chatRequestNote
      );
      setChatSentSuccess(true);
      setExistingChatStatus(res.data.conversation?.status || 'pending');
      setChatPromptOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to send chat request');
    } finally {
      setChatLoading(false);
    }
  };

  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState(false);
  const [activeMenuItemId, setActiveMenuItemId] = useState(null);

  const categoryDropdownRef = useRef(null);
  const conditionDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }
      if (
        conditionDropdownRef.current &&
        !conditionDropdownRef.current.contains(event.target)
      ) {
        setConditionDropdownOpen(false);
      }
      if (!event.target.closest('.market-menu-container')) {
        setActiveMenuItemId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal & form
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    condition: 'good',
    contact: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (conditionFilter) params.condition = conditionFilter;
      if (search) params.search = search;
      const res = await marketService.getMarketItems(params);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter, conditionFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', Number(formData.price));
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('contact', formData.contact);
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      await marketService.createMarketItem(data);
      setModalOpen(false);
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'books',
        condition: 'good',
        contact: '',
      });
      setSelectedFile(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to list item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    setActiveMenuItemId(null);
    try {
      setActionLoading(true);
      const nextStatus = item.status === 'available' ? 'sold' : 'available';
      await marketService.updateMarketStatus(item._id, nextStatus);
      setSelectedItem((prev) =>
        prev && prev._id === item._id ? { ...prev, status: nextStatus } : prev
      );
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (item) => {
    setActiveMenuItemId(null);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await marketService.deleteMarketItem(item._id);
      setSelectedItem((prev) => (prev && prev._id === item._id ? null : prev));
      alert(`"${item.title}" has been deleted successfully.`);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to delete listing');
    } finally {
      setActionLoading(false);
    }
  };

  const categories = [
    { label: 'All Items', value: '', icon: ShoppingBag },
    { label: 'Books', value: 'books', icon: BookOpen },
    { label: 'Notes', value: 'notes', icon: FileText },
    { label: 'Lab Kits', value: 'kit', icon: PenTool },
    { label: 'Electronics', value: 'electronics', icon: Laptop },
    { label: 'Instruments', value: 'instruments', icon: Music },
    { label: 'Furniture', value: 'furniture', icon: Home },
    { label: 'Other', value: 'other', icon: Sparkles },
  ];

  const conditions = [
    { label: 'Any Condition', value: '' },
    { label: 'Brand New', value: 'new' },
    { label: 'Like New', value: 'like-new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
  ];

  const myListingsCount = user
    ? items.filter((item) => String(item.seller?._id || item.seller) === String(user._id)).length
    : 0;

  const displayedItems = onlyMyListings && user
    ? items.filter((item) => String(item.seller?._id || item.seller) === String(user._id))
    : items;

  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ─── Hero Banner with VGU Campus, Marketplace Title & Controls ─── */}
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

        {/* ─── Middle Row: Title & Slogan ─── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 my-4 sm:my-5">
          <div className="max-w-xl">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8E7E7A] dark:text-amber-200/70 mb-1">
              CAMPUS MARKETPLACE
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
              Campus <span className="text-[#E95E38]">Marketplace</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
              Buy and sell second-hand books, notes, lab kits, and electronics within Vivekananda Global University.
            </p>
          </div>

          {/* Angled handwritten slogan */}
          <div className="hidden lg:flex flex-col items-start -rotate-8 select-none my-auto pr-8 xl:pr-20">
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Pre-loved
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Affordable
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Sustainable
            </span>
            <svg className="w-24 h-2.5 mt-0.5 text-[#E95E38]" viewBox="0 0 100 8" fill="none">
              <path d="M 2 5 C 30 2, 70 3, 98 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ─── Bottom Row: Category Tabs, Search, Filters & Sell Button ─── */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isSelected = categoryFilter === cat.value && !onlyMyListings;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setOnlyMyListings(false);
                    setCategoryFilter(cat.value);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E95E38] text-white font-bold shadow-xs'
                      : 'bg-white/90 dark:bg-black/30 hover:bg-white text-gray-800 dark:text-slate-200 font-semibold shadow-2xs border border-white/60 dark:border-white/10 hover:shadow-xs'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {user && (
              <button
                type="button"
                onClick={() => {
                  setOnlyMyListings(!onlyMyListings);
                  if (!onlyMyListings) setCategoryFilter('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  onlyMyListings
                    ? 'bg-[#E95E38] text-white font-bold shadow-xs'
                    : 'bg-white/90 dark:bg-black/30 hover:bg-white text-gray-800 dark:text-slate-200 font-semibold shadow-2xs border border-white/60 dark:border-white/10 hover:shadow-xs'
                }`}
              >
                <span>My Listings ({myListingsCount})</span>
              </button>
            )}
          </div>

          {/* Search, Filter Button & Sell Item */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex-1 lg:flex-initial flex items-center bg-white/95 dark:bg-[#151D2C]/95 backdrop-blur-xs border border-[#F0DDD3] dark:border-slate-700/80 rounded-full px-4 py-2 shadow-xs w-full sm:w-64 md:w-72 transition-all focus-within:ring-2 focus-within:ring-[#E95E38]/40">
              <Search className="w-4 h-4 text-[#8E7E7A] mr-2.5 flex-shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, books, models..."
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
              title="Filter by condition"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Sell Item</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel for Condition */}
        {filterMenuOpen && (
          <div className="relative z-10 mt-4 pt-3 border-t border-[#F0DDD3] dark:border-slate-700/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-[#5C504D] dark:text-slate-300">Condition Filter:</span>
            {conditions.map((cond) => {
              const isSelected = conditionFilter === cond.value;
              return (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => setConditionFilter(cond.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E95E38] text-white font-bold'
                      : 'bg-white/80 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-white border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {cond.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('');
                setConditionFilter('');
                setSearchQuery('');
                setOnlyMyListings(false);
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

      {/* ─── Market Feed (Full Width, Matching Home) ─── */}
      <div className="w-full space-y-4">
        {loading ? (
          <LoadingSpinner message="Loading campus marketplace..." />
        ) : displayedItems.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center mx-auto shadow-xs">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-gray-950 tracking-tight">
              {onlyMyListings ? 'No listings found' : 'No items found'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto font-normal">
              {onlyMyListings
                ? 'You have not listed any items for sale yet.'
                : 'Try adjusting your search keywords or topic filter.'}
            </p>
            {onlyMyListings ? (
              <button
                onClick={() => setOnlyMyListings(false)}
                className="font-display inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md cursor-pointer active:scale-95"
              >
                Browse All Items
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="font-display inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B1528] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Sell Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full">
            {displayedItems.map((item) => {
              const isSeller = Boolean(
                user && String(item.seller?._id || item.seller) === String(user._id)
              );

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800/90 hover:border-[#E95E38]/50 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 ease-out flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative"
                >
                  {/* Top Image Preview */}
                  <div className="h-44 sm:h-48 w-full bg-gray-100 dark:bg-slate-800/50 overflow-hidden relative border-b border-gray-100 dark:border-slate-800 flex items-center justify-center">
                    <MarketImage
                      src={item.image}
                      alt={item.title}
                      category={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 pointer-events-none">
                      <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm text-gray-800 dark:text-slate-200 border border-gray-200/80 dark:border-slate-700 shadow-xs">
                        {item.category}
                      </span>
                      {item.status === 'sold' ? (
                        <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                          Sold
                        </span>
                      ) : (
                        <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm text-gray-700 dark:text-slate-300 border border-gray-200/80 dark:border-slate-700 shadow-xs capitalize">
                          {item.condition}
                        </span>
                      )}
                    </div>

                    {item.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-white border border-white/30 px-3 py-1.5 rounded-xl bg-gray-900/90 shadow-md">
                          SOLD
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono-code text-xl sm:text-2xl font-black text-[#E95E38] dark:text-[#F3704B] tracking-tight">
                          ₹{item.price}
                        </span>
                      </div>

                      <h3
                        className="font-bold text-sm sm:text-base text-gray-950 dark:text-white group-hover:text-[#E95E38] dark:group-hover:text-[#F3704B] transition-colors leading-snug tracking-tight mt-1 line-clamp-2"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 font-normal mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Footer: Seller Info & Actions */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400 mt-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#EDE7E3] dark:bg-slate-800 border border-[#F0DDD3] dark:border-slate-700 flex items-center justify-center font-bold text-gray-700 dark:text-slate-300 flex-shrink-0 text-[11px] shadow-2xs">
                          {item.seller?.name ? item.seller.name[0].toUpperCase() : 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                            {item.seller?.name || 'Campus Student'}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isSeller && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setChatPromptOpen(true);
                            }}
                            className="p-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                            title="Chat with seller"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isSeller && (
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                              item.status === 'sold'
                                ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                            }`}
                            title={item.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                          >
                            {item.status === 'sold' ? 'Avail' : 'Sold'}
                          </button>
                        )}

                        {isSeller && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || 'Item Details'}
        maxWidth="max-w-2xl"
      >
        {selectedItem && (() => {
          const isSeller = Boolean(
            user && String(selectedItem.seller?._id || selectedItem.seller) === String(user._id)
          );
          const cleanPhone = (selectedItem.contact || '').replace(/[^0-9]/g, '');
          const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

          return (
            <div className="space-y-5">
              {/* Product Media */}
              <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 relative flex items-center justify-center max-h-80 sm:max-h-96 min-h-[200px]">
                <MarketImage
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  category={selectedItem.category}
                  className="w-full h-full max-h-80 sm:max-h-96 object-contain sm:object-cover"
                />

                {/* Sold Overlay */}
                {selectedItem.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-sm font-bold uppercase tracking-widest text-white border border-white/30 px-4 py-2 rounded-xl bg-gray-900/90 shadow-lg">
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>

              {/* Price, Status & Badges */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                        selectedItem.status === 'sold'
                          ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {selectedItem.status === 'sold' ? 'Sold' : 'Available'}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 border border-gray-200">
                      {selectedItem.category}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 border border-gray-200">
                      Condition: {selectedItem.condition}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white bg-[#E95E38] px-4 py-1.5 rounded-xl shadow-xs">
                    ₹{selectedItem.price}
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-950 leading-tight">
                  {selectedItem.title}
                </h2>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Listed on{' '}
                    {new Date(selectedItem.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Description
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description || 'No description was provided for this item.'}
                </div>
              </div>

              {/* Seller Information */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Seller Information
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-900 font-bold text-base flex-shrink-0">
                      {selectedItem.seller?.avatar ? (
                        <img
                          src={selectedItem.seller.avatar}
                          alt={selectedItem.seller.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        (selectedItem.seller?.name?.[0] || 'S').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-950 text-sm">
                        {selectedItem.seller?.name || 'Campus Student'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedItem.seller?.branch
                          ? `${selectedItem.seller.branch}${
                              selectedItem.seller.semester ? ` • Sem ${selectedItem.seller.semester}` : ''
                            }`
                          : 'Campus Student'}
                        {selectedItem.seller?.email ? ` • ${selectedItem.seller.email}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Campus Bond Chat Request Option */}
                  {!isSeller ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {chatSentSuccess ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Request Sent</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(null);
                              navigate('/chat');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#0B1528] text-white text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
                          >
                            View in Messages →
                          </button>
                        </div>
                      ) : existingChatStatus === 'accepted' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(null);
                            navigate('/chat');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1528] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Chat</span>
                        </button>
                      ) : existingChatStatus === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(null);
                            navigate('/chat');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Request Pending · View in Chat</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChatPromptOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Seller</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                      Your listing
                    </span>
                  )}
                </div>

                {/* Inline Chat Request Box */}
                {chatPromptOpen && !isSeller && (
                  <div className="mt-3 p-4 bg-orange-50/70 dark:bg-amber-950/30 border border-orange-200 dark:border-amber-800/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#E95E38]" />
                        Send Chat Request to {selectedItem.seller?.name || 'Seller'}
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
                      Saamne wale student ke paas Campus Bond par chat request jayegi. Unke accept karte hi aap direct chat shuru kar sakte hain.
                    </p>
                    <textarea
                      rows={2}
                      value={chatRequestNote}
                      onChange={(e) => setChatRequestNote(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#E95E38] resize-none"
                      placeholder="Type your message to the seller..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setChatPromptOpen(false)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 cursor-pointer font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={chatLoading || !chatRequestNote.trim()}
                        onClick={handleSendChatRequest}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        {chatLoading ? (
                          <span>Sending Request...</span>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Send Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                {isSeller ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleToggleStatus(selectedItem)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>{selectedItem.status === 'sold' ? 'Mark Available' : 'Mark as Sold'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleDelete(selectedItem)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500">
                    Campus Safety: Exchange goods in public campus spaces.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 cursor-pointer ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Sell Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sell Item"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Engineering Mathematics by B.S. Grewal"
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                Price (₹)
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="350"
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#0B1528] rounded-xl text-sm text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="new">Brand New</option>
              </select>
            </div>
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
                <option value="books">Books</option>
                <option value="notes">Notes</option>
                <option value="kit">Lab Kits</option>
                <option value="electronics">Electronics</option>
                <option value="instruments">Instruments</option>
                <option value="furniture">Furniture</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#E95E38] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item details, meeting spot, etc..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 focus:border-[#E95E38] rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
              Photo (Optional)
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
              className="px-6 py-2 rounded-xl text-xs font-bold bg-[#E95E38] hover:bg-[#D7522D] text-white transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {actionLoading ? 'Listing...' : 'List Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
