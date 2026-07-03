import { useEffect, useState } from 'react';
import api from '../../../api/axios';

export default function AnnouncementsTab({ courseId, isOwner }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

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

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/courses/${courseId}/announcements/${id}`);
    setAnnouncements(announcements.filter((a) => a.id !== id));
  }

  if (loading) return <p className="text-gray-400">Loading announcements...</p>;

  return (
    <div>
      {/* Post announcement form (instructor only) */}
      {isOwner && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-lg hover:bg-blue-50 text-sm font-medium"
            >
              + Post Announcement
            </button>
          ) : (
            <form onSubmit={handlePost} className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold mb-3">New Announcement</h3>
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
              />
              <textarea
                placeholder="Write your announcement here..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={4}
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
        <p className="text-gray-500 text-center py-8">No announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="border rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  <p className="text-xs text-gray-400">
                    By {announcement.instructor?.name} ·{' '}
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mt-3">{announcement.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}