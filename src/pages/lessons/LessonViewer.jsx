import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function LessonViewer() {
    const { moduleId, lessonId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const [marking, setMarking] = useState(false);
    const [state, setState] = useState({
        loading: true,
        lesson: null,
        quizAttempt: null,
        quiz: null,
        courseId: null,
        completed: false,
    });
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        // Wait for auth to finish before doing anything
        if (authLoading) return;

        const fetchData = async () => {
            try {
                // Fetch lesson
                const res = await api.get(`/modules/${moduleId}/lessons/${lessonId}`);
                const lessonInfo = res.data;

                // Fetch courseId from module
                let courseId = null;
                try {
                    const moduleRes = await api.get(`/modules/${moduleId}`);
                    courseId = moduleRes.data.course_id;
                } catch (err) {
                    console.error('Could not fetch module info:', err);
                }

                // Check quiz attempt for students BEFORE any render
                let attemptData = null;
                let quizData = null;
                if (lessonInfo.content_type === 'quiz' && user?.role === 'student') {
                    try {
                        const quizRes = await api.get(`/lessons/${lessonId}/quiz`);
                        quizData = quizRes.data;
                        const attemptRes = await api.get(`/quizzes/${quizRes.data.id}/my-attempt`);
                        if (attemptRes.data) {
                            attemptData = attemptRes.data;
                        }
                    } catch (err) {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching quiz attempt:', err);
                        }
                        // 404 = no attempt yet, attemptData stays null — correct
                    }
                }

                // Check completion status for students
                let completed = false;
                if (user?.role === 'student' && courseId) {
                    try {
                        const progressRes = await api.get(`/courses/${courseId}/progress`);
                        completed = progressRes.data.completed_lesson_ids.includes(lessonInfo.id);
                    } catch (err) {
                        console.error('Error fetching progress:', err);
                    }
                }

                // Single atomic update — no intermediate renders possible
                setState({
                    loading: false,
                    lesson: lessonInfo,
                    quizAttempt: attemptData,
                    quiz: quizData,
                    courseId,
                    completed,
                });

            } catch (err) {
                console.error('Error fetching lesson:', err);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();
    }, [moduleId, lessonId, authLoading, user]);
    // ↑ authLoading in deps so effect re-runs once auth resolves

    async function toggleComplete() {
        setMarking(true);
        try {
            if (state.completed) {
                await api.delete(`/lessons/${lessonId}/complete`);
                setState(prev => ({ ...prev, completed: false }));
            } else {
                await api.post(`/lessons/${lessonId}/complete`);
                setState(prev => ({ ...prev, completed: true }));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong.');
        } finally {
            setMarking(false);
        }
    }

    // Keep showing loading until BOTH auth and data are ready
    if (authLoading || state.loading) {
        return <div className="p-8 text-center">Loading lesson...</div>;
    }

    if (!state.lesson) {
        return <div className="p-8 text-center text-red-600">Lesson not found.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto">

                {/* Lesson content card */}
                <div className="bg-white rounded-lg shadow p-8 mb-4">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl">
                            {state.lesson.content_type === 'video' && '🎬'}
                            {state.lesson.content_type === 'text' && '📄'}
                            {state.lesson.content_type === 'quiz' && '📝'}
                        </span>
                        <span className="text-xs uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded capitalize">
                            {state.lesson.content_type}
                        </span>
                        {state.completed && (
                            <span className="ml-auto text-green-600 font-medium text-sm">
                                ✓ Completed
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold mb-6">{state.lesson.title}</h1>

                    {/* Video lesson */}
                    {state.lesson.content_type === 'video' && state.lesson.video_url && (
                        <div className="aspect-video mb-6">
                            <iframe
                                src={state.lesson.video_url.replace('watch?v=', 'embed/')}
                                title={state.lesson.title}
                                className="w-full h-full rounded"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Text lesson */}
                    {state.lesson.content_type === 'text' && state.lesson.text_content && (
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {state.lesson.text_content}
                        </div>
                    )}

                    {/* Quiz lesson */}
                    {state.lesson.content_type === 'quiz' && (
                        <div>
                            {user?.role === 'instructor' ? (
                                <div className="text-center">
                                    <p className="text-gray-600 mb-4">
                                        This lesson has a quiz. You can view the quiz content.
                                    </p>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
                                    >
                                        View Quiz
                                    </Link>
                                </div>
                            ) : state.quizAttempt && state.quiz ? (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-blue-800 text-sm mb-2">
                                            You have already attempted this quiz. Only one attempt is allowed.
                                        </p>
                                        <p className="text-gray-700 font-medium">
                                            Your Score: {state.quizAttempt.score ?? 0}% · {state.quizAttempt.passed ? '✓ Passed' : '✗ Failed'}
                                        </p>
                                    </div>

                                    {!showResults ? (
                                        <button
                                            onClick={() => setShowResults(true)}
                                            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 inline-block"
                                        >
                                            View Results
                                        </button>
                                    ) : (
                                        <div className="mb-6">
                                            <div className="flex justify-center gap-8 mb-6">
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-green-600">{state.quizAttempt.correct ?? 0}</p>
                                                    <p className="text-gray-400 text-sm">Correct</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-red-500">
                                                        {(state.quizAttempt.total ?? 0) - (state.quizAttempt.correct ?? 0)}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">Incorrect</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-blue-600">{state.quizAttempt.score ?? 0}%</p>
                                                    <p className="text-gray-400 text-sm">Score</p>
                                                </div>
                                            </div>

                                            <div className="text-left">
                                                <h2 className="font-semibold mb-3">Question Breakdown</h2>
                                                {state.quiz.questions.map((question, index) => {
                                                    const detail = state.quizAttempt.details?.find(
                                                        (d) => d.question_id === question.id
                                                    );
                                                    return (
                                                        <div
                                                            key={question.id}
                                                            className={`p-4 rounded mb-3 ${
                                                                detail?.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                                            }`}
                                                        >
                                                            <p className="font-medium mb-3">
                                                                {index + 1}. {question.question_text}
                                                                {detail && (
                                                                    <span className="ml-2">
                                                                        {detail?.is_correct ? '✓' : '✗'}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            
                                                            {question.type === 'true_false' ? (
                                                                <div className="space-y-2 ml-4">
                                                                    {['true', 'false'].map((value) => {
                                                                        const isStudentAnswer = detail?.submitted_answer === value;
                                                                        const isCorrect = detail?.correct_answer === value;
                                                                        console.log('TF Answer:', value, 'isStudentAnswer:', isStudentAnswer, 'isCorrect:', isCorrect, 'detail:', detail);
                                                                        return (
                                                                            <div
                                                                                key={value}
                                                                                className={`p-2 rounded border-2 ${
                                                                                    isStudentAnswer && isCorrect
                                                                                        ? 'bg-green-500 border-green-600 text-white'
                                                                                        : isStudentAnswer
                                                                                        ? 'bg-red-500 border-red-600 text-white'
                                                                                        : isCorrect
                                                                                        ? 'bg-green-400 border-green-500 text-white'
                                                                                        : 'bg-transparent border-gray-300'
                                                                                }`}
                                                                                style={{
                                                                                    backgroundColor: isStudentAnswer && isCorrect ? '#22c55e' : isStudentAnswer ? '#ef4444' : isCorrect ? '#4ade80' : 'transparent',
                                                                                    borderColor: isStudentAnswer && isCorrect ? '#16a34a' : isStudentAnswer ? '#dc2626' : isCorrect ? '#22c55e' : '#d1d5db',
                                                                                    color: (isStudentAnswer || isCorrect) ? 'white' : 'black'
                                                                                }}
                                                                            >
                                                                                <span className="text-sm">
                                                                                    {value === 'true' ? 'True' : 'False'}
                                                                                    {isStudentAnswer && ' (Your answer)'}
                                                                                    {isCorrect && !isStudentAnswer && ' (Correct)'}
                                                                                    {isStudentAnswer && isCorrect && ' ✓'}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2 ml-4">
                                                                    {question.answers.map((answer) => {
                                                                        const isStudentAnswer = detail?.submitted_answer_id === answer.id;
                                                                        const isCorrect = detail?.correct_answer_id === answer.id;
                                                                        console.log('MC Answer:', answer.answer_text, 'isStudentAnswer:', isStudentAnswer, 'isCorrect:', isCorrect, 'detail:', detail);
                                                                        return (
                                                                            <div
                                                                                key={answer.id}
                                                                                className={`p-2 rounded border-2 ${
                                                                                    isStudentAnswer && isCorrect
                                                                                        ? 'bg-green-500 border-green-600 text-white'
                                                                                        : isStudentAnswer
                                                                                        ? 'bg-red-500 border-red-600 text-white'
                                                                                        : isCorrect
                                                                                        ? 'bg-green-400 border-green-500 text-white'
                                                                                        : 'bg-transparent border-gray-300'
                                                                                }`}
                                                                                style={{
                                                                                    backgroundColor: isStudentAnswer && isCorrect ? '#22c55e' : isStudentAnswer ? '#ef4444' : isCorrect ? '#4ade80' : 'transparent',
                                                                                    borderColor: isStudentAnswer && isCorrect ? '#16a34a' : isStudentAnswer ? '#dc2626' : isCorrect ? '#22c55e' : '#d1d5db',
                                                                                    color: (isStudentAnswer || isCorrect) ? 'white' : 'black'
                                                                                }}
                                                                            >
                                                                                <span className="text-sm">
                                                                                    {answer.answer_text}
                                                                                    {isStudentAnswer && ' (Your answer)'}
                                                                                    {isCorrect && !isStudentAnswer && ' (Correct)'}
                                                                                    {isStudentAnswer && isCorrect && ' ✓'}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center">
                                    <p className="text-gray-600 mb-4">
                                        This lesson has a quiz. Complete it to mark the lesson as done.
                                    </p>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
                                    >
                                        Start Quiz
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mark complete button (students only, not for quiz lessons) */}
                {user?.role === 'student' && state.lesson.content_type !== 'quiz' && (
                    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                        <span className="text-gray-600 text-sm">
                            {state.completed
                                ? 'You have completed this lesson.'
                                : 'Mark this lesson as complete when you are done.'}
                        </span>
                        <button
                            onClick={toggleComplete}
                            disabled={marking}
                            className={`px-4 py-2 rounded text-white text-sm disabled:opacity-50 ${
                                state.completed
                                    ? 'bg-gray-400 hover:bg-gray-500'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {marking
                                ? 'Saving...'
                                : state.completed
                                    ? 'Mark as Incomplete'
                                    : '✓ Mark as Complete'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}