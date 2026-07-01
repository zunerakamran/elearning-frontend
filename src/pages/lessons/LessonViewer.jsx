import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function LessonViewer() {
    const { moduleId, lessonId } = useParams();
    const { user } = useAuth();
    const [completed, setCompleted] = useState(false);
    const [marking, setMarking] = useState(false);
    const [state, setState] = useState({
        loading: true,
        lesson: null,
        quizAttempt: null,
        attemptCheckComplete: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/modules/${moduleId}/lessons/${lessonId}`);
                const lessonInfo = res.data;

                // Check if student has attempted the quiz BEFORE setting lesson state
                let attemptData = null;
                if (lessonInfo.content_type === 'quiz' && user?.role === 'student') {
                    try {
                        const quizRes = await api.get(`/lessons/${lessonId}/quiz`);
                        const attemptRes = await api.get(`/quizzes/${quizRes.data.id}/my-attempt`);
                        if (attemptRes.data) {
                            attemptData = attemptRes.data;
                        }
                    } catch (err) {
                        // 404 means no attempt exists, which is normal
                        if (err.response?.status !== 404) {
                            console.error('Error fetching quiz attempt:', err);
                        }
                    }
                }

                // Set all state atomically in one update
                setState({
                    loading: false,
                    lesson: lessonInfo,
                    quizAttempt: attemptData,
                    attemptCheckComplete: true
                });
            } catch (err) {
                console.error('Error fetching lesson:', err);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();
    }, [moduleId, lessonId, user]);

    // Check if this lesson is already completed
    useEffect(() => {
        if (!state.lesson || user?.role !== 'student') return;
        const courseId = state.lesson.module?.course_id;
        if (!courseId) return;

        api.get(`/courses/${courseId}/progress`)
            .then((res) => {
                const isCompleted = res.data.completed_lesson_ids.includes(state.lesson.id);
                setCompleted(isCompleted);
            })
            .catch(() => { });
    }, [state.lesson, user]);

    async function toggleComplete() {
        setMarking(true);
        try {
            if (completed) {
                await api.delete(`/lessons/${lessonId}/complete`);
                setCompleted(false);
            } else {
                await api.post(`/lessons/${lessonId}/complete`);
                setCompleted(true);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong.');
        } finally {
            setMarking(false);
        }
    }

    if (state.loading) return <div className="p-8 text-center">Loading lesson...</div>;
    if (!state.lesson) return <div className="p-8 text-center text-red-600">Lesson not found.</div>;

    // For students viewing quiz lessons, wait for attempt check to complete before rendering
    if (state.lesson.content_type === 'quiz' && user?.role === 'student' && !state.attemptCheckComplete) {
        return <div className="p-8 text-center">Loading quiz...</div>;
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
                        {completed && (
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
                        <div className="text-center">
                            {user?.role === 'instructor' ? (
                                <>
                                    <p className="text-gray-600 mb-4">
                                        This lesson has a quiz. You can view the quiz content.
                                    </p>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
                                    >
                                        View Quiz
                                    </Link>
                                </>
                            ) : state.quizAttempt ? (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-blue-800 text-sm mb-2">You have already attempted this quiz. Only one attempt is allowed.</p>
                                        <p className="text-gray-700 font-medium">
                                            Your Score: {state.quizAttempt.score}% · {state.quizAttempt.passed ? '✓ Passed' : '✗ Failed'}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 inline-block"
                                    >
                                        View Results
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-4">
                                        This lesson has a quiz. Complete it to mark the lesson as done.
                                    </p>
                                    <Link
                                        to={`/lessons/${lessonId}/quiz`}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
                                    >
                                        Start Quiz
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Mark complete button (students only, not for quiz lessons) */}
                {user?.role === 'student' && state.lesson.content_type !== 'quiz' && (
                    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                        <span className="text-gray-600 text-sm">
                            {completed
                                ? 'You have completed this lesson.'
                                : 'Mark this lesson as complete when you are done.'}
                        </span>
                        <button
                            onClick={toggleComplete}
                            disabled={marking}
                            className={`px-4 py-2 rounded text-white text-sm disabled:opacity-50 ${completed
                                    ? 'bg-gray-400 hover:bg-gray-500'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {marking
                                ? 'Saving...'
                                : completed
                                    ? 'Mark as Incomplete'
                                    : '✓ Mark as Complete'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}