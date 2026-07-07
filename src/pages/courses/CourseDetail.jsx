import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CourseTabs from '../../components/CourseTabs';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import AssignmentsTab from './tabs/AssignmentsTab';
import { ProgressBar } from '../../components/ui/Progress';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function CourseDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    const requests = [
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/modules`),
    ];
    if (user) requests.push(api.get(`/courses/${id}/enrollment-status`));

    Promise.all(requests)
      .then(([courseRes, modulesRes, enrollRes]) => {
        setCourse(courseRes.data);
        setModules(modulesRes.data);
        if (enrollRes) {
          setEnrolled(enrollRes.data.enrolled);
          if (enrollRes.data.enrolled && user?.role === 'student') {
            api.get(`/courses/${id}/progress`)
              .then((res) => setProgress(res.data))
              .catch(() => {});
          }
        }
      })
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false));
  }, [id, user]);

  // Sync tab with URL param
  useEffect(() => {
    setSearchParams(activeTab !== 'overview' ? { tab: activeTab } : {});
  }, [activeTab]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setEnrolled(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  }

  function handleUnenroll() {
    setConfirmModal({
      isOpen: true,
      title: 'Unenroll from Course',
      message: 'Are you sure you want to unenroll from this course? Your progress will be lost.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setEnrolling(true);
        try {
          await api.delete(`/courses/${id}/unenroll`);
          setEnrolled(false);
          setProgress(null);
        } catch (err) {
          alert(err.response?.data?.message || 'Unenrollment failed.');
        } finally {
          setEnrolling(false);
        }
      },
    });
  }

  function handleDeleteCourse() {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await api.delete(`/courses/${id}`);
        navigate('/courses');
      },
    });
  }

  function handleDeleteModule(moduleId) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Module',
      message: 'Are you sure you want to delete this module and all its lessons? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/courses/${id}/modules/${moduleId}`);
          setModules(modules.filter(m => m.id !== moduleId));
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete module.');
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
          await api.delete(`/modules/${moduleId}/lessons/${lessonId}`);
          setModules(modules.map(m => 
            m.id === moduleId 
              ? { ...m, lessons: m.lessons?.filter(l => l.id !== lessonId) || [] }
              : m
          ));
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete lesson.');
        }
      },
    });
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
  if (!course) return null;

  const isOwner = user?.id === course.instructor_id;
  const isStudent = user?.role === 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Course Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8">
            <Link to="/courses" className="inline-flex items-center gap-2 text-white/80 text-sm font-medium hover:text-white transition-colors mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to courses
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Badge variant="primary" className="bg-white/20 text-white px-3 py-1 rounded-full text-sm mb-3 inline-block">{course.level}</Badge>
                <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                    {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                  </div>
                  <span className="text-sm">By {course.instructor?.name || 'Instructor'}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <p className="text-xl font-bold text-white">{modules.length}</p>
                  <p className="text-xs text-white/70">Modules</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <p className="text-xl font-bold text-white">{modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}</p>
                  <p className="text-xs text-white/70">Lessons</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 leading-relaxed">{course.description}</p>
          </div>
        </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {isStudent && !isOwner && (
                <div className="flex-1">
                  {enrolled ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Enrolled
                      </div>
                      {progress && (
                        <div className="flex items-center gap-3">
                          <ProgressBar 
                            value={progress.percentage} 
                            max={100} 
                            showLabel={false}
                            color="green"
                            className="w-32"
                          />
                          <span className="text-sm text-gray-600">{progress.percentage}%</span>
                        </div>
                      )}
                      <button
                        onClick={handleUnenroll}
                        disabled={enrolling}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        {enrolling ? 'Processing...' : 'Unenroll'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {enrolling ? 'Enrolling...' : 'Enroll'}
                    </button>
                  )}
                </div>
              )}
              {isOwner && (
                <div className="flex gap-2">
                  <Link to={`/courses/${id}/edit`} className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-700 hover:shadow-md transition-all duration-200 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button onClick={handleDeleteCourse} className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 hover:shadow-md transition-all duration-200 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6">
          <CourseTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOwner={isOwner}
            enrolled={enrolled}
          />

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
                {isOwner && (
                  <Link
                    to={`/courses/${id}/modules/create`}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Module
                  </Link>
                )}
              </div>

              {modules.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 mb-4">No modules yet</p>
                  {isOwner && (
                    <Link
                      to={`/courses/${id}/modules/create`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Module
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-all duration-200">
                      <button
                        onClick={() => {/* Add expand/collapse logic */}}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-semibold text-sm shadow-md">
                            {moduleIndex + 1}
                          </span>
                          <span className="font-medium text-gray-900">{module.title}</span>
                          <span className="text-xs text-gray-500">({module.lessons?.length || 0} lessons)</span>
                        </div>
                        {isOwner && (
                          <div className="flex gap-2">
                            <Link
                              to={`/courses/${id}/modules/${module.id}/lessons/create`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-md hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200 text-xs font-medium"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Lesson
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(module.id);
                              }}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-md hover:from-red-600 hover:to-red-700 hover:shadow-md transition-all duration-200 text-xs font-medium cursor-pointer"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </button>
                      {module.lessons?.length > 0 && (
                        <div className="p-3 bg-gradient-to-br from-white to-gray-50">
                          <ul className="space-y-1">
                            {module.lessons?.map((lesson) => (
                              <li key={lesson.id}>
                                {enrolled || isOwner ? (
                                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group">
                                    <Link
                                      to={`/modules/${module.id}/lessons/${lesson.id}`}
                                      className="flex items-center gap-3 flex-1"
                                    >
                                      <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        {lesson.content_type === 'video' && (
                                          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        )}
                                        {lesson.content_type === 'text' && (
                                          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        )}
                                        {lesson.content_type === 'quiz' && (
                                          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                          </svg>
                                        )}
                                        {lesson.content_type === 'files' && (
                                          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="flex-1 text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{lesson.title}</span>
                                    </Link>
                                    {isOwner && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteLesson(module.id, lesson.id);
                                        }}
                                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                                        title="Delete lesson"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 p-2 text-gray-400 bg-gray-50 rounded-md">
                                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    </div>
                                    <span className="flex-1 text-sm">{lesson.title}</span>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <AnnouncementsTab courseId={id} isOwner={isOwner} />
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <AssignmentsTab courseId={id} isOwner={isOwner} />
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