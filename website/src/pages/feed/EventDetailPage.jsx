import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService, chatService, skillMatchService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Chat request modal state
  const [chatTarget, setChatTarget] = useState(null);
  const [chatNote, setChatNote] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [sentRequests, setSentRequests] = useState({});
  const [recommendedTeammates, setRecommendedTeammates] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEventById(id);
      setEvent(res.data.event);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const currentUserId = user?._id || user?.id;
  const creatorId = event?.createdBy?._id || event?.createdBy;
  const isOwner = Boolean(currentUserId && creatorId && String(creatorId) === String(currentUserId));

  useEffect(() => {
    if (isOwner && id) {
      const fetchRecommendations = async () => {
        try {
          setLoadingRecommendations(true);
          const res = await skillMatchService.getMatchedTeammates({ eventId: id });
          setRecommendedTeammates((res.data.candidates || []).slice(0, 4));
        } catch (err) {
          console.error('Failed to load AI teammate recommendations', err);
        } finally {
          setLoadingRecommendations(false);
        }
      };
      fetchRecommendations();
    }
  }, [isOwner, id]);

  // Review applicant (Approve / Reject)
  const handleReview = async (applicantId, status) => {
    try {
      setActionLoading(true);
      await eventService.reviewApplicant(id, applicantId, status);
      fetchEvent();
    } catch (err) {
      alert(err.message || 'Failed to update applicant');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Chat Request Modal for applicant
  const handleOpenChatModal = (app) => {
    setChatTarget(app);
    setChatNote(
      `Hi ${app.user?.name || 'there'}! I'd like to connect on Campus Bond to discuss collaborating on "${event?.title || 'our project'}".`
    );
  };

  // Send Chat Request to applicant
  const handleSendChatRequest = async (e) => {
    e.preventDefault();
    if (!chatTarget) return;
    try {
      setChatSending(true);
      const targetId = chatTarget.user?._id || chatTarget.user;
      await chatService.openConversation(targetId, id, chatNote);
      setSentRequests((prev) => ({ ...prev, [targetId]: true }));
      setChatTarget(null);
      alert(`Chat request successfully sent to ${chatTarget.user?.name || 'student'}! Jaise hi wo accept karenge, aap dono direct chat kar sakenge.`);
    } catch (err) {
      alert(err.message || 'Failed to send chat request');
    } finally {
      setChatSending(false);
    }
  };

  // Toggle status open/closed
  const handleToggleStatus = async () => {
    try {
      const nextStatus = event.status === 'open' ? 'closed' : 'open';
      await eventService.updateEventStatus(id, nextStatus);
      fetchEvent();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Delete event
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await eventService.deleteEvent(id);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await eventService.addComment(id, commentText);
      setCommentText('');
      fetchEvent();
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    }
  };

  if (loading) return <LoadingSpinner message="Loading post details..." />;
  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Post not found</h2>
        <Link to="/" className="text-sm text-[#7C8592] hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Posts</span>
      </button>

      {/* Main Post Card */}
      <div className="bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800 hover:border-[#E95E38]/40 rounded-3xl p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-xs hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 border border-gray-300 text-gray-900 font-bold text-base sm:text-lg flex items-center justify-center flex-shrink-0 shadow-xs">
              {event.createdBy?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-950">{event.createdBy?.name}</h3>
              <p className="text-xs text-gray-500">
                {event.createdBy?.branch} • Semester {event.createdBy?.semester || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code font-bold uppercase px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
              {event.category}
            </span>
            <span
              className={`text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full capitalize border ${
                event.status === 'open'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {event.status}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 mb-2 sm:mb-3">{event.title}</h1>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {/* Skills & Meta */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
          {event.skillsNeeded && event.skillsNeeded.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mr-4">
              {event.skillsNeeded.map((s, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200"
                >
                  #{s}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto text-xs text-gray-500">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-medium text-gray-700">
              <Users className="w-4 h-4 text-gray-800" />
              <span>
                {event.approvedCount || 0} / {event.teamSize} Teammates Filled
              </span>
            </div>

            {event.deadline && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-medium text-gray-700">
                <Clock className="w-4 h-4 text-[#D97706]" />
                <span>Due {new Date(event.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Owner Controls */}
        {isOwner && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleToggleStatus}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-all cursor-pointer"
            >
              {event.status === 'open' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{event.status === 'open' ? 'Close Team Applications' : 'Re-open Applications'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Post</span>
            </button>
          </div>
        )}
      </div>

      {/* Applicant Review Board (Owner only) */}
      {isOwner && (
        <div className="bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-950">
              Applicant Review ({event.applicants?.length || 0})
            </h2>
            <p className="text-xs text-gray-500">
              Accepting opens a direct chat thread with the applicant.
            </p>
          </div>

          {(!event.applicants || event.applicants.length === 0) ? (
            <p className="text-sm text-gray-500 py-4 italic">
              No students have applied yet. Your post is visible in the campus feed.
            </p>
          ) : (
            <div className="space-y-3">
              {event.applicants.map((app) => (
                <div
                  key={app._id}
                  className="bg-gray-50/80 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-gray-950 dark:text-white">
                        {app.user?.name || 'Applicant'}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {app.user?.branch || 'Campus Student'} • Sem {app.user?.semester || 'N/A'}
                      </span>
                      {app.status === 'rejected' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                          Declined
                        </span>
                      )}
                    </div>

                    {/* Styled Applicant Message with Modern Font */}
                    <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-[#F0DDD3] dark:border-slate-800 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-[#E95E38] dark:text-[#F3704B] flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm font-sans font-medium text-gray-800 dark:text-slate-200 leading-relaxed select-text">
                          {app.message || 'Interested in joining this project!'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {app.status === 'pending' && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleReview(app._id, 'approved')}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B1528] hover:bg-black text-white cursor-pointer transition-all shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleReview(app._id, 'rejected')}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleOpenChatModal(app)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                        sentRequests[app.user?._id || app.user]
                          ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                          : 'bg-[#E95E38] hover:bg-[#D7522D] text-white'
                      }`}
                      title="Send chat request to student"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {sentRequests[app.user?._id || app.user] ? 'Request Sent' : 'Chat'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── AI Recommended Campus Teammates (Owner Only) ─── */}
      {isOwner && recommendedTeammates.length > 0 && (
        <div className="bg-gradient-to-r from-[#FDF3ED]/90 via-[#FCEAE1]/90 to-[#F8DDD0]/90 dark:from-[#1A1412] dark:via-[#221816] dark:to-[#1A1412] border border-[#F3DFD5] dark:border-amber-950/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E95E38] text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                  AI Recommended Teammates for This Project
                </h2>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Campus students whose verified skills best match your requirement for "{(event.skillsNeeded || []).join(', ')}"
                </p>
              </div>
            </div>

            <Link
              to={`/skill-match?tab=teammates`}
              className="text-xs font-bold text-[#E95E38] hover:underline"
            >
              Open Full Matchmaker →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {recommendedTeammates.map((cand) => (
              <div
                key={cand._id}
                className="bg-white/95 dark:bg-[#0E1626]/95 border border-[#F0DDD3] dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#EDE7E3] text-gray-900 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {cand.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-950 dark:text-white truncate">
                        {cand.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cand.matchPercentage}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {cand.branch} • Sem {cand.semester}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(cand.skills || []).slice(0, 3).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[10px] font-medium text-gray-700 dark:text-slate-300"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenChatModal({
                      user: cand,
                    });
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#0B1528] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussion & Comments */}
      <div className="bg-white dark:bg-[#0E1626] border border-[#F0DDD3] dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-gray-950 dark:text-white">
          Public Comments & Q&A ({event.comments?.length || 0})
        </h2>

        <div className="space-y-3">
          {(!event.comments || event.comments.length === 0) ? (
            <p className="text-sm text-gray-500 italic">No comments yet. Have a question? Ask below!</p>
          ) : (
            event.comments.map((c, i) => (
              <div key={i} className="flex gap-3 text-xs bg-[#FDF3ED]/40 dark:bg-slate-900/60 border border-[#F0DDD3] dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  {c.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-950 dark:text-white">{c.user?.name || 'Student'}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {user && (
          <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
            <input
              type="text"
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ask a question about the project or event..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#151D2C] border border-[#F0DDD3] dark:border-slate-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E95E38]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#E95E38] hover:bg-[#D7522D] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Comment</span>
            </button>
          </form>
        )}
      </div>

      {/* ─── Send Chat Request Modal ─── */}
      <Modal
        isOpen={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        title="💬 Send Chat Request"
      >
        {chatTarget && (
          <form onSubmit={handleSendChatRequest} className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FDF3ED] dark:bg-slate-800/60 border border-[#F0DDD3] dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center font-bold text-gray-800 dark:text-white text-sm shadow-2xs">
                {(chatTarget.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-gray-950 dark:text-white truncate">
                  {chatTarget.user?.name || 'Applicant'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {chatTarget.user?.branch || 'Campus Student'} • Sem {chatTarget.user?.semester || 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              Pehle <strong>{chatTarget.user?.name}</strong> ke paas chat request jayegi. Unke <strong>Accept</strong> karte hi aap dono direct 1-on-1 chat kar sakenge.
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1.5">
                Invitation Note / Message
              </label>
              <textarea
                rows={3}
                required
                value={chatNote}
                onChange={(e) => setChatNote(e.target.value)}
                placeholder="Write a message to introduce yourself..."
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#E95E38] rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChatTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={chatSending}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#E95E38] hover:bg-[#D7522D] text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{chatSending ? 'Sending Request...' : 'Send Chat Request'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
