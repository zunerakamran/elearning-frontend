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
                console.log('Quiz data for lesson', lesson.id, ':', res.data);
                return { ...res.data, lesson_title: lesson.title };
              })
              .catch(() => null)
          )
        ).then((quizzesData) => {
          const validQuizzes = quizzesData.filter((q) => q !== null);
          console.log('Valid quizzes:', validQuizzes);
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

    console.log('Fetching attempts for quizzes:', quizzes.map(q => ({ id: q.id, lesson_id: q.lesson_id, title: q.title })));

    Promise.all(
      quizzes.map((quiz) =>
        api.get(`/quizzes/${quiz.id}/attempts`)
          .then((res) => {
            console.log('Attempts response for quiz', quiz.id, ':', res.data);
            return { quizId: quiz.id, data: res.data };
          })
          .catch((err) => {
            console.error('Error fetching attempts for quiz', quiz.id, ':', err);
            console.error('Backend endpoint /quizzes/${quiz.id}/attempts is returning 500 error - this is a backend bug');
            return { quizId: quiz.id, data: [] };
          })
      )
    ).then((results) => {
      const attemptsMap = {};
      results.forEach(({ quizId, data }) => {
        attemptsMap[quizId] = data;
      });
      console.log('Final attempts map:', attemptsMap);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{course?.title}</h1>
          <p className="text-gray-500 mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'students'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Enrolled Students
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'quizzes'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Quiz Results
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'assignments'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Assignment Results
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">No students enrolled yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">#</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Enrolled At</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-400">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-900">{student.name}</td>
                      <td className="p-4 text-gray-500 text-sm">{student.email}</td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(student.pivot?.enrolled_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <div className="p-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Lesson: {quiz.lesson_title} · Passing score: {quiz.passing_score}%
                    </p>
                  </div>

                  {attempts[quiz.id]?.length === 0 ? (
                    <p className="p-4 text-gray-500">No attempts yet.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Student</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Score</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Result</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts[quiz.id]?.map((attempt) => (
                          <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{attempt.user?.name}</td>
                            <td className="p-4 text-gray-500 text-sm">{attempt.user?.email}</td>
                            <td className="p-4 font-semibold text-gray-900">{attempt.score}%</td>
                            <td className="p-4">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                attempt.passed
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-500 text-sm">
                              {new Date(attempt.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  <div className="p-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Total Marks: {assignment.total_marks}
                      {assignment.due_date && ` · Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
                    </p>
                  </div>

                  {submissions[assignment.id]?.length === 0 ? (
                    <p className="p-4 text-gray-500">No submissions yet.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Student</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Marks</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions[assignment.id]?.map((submission) => (
                          <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{submission.student?.name}</td>
                            <td className="p-4 text-gray-500 text-sm">{submission.student?.email}</td>
                            <td className="p-4 font-semibold text-gray-900">
                              {submission.marks !== null ? `${submission.marks}/${assignment.total_marks}` : '-'}
                            </td>
                            <td className="p-4">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                submission.marks !== null
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {submission.marks !== null ? 'Graded' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-500 text-sm">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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