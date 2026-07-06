import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';

export default function AssignmentsTab({ courseId, isOwner }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${courseId}/assignments`)
      .then((res) => setAssignments(res.data))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handleDelete(id) {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/courses/${courseId}/assignments/${id}`);
    setAssignments(assignments.filter((a) => a.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
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
            const isPastDue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false;
            return (
              <div key={assignment.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{assignment.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-sm text-gray-500">
                        Total Marks: <span className="font-medium text-gray-700">{assignment.total_marks}</span>
                      </span>
                      {assignment.due_date && (
                        <span className={`text-sm ${
                          isPastDue
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        }`}>
                          Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>

                    {/* Student submission status */}
                    {!isOwner && assignment.my_submission && (
                      <div className={`mt-3 text-sm px-3 py-1.5 rounded-lg inline-block ${
                        assignment.my_submission.status === 'graded'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {assignment.my_submission.status === 'graded'
                          ? `Graded: ${assignment.my_submission.marks}/${assignment.total_marks}`
                          : 'Submitted — awaiting grade'}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/courses/${courseId}/assignments/${assignment.id}`}
                      className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                    >
                      {isOwner ? 'View Submissions' : 'View & Submit'}
                    </Link>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
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
  );
}