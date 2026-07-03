import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function CourseStudents() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
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
              .then((res) => ({ ...res.data, lesson_title: lesson.title }))
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

    quizzes.forEach((quiz) => {
      console.log('Fetching attempts for quiz ID:', quiz.id);
      api.get(`/quizzes/${quiz.id}/attempts`)
        .then((res) => {
          console.log('Attempts response for quiz', quiz.id, ':', res.data);
          setAttempts((prev) => ({ ...prev, [quiz.id]: res.data }));
        })
        .catch((err) => {
          console.error('Error fetching attempts for quiz', quiz.id, ':', err);
          setAttempts((prev) => ({ ...prev, [quiz.id]: [] }));
        });
    });
  }, [activeTab, quizzes]);

  // Load submissions when switching to assignments tab
  useEffect(() => {
    if (activeTab !== 'assignments' || assignments.length === 0) return;

    assignments.forEach((assignment) => {
      api.get(`/assignments/${assignment.id}/submissions`)
        .then((res) => {
          setSubmissions((prev) => ({ ...prev, [assignment.id]: res.data }));
        })
        .catch((err) => {
          console.error('Error fetching submissions for assignment', assignment.id, ':', err);
          setSubmissions((prev) => ({ ...prev, [assignment.id]: [] }));
        });
    });
  }, [activeTab, assignments]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <Link
            to="/dashboard"
            className="text-blue-600 text-sm hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-3">{course?.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Enrolled Students
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Quiz Results
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Assignment Results
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {students.length === 0 ? (
              <p className="p-6 text-gray-500">No students enrolled yet.</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">#</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Enrolled At</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-400">{index + 1}</td>
                      <td className="p-4 font-medium">{student.name}</td>
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
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">No quizzes in this course yet.</p>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold">{quiz.title}</h3>
                    <p className="text-gray-400 text-sm">
                      Lesson: {quiz.lesson_title} · Passing score: {quiz.passing_score}%
                    </p>
                  </div>

                  {!attempts[quiz.id] ? (
                    <p className="p-4 text-gray-400 text-sm">Loading attempts...</p>
                  ) : attempts[quiz.id].length === 0 ? (
                    <p className="p-4 text-gray-500">No attempts yet.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Student</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Score</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Result</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts[quiz.id].map((attempt) => (
                          <tr key={attempt.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{attempt.user?.name}</td>
                            <td className="p-4 text-gray-500 text-sm">{attempt.user?.email}</td>
                            <td className="p-4 font-semibold">{attempt.score}%</td>
                            <td className="p-4">
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
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
            {assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">No assignments in this course yet.</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <p className="text-gray-400 text-sm">
                      Total Marks: {assignment.total_marks}
                      {assignment.due_date && ` · Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
                    </p>
                  </div>

                  {!submissions[assignment.id] ? (
                    <p className="p-4 text-gray-400 text-sm">Loading submissions...</p>
                  ) : submissions[assignment.id].length === 0 ? (
                    <p className="p-4 text-gray-500">No submissions yet.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Student</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Marks</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left p-4 text-sm font-semibold text-gray-600">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions[assignment.id].map((submission) => (
                          <tr key={submission.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{submission.student?.name}</td>
                            <td className="p-4 text-gray-500 text-sm">{submission.student?.email}</td>
                            <td className="p-4 font-semibold">
                              {submission.marks !== null ? `${submission.marks}/${assignment.total_marks}` : '-'}
                            </td>
                            <td className="p-4">
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
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