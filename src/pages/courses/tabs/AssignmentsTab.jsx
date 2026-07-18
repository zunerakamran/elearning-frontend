import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ui/ConfirmModal';

export default function AssignmentsTab({ courseId, isOwner, isAdmin }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    api.get(`/courses/${courseId}/assignments`)
      .then((res) => setAssignments(res.data))
      .finally(() => setLoading(false));
  }, [courseId]);

  function handleDelete(id) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await api.delete(`/courses/${courseId}/assignments/${id}`);
        setAssignments(assignments.filter((a) => a.id !== id));
      },
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <div>
        {/* Create assignment button (instructor only) */}
        {isOwner && (
          <div className="mb-6">
            <Link
              to={`/courses/${courseId}/assignments/create`}
              className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Assignment
            </Link>
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isPastDue = assignment.due_date
                ? new Date(assignment.due_date) < new Date()
                : false;

              return (
                <div
                  key={assignment.id}
                  className="border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-sm transition-shadow bg-white"
                >
                  {/* Top row: title + meta */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                    {/* Left: content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-snug">
                        {assignment.title}
                      </h3>

                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                        <span className="text-xs sm:text-sm text-gray-500">
                          Total Marks:{' '}
                          <span className="font-medium text-gray-700">
                            {assignment.total_marks}
                          </span>
                        </span>
                        {assignment.due_date && (
                          <span className={`text-xs sm:text-sm font-medium ${isPastDue ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            Due:{' '}
                            {new Date(assignment.due_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {isPastDue && (
                              <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                Overdue
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Student submission status */}
                      {!isOwner && assignment.my_submission && (
                        <div className={`mt-3 text-xs sm:text-sm px-3 py-1.5 rounded-lg inline-block font-medium ${assignment.my_submission.status === 'graded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {assignment.my_submission.status === 'graded'
                            ? `Graded: ${assignment.my_submission.marks}/${assignment.total_marks}`
                            : 'Submitted — awaiting grade'}
                        </div>
                      )}
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2 sm:ml-4 sm:flex-shrink-0">
                      <Link
                        to={`/courses/${courseId}/assignments/${assignment.id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 px-3 py-2 rounded-lg hover:from-indigo-100 hover:to-indigo-200 hover:shadow-sm text-xs sm:text-sm font-medium transition-all duration-200"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="hidden sm:inline">
                          {isOwner || isAdmin ? 'View Submissions' : 'View & Submit'}
                        </span>
                        <span className="sm:hidden">
                          {isOwner || isAdmin ? 'Submissions' : 'Submit'}
                        </span>
                      </Link>

                      {isOwner && !isAdmin && (
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-lg hover:from-red-100 hover:to-red-200 hover:shadow-sm text-xs sm:text-sm font-medium transition-all duration-200"
                          title="Delete assignment"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline ml-1">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}