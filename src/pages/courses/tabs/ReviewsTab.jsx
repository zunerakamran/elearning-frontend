import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import StarRating from '../../../components/StarRating';

function RatingBar({ star, count, percent }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-8 text-right font-medium">{star}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
        </div>
    );
}

export default function ReviewsTab({ courseId, enrolled, isOwner }) {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [myReview, setMyReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ rating: 0, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const requests = [api.get(`/courses/${courseId}/reviews`)];
        if (user && enrolled && !isOwner) {
            requests.push(api.get(`/courses/${courseId}/my-review`));
        }

        Promise.all(requests)
            .then(([reviewsRes, myReviewRes]) => {
                setData(reviewsRes.data);
                if (myReviewRes?.data) {
                    setMyReview(myReviewRes.data);
                    setForm({
                        rating: myReviewRes.data.rating,
                        comment: myReviewRes.data.comment || '',
                    });
                }
            })
            .finally(() => setLoading(false));
    }, [courseId, user, enrolled, isOwner]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (form.rating === 0) {
            setError('Please select a rating.');
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const res = await api.post(`/courses/${courseId}/reviews`, form);
            setMyReview(res.data);
            setShowForm(false);
            // Refresh reviews
            const updated = await api.get(`/courses/${courseId}/reviews`);
            setData(updated.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Delete your review?')) return;
        try {
            await api.delete(`/courses/${courseId}/reviews`);
            setMyReview(null);
            setForm({ rating: 0, comment: '' });
            const updated = await api.get(`/courses/${courseId}/reviews`);
            setData(updated.data);
        } catch (err) {
            alert('Failed to delete review.');
        }
    }

    if (loading) return <p className="text-gray-400 text-sm py-4">Loading reviews...</p>;

    const canReview = enrolled && !isOwner && user?.role === 'student';

    return (
        <div className="mt-5 space-y-6">

            {/* Summary */}
            {data && (
                <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Average score */}
                            <div className="text-center flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-w-[180px]">
                                <p className="text-6xl font-bold text-gray-900 leading-none mb-3">
                                    {data.avg_rating?.toFixed(1) || '—'}
                                </p>
                                <div className="flex justify-center mb-3">
                                    <StarRating rating={Math.round(data.avg_rating)} readonly size="md" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Based on {data.total_reviews} review{data.total_reviews !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Distribution bars */}
                            <div className="flex-1 flex flex-col justify-center space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Rating Distribution</h3>
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <RatingBar
                                        key={star}
                                        star={star}
                                        count={data.distribution[star]?.count || 0}
                                        percent={data.distribution[star]?.percent || 0}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* My review / write a review */}
            {canReview && (
                <div>
                    {myReview && !showForm ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Your Review
                                    </p>
                                    <StarRating rating={myReview.rating} readonly size="md" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="text-sm text-red-500 hover:text-red-600 font-medium hover:underline transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            {myReview.comment && (
                                <p className="text-sm text-gray-700 leading-relaxed bg-white/50 rounded-lg p-3">{myReview.comment}</p>
                            )}
                        </div>
                    ) : canReview && !myReview && !showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all duration-200 font-medium"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Write a Review
                            </span>
                        </button>
                    ) : null}

                    {/* Review form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {myReview ? 'Edit Your Review' : 'Write a Review'}
                            </h3>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Your Rating</label>
                                <div className="bg-gray-50 rounded-xl p-4 inline-block">
                                    <StarRating
                                        rating={form.rating}
                                        onChange={(r) => setForm({ ...form, rating: r })}
                                        size="lg"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Comment <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={form.comment}
                                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                    rows={4}
                                    placeholder="Share your experience with this course. What did you like? What could be improved?"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setError(null);
                                    }}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* All reviews */}
            {data?.reviews?.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl border border-dashed border-gray-300">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-base text-gray-500 font-medium mb-1">No reviews yet</p>
                    {canReview && (
                        <p className="text-sm text-gray-400">Be the first to share your experience with this course!</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {data?.reviews
                        .filter((review) => !myReview || review.id !== myReview.id)
                        .map((review) => (
                        <div key={review.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-md">
                                        {review.student?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">{review.student?.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StarRating rating={review.rating} readonly size="sm" />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </span>
                            </div>
                            {review.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed pl-16">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}