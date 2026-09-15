import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { chatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  MessageSquare,
  Send,
  User,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  Check,
  X,
  Clock,
  UserPlus,
  Search,
  Users,
  Star,
  CheckCircle2,
  MessageCircle,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';

const BRANCH_OPTIONS = [
  'All Branches',
  'CSE',
  'AI & DS',
  'Mechanical',
  'ECE',
  'Design & Media',
  'EEE',
];

export default function ChatPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatFilterQuery, setChatFilterQuery] = useState('');

  // Discover / New Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [campusStudents, setCampusStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Custom request prompt state inside modal
  const [requestTargetStudent, setRequestTargetStudent] = useState(null);
  const [customRequestNote, setCustomRequestNote] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to find other participant
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return (
      conv.participants.find((p) => String(p._id) !== String(user?._id)) ||
      conv.participants[0]
    );
  };

  const activeConv = conversations.find((c) => c._id === activeConvId);

  // Fetch all conversations (silent flag prevents spinner during background polling)
  const fetchConversations = async (autoSelectId = null, silent = false) => {
    if (!silent && conversations.length === 0) {
      setLoadingConvs(true);
    }
    try {
      const res = await chatService.getConversations();
      const list = res.data.conversations || [];
      setConversations(list);

      if (autoSelectId) {
        setActiveConvId(autoSelectId);
      } else if (list.length > 0) {
        setActiveConvId((current) => {
          if (current && list.some((c) => c._id === current)) return current;
          return list[0]._id;
        });
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await chatService.getMessages(convId);
      setMessages(res.data.messages || []);
      // If server returned updated conversation object, sync state so pending flips to accepted in real time
      if (res.data?.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c._id === res.data.conversation._id ? res.data.conversation : c))
        );
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Fetch campus students for directory
  const fetchCampusStudents = async (query = '') => {
    setLoadingStudents(true);
    try {
      const res = await chatService.getCampusStudents(query);
      setCampusStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    const targetConvId = location.state?.conversationId || new URLSearchParams(location.search).get('convId');
    fetchConversations(targetConvId);
  }, [location.state?.conversationId, location.search]);

  // When active conversation changes, load messages
  useEffect(() => {
    if (activeConvId) {
      setLoadingMessages(true);
      fetchMessages(activeConvId).finally(() => {
        setLoadingMessages(false);
        scrollToBottom();
      });
    }
  }, [activeConvId]);

  // When activeConv transitions from pending to accepted, reload messages and scroll
  const prevStatusRef = useRef(activeConv?.status);
  useEffect(() => {
    if (prevStatusRef.current === 'pending' && activeConv?.status === 'accepted') {
      if (activeConvId) {
        fetchMessages(activeConvId).then(() => scrollToBottom());
      }
    }
    prevStatusRef.current = activeConv?.status;
  }, [activeConv?.status, activeConvId]);

  // Real-time polling: silently update conversation list and messages every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(null, true);
      if (activeConvId) {
        fetchMessages(activeConvId);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When modal opens, load students
  useEffect(() => {
    if (isNewChatModalOpen) {
      fetchCampusStudents(studentSearch);
    }
  }, [isNewChatModalOpen]);

  // Debounced search for campus students
  useEffect(() => {
    if (!isNewChatModalOpen) return;
    const timer = setTimeout(() => {
      fetchCampusStudents(studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const res = await chatService.sendMessage(activeConvId, textToSend);
      if (res.data?.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c._id === res.data.conversation._id ? res.data.conversation : c))
        );
      }
      await fetchMessages(activeConvId);
      fetchConversations(null, true);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Respond to chat request (Accept or Decline)
  const handleRespondRequest = async (convId, action) => {
    try {
      const res = await chatService.respondToChatRequest(convId, action);
      if (res.data?.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c._id === res.data.conversation._id ? res.data.conversation : c))
        );
      }
      await fetchConversations(convId, true);
      if (activeConvId === convId) {
        fetchMessages(convId);
      }
    } catch (err) {
      alert(err.message || 'Failed to update request');
    }
  };

  // Find existing conversation with a student
  const getExistingConversation = (studentId) => {
    return conversations.find((c) =>
      c.participants?.some((p) => String(p._id) === String(studentId))
    );
  };

  // Open or initiate chat with a student from modal
  const handleInitiateChat = async (student) => {
    const existing = getExistingConversation(student._id);
    if (existing) {
      setActiveConvId(existing._id);
      setIsNewChatModalOpen(false);
      return;
    }

    // Prepare custom message modal prompt or direct send
    setRequestTargetStudent(student);
    setCustomRequestNote(
      `Hi ${student.name?.split(' ')[0]}! I would love to connect with you on Campus Bond.`
    );
  };

  // Submit new chat request
  const handleSendChatRequest = async () => {
    if (!requestTargetStudent) return;
    setActionLoadingId(requestTargetStudent._id);

    try {
      const res = await chatService.openConversation(
        requestTargetStudent._id,
        null,
        customRequestNote.trim()
      );
      const newConvo = res.data.conversation;
      await fetchConversations(newConvo?._id);
      setRequestTargetStudent(null);
      setIsNewChatModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to send chat request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter conversations list in sidebar
  const filteredConversations = conversations.filter((conv) => {
    if (!chatFilterQuery.trim()) return true;
    const other = getOtherParticipant(conv);
    const q = chatFilterQuery.toLowerCase();
    return (
      other?.name?.toLowerCase().includes(q) ||
      other?.branch?.toLowerCase().includes(q) ||
      conv.event?.title?.toLowerCase().includes(q) ||
      conv.lastMessage?.toLowerCase().includes(q)
    );
  });

  // Filter campus students in modal
  const filteredStudents = campusStudents.filter((student) => {
    if (selectedBranch !== 'All Branches' && student.branch !== selectedBranch) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── Hero Banner with VGU Campus, Title & Action Controls ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FDF3ED] via-[#FCEAE1] to-[#F8DDD0] dark:from-[#1E1715] dark:via-[#261D1A] dark:to-[#1C1513] border border-[#F3DFD5] dark:border-amber-950/40 p-5 sm:p-7 shadow-xs">
        {/* Right background: Real Vivekananda Global University (VGU) campus photo */}
        <div className="absolute right-0 top-0 bottom-0 w-3/5 lg:w-[55%] xl:w-[58%] pointer-events-none overflow-hidden select-none">
          <img
            src="/images/vgu_campus_real.jpg?v=3"
            alt="Vivekananda Global University (VGU) Campus"
            className="w-full h-full object-cover object-[center_88%] opacity-90 dark:opacity-40 transition-all"
            style={{
              maskImage:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,1) 100%)',
            }}
          />
        </div>

        {/* Top Row: Campus AI, Theme Toggle & Profile */}
        <div className="flex items-center justify-end gap-2.5 relative z-10">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/90 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 text-indigo-600 dark:text-amber-400 shadow-xs border border-white/60 dark:border-white/10 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
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

        {/* Middle Row: Title & Slogan */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 my-4 sm:my-5">
          <div className="max-w-xl">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8E7E7A] dark:text-amber-200/70 mb-1">
              STUDENT MESSAGES & DIRECT CONNECTIONS
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.12]">
              Campus <span className="text-[#E95E38]">Direct Messages</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5C504D] dark:text-slate-300 font-medium max-w-md mt-1.5 leading-relaxed">
              Connect directly with students across branches, discuss hackathon ideas, form project teams, and exchange notes.
            </p>
          </div>

          {/* Angled handwritten slogan */}
          <div className="hidden lg:flex flex-col items-start -rotate-8 select-none my-auto pr-8 xl:pr-20">
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Connect
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Collaborate
            </span>
            <span className="font-['Caveat'] text-2xl lg:text-3xl font-bold text-[#4A3E3C] dark:text-amber-100 leading-none">
              Empower
            </span>
            <svg className="w-24 h-2.5 mt-0.5 text-[#E95E38]" viewBox="0 0 100 8" fill="none">
              <path
                d="M 2 5 C 30 2, 70 3, 98 4"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Bottom Row: Quick Stats & New Chat CTA */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-xs font-semibold text-gray-800 dark:text-slate-200 border border-white/60 dark:border-slate-700 shadow-2xs">
              <MessageCircle className="w-3.5 h-3.5 text-[#E95E38]" />
              <span>{conversations.length} Conversations Active</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewChatModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.8]" />
            <span>+ Find Students to Chat</span>
          </button>
        </div>
      </div>

      {/* ─── Main Chat Window ─── */}
      <div className="bg-white dark:bg-[#111827] border-2 border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[720px]">
        {/* Left Column: Conversations Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#111827] ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-950 dark:text-white">Direct Messages</h2>
                <p className="text-[10.5px] text-gray-500 dark:text-slate-400">
                  {conversations.length} ongoing discussion{conversations.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  fetchConversations();
                  if (activeConvId) fetchMessages(activeConvId);
                }}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
                title="Refresh messages and status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="p-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white shadow-xs cursor-pointer transition-all active:scale-95"
                title="Start a new chat with campus students"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Search Filter inside Conversations */}
          <div className="p-3 border-b border-gray-100 dark:border-slate-800/80 bg-white dark:bg-[#111827]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={chatFilterQuery}
                onChange={(e) => setChatFilterQuery(e.target.value)}
                placeholder="Filter messages or students..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-200 placeholder-gray-400 border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-[#E95E38]"
              />
              {chatFilterQuery && (
                <button
                  type="button"
                  onClick={() => setChatFilterQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
            {loadingConvs ? (
              <div className="py-12">
                <LoadingSpinner message="Loading messages..." />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-4 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] flex items-center justify-center mx-auto shadow-2xs">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {chatFilterQuery ? 'No matching conversations' : 'No chats open yet'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {chatFilterQuery
                      ? 'Try searching with a different student name or branch.'
                      : 'Connect with students, collaborate on projects, and discuss notes in 1-on-1 chats.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E95E38] text-white text-xs font-bold shadow-xs hover:bg-[#D7522D] transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Find Students to Chat</span>
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = conv._id === activeConvId;
                const isIncomingRequest =
                  conv.status === 'pending' &&
                  String(conv.requestedBy?._id || conv.requestedBy) !== String(user?._id);

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConvId(conv._id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FDF3ED] dark:bg-slate-800/90 border-l-4 border-[#E95E38]'
                        : 'hover:bg-gray-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white font-bold text-sm flex items-center justify-center overflow-hidden shadow-2xs">
                        {other?.avatar ? (
                          <img
                            src={other.avatar}
                            alt={other.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(other?.name || 'S').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-bold text-gray-950 dark:text-white truncate">
                          {other?.name || 'Student'}
                        </h4>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        {other?.branch && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                            {other.branch}
                          </span>
                        )}
                        {conv.status === 'pending' && (
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isIncomingRequest
                                ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            {isIncomingRequest ? 'Action Required' : 'Request Sent'}
                          </span>
                        )}
                      </div>

                      {conv.event?.title && (
                        <p className="text-[10.5px] text-[#E95E38] truncate font-medium">
                          Post: {conv.event.title}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.lastMessage || 'Direct chat active'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Messages & Chat Input */}
        <div
          className={`flex-1 flex flex-col bg-[#FBFBFA] dark:bg-[#0B111E] ${
            !activeConvId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Active Conversation Topbar */}
              <div className="p-4 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-bold text-sm flex items-center justify-center overflow-hidden">
                    {getOtherParticipant(activeConv)?.avatar ? (
                      <img
                        src={getOtherParticipant(activeConv).avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {(getOtherParticipant(activeConv)?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-gray-950 dark:text-white">
                        {getOtherParticipant(activeConv)?.name || 'Student'}
                      </h3>
                      {getOtherParticipant(activeConv)?.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                      <span>{getOtherParticipant(activeConv)?.branch || 'VGU Student'}</span>
                      {getOtherParticipant(activeConv)?.semester && (
                        <span>• Sem {getOtherParticipant(activeConv).semester}</span>
                      )}
                      {activeConv.event?.title && (
                        <span className="hidden sm:inline truncate max-w-xs text-stone-600 dark:text-stone-300">
                          • Re: {activeConv.event.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Status Badge */}
                <div>
                  {activeConv.status === 'pending' ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {String(activeConv.requestedBy?._id || activeConv.requestedBy) !==
                      String(user?._id)
                        ? 'Pending Approval'
                        : 'Waiting for Acceptance'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Body: Handling Pending States vs Active Messages */}
              {activeConv.status === 'pending' ? (
                String(activeConv.requestedBy?._id || activeConv.requestedBy) !==
                String(user?._id) ? (
                  /* ─── Incoming Chat Request Review Card ─── */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto my-auto">
                    <div className="w-16 h-16 rounded-3xl bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] border border-[#F0DDD3] dark:border-amber-900/50 flex items-center justify-center mx-auto shadow-sm">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-950 dark:text-white">
                        Chat Request from {getOtherParticipant(activeConv)?.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {getOtherParticipant(activeConv)?.branch} Student • Semester{' '}
                        {getOtherParticipant(activeConv)?.semester || 'Campus Bond'}
                      </p>
                      {activeConv.requestMessage && (
                        <div className="mt-3 bg-stone-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-stone-200 dark:border-slate-700 text-sm font-sans font-medium text-gray-800 dark:text-slate-200 leading-relaxed text-left">
                          "{activeConv.requestMessage}"
                        </div>
                      )}
                      <p className="text-xs text-gray-600 dark:text-slate-400 pt-2 font-medium">
                        Request accept karne ke baad aap dono direct 1-on-1 chat kar sakenge.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                      <button
                        onClick={() => handleRespondRequest(activeConv._id, 'accept')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(activeConv._id, 'decline')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-semibold text-xs transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── Outgoing Chat Request Waiting State ─── */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto my-auto">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto shadow-xs">
                      <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                        Chat Request Sent (Pending)
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        Aapne <strong>{getOtherParticipant(activeConv)?.name}</strong> ko chat request
                        bheji hai. Jaise hi wo accept karenge, yahan direct messaging unlock ho
                        jayegi.
                      </p>
                      {activeConv.requestMessage && (
                        <div className="mt-3 bg-stone-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-700 text-xs font-sans font-medium text-gray-700 dark:text-slate-300 text-left">
                          Aapka note: "{activeConv.requestMessage}"
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : activeConv.status === 'declined' ? (
                /* ─── Declined State ─── */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 max-w-md mx-auto my-auto">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                    <X className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">
                    Chat Request Closed
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    This chat request was declined and messaging is currently closed.
                  </p>
                </div>
              ) : (
                /* ─── Active 1-on-1 Messages Thread ─── */
                <>
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
                    {loadingMessages ? (
                      <div className="py-12">
                        <LoadingSpinner message="Fetching messages..." />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] flex items-center justify-center mx-auto">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300">
                          Say hello to {getOtherParticipant(activeConv)?.name}!
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 max-w-sm mx-auto">
                          Discuss hackathons, projects, exams, or campus events directly.
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = String(m.sender?._id || m.sender) === String(user?._id);

                        return (
                          <div
                            key={m._id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-md sm:max-w-lg px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isMe
                                  ? 'bg-[#E95E38] text-white rounded-br-xs shadow-xs font-medium'
                                  : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-bl-xs shadow-xs'
                              }`}
                            >
                              <p className="whitespace-pre-line">{m.text}</p>
                              <span
                                className={`block text-[10px] mt-1 ${
                                  isMe
                                    ? 'text-amber-100 text-right'
                                    : 'text-gray-400 dark:text-slate-500'
                                }`}
                              >
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 sm:p-4 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-slate-800 flex gap-2"
                  >
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Type a message to ${
                        getOtherParticipant(activeConv)?.name?.split(' ')[0] || 'student'
                      }...`}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E95E38]"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sending}
                      className="px-5 py-2.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white font-bold flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            /* Empty Right Pane */
            <div className="text-center p-8 space-y-4 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#FDF3ED] dark:bg-amber-950/40 text-[#E95E38] flex items-center justify-center mx-auto shadow-sm">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Select a Conversation or Start a New Chat
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Connect with classmates, project teammates, and campus members to collaborate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Find Students to Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Find Campus Students / Start New Chat Modal ─── */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => {
          setIsNewChatModalOpen(false);
          setRequestTargetStudent(null);
        }}
        title="Find Campus Students"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {requestTargetStudent ? (
            /* Send Chat Request Sub-view */
            <div className="space-y-4 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setRequestTargetStudent(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to student list</span>
              </button>

              <div className="p-4 rounded-2xl bg-[#FDF3ED] dark:bg-amber-950/30 border border-[#F0DDD3] dark:border-amber-900/40 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-[#E95E38] font-bold text-base flex items-center justify-center border border-gray-200 dark:border-slate-700 shadow-2xs">
                  {requestTargetStudent.avatar ? (
                    <img
                      src={requestTargetStudent.avatar}
                      alt={requestTargetStudent.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    requestTargetStudent.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-950 dark:text-white">
                    {requestTargetStudent.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-slate-400">
                    {requestTargetStudent.branch} • Semester {requestTargetStudent.semester || 1}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Introductory Message / Chat Note
                </label>
                <textarea
                  rows={3}
                  value={customRequestNote}
                  onChange={(e) => setCustomRequestNote(e.target.value)}
                  placeholder="Explain why you want to connect (e.g. project teammate, study group, notes)..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E95E38]"
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  This note will appear on {requestTargetStudent.name}'s chat invitation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestTargetStudent(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendChatRequest}
                  disabled={actionLoadingId === requestTargetStudent._id}
                  className="px-6 py-2 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoadingId === requestTargetStudent._id
                    ? 'Sending Request...'
                    : 'Send Chat Request'}
                </button>
              </div>
            </div>
          ) : (
            /* Student Directory Browsing */
            <>
              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by student name, branch, or email..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-[#E95E38]"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch('')}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Branch Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {BRANCH_OPTIONS.map((branch) => {
                  const isSelected = selectedBranch === branch;
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => setSelectedBranch(branch)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E95E38] text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>

              {/* Student Cards List */}
              <div className="max-h-[360px] overflow-y-auto space-y-2 divide-y divide-gray-100 dark:divide-slate-800/80 pr-1">
                {loadingStudents ? (
                  <div className="py-8">
                    <LoadingSpinner message="Searching students..." />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Users className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                      No students found
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Try searching with another branch name or keyword.
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const existingConv = getExistingConversation(student._id);
                    const isPending = existingConv?.status === 'pending';
                    const isAccepted = existingConv?.status === 'accepted';

                    return (
                      <div
                        key={student._id}
                        className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#EDE7E3] dark:bg-slate-700 text-gray-800 dark:text-white font-bold text-sm flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-600">
                            {student.avatar ? (
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{student.name?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs sm:text-sm text-gray-950 dark:text-white truncate">
                                {student.name}
                              </h4>
                              {student.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
                              <span className="font-semibold text-stone-700 dark:text-slate-300">
                                {student.branch || 'Campus Bond'}
                              </span>
                              {student.semester && <span>• Sem {student.semester}</span>}
                              {student.campusScore > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-current" />
                                  {student.campusScore}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isAccepted ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveConvId(existingConv._id);
                                setIsNewChatModalOpen(false);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer"
                            >
                              Open Chat
                            </button>
                          ) : isPending ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveConvId(existingConv._id);
                                setIsNewChatModalOpen(false);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer"
                            >
                              Pending Request
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleInitiateChat(student)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Chat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
