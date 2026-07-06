import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CourseTabs from '../../components/CourseTabs';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import AssignmentsTab from './tabs/AssignmentsTab';
import { ProgressBar } from '../../components/ui/Progress';
import Badge from '../../components/ui/Badge';

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

  async function handleUnenroll() {
    if (!confirm('Are you sure you want to unenroll?')) return;
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
  }

  async function handleDeleteCourse() {
    if (!confirm('Delete this course?')) return;
    await api.delete(`/courses/${id}`);
    navigate('/courses');
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Course Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
          <Link to="/courses" className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to courses
          </Link>
          
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <Badge variant="primary" className="mb-3">{course.level}</Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                </div>
                <span>By {course.instructor?.name || 'Instructor'}</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6 leading-relaxed">{course.description}</p>

          {/* Enroll/Unenroll */}
          {isStudent && !isOwner && (
            <div className="pt-4 border-t border-gray-100">
              {enrolled ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enrolled
                    </div>
                    <button
                      onClick={handleUnenroll}
                      disabled={enrolling}
                      className="text-red-600 text-sm font-medium hover:text-red-700 hover:underline disabled:opacity-50 transition-colors"
                    >
                      {enrolling ? 'Processing...' : 'Unenroll'}
                    </button>
                  </div>
                  {progress && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ProgressBar 
                        value={progress.percentage} 
                        max={100} 
                        showLabel={true}
                        color="green"
                        className="mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        {progress.completed_lessons} of {progress.total_lessons} lessons completed
                      </p>
                      {progress.percentage === 100 && (
                        <div className="mt-3 flex items-center gap-2 text-green-600 font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Course completed!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in this course'}
                </button>
              )}
            </div>
          )}

          {/* Owner controls */}
          {isOwner && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Link to={`/courses/${id}/edit`} className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Course
              </Link>
              <button onClick={handleDeleteCourse} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Course
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
                {isOwner && (
                  <Link
                    to={`/courses/${id}/modules/create`}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Module
                  </Link>
                )}
              </div>

              {modules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No modules yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">{module.title}</h3>
                        {isOwner && (
                          <Link
                            to={`/courses/${id}/modules/${module.id}/lessons/create`}
                            className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Lesson
                          </Link>
                        )}
                      </div>
                      {module.lessons?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No lessons yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {module.lessons?.map((lesson) => (
                            <li key={lesson.id}>
                              {enrolled || isOwner ? (
                                <Link
                                  to={`/modules/${module.id}/lessons/${lesson.id}`}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
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
                                  </div>
                                  <span className="flex-1 text-gray-700 font-medium group-hover:text-indigo-600 transition-colors">{lesson.title}</span>
                                  <Badge variant="info" className="capitalize">{lesson.content_type}</Badge>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-3 p-3 rounded-lg text-gray-400 cursor-not-allowed bg-gray-50">
                                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                  <span className="flex-1">{lesson.title}</span>
                                  <Badge variant="default" className="capitalize">{lesson.content_type}</Badge>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
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
    </div>
  );
}