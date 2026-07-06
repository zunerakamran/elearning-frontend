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
  const [files, setFiles] = useState([]);
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
      let res;
      if (form.content_type === 'files') {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('content_type', form.content_type);
        formData.append('order', form.order);
        files.forEach((file) => {
          formData.append('files[]', file);
        });
        res = await api.post(`/modules/${moduleId}/lessons`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post(`/modules/${moduleId}/lessons`, form);
      }
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
              <option value="files">Files (PDF, Word, Images, etc.)</option>
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

          {form.content_type === 'files' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Upload Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="hidden"
                  id="lesson-files"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <label htmlFor="lesson-files" className="cursor-pointer">
                  {files.length > 0 ? (
                    <div className="text-green-600 text-sm">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <p>{files.length} file(s) selected</p>
                      <ul className="mt-2 text-xs text-gray-600">
                        {files.map((file, index) => (
                          <li key={index} className="truncate">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setFiles([]); }}
                        className="mt-2 text-red-400 hover:text-red-600 text-xs"
                      >
                        Clear all
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      <p>Click to upload files</p>
                      <p className="text-xs mt-1">PDF, Word, PowerPoint, Images (Max 10MB each)</p>
                    </div>
                  )}
                </label>
              </div>
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