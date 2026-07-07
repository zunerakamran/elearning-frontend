import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ui/ConfirmModal';

export default function AnnouncementsTab({ courseId, isOwner }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    api.get(`/courses/${courseId}/announcements`)
      .then((res) => setAnnouncements(res.data))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handlePost(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/courses/${courseId}/announcements`, form);
      setAnnouncements([res.data, ...announcements]);
      setForm({ title: '', body: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await api.delete(`/courses/${courseId}/announcements/${id}`);
        setAnnouncements(announcements.filter((a) => a.id !== id));
      },
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <div>
      {/* Post announcement form (instructor only) */}
      {isOwner && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Announcement
            </button>
          ) : (
            <form onSubmit={handlePost} className="border border-indigo-200 rounded-xl p-5 bg-indigo-50">
              <h3 className="font-semibold text-gray-900 mb-4">New Announcement</h3>
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <textarea
                placeholder="Write your announcement here..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-gray-500">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{announcement.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    By <span className="font-medium text-gray-700">{announcement.instructor?.name}</span> ·{' '}
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mt-3 leading-relaxed">{announcement.body}</p>
            </div>
          ))}
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
      confirmText="Confirm"
      cancelText="Cancel"
      variant="danger"
    />
  </>
  );
}