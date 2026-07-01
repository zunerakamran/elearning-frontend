import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CourseDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [enrolled, setEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const requests = [
            api.get(`/courses/${id}`),
            api.get(`/courses/${id}/modules`),
        ];

        if (user) {
            requests.push(api.get(`/courses/${id}/enrollment-status`));
        }

        Promise.all(requests)
            .then(([courseRes, modulesRes, enrollRes]) => {
                setCourse(courseRes.data);
                setModules(modulesRes.data);
                if (enrollRes) {
                    setEnrolled(enrollRes.data.enrolled);

                    // Fetch progress if enrolled
                    if (enrollRes.data.enrolled && user?.role === 'student') {
                        api.get(`/courses/${id}/progress`)
                            .then((res) => setProgress(res.data))
                            .catch(() => { });
                    }
                }
            })
            .catch(() => navigate('/courses'))
            .finally(() => setLoading(false));
    }, [id, user]);

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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!course) return null;

    const isOwner = user?.id === course.instructor_id;
    const isStudent = user?.role === 'student';

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">

                {/* Course Header */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <Link to="/courses" className="text-blue-600 text-sm hover:underline">
                        ← Back to courses
                    </Link>

                    <div className="mt-4 mb-2">
                        <span className="text-xs uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {course.level}
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold mt-3 mb-2">{course.title}</h1>
                    <p className="text-gray-500 text-sm mb-4">By {course.instructor?.name}</p>
                    <p className="text-gray-700 mb-6">{course.description}</p>

                    {/* Enroll / Unenroll button for students */}
                    {isStudent && !isOwner && (
                        <div>
                            {enrolled ? (
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-green-600 font-medium">
                                            ✓ You are enrolled in this course
                                        </span>
                                        <button
                                            onClick={handleUnenroll}
                                            disabled={enrolling}
                                            className="text-red-600 text-sm underline hover:no-underline disabled:opacity-50"
                                        >
                                            {enrolling ? 'Processing...' : 'Unenroll'}
                                        </button>
                                    </div>

                                    {/* Progress bar */}
                                    {progress && (
                                        <div>
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>Your progress</span>
                                                <span>{progress.completed_lessons}/{progress.total_lessons} lessons · {progress.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-green-500 h-3 rounded-full transition-all"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                            {progress.percentage === 100 && (
                                                <p className="text-green-600 font-medium text-sm mt-2">
                                                    🎉 You have completed this course!
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    {enrolling ? 'Enrolling...' : 'Enroll in this course'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Owner controls */}
                    {isOwner && (
                        <div className="flex gap-3">
                            <Link
                                to={`/courses/${id}/edit`}
                                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                            >
                                Edit Course
                            </Link>
                            <button
                                onClick={handleDeleteCourse}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Delete Course
                            </button>
                        </div>
                    )}
                </div>

                {/* Modules & Lessons */}
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Course Content</h2>
                        {isOwner && (
                            <Link
                                to={`/courses/${id}/modules/create`}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                            >
                                + Add Module
                            </Link>
                        )}
                    </div>

                    {modules.length === 0 ? (
                        <p className="text-gray-500">No modules yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {modules.map((module) => (
                                <div key={module.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-semibold text-lg">{module.title}</h3>
                                        {isOwner && (
                                            <Link
                                                to={`/courses/${id}/modules/${module.id}/lessons/create`}
                                                className="text-blue-600 text-sm hover:underline"
                                            >
                                                + Add Lesson
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
                                                        <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                                            <Link
                                                                to={`/modules/${module.id}/lessons/${lesson.id}`}
                                                                className="flex items-center gap-3 flex-1"
                                                            >
                                                                <span className="text-lg">
                                                                    {lesson.content_type === 'video' && '🎬'}
                                                                    {lesson.content_type === 'text' && '📄'}
                                                                    {lesson.content_type === 'quiz' && '📝'}
                                                                </span>
                                                                <span className="text-gray-700">{lesson.title}</span>
                                                                <span className="ml-auto text-xs text-gray-400 capitalize">
                                                                    {lesson.content_type}
                                                                </span>
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 p-2 rounded text-gray-400 cursor-not-allowed">
                                                            <span className="text-lg">🔒</span>
                                                            <span>{lesson.title}</span>
                                                            <span className="ml-auto text-xs capitalize">{lesson.content_type}</span>
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
            </div>
        </div>
    );
}