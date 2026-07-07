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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 pb-8 pt-8">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add Lesson</h1>
          <p className="text-gray-500 mt-1">Create a new lesson for your module</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              placeholder="Enter lesson title"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select
              name="content_type"
              value={form.content_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
              <option value="files">Files (PDF, Word, Images, etc.)</option>
            </select>
          </div>

          {form.content_type === 'video' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
              <input
                type="url"
                name="video_url"
                value={form.video_url}
                onChange={handleChange}
                required
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          )}

          {form.content_type === 'text' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                name="text_content"
                value={form.text_content}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                placeholder="Write your lesson content here..."
              />
            </div>
          )}

          {form.content_type === 'quiz' && (
            <div className="mb-5 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-700">
                Quiz content will be added separately after creating the lesson.
              </p>
            </div>
          )}

          {form.content_type === 'files' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
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
                    <div className="text-green-600">
                      <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <p className="font-medium">{files.length} file(s) selected</p>
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
                        className="mt-3 text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      <p className="font-medium">Click to upload files</p>
                      <p className="text-xs mt-1">PDF, Word, PowerPoint, Images (Max 10MB each)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loading ? 'Creating...' : 'Create Lesson'}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancel and go back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}