import { useEffect, useState } from 'react';
import api from '../../api/axios';

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className={`bg-[#151922] border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:border-white/10 transition-all duration-200`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-gray-300 text-sm w-36 truncate flex-shrink-0">{label}</p>
      <div className="flex-1 bg-white/5 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-gray-400 text-sm w-8 text-right">{value}</p>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const { stats, enrollments_by_month, top_courses } = data;
  const maxEnrollment = enrollments_by_month?.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  const maxTopCount   = top_courses?.[0]?.enrollments_count || 1;

  return (
    <div className="p-6 lg:p-8 space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome to the ELearn admin panel. Here's your platform overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.total_users?.toLocaleString()}
          color="bg-violet-500/10 text-violet-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Instructors"
          value={stats.total_instructors?.toLocaleString()}
          color="bg-blue-500/10 text-blue-400"
          sub={`${stats.pending_instructors} pending approval`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <StatCard
          label="Students"
          value={stats.total_students?.toLocaleString()}
          color="bg-emerald-500/10 text-emerald-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
        />
        <StatCard
          label="Active Enrollments"
          value={stats.active_enrollments?.toLocaleString()}
          color="bg-amber-500/10 text-amber-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Courses"
          value={stats.total_courses?.toLocaleString()}
          color="bg-pink-500/10 text-pink-400"
          sub={`${stats.approved_courses} approved · ${stats.pending_courses} pending`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard
          label="Lessons Completed"
          value={stats.completed_lessons?.toLocaleString()}
          color="bg-cyan-500/10 text-cyan-400"
          sub="Across all students"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment trend */}
        <div className="bg-[#151922] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Enrollment Trend</h2>
          <p className="text-gray-500 text-xs mb-6">Last 6 months</p>
          {enrollments_by_month?.length > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {enrollments_by_month.map((row) => {
                const pct = row.count / maxEnrollment;
                return (
                  <div key={`${row.year}-${row.month}`} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-gray-400 text-xs">{row.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-md transition-all duration-700"
                      style={{ height: `${Math.max(pct * 100, 4)}%` }}
                    />
                    <span className="text-gray-500 text-xs">{MONTHS[row.month - 1]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">No data available</div>
          )}
        </div>

        {/* Top courses */}
        <div className="bg-[#151922] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Top Courses</h2>
          <p className="text-gray-500 text-xs mb-6">By enrollment count</p>
          <div className="space-y-4">
            {top_courses?.length > 0 ? top_courses.map((c) => (
              <MiniBar key={c.id} label={c.title} value={c.enrollments_count} max={maxTopCount} />
            )) : (
              <p className="text-gray-500 text-sm">No courses found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-[#151922] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending Courses', count: stats.pending_courses, href: '/admin/courses', color: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/5' },
            { label: 'Pending Instructors', count: stats.pending_instructors, href: '/admin/instructors', color: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/5' },
          ].map((a) => (
            <a
              key={a.label}
              href={a.href}
              className={`border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer ${a.color}`}
            >
              <span className="text-2xl font-bold">{a.count ?? '—'}</span>
              <span className="text-xs font-medium text-center">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
