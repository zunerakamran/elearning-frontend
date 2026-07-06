import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';

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

    async function handleDownloadFile(file) {
        try {
            const response = await api.get(`/lessons/${lessonId}/files/${file.id}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.file_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download file. Please try again.');
        }
    }

    async function handleViewFile(file) {
        try {
            const response = await api.get(`/lessons/${lessonId}/files/${file.id}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: file.file_type }));
            window.open(url, '_blank');
        } catch (err) {
            console.error('View error:', err);
            alert('Failed to view file. Please try again.');
        }
    }

    // Keep showing loading until BOTH auth and data are ready
    if (authLoading || state.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading lesson...</p>
                </div>
            </div>
        );
    }

    if (!state.lesson) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-red-600 font-medium">Lesson not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Lesson content card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                            {state.lesson.content_type === 'video' && (
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                            {state.lesson.content_type === 'text' && (
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                            {state.lesson.content_type === 'quiz' && (
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            )}
                            {state.lesson.content_type === 'files' && (
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            )}
                        </div>
                        <Badge variant="primary" className="capitalize">{state.lesson.content_type}</Badge>
                        {state.completed && (
                            <div className="ml-auto flex items-center gap-2 text-green-600 font-medium text-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Completed
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">{state.lesson.title}</h1>

                    {/* Video lesson */}
                    {state.lesson.content_type === 'video' && state.lesson.video_url && (
                        <div className="aspect-video mb-6 rounded-xl overflow-hidden shadow-lg">
                            <iframe
                                src={state.lesson.video_url.replace('watch?v=', 'embed/')}
                                title={state.lesson.title}
                                className="w-full h-full"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Text lesson */}
                    {state.lesson.content_type === 'text' && state.lesson.text_content && (
                        <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {state.lesson.text_content}
                        </div>
                    )}

                    {/* Files lesson */}
                    {state.lesson.content_type === 'files' && state.lesson.files && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Learning Materials ({state.lesson.files.length})
                            </h3>
                            {state.lesson.files.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-gray-500">No files uploaded yet.</p>
                                </div>
                            ) : (
                                state.lesson.files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            {file.file_type?.includes('pdf') && (
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            {file.file_type?.includes('word') && (
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            )}
                                            {file.file_type?.includes('powerpoint') && (
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                                </svg>
                                            )}
                                            {file.file_type?.includes('image') && (
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            {!file.file_type && (
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{file.file_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewFile(file)}
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDownloadFile(file)}
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
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
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        This lesson has a quiz. Complete it to mark the lesson as done.
                                    </p>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        Start Quiz
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mark complete button (students only, not for quiz lessons) */}
                {user?.role === 'student' && state.lesson.content_type !== 'quiz' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                state.completed
                                    ? 'bg-green-100'
                                    : 'bg-gray-100'
                            }`}>
                                {state.completed ? (
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {state.completed
                                        ? 'Lesson completed'
                                        : 'Mark lesson as complete'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {state.completed
                                        ? 'You can mark it as incomplete if needed'
                                        : 'When you finish the lesson content'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleComplete}
                            disabled={marking}
                            className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                state.completed
                                    ? 'bg-gray-400 hover:bg-gray-500'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {marking
                                ? 'Saving...'
                                : state.completed
                                    ? 'Mark as Incomplete'
                                    : 'Mark as Complete'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}