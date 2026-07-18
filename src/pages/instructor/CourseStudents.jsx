import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/Loader';

export default function CourseStudents() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/students`),
      api.get(`/courses/${id}/modules`),
      api.get(`/courses/${id}/assignments`),
    ]).then(([courseRes, studentsRes, modulesRes, assignmentsRes]) => {
      setCourse(courseRes.data);
      setStudents(studentsRes.data);
      setAssignments(assignmentsRes.data);

      // Extract quiz lesson IDs and fetch quiz data separately
      const quizLessonIds = [];
      modulesRes.data.forEach((module) => {
        module.lessons?.forEach((lesson) => {
          if (lesson.content_type === 'quiz') {
            quizLessonIds.push({ id: lesson.id, title: lesson.title });
          }
        });
      });

      // Fetch quiz data for each quiz lesson
      if (quizLessonIds.length > 0) {
        Promise.all(
          quizLessonIds.map((lesson) =>
            api.get(`/lessons/${lesson.id}/quiz`)
              .then((res) => {
                return { ...res.data, lesson_title: lesson.title };
              })
              .catch(() => null)
          )
        ).then((quizzesData) => {
          const validQuizzes = quizzesData.filter((q) => q !== null);
          setQuizzes(validQuizzes);
        });
      } else {
        setQuizzes([]);
      }
    }).catch((err) => {
      console.error('Error loading course data:', err);
    }).finally(() => setLoading(false));
  }, [id]);

  // Load attempts when switching to quiz tab
  useEffect(() => {
    if (activeTab !== 'quizzes' || quizzes.length === 0) return;

    setLoadingAttempts(true);
    setAttempts({});

    Promise.all(
      quizzes.map((quiz) =>
        api.get(`/quizzes/${quiz.id}/attempts`)
          .then((res) => {
            return { quizId: quiz.id, data: res.data };
          })
          .catch((err) => {
            console.error('Error fetching attempts for quiz', quiz.id, ':', err);
            return { quizId: quiz.id, data: [] };
          })
      )
    ).then((results) => {
      const attemptsMap = {};
      results.forEach(({ quizId, data }) => {
        attemptsMap[quizId] = data;
      });
      setAttempts(attemptsMap);
    }).finally(() => {
      setLoadingAttempts(false);
    });
  }, [activeTab, quizzes]);

  // Load submissions when switching to assignments tab
  useEffect(() => {
    if (activeTab !== 'assignments' || assignments.length === 0) return;

    setLoadingSubmissions(true);
    setSubmissions({});

    Promise.all(
      assignments.map((assignment) =>
        api.get(`/assignments/${assignment.id}/submissions`)
          .then((res) => ({ assignmentId: assignment.id, data: res.data }))
          .catch((err) => {
            console.error('Error fetching submissions for assignment', assignment.id, ':', err);
            return { assignmentId: assignment.id, data: [] };
          })
      )
    ).then((results) => {
      const submissionsMap = {};
      results.forEach(({ assignmentId, data }) => {
        submissionsMap[assignmentId] = data;
      });
      setSubmissions(submissionsMap);
    }).finally(() => {
      setLoadingSubmissions(false);
    });
  }, [activeTab, assignments]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader text="Loading students..." />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 break-words">{course?.title}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 whitespace-nowrap px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'students'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 whitespace-nowrap px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'quizzes'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Quiz Results
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 whitespace-nowrap px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'assignments'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Assignments
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="text-center py-12 px-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">No students enrolled yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">#</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Name</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600 hidden md:table-cell">Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 sm:p-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="p-3 sm:p-4 font-medium text-gray-900 text-sm sm:text-base">
                          {student.name}
                          <span className="block text-xs text-gray-400 font-normal sm:hidden truncate max-w-[160px]">
                            {student.email}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-gray-500 text-sm hidden sm:table-cell">{student.email}</td>
                        <td className="p-3 sm:p-4 text-gray-500 text-sm hidden md:table-cell">
                          {new Date(student.pivot?.enrolled_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quiz Results Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {loadingAttempts ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-gray-500">No quizzes in this course yet.</p>
                </div>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{quiz.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 break-words">
                      Lesson: {quiz.lesson_title} · Passing score: {quiz.passing_score}%
                    </p>
                  </div>

                  {attempts[quiz.id]?.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">No attempts yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px]">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Student</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Score</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Result</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600 hidden md:table-cell">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempts[quiz.id]?.map((attempt) => (
                            <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="p-3 sm:p-4 font-medium text-gray-900 text-sm sm:text-base">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate max-w-[140px] sm:max-w-none">{attempt.user?.name}</span>
                                  {!!attempt.user?.is_verified && (
                                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                  )}
                                </div>
                                <span className="block text-xs text-gray-400 font-normal sm:hidden truncate max-w-[160px]">
                                  {attempt.user?.email}
                                </span>
                              </td>
                              <td className="p-3 sm:p-4 text-gray-500 text-sm hidden sm:table-cell">{attempt.user?.email}</td>
                              <td className="p-3 sm:p-4 font-semibold text-gray-900 text-sm sm:text-base">{attempt.score}%</td>
                              <td className="p-3 sm:p-4">
                                <span className={`text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap ${attempt.passed
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                  }`}>
                                  {attempt.passed ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                              <td className="p-3 sm:p-4 text-gray-500 text-sm hidden md:table-cell">
                                {new Date(attempt.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Assignment Results Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {loadingSubmissions ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-5.586a1 1 0 01-.707-.293l-5.414-5.414A1 1 0 013 12V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0116 5v1" />
                  </svg>
                  <p className="text-gray-500">No assignments in this course yet.</p>
                </div>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{assignment.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 break-words">
                      Total Marks: {assignment.total_marks}
                      {assignment.due_date && ` · Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
                    </p>
                  </div>

                  {submissions[assignment.id]?.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">No submissions yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px]">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Student</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Marks</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600">Status</th>
                            <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-600 hidden md:table-cell">Submitted Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions[assignment.id]?.map((submission) => (
                            <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="p-3 sm:p-4 font-medium text-gray-900 text-sm sm:text-base">
                                <span className="truncate block max-w-[140px] sm:max-w-none">{submission.student?.name}</span>
                                <span className="block text-xs text-gray-400 font-normal sm:hidden truncate max-w-[160px]">
                                  {submission.student?.email}
                                </span>
                              </td>
                              <td className="p-3 sm:p-4 text-gray-500 text-sm hidden sm:table-cell">{submission.student?.email}</td>
                              <td className="p-3 sm:p-4 font-semibold text-gray-900 text-sm sm:text-base whitespace-nowrap">
                                {submission.marks !== null ? `${submission.marks}/${assignment.total_marks}` : '-'}
                              </td>
                              <td className="p-3 sm:p-4">
                                <span className={`text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap ${submission.marks !== null
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {submission.marks !== null ? 'Graded' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-3 sm:p-4 text-gray-500 text-sm hidden md:table-cell">
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}