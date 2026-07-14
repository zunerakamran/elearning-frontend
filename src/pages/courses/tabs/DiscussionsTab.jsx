import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { useAuth } from '../../../context/AuthContext';

export default function DiscussionsTab({ courseId, isOwner }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Form states
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  function fetchQuestions() {
    setLoading(true);
    api.get(`/courses/${courseId}/discussions`)
      .then((res) => setQuestions(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }

  function handleSelectQuestion(questionId) {
    setLoadingQuestion(true);
    api.get(`/discussions/${questionId}`)
      .then((res) => {
        setSelectedQuestion(res.data.question);
        setReplies(res.data.replies);
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Failed to load discussion details.');
      })
      .finally(() => setLoadingQuestion(false));
  }

  async function handleCreateQuestion(e) {
    e.preventDefault();
    setSubmittingQuestion(true);
    try {
      const res = await api.post(`/courses/${courseId}/discussions`, questionForm);
      setQuestions([res.data, ...questions]);
      setQuestionForm({ title: '', content: '' });
      setShowQuestionForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit question.');
    } finally {
      setSubmittingQuestion(false);
    }
  }

  async function handleDeleteQuestion(questionId) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this discussion question and all its replies? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/discussions/${questionId}`);
          setQuestions(questions.filter((q) => q.id !== questionId));
          if (selectedQuestion?.id === questionId) {
            setSelectedQuestion(null);
            setReplies([]);
          }
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete question.');
        }
      },
    });
  }

  async function handleCreateReply(e) {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(`/discussions/${selectedQuestion.id}/replies`, {
        content: replyContent,
      });
      // Append the reply to the end or sorted position. Pinned/Accepted are handled in sorted view.
      // Initially, it's chronological, so append at the end.
      setReplies([...replies, res.data]);
      setReplyContent('');

      // Increment replies count in list
      setQuestions(questions.map(q => q.id === selectedQuestion.id ? { ...q, replies_count: (q.replies_count || 0) + 1 } : q));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit reply.');
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleDeleteReply(replyId) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Reply',
      message: 'Are you sure you want to delete this reply? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/discussions/replies/${replyId}`);
          setReplies(replies.filter((r) => r.id !== replyId));
          // Decrement replies count in list
          setQuestions(questions.map(q => q.id === selectedQuestion.id ? { ...q, replies_count: Math.max(0, (q.replies_count || 1) - 1) } : q));
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete reply.');
        }
      },
    });
  }

  async function handleToggleLike(replyId) {
    try {
      const res = await api.post(`/discussions/replies/${replyId}/like`);
      setReplies(replies.map(r => r.id === replyId ? { ...r, is_liked: res.data.liked, likes_count: res.data.likes_count } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to like reply.');
    }
  }

  async function handleTogglePin(replyId) {
    try {
      const res = await api.post(`/discussions/replies/${replyId}/pin`);
      const updatedReplies = replies.map(r => r.id === replyId ? { ...r, is_pinned: res.data.is_pinned } : r);
      // Re-sort: Pinned -> Accepted -> Date
      sortAndSetReplies(updatedReplies);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pin reply.');
    }
  }

  async function handleToggleAccept(replyId) {
    try {
      const res = await api.post(`/discussions/replies/${replyId}/accept`);
      const updatedReplies = replies.map(r => r.id === replyId ? { ...r, is_accepted: res.data.is_accepted } : r);
      // Re-sort: Pinned -> Accepted -> Date
      sortAndSetReplies(updatedReplies);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update accepted state.');
    }
  }

  function sortAndSetReplies(list) {
    const sorted = [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return b.is_pinned ? 1 : -1;
      }
      if (a.is_accepted !== b.is_accepted) {
        return b.is_accepted ? 1 : -1;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });
    setReplies(sorted);
  }

  function getInitials(name) {
    return name?.charAt(0)?.toUpperCase() || 'U';
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <div className="mt-6">
        {selectedQuestion ? (
          /* Question Detail & Thread View */
          <div>
            <button
              onClick={() => setSelectedQuestion(null)}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-6 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to discussions
            </button>

            {loadingQuestion ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Question Card */}
                <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm relative">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-semibold rounded-full flex items-center justify-center shadow-inner">
                        {getInitials(selectedQuestion.user?.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{selectedQuestion.user?.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            selectedQuestion.user?.role === 'instructor' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedQuestion.user?.role?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Asked on {new Date(selectedQuestion.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {user && (selectedQuestion.user_id === user.id || isOwner) && (
                      <button
                        onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        Delete Question
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-4">{selectedQuestion.title}</h2>
                  <p className="text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed text-sm">{selectedQuestion.content}</p>
                </div>

                {/* Replies Count */}
                <h3 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <span>Replies</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">{replies.length}</span>
                </h3>

                {/* Replies Thread */}
                {replies.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-500 text-sm">No replies yet. Be the first to answer!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replies.map((reply) => {
                      const isReplyAuthor = user && reply.user_id === user.id;
                      const isInstructorReply = reply.user?.role === 'instructor';
                      
                      return (
                        <div
                          key={reply.id}
                          className={`border rounded-xl p-5 bg-white transition-all duration-200 shadow-sm relative ${
                            reply.is_pinned 
                              ? 'border-amber-400 bg-amber-50/10' 
                              : reply.is_accepted 
                              ? 'border-green-400 bg-green-50/10' 
                              : 'border-gray-200'
                          }`}
                        >
                          {/* Badges for Pin and Accepted */}
                          <div className="absolute top-4 right-4 flex gap-2">
                            {reply.is_pinned && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 2a1 1 0 011 1v1.323l3.07 1.9c.77.477.925 1.517.319 2.19l-1.92 2.13a1 1 0 00-.262.668v2.446l2.19 1.46a1 1 0 01-1.11 1.664l-2.28-1.52A1.002 1.002 0 0011 14v4a1 1 0 11-2 0v-4c0-.233-.082-.46-.232-.614l-2.28 1.52a1 1 0 01-1.11-1.664l2.19-1.46V10.31a1 1 0 00-.262-.668L5.3 7.512C4.7 6.84 4.85 5.8 5.62 5.323L8.7 3.323V3a1 1 0 011-1z" />
                                </svg>
                                PINNED
                              </span>
                            )}
                            {reply.is_accepted && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                ACCEPTED
                              </span>
                            )}
                          </div>

                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs text-white ${
                              isInstructorReply ? 'bg-purple-600' : 'bg-indigo-500'
                            }`}>
                              {getInitials(reply.user?.name)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-900">{reply.user?.name}</span>
                                {isInstructorReply && (
                                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                                    INSTRUCTOR
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">
                                  {new Date(reply.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                                {reply.content}
                              </p>

                              {/* Footer Actions (Like, Pin, Accept, Delete) */}
                              <div className="flex items-center gap-4 mt-4 border-t border-gray-100 pt-3">
                                {/* Like button */}
                                <button
                                  onClick={() => handleToggleLike(reply.id)}
                                  className={`inline-flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
                                    reply.is_liked 
                                      ? 'text-indigo-600 font-semibold' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill={reply.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.757c1.27 0 2.254 1.097 2.062 2.36l-1.22 8.01A2 2 0 0117.638 22H7.574A2 2 0 015.6 20.088L4 10m7-6v6m4-6h-4m-1 12H7" />
                                  </svg>
                                  <span>{reply.likes_count || 0} Likes</span>
                                </button>

                                {/* Instructor controls */}
                                {isOwner && (
                                  <>
                                    <button
                                      onClick={() => handleTogglePin(reply.id)}
                                      className={`text-xs font-medium cursor-pointer transition-colors ${
                                        reply.is_pinned ? 'text-amber-600' : 'text-gray-400 hover:text-amber-500'
                                      }`}
                                    >
                                      {reply.is_pinned ? 'Unpin' : 'Pin Answer'}
                                    </button>
                                    <button
                                      onClick={() => handleToggleAccept(reply.id)}
                                      className={`text-xs font-medium cursor-pointer transition-colors ${
                                        reply.is_accepted ? 'text-green-600' : 'text-gray-400 hover:text-green-500'
                                      }`}
                                    >
                                      {reply.is_accepted ? 'Unaccept' : 'Accept Answer'}
                                    </button>
                                  </>
                                )}

                                {/* Delete reply */}
                                {user && (isReplyAuthor || isOwner) && (
                                  <button
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-medium ml-auto cursor-pointer"
                                  >
                                    Delete
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

                {/* Reply Form — hidden if the current user is the question author (students can't answer their own questions) */}
                {user && !(selectedQuestion?.user_id === user.id && !isOwner) ? (
                  <form onSubmit={handleCreateReply} className="border border-gray-200 rounded-xl p-5 bg-gray-50 shadow-inner">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Write a Reply</label>
                    <textarea
                      rows={3}
                      placeholder="Provide your helpful reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={submittingReply || !replyContent.trim()}
                        className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-medium"
                      >
                        {submittingReply ? 'Submitting...' : 'Post Reply'}
                      </button>
                    </div>
                  </form>
                ) : user && selectedQuestion?.user_id === user.id ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 text-center text-sm text-gray-400">
                    You cannot reply to your own question.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          /* Discussion Questions List View */
          <div>
            {/* Ask Question toggle / button */}
            <div className="mb-6">
              {!showQuestionForm ? (
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-4 rounded-xl hover:bg-indigo-50 transition-all text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer hover:shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ask a Question
                </button>
              ) : (
                <form onSubmit={handleCreateQuestion} className="border border-indigo-200 rounded-2xl p-6 bg-indigo-50/50">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">New Discussion Question</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Title</label>
                    <input
                      type="text"
                      placeholder="What is your question about? Be specific."
                      value={questionForm.title}
                      onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Details</label>
                    <textarea
                      placeholder="Describe what you are trying to solve or clarify..."
                      value={questionForm.content}
                      onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                      required
                      rows={5}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowQuestionForm(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-150 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingQuestion}
                      className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-medium"
                    >
                      {submittingQuestion ? 'Submitting...' : 'Post Question'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
              <div className="text-center py-16 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 font-medium">No discussion questions yet.</p>
                <p className="text-gray-400 text-xs mt-1">Be the first to start a conversation about this course!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuestion(q.id)}
                    className="border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-200 bg-white cursor-pointer group flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-base">
                          {q.title}
                        </h3>
                        {q.has_accepted && (
                          <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            SOLVED
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                        {q.content}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Posted by <span className="font-medium text-gray-600">{q.user?.name}</span> ·{' '}
                        {new Date(q.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-center px-3 py-1 bg-gray-50 rounded-lg group-hover:bg-indigo-50/50 transition-colors border border-gray-150">
                        <span className="block font-bold text-gray-800 text-sm group-hover:text-indigo-700">{q.replies_count || 0}</span>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Replies</span>
                      </div>
                      {user && (q.user_id === user.id || isOwner) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
