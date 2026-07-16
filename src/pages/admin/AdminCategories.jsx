import { useEffect, useState } from 'react';
import api from '../../api/axios';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState({ name: '', description: '' });
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  function load() {
    setLoading(true);
    api.get('/admin/categories')
      .then(r => setCategories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditItem(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
  }

  function openEdit(cat) {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/categories/${editItem.id}`, form);
        showToast('Category updated.');
      } else {
        await api.post('/admin/categories', form);
        showToast('Category created.');
      }
      setShowForm(false);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id) {
    setDeleteModal(id);
  }

  async function confirmDeleteCategory() {
    try {
      await api.delete(`/admin/categories/${deleteModal}`);
      showToast('Category deleted.');
      setDeleteModal(null);
      load();
    } catch { showToast('Failed to delete.'); }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1e2534] border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl text-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">Organize courses into categories.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center bg-[#151922] border border-white/5 rounded-2xl">
          <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">No categories yet</p>
          <p className="text-gray-500 text-sm mb-4">Create your first category to organize courses.</p>
          <button onClick={openCreate} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all">
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#151922] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
                {cat.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-500">{cat.courses_count ?? 0} courses</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-xs text-gray-600 font-mono">{cat.slug}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message="Delete this category? Courses in this category will become uncategorized."
        confirmText="Delete Category"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151922] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-white text-lg font-semibold">
              {editItem ? 'Edit Category' : 'New Category'}
            </h2>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Web Development"
                className="w-full bg-[#0f1117] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500/50 transition-colors placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Optional description..."
                className="w-full bg-[#0f1117] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500/50 transition-colors resize-none placeholder-gray-600"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors border border-white/10">Cancel</button>
              <button
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editItem ? 'Save Changes' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
