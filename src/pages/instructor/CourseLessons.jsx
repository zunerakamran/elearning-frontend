import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function CourseLessons() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/modules`),
    ])
      .then(([courseRes, modulesRes]) => {
        setCourse(courseRes.data);
        setModules(modulesRes.data);
      })
      .catch(() => navigate('/instructor/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function handleDeleteModule(moduleId) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Module',
      message: 'Are you sure you want to delete this module and all its lessons? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/modules/${moduleId}`);
          setModules(modules.filter(m => m.id !== moduleId));
        } catch (err) {
          alert('Failed to delete module');
        }
      },
    });
  }

  function handleDeleteLesson(moduleId, lessonId) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Lesson',
      message: 'Are you sure you want to delete this lesson? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/lessons/${lessonId}`);
          setModules(modules.map(m => 
            m.id === moduleId 
              ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
              : m
          ));
        } catch (err) {
          alert('Failed to delete lesson');
        }
      },
    });
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!course) return null;

  const isOwner = user?.id === course.instructor_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/instructor/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-500">Manage course modules and lessons</p>
            </div>
            <Link
              to={`/courses/${id}/modules/create`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Module
            </Link>
          </div>
        </div>

        {/* Modules and Lessons */}
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start by creating your first module to organize your course content</p>
              <Link
                to={`/courses/${id}/modules/create`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Module
              </Link>
            </div>
          ) : (
            modules.map((module, moduleIndex) => (
              <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Module Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-500">{module.lessons?.length || 0} lesson{module.lessons?.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/courses/${id}/modules/${module.id}/lessons/create`}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 px-3 py-2 rounded-lg hover:from-indigo-100 hover:to-indigo-200 hover:shadow-md text-sm font-medium cursor-pointer transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Lesson
                      </Link>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteModule(module.id)}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 px-3 py-2 rounded-lg hover:from-red-100 hover:to-red-200 hover:shadow-md text-sm font-medium cursor-pointer transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="p-6">
                  {module.lessons?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No lessons in this module yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {module.lessons?.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-medium text-gray-500 shadow-sm">
                              {lessonIndex + 1}
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                              {lesson.content_type === 'video' && (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                              {lesson.content_type === 'text' && (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              {lesson.content_type === 'quiz' && (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                              )}
                              {(lesson.content_type === 'files' || lesson.content_type === 'file') && (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                              <p className="text-xs text-gray-500 capitalize">{lesson.content_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/modules/${module.id}/lessons/${lesson.id}`}
                              className="inline-flex items-center gap-1.5 bg-white text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-200 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Link>
                            {isOwner && (
                              <button
                                onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 px-3 py-2 rounded-lg hover:from-red-100 hover:to-red-200 hover:shadow-md text-sm font-medium cursor-pointer transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
