import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const LEVEL_COLORS = {
  beginner: { bar: '#639922', badge: 'bg-green-50 text-green-700' },
  intermediate: { bar: '#BA7517', badge: 'bg-amber-50 text-amber-700' },
  advanced: { bar: '#E24B4A', badge: 'bg-red-50 text-red-700' },
};

const LEVEL_FILTERS = ['all', 'beginner', 'intermediate', 'advanced'];

function MiniStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill={star <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/courses')
      .then((res) => {
        const loadedCourses = res.data;
        // Fetch review summary for each course in parallel
        return Promise.all(
          loadedCourses.map((course) =>
            api.get(`/courses/${course.id}/reviews`)
              .then((r) => ({
                ...course,
                avg_rating: r.data.avg_rating || 0,
                total_reviews: r.data.total_reviews || 0,
              }))
              .catch(() => ({ ...course, avg_rating: 0, total_reviews: 0 }))
          )
        );
      })
      .then((coursesWithReviews) => setCourses(coursesWithReviews))
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    const matchesLevel = levelFilter === 'all' || c.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || String(c.category_id) === String(categoryFilter);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      c.title.toLowerCase().includes(searchLower) ||
      c.description?.toLowerCase().includes(searchLower) ||
      c.instructor?.name?.toLowerCase().includes(searchLower);
    return matchesLevel && matchesCategory && matchesSearch;
  });

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
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
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
          className="mt-3 text-sm text-indigo-600 hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Explore courses</h1>
            <p className="text-xs sm:text-sm text-gray-400">Discover and learn from expert instructors</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-auto">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, description, or instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 lg:w-72"
              />
            </div>
            {user?.role === 'instructor' && (
              <Link
                to="/courses/create"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create course
              </Link>
            )}
          </div>
        </div>

        {/* Level and Category filters */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm focus:outline-none w-full sm:w-auto"
            >
              {LEVEL_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f === 'all' ? 'All Levels' : f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm focus:outline-none w-full sm:w-auto"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(searchQuery || levelFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setLevelFilter('all'); setCategoryFilter('all'); }}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-gray-400 text-sm mb-1">No courses found</p>
            {(levelFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setLevelFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="text-sm text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((course) => {
              const colors = LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner;
              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-200 group block"
                >
                  {/* Color bar top */}
                  <div className="h-1.5 w-full" style={{ background: colors.bar }} />

                  <div className="p-4 sm:p-5">
                    {/* Level + Category badges */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                      <span className={`text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full inline-block uppercase ${colors.badge}`}>
                        {course.level}
                      </span>
                      {course.category && (
                        <span className="text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full inline-block bg-violet-50 text-violet-700 border border-violet-100">
                          {course.category.name}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h2>
                      {course.featured && (
                        <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3 sm:mb-4">
                      {course.description || 'No description provided.'}
                    </p>

                    {/* Ratings row */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      {course.total_reviews > 0 ? (
                        <>
                          <MiniStars rating={course.avg_rating} />
                          <span className="text-xs font-bold text-amber-600">
                            {course.avg_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({course.total_reviews} review{course.total_reviews !== 1 ? 's' : ''})
                          </span>
                        </>
                      ) : (
                        <>
                          <MiniStars rating={0} />
                          <span className="text-xs text-gray-400 italic">No reviews yet</span>
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:pt-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-[140px]">
                          {course.instructor?.name}
                        </span>
                        {!!course.instructor?.is_verified && (
                          <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-indigo-600 font-medium group-hover:underline">
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