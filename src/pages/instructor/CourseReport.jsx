import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

// ── Small reusable components ─────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-5 flex items-center gap-3 sm:gap-4`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
            </div>
        </div>
    );
}

function RatingBadge({ rating }) {
    const styles = {
        Excellent: 'bg-green-100 text-green-700',
        Good: 'bg-blue-100 text-blue-700',
        Average: 'bg-yellow-100 text-yellow-700',
        Poor: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${styles[rating] || 'bg-gray-100 text-gray-600'}`}>
            {rating}
        </span>
    );
}

function ProgressBar({ percent, color = 'bg-blue-500' }) {
    return (
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div
                className={`h-2 rounded-full transition-all ${color}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
            />
        </div>
    );
}

function ScoreCell({ value, suffix = '%' }) {
    if (value === null || value === undefined) {
        return <span className="text-gray-300 text-sm">—</span>;
    }
    const color = value >= 80
        ? 'text-green-600'
        : value >= 60
            ? 'text-blue-600'
            : value >= 40
                ? 'text-yellow-600'
                : 'text-red-500';
    return <span className={`font-semibold ${color}`}>{value}{suffix}</span>;
}

// ── Main component ────────────────────────────────────────────────────────

export default function CourseReport() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('students');
    const [sortBy, setSortBy] = useState('overall_score');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get(`/courses/${id}/report`)
            .then((res) => setReport(res.data))
            .catch(() => setError('Failed to load report.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Generating report...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 p-8 text-center text-red-600">{error}</div>
    );

    if (!report) return null;

    const { course, overview, students, quiz_summaries, assignment_summaries } = report;

    // Sort and filter students
    const filteredStudents = students
        .filter((s) =>
            s.student.name.toLowerCase().includes(search.toLowerCase()) ||
            s.student.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'name': aVal = a.student.name; bVal = b.student.name; break;
                case 'progress': aVal = a.progress.percent; bVal = b.progress.percent; break;
                case 'quiz': aVal = a.quizzes.avg_score ?? -1; bVal = b.quizzes.avg_score ?? -1; break;
                case 'assignment': aVal = a.assignments.avg_score ?? -1; bVal = b.assignments.avg_score ?? -1; break;
                default: aVal = a.overall_score; bVal = b.overall_score;
            }
            if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });

    function toggleSort(col) {
        if (sortBy === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('desc');
        }
    }

    function SortIcon({ col }) {
        if (sortBy !== col) {
            return <svg className="w-4 h-4 text-gray-300 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
        }
        return sortDir === 'asc'
            ? <svg className="w-4 h-4 text-indigo-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            : <svg className="w-4 h-4 text-indigo-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
    }

    // Rating distribution for overview
    const ratingCounts = students.reduce((acc, s) => {
        acc[s.rating] = (acc[s.rating] || 0) + 1;
        return acc;
    }, {});

    const tabs = [
        { key: 'students', label: 'Students' },
        { key: 'quizzes', label: 'Quizzes' },
        { key: 'assignments', label: 'Assignments' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <Link
                            to="/instructor/dashboard"
                            className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 break-words">{course.title}</h1>
                        <p className="text-gray-500 mt-1">Course Report</p>
                    </div>
                    <div className="text-left sm:text-right text-xs text-gray-400">
                        Generated {new Date().toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </div>
                </div>

                {/* Overview stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <StatCard
                        label="Students Enrolled"
                        value={overview.total_students}
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        color="bg-blue-50"
                    />
                    <StatCard
                        label="Modules"
                        value={overview.total_modules}
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                        color="bg-purple-50"
                    />
                    <StatCard
                        label="Lessons"
                        value={overview.total_lessons}
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        color="bg-yellow-50"
                    />
                    <StatCard
                        label="Quizzes"
                        value={overview.total_quizzes}
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                        color="bg-green-50"
                    />
                    <StatCard
                        label="Assignments"
                        value={overview.total_assignments}
                        icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                        color="bg-red-50"
                    />
                </div>

                {/* Performance distribution */}
                {students.length > 0 && (
                    <div className="bg-white rounded-xl shadow p-4 sm:p-5 mb-6">
                        <h2 className="font-bold text-gray-700 mb-4">Performance Distribution</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {['Excellent', 'Good', 'Average', 'Poor'].map((rating) => {
                                const count = ratingCounts[rating] || 0;
                                const percent = overview.total_students > 0
                                    ? Math.round((count / overview.total_students) * 100)
                                    : 0;
                                const colors = {
                                    Excellent: { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
                                    Good: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                                    Average: { bar: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
                                    Poor: { bar: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
                                };
                                const c = colors[rating];
                                return (
                                    <div key={rating} className={`${c.bg} rounded-lg p-3 sm:p-4`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-xs sm:text-sm font-semibold ${c.text}`}>{rating}</span>
                                            <span className={`text-lg sm:text-xl font-bold ${c.text}`}>{count}</span>
                                        </div>
                                        <ProgressBar percent={percent} color={c.bar} />
                                        <p className="text-xs text-gray-400 mt-1">{percent}% of students</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${activeTab === tab.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Students Tab ─────────────────────────────────── */}
                {activeTab === 'students' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        {/* Search + filter bar */}
                        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border rounded-lg px-3 py-1.5 text-sm w-full sm:flex-1 sm:max-w-xs"
                            />
                            <span className="text-xs sm:text-sm text-gray-400 sm:ml-auto">
                                {filteredStudents.length} of {students.length} students
                            </span>
                        </div>

                        {filteredStudents.length === 0 ? (
                            <p className="p-8 text-center text-gray-400">No students found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[900px]">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">#</th>
                                            <th
                                                className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                                                onClick={() => toggleSort('name')}
                                            >
                                                Student <SortIcon col="name" />
                                            </th>
                                            <th
                                                className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                                                onClick={() => toggleSort('progress')}
                                            >
                                                Progress <SortIcon col="progress" />
                                            </th>
                                            <th
                                                className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                                                onClick={() => toggleSort('quiz')}
                                            >
                                                Quiz Avg <SortIcon col="quiz" />
                                            </th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                                                Quizzes
                                            </th>
                                            <th
                                                className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                                                onClick={() => toggleSort('assignment')}
                                            >
                                                Assignment Avg <SortIcon col="assignment" />
                                            </th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                                                Assignments
                                            </th>
                                            <th
                                                className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-indigo-600 whitespace-nowrap"
                                                onClick={() => toggleSort('overall_score')}
                                            >
                                                Overall <SortIcon col="overall_score" />
                                            </th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                                                Rating
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((s, index) => (
                                            <tr key={s.student.id} className="border-b hover:bg-gray-50">
                                                <td className="px-3 sm:px-4 py-3 text-gray-400">{index + 1}</td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <p className="font-medium text-gray-800 truncate max-w-[160px]">{s.student.name}</p>
                                                    <p className="text-xs text-gray-400 truncate max-w-[160px]">{s.student.email}</p>
                                                    <p className="text-xs text-gray-300 mt-0.5 whitespace-nowrap">
                                                        Enrolled {new Date(s.enrolled_at).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <div className="w-24 sm:w-28">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>{s.progress.completed_lessons}/{s.progress.total_lessons}</span>
                                                            <span>{s.progress.percent}%</span>
                                                        </div>
                                                        <ProgressBar
                                                            percent={s.progress.percent}
                                                            color={s.progress.percent === 100 ? 'bg-green-500' : 'bg-blue-400'}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <ScoreCell value={s.quizzes.avg_score} />
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">
                                                    {s.quizzes.attempted}/{s.quizzes.total} attempted
                                                    {s.quizzes.attempted > 0 && (
                                                        <p className="text-xs text-green-600">
                                                            {s.quizzes.passed} passed
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <ScoreCell value={s.assignments.avg_score} />
                                                    {s.assignments.graded > 0 && (
                                                        <p className="text-xs text-gray-400 whitespace-nowrap">
                                                            {s.assignments.total_earned_marks}/{s.assignments.total_possible_marks} marks
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">
                                                    {s.assignments.submitted}/{s.assignments.total} submitted
                                                    {s.assignments.graded > 0 && (
                                                        <p className="text-xs text-blue-600">
                                                            {s.assignments.graded} graded
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <ScoreCell value={s.overall_score} />
                                                    </div>
                                                    <div className="w-20">
                                                        <ProgressBar
                                                            percent={s.overall_score}
                                                            color={
                                                                s.overall_score >= 80 ? 'bg-green-500' :
                                                                    s.overall_score >= 60 ? 'bg-blue-500' :
                                                                        s.overall_score >= 40 ? 'bg-yellow-400' :
                                                                            'bg-red-400'
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <RatingBadge rating={s.rating} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Quizzes Tab ──────────────────────────────────── */}
                {activeTab === 'quizzes' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        {quiz_summaries.length === 0 ? (
                            <p className="p-8 text-center text-gray-400">No quizzes in this course yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[760px]">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Quiz</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Lesson</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Passing Score</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Attempted</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Pass Rate</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Avg Score</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Difficulty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quiz_summaries.map((quiz) => {
                                            const difficulty = quiz.avg_score === null ? null :
                                                quiz.avg_score >= 80 ? 'Easy' :
                                                    quiz.avg_score >= 60 ? 'Moderate' : 'Hard';
                                            const diffColor = {
                                                Easy: 'text-green-600 bg-green-50',
                                                Moderate: 'text-yellow-600 bg-yellow-50',
                                                Hard: 'text-red-600 bg-red-50',
                                            };
                                            return (
                                                <tr key={quiz.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 truncate max-w-[180px]">{quiz.title}</td>
                                                    <td className="px-3 sm:px-4 py-3 text-gray-500 truncate max-w-[160px]">{quiz.lesson_title}</td>
                                                    <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{quiz.passing_score}%</td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <span className="font-medium">{quiz.attempted}</span>
                                                        <span className="text-gray-400">/{quiz.total_students}</span>
                                                        <div className="w-20 mt-1">
                                                            <ProgressBar
                                                                percent={quiz.total_students > 0 ? Math.round((quiz.attempted / quiz.total_students) * 100) : 0}
                                                                color="bg-blue-400"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                                        {quiz.pass_rate !== null ? (
                                                            <>
                                                                <ScoreCell value={quiz.pass_rate} />
                                                                <p className="text-xs text-gray-400">{quiz.passed}/{quiz.attempted} passed</p>
                                                            </>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <ScoreCell value={quiz.avg_score} />
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        {difficulty ? (
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${diffColor[difficulty]}`}>
                                                                {difficulty}
                                                            </span>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Assignments Tab ──────────────────────────────── */}
                {activeTab === 'assignments' && (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        {assignment_summaries.length === 0 ? (
                            <p className="p-8 text-center text-gray-400">No assignments in this course yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[760px]">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Assignment</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Total Marks</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Due Date</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Submitted</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Graded</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Avg Marks</th>
                                            <th className="text-left px-3 sm:px-4 py-3 font-semibold text-gray-600">Avg %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignment_summaries.map((a) => (
                                            <tr key={a.id} className="border-b hover:bg-gray-50">
                                                <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]">{a.title}</td>
                                                <td className="px-3 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{a.total_marks}</td>
                                                <td className="px-3 sm:px-4 py-3 text-gray-500 whitespace-nowrap">
                                                    {a.due_date ? (
                                                        <span className={new Date(a.due_date) < new Date() ? 'text-red-500' : ''}>
                                                            {new Date(a.due_date).toLocaleDateString()}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <span className="font-medium">{a.submitted}</span>
                                                    <span className="text-gray-400">/{a.total_students}</span>
                                                    <div className="w-20 mt-1">
                                                        <ProgressBar
                                                            percent={a.total_students > 0 ? Math.round((a.submitted / a.total_students) * 100) : 0}
                                                            color="bg-purple-400"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <span className="font-medium">{a.graded}</span>
                                                    <span className="text-gray-400">/{a.submitted}</span>
                                                    {a.submitted > 0 && a.graded < a.submitted && (
                                                        <p className="text-xs text-orange-500 whitespace-nowrap">
                                                            {a.submitted - a.graded} pending
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                                    {a.avg_marks !== null ? (
                                                        <span className="font-medium text-gray-700">
                                                            {a.avg_marks}/{a.total_marks}
                                                        </span>
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3">
                                                    <ScoreCell value={a.avg_percent} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}