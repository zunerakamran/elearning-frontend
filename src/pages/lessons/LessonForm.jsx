import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function LessonForm() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    content_type: 'text',
    video_url: '',
    text_content: '',
    order: 0,
  });
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
      const res = await api.post(`/modules/${moduleId}/lessons`, form);
      console.log('Lesson created:', res.data);
      if (form.content_type === 'quiz') {
        const lessonId = res.data.id || res.data.lesson?.id;
        console.log('Redirecting to quiz form with lessonId:', lessonId);
        navigate(`/courses/${courseId}/lessons/${lessonId}/quiz/create`);
      } else {
        navigate(`/courses/${courseId}`);
      }
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Add Lesson</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Lesson Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Content Type</label>
            <select
              name="content_type"
              value={form.content_type}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>

          {form.content_type === 'video' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Video URL</label>
              <input
                type="url"
                name="video_url"
                value={form.video_url}
                onChange={handleChange}
                required
                placeholder="https://youtube.com/..."
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}

          {form.content_type === 'text' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                name="text_content"
                value={form.text_content}
                onChange={handleChange}
                required
                rows={6}
                className="w-full border rounded px-3 py-2"
                placeholder="Write your lesson content here..."
              />
            </div>
          )}

          {form.content_type === 'quiz' && (
            <div className="mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm text-yellow-700">
                Quiz content will be added separately after creating the lesson.
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Lesson'}
          </button>
        </form>
      </div>
    </div>
  );
}