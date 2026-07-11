import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('instructions', form.instructions);
      formData.append('total_marks', form.total_marks);
      if (form.due_date) formData.append('due_date', form.due_date);
      if (file) formData.append('file', file);

      const response = await api.post(`/courses/${courseId}/assignments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const assignment = response.data;
      const assignmentLink = assignment?.id ? `/courses/${courseId}/assignments/${assignment.id}` : `/courses/${courseId}?tab=assignments`;

      try {
        await api.post('/notifications', {
          type: 'assignment',
          title: `New assignment posted: ${form.title}`,
          body: `A new assignment has been added to your course. View it now.`,
          link: assignmentLink,
          course_id: courseId,
          assignment_id: assignment?.id,
          target_role: 'student',
        });
      } catch (notifErr) {
        // Ignore notification creation failures to avoid blocking assignment creation.
        console.error('Failed to send assignment notification', notifErr);
      }

      navigate(`/courses/${courseId}?tab=assignments`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
          <p className="text-gray-500 mt-1">Add a new assignment to your course</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Week 1 Assignment"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the assignment requirements..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
            />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
              <input
                type="number"
                name="total_marks"
                value={form.total_marks}
                onChange={handleChange}
                required
                min={1}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (optional)</label>
              <input
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="assignment-file"
              />
              <label htmlFor="assignment-file" className="cursor-pointer">
                {file ? (
                  <div className="text-green-600 flex flex-col items-center gap-2">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="font-medium truncate max-w-xs">{file.name}</span>
                    <span
                      className="text-red-400 hover:text-red-600 cursor-pointer mt-1"
                      onClick={(e) => { e.preventDefault(); setFile(null); }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="font-medium">Click to upload a file</p>
                    <p className="text-sm mt-1">Max 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>

          <div className="mt-6 text-center">
            <Link
              to={`/courses/${courseId}?tab=assignments`}
              className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
            >
              Cancel and go back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}