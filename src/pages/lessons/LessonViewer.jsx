import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';

export default function LessonViewer() {
    const { moduleId, lessonId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const isAdmin = user?.role === 'admin';
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
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [attemptsLoading, setAttemptsLoading] = useState(false);

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
                if (lessonInfo.content_type === 'quiz') {
                    try {
                        const quizRes = await api.get(`/lessons/${lessonId}/quiz`);
                        quizData = quizRes.data;
                        if (user?.role === 'student') {
                            const attemptRes = await api.get(`/quizzes/${quizRes.data.id}/my-attempt`);
                            if (attemptRes.data) {
                                attemptData = attemptRes.data;
                            }
                        }
                        // Fetch all attempts for admin and instructor
                        if ((user?.role === 'admin' || user?.role === 'instructor') && quizRes.data?.id) {
                            try {
                                setAttemptsLoading(true);
                                const attemptsUrl = user.role === 'admin'
                                    ? `/admin/quizzes/${quizRes.data.id}/attempts`
                                    : `/quizzes/${quizRes.data.id}/attempts`;
                                const attemptsRes = await api.get(attemptsUrl);
                                setQuizAttempts(attemptsRes.data || []);
                            } catch (attErr) {
                                console.error('Error fetching quiz attempts:', attErr);
                            } finally {
                                setAttemptsLoading(false);
                            }
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
                if ((user?.role === 'student' || isAdmin) && courseId) {
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Back button */}
                <Link
                    to={state.courseId ? `/courses/${state.courseId}` : '/courses'}
                    className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors mb-6"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to course
                </Link>

                {/* Lesson content card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            {state.lesson.content_type === 'video' && (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                            {state.lesson.content_type === 'text' && (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                            {state.lesson.content_type === 'quiz' && (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            )}
                            {state.lesson.content_type === 'files' && (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="aspect-video mb-6 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                            <iframe
                                src={(() => {
                                    const url = state.lesson.video_url;
                                    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
                                    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
                                })()}
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
                                <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-gray-500">No files uploaded yet.</p>
                                </div>
                            ) : (
                                state.lesson.files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:from-indigo-50 hover:to-purple-50 transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
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
                                                className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDownloadFile(file)}
                                                className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200"
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
                            {(user?.role === 'instructor' || isAdmin) && state.quiz ? (
                                <>
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 mb-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center">
                                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    Quiz Preview
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    Showing quiz questions with correct answers highlighted.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                            Question Breakdown
                                        </h3>
                                        {state.quiz.questions.map((question, index) => {
                                            const isCorrectAnswer = (value) => {
                                                if (question.type === 'true_false') {
                                                    return question.correct_answer === value;
                                                } else {
                                                    // For MCQs, check if the answer has is_correct field set to true
                                                    const answer = question.answers?.find(a => a.id === value);
                                                    return answer?.is_correct === true;
                                                }
                                            };
                                            return (
                                                <div
                                                    key={question.id}
                                                    className="bg-white rounded-xl border-2 p-5 shadow-sm border-gray-200"
                                                >
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900 mb-1">
                                                                Question {index + 1}
                                                            </p>
                                                            <p className="text-gray-700">{question.question_text}</p>
                                                        </div>
                                                    </div>

                                                    <div className="ml-11 space-y-2">
                                                        {question.type === 'true_false' ? (
                                                            ['true', 'false'].map((value) => {
                                                                const isCorrect = isCorrectAnswer(value);
                                                                return (
                                                                    <div
                                                                        key={value}
                                                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isCorrect
                                                                            ? 'bg-green-100 border-green-300 text-green-800'
                                                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                                                            }`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                                                                            {isCorrect && (
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                                                                            )}
                                                                        </div>
                                                                        <span className="font-medium text-sm">
                                                                            {value === 'true' ? 'True' : 'False'}
                                                                        </span>
                                                                        {isCorrect && (
                                                                            <span className="ml-auto text-xs font-medium text-green-700 flex items-center gap-1">
                                                                                Correct answer
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            question.answers.map((answer) => {
                                                                const isCorrect = isCorrectAnswer(answer.id);
                                                                return (
                                                                    <div
                                                                        key={answer.id}
                                                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isCorrect
                                                                            ? 'bg-green-100 border-green-300 text-green-800'
                                                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                                                            }`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                                                                            {isCorrect && (
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                                                                            )}
                                                                        </div>
                                                                        <span className="font-medium text-sm">
                                                                            {answer.answer_text}
                                                                        </span>
                                                                        {isCorrect && (
                                                                            <span className="ml-auto text-xs font-medium text-green-700 flex items-center gap-1">
                                                                                Correct answer
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Quiz Attempts Table (admin only) */}
                                    <div className="mt-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Quiz Attempts</h3>
                                                <p className="text-sm text-gray-500">All student submissions for this quiz</p>
                                            </div>
                                            <span className="ml-auto bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
                                                {quizAttempts.length} {quizAttempts.length === 1 ? 'attempt' : 'attempts'}
                                            </span>
                                        </div>

                                        {attemptsLoading ? (
                                            <div className="flex items-center justify-center py-10">
                                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                            </div>
                                        ) : quizAttempts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl border border-dashed border-gray-200">
                                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-600 font-medium mb-1">No quiz attempts yet</p>
                                                <p className="text-gray-400 text-sm">Students haven't attempted this quiz yet.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm -mx-4 sm:mx-0">
                                                <table className="w-full text-sm min-w-[640px]">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                                            <th className="text-left px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold">#</th>
                                                            <th className="text-left px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold">Student</th>
                                                            <th className="text-left px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold hidden sm:table-cell">Email</th>
                                                            <th className="text-center px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold">Score</th>
                                                            <th className="text-center px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold">Result</th>
                                                            <th className="text-right px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold hidden md:table-cell">Date</th>
                                                            <th className="text-center px-3 sm:px-5 py-2.5 sm:py-3.5 font-semibold">Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                        {quizAttempts.map((attempt, idx) => (
                                                            <tr key={attempt.id} className="hover:bg-indigo-50/40 transition-colors duration-150">
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-gray-500 font-medium">{idx + 1}</td>
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5">
                                                                    <div className="flex items-center gap-2 sm:gap-2.5">
                                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                                            {attempt.user?.name?.charAt(0)?.toUpperCase()}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium text-gray-900 block truncate max-w-[120px] sm:max-w-none">{attempt.user?.name}</span>
                                                                            <span className="text-xs text-gray-400 truncate block sm:hidden max-w-[120px]">{attempt.user?.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-gray-500 hidden sm:table-cell">{attempt.user?.email}</td>
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center">
                                                                    <span className={`font-bold text-sm sm:text-base ${attempt.passed ? 'text-green-600' : 'text-red-500'
                                                                        }`}>
                                                                        {attempt.score ?? 0}%
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center">
                                                                    {attempt.passed ? (
                                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                            <span className="hidden xs:inline">Passed</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                            <span className="hidden xs:inline">Failed</span>
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-right text-gray-500 text-xs hidden md:table-cell">
                                                                    {attempt.created_at
                                                                        ? new Date(attempt.created_at).toLocaleDateString('en-US', {
                                                                            year: 'numeric', month: 'short', day: 'numeric',
                                                                        })
                                                                        : '—'}
                                                                </td>
                                                                <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-center">
                                                                    <Link
                                                                        to={`/quiz-attempts/${attempt.id}`}
                                                                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                        <span className="hidden sm:inline">View</span>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : user?.role === 'student' && state.quizAttempt && state.quiz ? (
                                <>
                                    {/* Attempt Summary Card */}
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 mb-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${state.quizAttempt.passed
                                                ? 'bg-gradient-to-br from-green-400 to-green-500'
                                                : 'bg-gradient-to-br from-orange-400 to-orange-500'
                                                }`}>
                                                {state.quizAttempt.passed ? (
                                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {state.quizAttempt.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    You have completed this quiz. Only one attempt is allowed.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-indigo-600">{state.quizAttempt.score ?? 0}%</p>
                                                <p className="text-sm text-gray-500">Your Score</p>
                                            </div>
                                        </div>
                                    </div>

                                    {!showResults ? (
                                        <button
                                            onClick={() => setShowResults(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium cursor-pointer"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            View Detailed Results
                                        </button>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Stats Cards */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
                                                    <p className="text-3xl font-bold text-green-600 mb-1">{state.quizAttempt.correct ?? 0}</p>
                                                    <p className="text-sm text-green-700 font-medium">Correct</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 text-center">
                                                    <p className="text-3xl font-bold text-red-600 mb-1">
                                                        {(state.quizAttempt.total ?? 0) - (state.quizAttempt.correct ?? 0)}
                                                    </p>
                                                    <p className="text-sm text-red-700 font-medium">Incorrect</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4 text-center">
                                                    <p className="text-3xl font-bold text-indigo-600 mb-1">{state.quizAttempt.score ?? 0}%</p>
                                                    <p className="text-sm text-indigo-700 font-medium">Score</p>
                                                </div>
                                            </div>

                                            {/* Question Breakdown */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                    Question Breakdown
                                                </h3>
                                                {state.quiz.questions.map((question, index) => {
                                                    const detail = state.quizAttempt.details?.find(
                                                        (d) => d.question_id === question.id
                                                    );
                                                    const isCorrect = detail?.is_correct;
                                                    return (
                                                        <div
                                                            key={question.id}
                                                            className={`bg-white rounded-xl border-2 p-5 shadow-sm ${isCorrect
                                                                ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-white'
                                                                : 'border-red-200 bg-gradient-to-br from-red-50/50 to-white'
                                                                }`}
                                                        >
                                                            <div className="flex items-start gap-3 mb-4">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCorrect
                                                                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                                                                    : 'bg-gradient-to-br from-red-500 to-red-600'
                                                                    }`}>
                                                                    {isCorrect ? (
                                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-gray-900 mb-1">
                                                                        Question {index + 1}
                                                                    </p>
                                                                    <p className="text-gray-700">{question.question_text}</p>
                                                                </div>
                                                                <Badge variant={isCorrect ? 'success' : 'danger'} className="capitalize">
                                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                                </Badge>
                                                            </div>

                                                            <div className="ml-11 space-y-2">
                                                                {question.type === 'true_false' ? (
                                                                    ['true', 'false'].map((value) => {
                                                                        const isStudentAnswer = detail?.submitted_answer === value;
                                                                        const isCorrectAnswer = detail?.correct_answer === value;
                                                                        return (
                                                                            <div
                                                                                key={value}
                                                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isStudentAnswer && isCorrectAnswer
                                                                                    ? 'bg-green-500 border-green-600 text-white shadow-md'
                                                                                    : isStudentAnswer
                                                                                        ? 'bg-red-500 border-red-600 text-white shadow-md'
                                                                                        : isCorrectAnswer
                                                                                            ? 'bg-green-100 border-green-300 text-green-800'
                                                                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                                                                    }`}
                                                                            >
                                                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                                                                                    {isStudentAnswer && (
                                                                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                                                    )}
                                                                                </div>
                                                                                <span className="font-medium text-sm">
                                                                                    {value === 'true' ? 'True' : 'False'}
                                                                                </span>
                                                                                {isStudentAnswer && !isCorrectAnswer && (
                                                                                    <span className="ml-auto text-xs font-medium">
                                                                                        Your answer
                                                                                    </span>
                                                                                )}
                                                                                {isCorrectAnswer && !isStudentAnswer && (
                                                                                    <span className="ml-auto text-xs font-medium">
                                                                                        Correct answer
                                                                                    </span>
                                                                                )}
                                                                                {isStudentAnswer && isCorrectAnswer && (
                                                                                    <span className="ml-auto text-xs font-medium flex items-center gap-1">
                                                                                        Correct
                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                        </svg>
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    question.answers.map((answer) => {
                                                                        const isStudentAnswer = detail?.submitted_answer_id === answer.id;
                                                                        const isCorrectAnswer = detail?.correct_answer_id === answer.id;
                                                                        return (
                                                                            <div
                                                                                key={answer.id}
                                                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isStudentAnswer && isCorrectAnswer
                                                                                    ? 'bg-green-500 border-green-600 text-white shadow-md'
                                                                                    : isStudentAnswer
                                                                                        ? 'bg-red-500 border-red-600 text-white shadow-md'
                                                                                        : isCorrectAnswer
                                                                                            ? 'bg-green-100 border-green-300 text-green-800'
                                                                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                                                                    }`}
                                                                            >
                                                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                                                                                    {isStudentAnswer && (
                                                                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                                                    )}
                                                                                </div>
                                                                                <span className="font-medium text-sm">
                                                                                    {answer.answer_text}
                                                                                </span>
                                                                                {isStudentAnswer && !isCorrectAnswer && (
                                                                                    <span className="ml-auto text-xs font-medium">
                                                                                        Your answer
                                                                                    </span>
                                                                                )}
                                                                                {isCorrectAnswer && !isStudentAnswer && (
                                                                                    <span className="ml-auto text-xs font-medium">
                                                                                        Correct answer
                                                                                    </span>
                                                                                )}
                                                                                {isStudentAnswer && isCorrectAnswer && (
                                                                                    <span className="ml-auto text-xs font-medium flex items-center gap-1">
                                                                                        Correct
                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                        </svg>
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50/30 rounded-2xl border border-indigo-100">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Test Your Knowledge?</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Complete this quiz to mark the lesson as done and track your progress.
                                    </p>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium"
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

                {/* Mark complete button (students only, not for quiz lessons or admins) */}
                {user?.role === 'student' && !isAdmin && state.lesson.content_type !== 'quiz' && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${state.completed
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
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ${state.completed
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-md'
                                }`}
                        >
                            {marking
                                ? 'Saving...'
                                : state.completed
                                    ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Mark as Incomplete
                                        </>
                                    )
                                    : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Mark as Complete
                                        </>
                                    )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}