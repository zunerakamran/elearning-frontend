import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

const STATUS_COLORS = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AdminCourses() {
  const [courses, setCourses]         = useState([]);
  const [meta, setMeta]               = useState({});
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState('pending');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast]             = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, approval_status: statusFilter };
    if (search) params.search = search;
    api.get('/admin/courses', { params })
      .then(r => { setCourses(r.data.data); setMeta(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function approveCourse(id) {
    try {
      await api.post(`/admin/courses/${id}/approve`);
      showToast('Course approved and published.');
      load();
    } catch { showToast('Action failed.'); }
  }

  async function submitReject() {
    try {
      await api.post(`/admin/courses/${rejectModal.id}/reject`, { reason: rejectReason });
      showToast('Course rejected.');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch { showToast('Action failed.'); }
  }

  async function featureCourse(id) {
    try {
      const r = await api.post(`/admin/courses/${id}/feature`);
      showToast(r.data.message);
      load();
    } catch { showToast('Action failed.'); }
  }

  async function removeCourse(id) {
    if (!confirm('Remove this course? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      showToast('Course removed.');
      load();
    } catch { showToast('Action failed.'); }
  }

  const tabs = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1e2534] border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl text-sm">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Course Moderation</h1>
          <p className="text-gray-400 text-sm mt-1">Review, approve, reject, and feature courses.</p>
        </div>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search courses..."
          className="bg-[#151922] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500/50 placeholder-gray-500 transition-colors w-56"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1); }}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl border border-b-0 transition-all duration-200 ${
              statusFilter === t.value
                ? 'bg-[#151922] text-white border-white/10'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Course cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="py-20 text-center bg-[#151922] border border-white/5 rounded-2xl text-gray-500">
          No courses found.
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(c => (
            <div key={c.id} className="bg-[#151922] border border-white/5 rounded-2xl p-5 flex items-center gap-5 hover:border-white/10 transition-all duration-200">
              {/* Thumbnail placeholder */}
              <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm truncate">{c.title}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${STATUS_COLORS[c.approval_status || 'pending']}`}>
                    {c.approval_status || 'pending'}
                  </span>
                  {c.featured && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  By <span className="text-gray-400">{c.instructor?.name}</span> ·
                  <span className="ml-1 capitalize">{c.level}</span> ·
                  <span className="ml-1">{c.enrollments_count ?? 0} enrolled</span>
                  {c.category && <span className="ml-1">· {c.category.name}</span>}
                </p>
                {c.rejection_reason && (
                  <p className="text-red-400 text-xs mt-1">Rejection reason: {c.rejection_reason}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {c.approval_status !== 'approved' && (
                  <button
                    onClick={() => approveCourse(c.id)}
                    className="px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                  >
                    Approve
                  </button>
                )}
                {c.approval_status !== 'rejected' && (
                  <button
                    onClick={() => setRejectModal(c)}
                    className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => featureCourse(c.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${c.featured ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/10' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                >
                  {c.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => removeCourse(c.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove course"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">Page {meta.current_page} of {meta.last_page}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm bg-[#151922] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 transition-all">Previous</button>
            <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm bg-[#151922] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 transition-all">Next</button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151922] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-white text-lg font-semibold">Reject Course</h2>
            <p className="text-gray-400 text-sm">
              Rejecting: <span className="text-white font-medium">"{rejectModal.title}"</span>
            </p>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for rejection..."
                className="w-full bg-[#0f1117] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500/50 transition-colors resize-none placeholder-gray-600"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 text-sm bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
              <button onClick={submitReject} className="flex-1 py-2.5 text-sm bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all">Reject Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
