import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import ConfirmModal from '../../components/ui/ConfirmModal';

const STATUS_COLORS = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  banned: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ROLE_COLORS = {
  student: 'bg-blue-500/10 text-blue-400',
  instructor: 'bg-violet-500/10 text-violet-400',
};

function Badge({ text, className }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${className}`}>
      {text}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [meta, setMeta]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]         = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [actionUser, setActionUser] = useState(null);
  const [toast, setToast]       = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/users', { params })
      .then(r => { setUsers(r.data.data); setMeta(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openEdit(u) {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, status: u.status });
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, editForm);
      showToast('User updated.');
      setEditUser(null);
      load();
    } catch { showToast('Failed to update user.'); }
    finally { setSaving(false); }
  }

  async function doAction(userId, action) {
    try {
      await api.post(`/admin/users/${userId}/${action}`);
      const labels = { suspend: 'suspended', ban: 'banned', activate: 'activated' };
      showToast(`User ${labels[action] || action}.`);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Action failed.');
    }
    setActionUser(null);
  }

  async function deleteUser(userId) {
    setDeleteModal(userId);
  }

  async function confirmDeleteUser() {
    try {
      await api.delete(`/admin/users/${deleteModal}`);
      showToast('User deleted.');
      setDeleteModal(null);
      load();
    } catch { showToast('Failed to delete user.'); }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1e2534] border border-white/10 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-2xl text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">User Management</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Manage all students and instructors on your platform.</p>
        </div>
        <span className="text-gray-400 text-xs sm:text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          {meta.total ?? 0} users
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="flex-1 min-w-[200px] bg-[#151922] border border-white/10 text-white text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none focus:border-violet-500/50 placeholder-gray-500 transition-colors"
        />
        <select
          value={roleFilter}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          className="bg-[#151922] border border-white/10 text-gray-300 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#151922] border border-white/10 text-gray-300 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#151922] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 sm:py-20 text-center text-gray-500 text-xs sm:text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['User', 'Role', 'Status', 'Enrollments', 'Courses', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 sm:px-5 py-3 sm:py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{u.name}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[150px] sm:max-w-none">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <Badge text={u.role} className={`border-transparent ${ROLE_COLORS[u.role] || 'bg-gray-500/10 text-gray-400'}`} />
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <Badge text={u.status || 'active'} className={STATUS_COLORS[u.status || 'active']} />
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-300 text-xs sm:text-sm">{u.enrollments_count ?? 0}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-300 text-xs sm:text-sm">{u.courses_count ?? 0}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {u.status !== 'active' ? (
                          <button onClick={() => doAction(u.id, 'activate')} className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Activate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                        ) : (
                          <>
                            <button onClick={() => doAction(u.id, 'suspend')} className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Suspend">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => doAction(u.id, 'ban')} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Ban">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <p className="text-gray-500 text-xs sm:text-sm">Page {meta.current_page} of {meta.last_page}</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm bg-[#151922] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage(p => p + 1)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm bg-[#151922] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151922] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 space-y-4 sm:space-y-5">
            <h2 className="text-white text-base sm:text-lg font-semibold">Edit User</h2>
            {['name', 'email'].map(field => (
              <div key={field}>
                <label className="block text-gray-400 text-xs font-medium mb-1.5 capitalize">{field}</label>
                <input
                  value={editForm[field] || ''}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full bg-[#0f1117] border border-white/10 text-white text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="w-full bg-[#0f1117] border border-white/10 text-gray-300 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none focus:border-violet-500/50 transition-colors cursor-pointer">
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Status</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-[#0f1117] border border-white/10 text-gray-300 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 outline-none focus:border-violet-500/50 transition-colors cursor-pointer">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <div className="flex gap-2 sm:gap-3 pt-2">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
