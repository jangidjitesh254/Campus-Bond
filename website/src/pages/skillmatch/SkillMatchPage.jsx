import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  skillMatchService,
  eventService,
  authService,
  chatService,
} from '../../services/api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Sparkles,
  Zap,
  Users,
  Compass,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Send,
  MessageSquare,
  ArrowRight,
  GraduationCap,
  ChevronRight,
  Lightbulb,
  FileText,
  Sliders,
  Check,
  Flame,
  Clock,
  Target,
  UserCheck,
  Brain,
  Code2,
  Cpu,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';

const POPULAR_CAMPUS_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'AI/ML',
  'PyTorch',
  'Tailwind CSS',
  'UI/UX Design',
  'Figma',
  'C++',
  'Flutter',
  'Arduino',
  'IoT',
  'ROS (Robotics)',
  'SolidWorks',
  'Three.js',
  'Solidity / Web3',
  'Data Structures',
  'MATLAB',
];

export default function SkillMatchPage() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'events';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const changeTab = (tabId) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  // State for Tab 1: Matched Projects
  const [matchedEvents, setMatchedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // State for Tab 2: Find Teammates
  const [myCreatedEvents, setMyCreatedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customSkillsInput, setCustomSkillsInput] = useState('');
  const [teammateCandidates, setTeammateCandidates] = useState([]);
  const [loadingTeammates, setLoadingTeammates] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const [chatPitch, setChatPitch] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // State for Tab 3: AI Prompt Search
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState(null);
  const [searchingAI, setSearchingAI] = useState(false);

  // State for Tab 4: My Skills & Profile
  const [skillsList, setSkillsList] = useState(user?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);

  // Sync user skills state when user changes
  useEffect(() => {
    if (user?.skills) setSkillsList(user.skills);
    if (user?.bio) setProfileBio(user.bio);
  }, [user]);

  // Load Matched Events
  const loadMatchedEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await skillMatchService.getMatchedEvents();
      setMatchedEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load matched events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load My Created Events for Tab 2 selector
  const loadMyEvents = async () => {
    try {
      const res = await eventService.getMyCreated();
      const events = res.data.events || [];
      setMyCreatedEvents(events);
      if (events.length > 0 && !selectedEventId) {
        setSelectedEventId(events[0]._id);
      }
    } catch (err) {
      console.error('Failed to load user created events', err);
    }
  };

  // Load Teammates
  const loadTeammates = async () => {
    try {
      setLoadingTeammates(true);
      const params = {};
      if (selectedEventId) {
        params.eventId = selectedEventId;
      } else if (customSkillsInput.trim()) {
        params.skills = customSkillsInput.trim();
      } else if (user?.skills?.length) {
        // fallback to complementary skills
        params.skills = user.skills.join(',');
      }

      const res = await skillMatchService.getMatchedTeammates(params);
      setTeammateCandidates(res.data.candidates || []);
    } catch (err) {
      console.error('Failed to load teammates', err);
    } finally {
      setLoadingTeammates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'events') {
      loadMatchedEvents();
    } else if (activeTab === 'teammates') {
      loadMyEvents();
      loadTeammates();
    }
  }, [activeTab, selectedEventId]);

  // Handle Event Application
  const handleApply = async (e) => {
    e.preventDefault();
    if (!targetEvent) return;
    try {
      setActionLoading(true);
      await eventService.applyToEvent(targetEvent._id, applyMessage);
      setFeedback({
        type: 'success',
        message: 'Your application with AI skill highlights was sent to the team leader!',
      });
      setApplyModalOpen(false);
      setApplyMessage('');
      loadMatchedEvents();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit application' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Chat Request to Teammate
  const handleSendChatRequest = async (e) => {
    e.preventDefault();
    if (!chatTargetUser) return;
    try {
      setChatSending(true);
      await chatService.openConversation(
        chatTargetUser._id,
        selectedEventId || undefined,
        chatPitch
      );
      setChatModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Collaboration invite sent to ${chatTargetUser.name}! Check your Messages tab.`,
      });
    } catch (err) {
      alert(err.message || 'Failed to send invite');
    } finally {
      setChatSending(false);
    }
  };

  // Handle AI Prompt Search
  const handleSearchAI = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchingAI(true);
      const res = await skillMatchService.searchSkillMatches(searchQuery);
      setAiSearchResults(res.data);
    } catch (err) {
      console.error('AI search failed', err);
    } finally {
      setSearchingAI(false);
    }
  };

  // Add / Remove Skills
  const handleAddSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed || skillsList.includes(trimmed)) return;
    setSkillsList([...skillsList, trimmed]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  // Save Profile Skills
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await authService.updateProfile({
        skills: skillsList,
        bio: profileBio,
      });
      await refreshUser();
      setFeedback({ type: 'success', message: 'Your skills and AI profile have been updated!' });
      if (activeTab === 'events') loadMatchedEvents();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update skills' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Extract Skills from Text with AI
  const handleExtractSkills = async () => {
    if (!resumeText.trim()) return;
    try {
      setExtracting(true);
      const res = await skillMatchService.extractSkills(resumeText);
      setExtractedSkills(res.data.skills || []);
    } catch (err) {
      alert(err.message || 'Failed to extract skills');
    } finally {
      setExtracting(false);
    }
  };

  const handleApplyExtractedSkills = () => {
    const merged = Array.from(new Set([...skillsList, ...extractedSkills]));
    setSkillsList(merged);
    setExtractModalOpen(false);
    setResumeText('');
    setExtractedSkills([]);
    setFeedback({
      type: 'success',
      message: `Extracted ${extractedSkills.length} skills! Click "Save Changes" to commit.`,
    });
  };

  return (
    <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FDF3ED] via-[#FCEAE1] to-[#F8DDD0] dark:from-[#1E1715] dark:via-[#261D1A] dark:to-[#1C1513] border border-[#F3DFD5] dark:border-amber-950/40 p-5 sm:p-7 shadow-xs">
        {/* Right background campus watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-3/5 lg:w-[55%] pointer-events-none overflow-hidden select-none">
          <img
            src="/images/vgu_campus_real.jpg?v=3"
            alt="Vivekananda Global University"
            className="w-full h-full object-cover object-[center_88%] opacity-90 dark:opacity-35"
            style={{
              maskImage:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
            }}
          />
        </div>

        {/* Top bar controls */}
        <div className="flex items-center justify-between gap-3 relative z-10 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E95E38]/10 dark:bg-[#E95E38]/20 border border-[#E95E38]/30 text-[#E95E38] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Matchmaker 2.0</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/90 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 text-indigo-600 dark:text-amber-400 shadow-xs border border-white/60 dark:border-white/10 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <Link
              to="/assistant"
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              Campus AI
            </Link>
          </div>
        </div>

        {/* Main Title */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.15]">
            AI Skill <span className="text-[#E95E38]">Matching Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-xl mt-2 leading-relaxed">
            Discover hackathons and team posts tailored to your exact stack, find top campus collaborators with AI skill synergy, or ask the AI matchmaker anything.
          </p>
        </div>

        {/* User Skills Snapshot bar in hero */}
        <div className="relative z-10 mt-5 pt-4 border-t border-[#EBD6CB] dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700 dark:text-slate-300">Your Skills:</span>
            {user?.skills?.length ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {user.skills.slice(0, 5).map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200/80 dark:border-slate-700 font-semibold text-[11px] shadow-2xs"
                  >
                    {s}
                  </span>
                ))}
                {user.skills.length > 5 && (
                  <span className="text-[11px] font-bold text-gray-500">
                    +{user.skills.length - 5} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-amber-700 dark:text-amber-300 italic">
                No skills added yet! Head to "My Skill Profile" to get instant tailored matches.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeTab('profile')}
            className="inline-flex items-center gap-1 text-[#E95E38] hover:text-[#D7522D] font-bold cursor-pointer transition-colors"
          >
            <span>Manage Skills</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Feedback Alert ─── */}
      {feedback.message && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Navigation Tabs ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-gray-200 dark:border-slate-800">
        {[
          { id: 'events', label: 'Projects For You', icon: Target },
          { id: 'teammates', label: 'Find Teammates', icon: Users },
          { id: 'query', label: 'AI Prompt Search', icon: Brain },
          { id: 'profile', label: 'My Skill Profile', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#E95E38] text-white shadow-xs'
                  : 'bg-white dark:bg-[#0E1626] hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: PROJECTS FOR YOU
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 dark:text-white">
                Tailored Project Matches
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Ranked by AI skill compatibility with your profile.
              </p>
            </div>
            <button
              onClick={loadMatchedEvents}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E95E38] hover:underline cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Refresh AI Ranking</span>
            </button>
          </div>

          {loadingEvents ? (
            <LoadingSpinner message="Calculating AI skill compatibility..." />
          ) : matchedEvents.length === 0 ? (
            <div className="bg-white dark:bg-[#0E1626] border border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
              No open team collaboration requests found. Check back soon or create your own team post!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedEvents.map((evt) => {
                const matchPct = evt.matchPercentage || 0;
                const isHigh = matchPct >= 75;
                const isMedium = matchPct >= 40 && matchPct < 75;

                return (
                  <div
                    key={evt._id}
                    className="bg-white dark:bg-[#0E1626] border-2 border-gray-200 dark:border-slate-800 hover:border-[#E95E38]/50 dark:hover:border-[#E95E38]/50 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Category + Match Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                          {evt.category}
                        </span>

                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border shadow-2xs ${
                            isHigh
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : isMedium
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-700'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{matchPct}% Match</span>
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-base font-bold text-gray-950 dark:text-white leading-snug line-clamp-2">
                        {evt.title}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {evt.description}
                      </p>

                      {/* Skills Breakdown */}
                      <div className="my-3 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1 text-[11px]">
                          <span className="text-gray-400 font-medium">Matched:</span>
                          {evt.matchedSkills?.length ? (
                            evt.matchedSkills.map((sk, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px]"
                              >
                                <Check className="w-2.5 h-2.5" />
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">None yet</span>
                          )}
                        </div>

                        {evt.missingSkills?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-[11px]">
                            <span className="text-gray-400 font-medium">To Learn:</span>
                            {evt.missingSkills.slice(0, 3).map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 text-[10px]"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Explanation Card */}
                      {evt.aiExplanation && (
                        <div className="p-2.5 rounded-xl bg-[#FDF3ED] dark:bg-[#1C1513] border border-[#F3DFD5] dark:border-amber-950/40 text-[11px] text-[#4A3E3C] dark:text-amber-200/90 leading-relaxed my-2.5 flex items-start gap-2">
                          <Brain className="w-3.5 h-3.5 text-[#E95E38] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">{evt.aiExplanation}</p>
                            {evt.suggestedRole && (
                              <p className="mt-1 font-bold text-[#E95E38] text-[10px]">
                                Suggested Role: {evt.suggestedRole}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <div className="w-6 h-6 rounded-full bg-[#EDE7E3] dark:bg-slate-700 text-gray-900 dark:text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {evt.createdBy?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="truncate font-medium">{evt.createdBy?.name || 'Student'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/events/${evt._id}`}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Details
                        </Link>

                        {evt.isApproved ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved Teammate
                          </span>
                        ) : evt.isApplied ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Application Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetEvent(evt);
                              setApplyMessage(
                                `Hi ${evt.createdBy?.name || 'there'}! I'd love to collaborate on "${evt.title}". My matching skills include ${(evt.matchedSkills || []).slice(0, 3).join(', ')}.`
                              );
                              setApplyModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E95E38] hover:bg-[#D7522D] text-white shadow-2xs transition-all cursor-pointer"
                          >
                            Apply Now
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
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: FIND TEAMMATES (PROJECT -> STUDENTS)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'teammates' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0E1626] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white">
              Target Required Skills for Teammates
            </h2>

            {/* Select from created projects OR custom skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Select From Your Created Projects:
                </label>
                {myCreatedEvents.length > 0 ? (
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      setCustomSkillsInput('');
                    }}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden"
                  >
                    <option value="">-- Choose your project --</option>
                    {myCreatedEvents.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.title} ({(e.skillsNeeded || []).join(', ')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    You haven't posted any team projects yet. You can enter skills manually below!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Or Enter Skills Manually (Comma separated):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkillsInput}
                    onChange={(e) => {
                      setCustomSkillsInput(e.target.value);
                      if (e.target.value) setSelectedEventId('');
                    }}
                    placeholder="e.g. Flutter, PyTorch, Figma, Three.js"
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={loadTeammates}
                    className="px-4 py-2.5 rounded-xl bg-[#0B1528] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Match
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-gray-950 dark:text-white">
                Recommended Campus Candidates ({teammateCandidates.length})
              </h3>
            </div>

            {loadingTeammates ? (
              <LoadingSpinner message="Searching campus student profiles..." />
            ) : teammateCandidates.length === 0 ? (
              <div className="bg-white dark:bg-[#0E1626] border border-gray-200 dark:border-slate-800 rounded-2xl p-10 text-center text-xs sm:text-sm text-gray-500 shadow-xs">
                No matching students found for this exact combination. Try adjusting skills!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teammateCandidates.map((cand) => (
                  <div
                    key={cand._id}
                    className="bg-white dark:bg-[#0E1626] border-2 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Avatar & Match Score */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#EDE7E3] dark:bg-slate-700 text-gray-900 dark:text-white font-bold text-base flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {cand.avatar ? (
                              <img
                                src={cand.avatar}
                                alt={cand.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              cand.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-950 dark:text-white">
                              {cand.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <span>{cand.branch || 'CSE'}</span>
                              {cand.semester && <span>• Sem {cand.semester}</span>}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-2.5 py-1 rounded-full text-xs font-black border shadow-2xs ${
                            cand.matchPercentage >= 75
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : cand.matchPercentage >= 40
                              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {cand.matchPercentage}%
                        </div>
                      </div>

                      {/* Bio */}
                      {cand.bio && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 italic mb-3">
                          "{cand.bio}"
                        </p>
                      )}

                      {/* Skill Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(cand.skills || []).map((sk, idx) => {
                          const isMatched = (cand.matchedSkills || []).includes(sk);
                          return (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                isMatched
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold'
                                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                              }`}
                            >
                              {sk}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setChatTargetUser(cand);
                        setChatPitch(
                          `Hi ${cand.name}! I found your profile via AI Skill Match on Campus Bond. Your experience in ${(cand.skills || []).slice(0, 3).join(', ')} is exactly what we need for our project!`
                        );
                        setChatModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#0B1528] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Invite / Message</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: AI PROMPT SEARCH
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'query' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#0E1626] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white">
                Conversational AI Skill Matcher
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Describe in your own words what teammate or project you're searching for.
              </p>
            </div>

            <form onSubmit={handleSearchAI} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Need a 3rd or 4th sem frontend developer who knows React, Tailwind, and Three.js for NASA Space Apps hackathon"
                  className="w-full text-xs sm:text-sm p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-bold">Try asking:</span>
                  {[
                    'Frontend dev for SIH hackathon with React',
                    'Robotics teammate who knows ROS and C++',
                    'Want to join a Web3 or Solidity project',
                  ].map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSearchQuery(sugg);
                        // trigger auto search
                      }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={searchingAI || !searchQuery.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>{searchingAI ? 'Matching...' : 'Ask AI Matcher'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Search Results */}
          {searchingAI && <LoadingSpinner message="AI is parsing requirements & matching campus profiles..." />}

          {aiSearchResults && (
            <div className="space-y-5">
              {/* Parsed Meta Card */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 text-[10px]">
                    AI Parsed Intent
                  </span>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {aiSearchResults.parsed?.intent || searchQuery}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Target Skills:</span>
                  {(aiSearchResults.parsed?.skills || []).map((sk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 font-bold text-gray-800 dark:text-slate-200 border text-[11px]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Matched Students */}
              {aiSearchResults.students?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">
                    Matching Students ({aiSearchResults.students.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiSearchResults.students.map((cand) => (
                      <div
                        key={cand._id}
                        className="bg-white dark:bg-[#0E1626] border-2 border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-bold text-sm text-gray-950 dark:text-white truncate">
                              {cand.name}
                            </h4>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {cand.matchPercentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-2">
                            {cand.branch} • Sem {cand.semester}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(cand.skills || []).map((sk, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-semibold text-gray-700 dark:text-slate-300"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setChatTargetUser(cand);
                            setChatPitch(
                              `Hi ${cand.name}! I found your profile via AI Skill Match on Campus Bond for: "${searchQuery}". Would love to discuss collaborating!`
                            );
                            setChatModalOpen(true);
                          }}
                          className="w-full py-1.5 rounded-xl bg-[#0B1528] text-white text-xs font-bold hover:bg-black transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Projects */}
              {aiSearchResults.events?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">
                    Matching Projects & Hackathons ({aiSearchResults.events.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {aiSearchResults.events.map((evt) => (
                      <div
                        key={evt._id}
                        className="bg-white dark:bg-[#0E1626] border-2 border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-500">
                              {evt.category}
                            </span>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {evt.matchPercentage}%
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-950 dark:text-white line-clamp-1">
                            {evt.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {evt.description}
                          </p>
                        </div>
                        <Link
                          to={`/events/${evt._id}`}
                          className="mt-3 block text-center py-1.5 rounded-xl bg-[#E95E38] text-white text-xs font-bold hover:bg-[#D7522D] transition-colors"
                        >
                          View Project
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 4: MY SKILL PROFILE & AI EXTRACTOR
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#0E1626] border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                My Skills & Collaboration Profile
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Keep your technical stack up to date so campus teams and hackathon leads can find you.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setExtractModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] border border-[#F3DFD5] dark:border-amber-950/60 font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Auto-Extract from Resume/Bio</span>
            </button>
          </div>

          {/* Active Skills Chips */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Active Skills ({skillsList.length})
            </label>

            {skillsList.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 italic">
                You have not added any skills yet. Add some below or use the AI Extractor!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 text-xs font-bold shadow-2xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input to add custom skill */}
            <div className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(newSkillInput);
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(newSkillInput)}
                className="px-4 py-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Quick Add Suggestions */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Popular Campus Skills:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CAMPUS_SKILLS.filter((s) => !skillsList.includes(s)).map((skill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                  <span>{skill}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio textarea */}
          <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Student Bio & Project Interests
            </label>
            <textarea
              rows={3}
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              placeholder="Tell other students what you enjoy building, past hackathons, or technologies you are currently learning..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden resize-none"
            />
          </div>

          {/* Commit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? 'Saving Profile...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: Apply to Project ─── */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply to ${targetEvent?.title || 'Project'}`}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-gray-500 block mb-1">Required Skills:</span>
            <div className="flex flex-wrap gap-1">
              {(targetEvent?.skillsNeeded || []).map((sk, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-gray-800 dark:text-slate-200 font-semibold"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              Your Pitch to Team Leader:
            </label>
            <textarea
              rows={4}
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              required
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Submitting...' : 'Send Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: Chat / Invite Teammate ─── */}
      <Modal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        title={`Connect with ${chatTargetUser?.name || 'Student'}`}
      >
        <form onSubmit={handleSendChatRequest} className="space-y-4">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EDE7E3] text-gray-900 font-bold flex items-center justify-center flex-shrink-0">
              {chatTargetUser?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{chatTargetUser?.name}</p>
              <p className="text-gray-500">
                {chatTargetUser?.branch} • Sem {chatTargetUser?.semester}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              Invite Message:
            </label>
            <textarea
              rows={4}
              value={chatPitch}
              onChange={(e) => setChatPitch(e.target.value)}
              required
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setChatModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={chatSending}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B1528] hover:bg-black text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{chatSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: AI Auto-Extract Skills ─── */}
      <Modal
        isOpen={extractModalOpen}
        onClose={() => setExtractModalOpen(false)}
        title="AI Skill Auto-Extractor"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Paste your resume summary, LinkedIn about section, or GitHub project descriptions. Our AI will automatically detect and extract your core technical & design skills.
          </p>

          <textarea
            rows={5}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="e.g. Full-stack developer with 2 years of experience in React, Node.js, and MongoDB. Built an IoT smart agriculture monitoring system using Arduino and ESP32 with MQTT protocol. Familiar with Figma and Tailwind CSS."
            className="w-full text-xs sm:text-sm p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#E95E38]/20 outline-hidden resize-none"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExtractSkills}
              disabled={extracting || !resumeText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{extracting ? 'Extracting with AI...' : 'Analyze & Extract Skills'}</span>
            </button>
          </div>

          {extractedSkills.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                Found {extractedSkills.length} Skills:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extractedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyExtractedSkills}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Add These to My Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
