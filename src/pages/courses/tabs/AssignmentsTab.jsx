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

  if (loading) return <p className="text-gray-400">Loading assignments...</p>;

  return (
    <div>
      {/* Create assignment button (instructor only) */}
      {isOwner && (
        <div className="mb-6">
          <Link
            to={`/courses/${courseId}/assignments/create`}
            className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-lg hover:bg-blue-50 text-sm font-medium flex items-center justify-center"
          >
            + Create Assignment
          </Link>
        </div>
      )}

      {assignments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No assignments yet.</p>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="border rounded-lg p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{assignment.title}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-sm text-gray-500">
                      Total Marks: <span className="font-medium text-gray-700">{assignment.total_marks}</span>
                    </span>
                    {assignment.due_date && (
                      <span className={`text-sm ${
                        new Date(assignment.due_date) < new Date()
                          ? 'text-red-500'
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
                    <div className={`mt-2 text-sm px-3 py-1 rounded inline-block ${
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
                    className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 text-sm"
                  >
                    {isOwner ? 'View Submissions' : 'View & Submit'}
                  </Link>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}