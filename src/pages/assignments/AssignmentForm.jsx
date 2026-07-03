import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function AssignmentForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    instructions: '',
    total_marks: 100,
    due_date: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use FormData since we have file upload
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('instructions', form.instructions);
      formData.append('total_marks', form.total_marks);
      if (form.due_date) formData.append('due_date', form.due_date);
      if (file) formData.append('file', file);

      await api.post(`/courses/${courseId}/assignments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/courses/${courseId}?tab=assignments`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Create Assignment</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. Week 1 Assignment"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Instructions</label>
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              rows={5}
              className="w-full border rounded px-3 py-2"
              placeholder="Describe the assignment requirements..."
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total Marks</label>
              <input
                type="number"
                name="total_marks"
                value={form.total_marks}
                onChange={handleChange}
                required
                min={1}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
              <input
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Attachment (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="assignment-file"
              />
              <label htmlFor="assignment-file" className="cursor-pointer">
                {file ? (
                  <div className="text-green-600 text-sm">
                    📎 {file.name}
                    <span
                      className="ml-2 text-red-400 hover:text-red-600"
                      onClick={(e) => { e.preventDefault(); setFile(null); }}
                    >
                      ✕
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    <p className="text-2xl mb-1">📁</p>
                    <p>Click to upload a file</p>
                    <p className="text-xs mt-1">Max 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
}