import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  authService,
  eventService,
  marketService,
  lostFoundService,
  clubService,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationBell from '../../components/NotificationBell';
import {
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Clock,
  ThumbsUp,
  MessageSquare,
  MoreVertical,
  Plus,
  Sun,
  Bell,
  Bookmark,
  ChevronRight,
  X,
  Check,
  ExternalLink,
  Users,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  // Tab datasets
  const [myPosts, setMyPosts] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myLostItems, setMyLostItems] = useState([]);
  const [myClubs, setMyClubs] = useState([]);

  // Liked posts tracking (local toggle)
  const [likedPosts, setLikedPosts] = useState({});

  // Menu open for post options
  const [openMenuId, setOpenMenuId] = useState(null);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Authentic user fields (NO dummy defaults)
  const displayName = user?.name || 'Vikash';
  const branchName = user?.branch || 'CSE';
  
  const getYearString = (sem) => {
    if (!sem) return null;
    const s = Number(sem);
    if (s <= 2) return '1st Year';
    if (s <= 4) return '2nd Year';
    if (s <= 6) return '3rd Year';
    return '4th Year';
  };
  const yearText = getYearString(user?.semester);

  const userPhone = user?.phone || '';
  const userLocation = user?.location || '';
  const userBio = user?.bio || '';
  const userAvatar = user?.avatar || '';

  const skillsList = user?.skills || [];
  const interestsList = user?.interests || [];

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    semester: 5,
    phone: '',
    location: '',
    bio: '',
    avatar: '',
    skills: [],
    interests: [],
  });
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postsRes, appsRes, marketRes, lostRes, clubsRes] = await Promise.allSettled([
          eventService.getMyCreated(),
          eventService.getMyApplications(),
          marketService.getMyListings(),
          lostFoundService.getMyPosts(),
          clubService.getMyJoined(),
        ]);

        if (postsRes.status === 'fulfilled') setMyPosts(postsRes.value.data.events || []);
        if (appsRes.status === 'fulfilled') setMyApplications(appsRes.value.data.applications || []);
        if (marketRes.status === 'fulfilled') setMyListings(marketRes.value.data.items || []);
        if (lostRes.status === 'fulfilled') setMyLostItems(lostRes.value.data.items || []);
        if (clubsRes.status === 'fulfilled') setMyClubs(clubsRes.value.data.clubs || []);
      } catch (err) {
        console.error('Error fetching profile data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Initialize edit form with actual data when opening modal
  const handleOpenEdit = () => {
    setFormData({
      name: displayName,
      branch: branchName,
      semester: user?.semester || 5,
      phone: userPhone,
      location: userLocation,
      bio: userBio,
      avatar: userAvatar,
      skills: [...skillsList],
      interests: [...interestsList],
    });
    setNewSkillInput('');
    setNewInterestInput('');
    setEditSuccessMsg('');
    setIsEditModalOpen(true);
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const val = newSkillInput.trim();
    if (val && !formData.skills.includes(val)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, val] }));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddInterest = (e) => {
    e?.preventDefault();
    const val = newInterestInput.trim();
    if (val && !formData.interests.includes(val)) {
      setFormData((prev) => ({ ...prev, interests: [...prev.interests, val] }));
      setNewInterestInput('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interestToRemove),
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await authService.updateProfile({
        name: formData.name,
        branch: formData.branch,
        semester: Number(formData.semester),
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        avatar: formData.avatar,
        skills: formData.skills,
        interests: formData.interests,
      });
      await refreshUser();
      setEditSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccessMsg('');
      }, 1000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleLike = (postId) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* ─── Top Header Bar: "My Profile" + Action Icons ─── */}
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1528] dark:text-white tracking-tight">
          My Profile
        </h1>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-400 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            <Sun className="w-5 h-5" />
          </button>

          {/* Interactive Notification Bell */}
          <NotificationBell />

          {/* Mini User Profile Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1E293B] text-white font-bold text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{displayName}</p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 leading-tight mt-0.5">{branchName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3-Card Top Row: Student Details, Skills, Interests ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* CARD 1: Student Identity & Contact */}
        <div className="bg-white dark:bg-[#0E1626] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 shadow-xs flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1E293B] text-white font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-xs border-2 border-slate-100 dark:border-slate-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{displayName}</h2>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{branchName}</p>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  {user?.semester ? `Semester ${user.semester}${yearText ? ` • ${yearText}` : ''}` : 'CSE Student'}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-col gap-2.5 mt-5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{user?.email || 'vikash@college.edu'}</span>
              </div>
              {userPhone ? (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{userPhone}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  <span className="text-xs italic">+ Add phone number</span>
                </button>
              )}
              {userLocation ? (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{userLocation}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  <span className="text-xs italic">+ Add location</span>
                </button>
              )}
            </div>
          </div>

          {/* Student Quote / Motto Box */}
          {userBio ? (
            <div className="mt-5 rounded-2xl bg-[#EEF4FF] dark:bg-blue-950/30 p-4 border border-blue-100 dark:border-blue-900/40 relative">
              <div className="text-blue-500 dark:text-blue-400 font-serif font-black text-2xl leading-none mb-1 select-none">
                “
              </div>
              <p className="text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 leading-snug pl-1">
                {userBio}
              </p>
            </div>
          ) : (
            <div
              onClick={handleOpenEdit}
              className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-dashed border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:border-blue-300 transition-colors"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                + Click to add your bio or campus motto
              </p>
            </div>
          )}
        </div>

        {/* CARD 2: Skills */}
        <div className="bg-white dark:bg-[#0E1626] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
              Skills
            </h3>
            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] font-bold transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">No skills added yet</p>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skills</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Interests */}
        <div className="bg-white dark:bg-[#0E1626] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Interests
              </h3>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-[13px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>

            {interestsList.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {interestsList.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] font-bold transition-colors cursor-default"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">No interests added yet</p>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Interests</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Posts & Activity ─── */}
      <div className="space-y-4 pt-2">
        {/* Posts Header: Title & View All */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Posts
          </h3>
          <Link
            to="/"
            className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Sub-filter Tabs: My Posts, Saved, Applications, Market, Lost & Found, Clubs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            My Posts {myPosts.length > 0 && `(${myPosts.length})`}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Applications ({myApplications.length})
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'market'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Listings ({myListings.length})
          </button>

          <button
            onClick={() => setActiveTab('lost')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'lost'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Lost & Found ({myLostItems.length})
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'clubs'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Clubs ({myClubs.length})
          </button>
        </div>

        {/* ─── Content Panel ─── */}
        {loading ? (
          <LoadingSpinner message="Loading your activity..." />
        ) : (
          <div className="space-y-3">
            {/* TAB: My Posts */}
            {activeTab === 'posts' && (
              <>
                {myPosts.length === 0 ? (
                  <div className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
                    You haven't posted any team collaboration requests yet.
                  </div>
                ) : (
                  myPosts.map((p) => {
                    const isLiked = likedPosts[p._id];
                    const isMenuOpen = openMenuId === p._id;

                    return (
                      <div
                        key={p._id}
                        className="bg-gradient-to-r from-[#FDF3ED] via-[#FCEAE1] to-white dark:from-[#1E1715] dark:via-[#191416] dark:to-[#0E1626] rounded-2xl border border-[#F0DDD3] hover:border-[#E5C9BC] dark:border-amber-950/40 dark:hover:border-amber-950/70 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                      >
                        {/* Thumbnail & Post Info */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl object-cover flex-shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl bg-gradient-to-br from-[#0B1528] to-[#1E293B] flex flex-col items-center justify-center p-2 text-white flex-shrink-0 shadow-xs border border-slate-800">
                              <Sparkles className="w-4 h-4 text-purple-400 mb-1" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">{p.category || 'Post'}</span>
                            </div>
                          )}

                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Category Badge */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-900/60">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              <span className="capitalize">{p.category || 'Event'}</span>
                            </span>

                            {/* Actual Post Title */}
                            <Link
                              to={`/events/${p._id}`}
                              className="block font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {p.title}
                            </Link>

                            {/* Actual Post Description */}
                            {p.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{p.description}</p>
                            )}

                            {/* Date, Spots & Skills Needed */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-0.5">
                              {p.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{formatDate(p.createdAt)}</span>
                                </span>
                              )}
                              <span>•</span>
                              <span>{p.approvedCount || 0} / {p.teamSize} spots filled</span>
                              {p.skillsNeeded?.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex flex-wrap items-center gap-1">
                                    {p.skillsNeeded.map((s, i) => (
                                      <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Actions: Manage Applicants, Likes, Comments, Options */}
                        <div className="flex items-center gap-2.5 ml-auto sm:ml-0 relative">
                          <Link
                            to={`/events/${p._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B1528] dark:bg-slate-800 hover:bg-black text-white text-xs font-bold shadow-2xs transition-all"
                          >
                            <span>Manage Applicants ({p.applicants?.length || 0})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => toggleLike(p._id)}
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLiked
                                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current text-blue-600' : ''}`} />
                            <span>{isLiked ? 1 : 0}</span>
                          </button>

                          <Link
                            to={`/events/${p._id}`}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{p.comments?.length || 0}</span>
                          </Link>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : p._id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-[#0E1626] rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 py-1 text-xs">
                                <Link
                                  to={`/events/${p._id}`}
                                  className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Post</span>
                                </Link>
                                <Link
                                  to={`/events/${p._id}`}
                                  className="flex items-center gap-2 px-3.5 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>Manage Applicants</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB: Saved */}
            {activeTab === 'saved' && (
              <div className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
                You haven't bookmarked any posts yet.
              </div>
            )}

            {/* TAB: Applications */}
            {activeTab === 'applications' && (
              <>
                {myApplications.length === 0 ? (
                  <div className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
                    You haven't applied to any team posts yet.
                  </div>
                ) : (
                  myApplications.map((app, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {app.event?.title || 'Team Collaboration Request'}
                        </h4>
                        <p className="text-xs text-slate-500 italic">Pitch: "{app.message}"</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl capitalize border ${
                          app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB: Listings */}
            {activeTab === 'market' && (
              <>
                {myListings.length === 0 ? (
                  <div className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
                    You have no active listings on the marketplace.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myListings.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                          <p className="text-xs font-black text-emerald-600">₹{item.price}</p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB: Lost & Found */}
            {activeTab === 'lost' && (
              <>
                {myLostItems.length === 0 ? (
                  <div className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
                    You haven't reported any lost or found items.
                  </div>
                ) : (
                  myLostItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                              item.type === 'lost'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.type}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500">{item.location}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {/* TAB: Clubs */}
            {activeTab === 'clubs' && (
              <>
                {myClubs.length === 0 ? (
                  <div className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
                    You haven't joined any campus clubs yet. Check out the Clubs section!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myClubs.map((club) => (
                      <div
                        key={club._id}
                        className="bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 flex-shrink-0">
                            {club.name?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{club.name}</h4>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">{club.category}</span>
                          </div>
                        </div>
                        <Link to="/clubs" className="text-xs font-bold text-blue-600 hover:underline">
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── EDIT PROFILE MODAL ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0E1626] rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">Customize your student information, skills & interests</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              {editSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {/* Name & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch / Dept</label>
                  <input
                    type="text"
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Semester & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semester (1 - 8)</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Location & Avatar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Campus / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. VGU Campus, Jaipur"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Avatar Photo URL (optional)</label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="Image URL"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bio / Motto Quote */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bio / Campus Motto
                </label>
                <input
                  type="text"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a short bio or motto"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Skills Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Skills (press Enter or Add)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-400 hover:text-blue-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    placeholder="e.g. Python, Flutter, ML, React"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Interests Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Interests (press Enter or Add)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800"
                    >
                      <span>{interest}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="text-purple-400 hover:text-purple-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInterest(e)}
                    placeholder="e.g. Hackathons, Robotics, Web Dev"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
