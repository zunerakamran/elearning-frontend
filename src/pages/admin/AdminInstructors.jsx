import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

const STATUS_COLORS = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [meta, setMeta]               = useState({});
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState('pending');
  const [page, setPage]               = useState(1);
  const [toast, setToast]             = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/instructors', { params: { instructor_status: statusFilter, page } })
      .then(r => { setInstructors(r.data.data); setMeta(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function doAction(userId, action) {
    try {
      await api.post(`/admin/instructors/${userId}/${action}`);
      const labels = { approve: 'approved', reject: 'rejected', verify: 'verified' };
      showToast(`Instructor ${labels[action] || action}.`);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Action failed.');
    }
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

      <div>
        <h1 className="text-white text-2xl font-bold">Instructor Management</h1>
        <p className="text-gray-400 text-sm mt-1">Review and approve instructor applications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
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

      <div className="bg-[#151922] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : instructors.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No instructors found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Instructor', 'Status', 'Verified', 'Courses', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {instructors.map(u => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border capitalize ${STATUS_COLORS[u.instructor_status || 'pending']}`}>
                        {u.instructor_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-300 text-sm">{u.courses_count ?? 0}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {u.instructor_status !== 'approved' && (
                          <button
                            onClick={() => doAction(u.id, 'approve')}
                            className="px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {u.instructor_status !== 'rejected' && (
                          <button
                            onClick={() => doAction(u.id, 'reject')}
                            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            Reject
                          </button>
                        )}
                        {!u.is_verified && u.instructor_status === 'approved' && (
                          <button
                            onClick={() => doAction(u.id, 'verify')}
                            className="px-3 py-1.5 text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 transition-all"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">Page {meta.current_page} of {meta.last_page}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm bg-[#151922] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 transition-all">Previous</button>
            <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm bg-[#151922] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 transition-all">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
