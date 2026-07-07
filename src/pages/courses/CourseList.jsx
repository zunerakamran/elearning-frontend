import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const LEVEL_COLORS = {
  beginner: { bar: '#639922', badge: 'bg-green-50 text-green-700' },
  intermediate: { bar: '#BA7517', badge: 'bg-amber-50 text-amber-700' },
  advanced: { bar: '#E24B4A', badge: 'bg-red-50 text-red-700' },
};

const FILTERS = ['all', 'beginner', 'intermediate', 'advanced'];

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data))
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? courses
    : courses.filter((c) => c.level === filter);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-5 w-36 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-56 bg-gray-100 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
              <div className="h-1.5 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-16 bg-gray-200 rounded-full" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Explore courses</h1>
            <p className="text-sm text-gray-400">Discover and learn from expert instructors</p>
          </div>
          {user?.role === 'instructor' && (
            <Link
              to="/courses/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create course
            </Link>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-4 py-1.5 rounded-full border transition-colors uppercase ${
                filter === f
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-1">No courses found</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {filtered.map((course) => {
              const colors = LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner;
              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-blue-200 transition-colors group block"
                >
                  {/* Color bar top */}
                  <div className="h-2 w-full" style={{ background: colors.bar }} />

                  <div className="p-5">
                    {/* Level badge */}
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full inline-block mb-4 uppercase ${colors.badge}`}>
                      {course.level}
                    </span>

                    {/* Title */}
                    <h2 className="text-base font-semibold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-5">
                      {course.description || 'No description provided.'}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm text-gray-500 truncate max-w-[140px]">
                        {course.instructor?.name}
                      </span>
                      <span className="text-sm text-blue-600 font-medium group-hover:underline">
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
    </div>
  );
}