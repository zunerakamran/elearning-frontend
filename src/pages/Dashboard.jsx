import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ProgressBar } from '../components/ui/Progress';
import Badge from '../components/ui/Badge';
import { CircularProgress } from '../components/ui/Progress';
import EmptyState from '../components/ui/EmptyState';

const LEVEL_COLORS = {
  beginner: { bar: '#639922', badge: 'bg-green-50 text-green-700' },
  intermediate: { bar: '#BA7517', badge: 'bg-amber-50 text-amber-700' },
  advanced: { bar: '#E24B4A', badge: 'bg-red-50 text-red-700' },
};

function CourseProgressBar({ courseId }) {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/courses/${courseId}/progress`)
            .then((res) => {
                setProgress(res.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [courseId]);

    if (loading) {
        return (
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5 animate-pulse" />
            </div>
        );
    }

    if (!progress) {
        return (
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Not started</p>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <ProgressBar 
                value={progress.percentage || 0} 
                max={100} 
                showLabel={true}
                color="indigo"
                size="sm"
            />
            <p className="text-xs text-gray-500 mt-1">
                {progress.completed_lessons || 0} of {progress.total_lessons || 0} lessons completed
            </p>
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                            <p className="text-indigo-100">
                                {user?.email} · <span className="capitalize">{user?.role}</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                to="/courses"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-white to-gray-50 text-indigo-600 px-5 py-2.5 rounded-lg hover:from-indigo-50 hover:to-indigo-100 hover:shadow-md transition-all duration-200 font-medium cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Browse Courses
                            </Link>
                            <Link
                                to="/my-certificates"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-amber-600 hover:to-orange-700 hover:shadow-md transition-all duration-200 font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                My Certificates
                            </Link>
                        </div>
                    </div>
                </div>

                {/* My Enrolled Courses (students only) */}
                {user?.role === 'student' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">My Learning</h2>
                        </div>

                        {loadingCourses ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-4 animate-pulse" />
                                    <div className="h-3 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
                                    <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-4 animate-pulse" />
                                    <div className="h-3 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
                                    <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ) : myCourses.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                }
                                title="No courses enrolled yet"
                                description="Start your learning journey by enrolling in a course."
                                actionText="Browse Courses"
                                onAction={() => window.location.href = '/courses'}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myCourses.map((course) => {
                                    const colors = LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner;
                                    return (
                                        <Link
                                            key={course.id}
                                            to={`/courses/${course.id}`}
                                            className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors group block"
                                        >
                                            {/* Color bar top */}
                                            <div className="h-2 w-full" style={{ background: colors.bar }} />

                                            <div className="p-5">
                                                {/* Level badge */}
                                                <span className={`text-xs font-medium px-3 py-1.5 rounded-full inline-block mb-4 uppercase ${colors.badge}`}>
                                                    {course.level}
                                                </span>

                                                {/* Title */}
                                                <h2 className="text-base font-semibold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                    {course.title}
                                                </h2>

                                                {/* Description */}
                                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
                                                    {course.description || 'No description provided.'}
                                                </p>

                                                {/* Progress */}
                                                <CourseProgressBar courseId={course.id} />

                                                {/* Footer */}
                                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                                                    <span className="text-sm text-gray-500 truncate max-w-[140px]">
                                                        {course.instructor?.name}
                                                    </span>
                                                    <span className="text-sm text-indigo-600 font-medium group-hover:underline">
                                                        View →
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Instructor view */}
                {user?.role === 'instructor' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Instructor Dashboard</h2>
                        <p className="text-gray-500 mb-6">
                            Manage your courses and track student progress.
                        </p>
                        <Link
                            to="/instructor/dashboard"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200 font-medium"
                        >
                            Go to Instructor Dashboard
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}