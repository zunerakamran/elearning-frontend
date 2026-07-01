import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function CourseProgressBar({ courseId }) {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        api.get(`/courses/${courseId}/progress`)
            .then((res) => setProgress(res.data))
            .catch(() => { });
    }, [courseId]);

    if (!progress) return null;

    return (
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{progress.completed_lessons}/{progress.total_lessons} lessons</span>
                <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress.percentage}%` }}
                />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [myCourses, setMyCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    // Redirect instructors to their own dashboard
    useEffect(() => {
        if (user?.role === 'instructor') {
            navigate('/instructor/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'student') {
            api.get('/my-enrolled-courses')
                .then((res) => setMyCourses(res.data))
                .finally(() => setLoadingCourses(false));
        } else {
            setLoadingCourses(false);
        }
    }, [user]);

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name}</h1>
                            <p className="text-gray-500 text-sm">
                                {user?.email} · <span className="capitalize">{user?.role}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                        >
                            Log out
                        </button>
                    </div>

                    <div className="mt-4">
                        <Link
                            to="/courses"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                        >
                            Browse All Courses
                        </Link>
                    </div>
                </div>

                {/* My Enrolled Courses (students only) */}
                {user?.role === 'student' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">My Courses</h2>

                        {loadingCourses ? (
                            <p className="text-gray-400">Loading your courses...</p>
                        ) : myCourses.length === 0 ? (
                            <div>
                                <p className="text-gray-500 mb-3">You haven't enrolled in any courses yet.</p>
                                <Link
                                    to="/courses"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    Browse courses to get started →
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myCourses.map((course) => (
                                    <Link
                                        key={course.id}
                                        to={`/courses/${course.id}`}
                                        className="border rounded-lg p-4 hover:shadow-md transition"
                                    >
                                        <span className="text-xs uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            {course.level}
                                        </span>
                                        <h3 className="font-semibold mt-2 mb-1">{course.title}</h3>
                                        <p className="text-gray-400 text-sm mb-3">By {course.instructor?.name}</p>
                                        <CourseProgressBar courseId={course.id} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Instructor view */}
                {user?.role === 'instructor' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Your Courses</h2>
                        <p className="text-gray-500 mb-3">
                            Manage your courses from the course listing page.
                        </p>
                        <Link
                            to="/courses"
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Go to courses →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}