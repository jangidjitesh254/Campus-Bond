import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  eventService,
  marketService,
  lostFoundService,
  clubService,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  User,
  GraduationCap,
  Sparkles,
  Compass,
  FileCheck,
  ShoppingBag,
  Search,
  Users,
  Clock,
  ChevronRight,
  Trash2,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const displayName = (user?.name && user.name !== 'Test Student') ? user.name : 'Vikash';

  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  // Tab datasets
  const [myPosts, setMyPosts] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myLostItems, setMyLostItems] = useState([]);
  const [myClubs, setMyClubs] = useState([]);

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

  const tabs = [
    { id: 'posts', label: 'My Posts', count: myPosts.length, icon: Compass },
    { id: 'applications', label: 'My Applications', count: myApplications.length, icon: FileCheck },
    { id: 'market', label: 'My Listings', count: myListings.length, icon: ShoppingBag },
    { id: 'lost', label: 'Lost & Found', count: myLostItems.length, icon: Search },
    { id: 'clubs', label: 'Joined Clubs', count: myClubs.length, icon: Users },
  ];

  return (
    <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* ─── Hero Banner with VGU Campus & Profile Title ─── */}
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

        {/* ─── Top Row: Theme Toggle & Campus AI ─── */}
        <div className="flex items-center justify-end gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
        </div>

        {/* ─── Middle Row: Title & Slogan ─── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 my-3 sm:my-4">
          <div className="max-w-xl">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8E7E7A] dark:text-amber-200/70 mb-1">
              STUDENT PROFILE
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
              Student <span className="text-[#E95E38]">Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
              Manage your created hackathon posts, applications, marketplace listings, and club memberships.
            </p>
          </div>

          <div className="hidden lg:flex flex-col items-start -rotate-8 select-none my-auto pr-8 xl:pr-20">
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Achievements
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Collaborations
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Community
            </span>
            <svg className="w-24 h-2.5 mt-0.5 text-[#E95E38]" viewBox="0 0 100 8" fill="none">
              <path d="M 2 5 C 30 2, 70 3, 98 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Student Identity Card */}
      <div className="bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EDE7E3] dark:bg-slate-700 border border-[#F0DDD3] dark:border-slate-600 text-gray-950 dark:text-white font-black text-xl sm:text-2xl flex items-center justify-center flex-shrink-0 shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-950 dark:text-white">{displayName}</h2>
              </div>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                  {user?.branch || 'CSE'}
                </span>
                {user?.semester && (
                  <span className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                    Semester {user.semester}
                  </span>
                )}
              </div>

              {/* Verified Skills Preview */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                {(user?.skills && user.skills.length > 0) ? (
                  <>
                    {user.skills.slice(0, 4).map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] border border-[#F3DFD5] dark:border-amber-950/60 font-bold text-[10px]"
                      >
                        {sk}
                      </span>
                    ))}
                    {user.skills.length > 4 && (
                      <span className="text-[10px] text-gray-400 font-bold">
                        +{user.skills.length - 4} more
                      </span>
                    )}
                    <Link
                      to="/skill-match?tab=profile"
                      className="text-[11px] font-bold text-[#E95E38] hover:underline ml-1"
                    >
                      Edit Skills →
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/skill-match?tab=profile"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E95E38] hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Add your skills for AI matching →</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 sm:p-0 bg-[#FEF3C7]/60 sm:bg-transparent rounded-xl sm:rounded-none border border-[#F59E0B]/20 sm:border-0">
              <span className="text-xs text-gray-500">Campus Score</span>
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-[#D97706]">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span>{user?.campusScore || 0} pts</span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#E95E38] text-white font-bold shadow-xs'
                  : 'bg-white/90 dark:bg-black/30 hover:bg-white text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <LoadingSpinner message="Loading your activity dashboard..." />
      ) : (
        <div className="space-y-4">
          {/* TAB 1: My Posts */}
          {activeTab === 'posts' && (
            <div>
              {myPosts.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
                  You haven't posted any team collaboration requests yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myPosts.map((p) => (
                    <div
                      key={p._id}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold capitalize px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                          {p.category}
                        </span>
                        <h4 className="font-bold text-sm text-gray-950">{p.title}</h4>
                        <p className="text-xs text-gray-500">
                          {p.approvedCount || 0} / {p.teamSize} spots filled • {p.applicants?.length || 0} applicants
                        </p>
                      </div>

                      <Link
                        to={`/events/${p._id}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B1528] hover:bg-black text-white transition-all shadow-xs"
                      >
                        <span>Manage Applicants</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Applications */}
          {activeTab === 'applications' && (
            <div>
              {myApplications.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
                  You haven't applied to any team posts yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myApplications.map((app, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-950">{app.event?.title || 'Post'}</h4>
                        <p className="text-xs text-gray-500 italic">Pitch: "{app.message}"</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl capitalize border ${
                          app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-amber-50 text-[#D97706] border-amber-200'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: My Marketplace Listings */}
          {activeTab === 'market' && (
            <div>
              {myListings.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
                  You have no active listings on the marketplace.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myListings.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-950">{item.title}</h4>
                        <p className="text-xs font-black text-gray-950">₹{item.price}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize border ${
                          item.status === 'sold'
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Lost & Found */}
          {activeTab === 'lost' && (
            <div>
              {myLostItems.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
                  You haven't reported any lost or found items.
                </div>
              ) : (
                <div className="space-y-3">
                  {myLostItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
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
                          <h4 className="font-bold text-sm text-gray-950">{item.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500">{item.location}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Joined Clubs */}
          {activeTab === 'clubs' && (
            <div>
              {myClubs.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
                  You haven't joined any campus clubs yet. Check out the Clubs tab!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myClubs.map((club) => (
                    <div
                      key={club._id}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-black text-xs text-gray-900 flex-shrink-0">
                          {club.category === 'tech' || (club.name || '').toLowerCase().includes('code') ? '</>' : club.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-gray-950 truncate">{club.name}</h4>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">{club.category}</span>
                        </div>
                      </div>
                      <Link
                        to="/clubs"
                        className="text-xs font-bold text-[#0B1528] hover:underline"
                      >
                        View Society
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
