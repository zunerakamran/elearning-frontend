import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import StarRating from '../../components/StarRating';

function RatingBar({ star, count, percent }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{star} ★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right font-medium">{count}</span>
    </div>
  );
}

export default function CourseReviews() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/reviews`)
    ])
      .then(([courseRes, reviewsRes]) => {
        setCourse(courseRes.data);
        setReviewsData(reviewsRes.data);
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews data.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-8 text-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  const filteredReviews = reviewsData?.reviews?.filter((r) => {
    const matchesSearch =
      search === '' ||
      r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());

    const matchesRating =
      ratingFilter === 'all' || r.rating === parseInt(ratingFilter);

    return matchesSearch && matchesRating;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <Link
            to="/instructor/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4 animate-in slide-in-from-right-1 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4 tracking-tight">
            {course?.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse and search reviews submitted by students enrolled in this course
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Summary metrics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-50 pb-3">
                Rating Overview
              </h2>

              <div className="text-center p-4 bg-gray-50/50 rounded-xl mb-6">
                <p className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
                  {reviewsData?.avg_rating?.toFixed(1) || '0.0'}
                </p>
                <div className="flex justify-center mb-2">
                  <StarRating rating={Math.round(reviewsData?.avg_rating || 0)} readonly size="lg" />
                </div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  {reviewsData?.total_reviews || 0} reviews
                </p>
              </div>

              {/* Star rating breakdown */}
              {reviewsData?.distribution && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Rating Breakdown
                  </h3>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <RatingBar
                      key={star}
                      star={star}
                      count={reviewsData.distribution[star]?.count || 0}
                      percent={reviewsData.distribution[star]?.percent || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Search, Filter, and List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  Reviews Feed
                </h2>

                {/* Search Bar */}
                <div className="relative min-w-[240px]">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by student or text..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Rating Filter Pills */}
              <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setRatingFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold uppercase transition-all cursor-pointer flex-shrink-0 ${ratingFilter === 'all'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(star.toString())}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 ${ratingFilter === star.toString()
                        ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>

              {/* Reviews List */}
              {filteredReviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 10.742l1.328-3.985a.75.75 0 011.424 0l1.328 3.985h4.19a.75.75 0 01.44 1.345l-3.39 2.463 1.295 3.985a.75.75 0 01-1.155.84l-3.39-2.463-3.39 2.463a.75.75 0 01-1.155-.84l1.295-3.985-3.39-2.463a.75.75 0 01.44-1.345h4.19z" />
                  </svg>
                  <p className="text-sm font-bold text-gray-700 mb-1">No reviews found</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Try clearing search text or choosing a different star filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold flex-shrink-0 shadow-md">
                            {review.student?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{review.student?.name}</p>
                            <p className="text-[10px] text-gray-400">{review.student?.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end">
                            <StarRating rating={review.rating} readonly size="sm" />
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      {review.comment ? (
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 rounded-xl p-3.5 mt-2 border border-gray-100">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-xs italic text-gray-400 mt-2 pl-2 border-l-2 border-gray-200">
                          No text comment provided
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
