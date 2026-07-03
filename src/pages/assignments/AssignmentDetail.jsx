import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function AssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [gradingData, setGradingData] = useState({});

  useEffect(() => {
    const isInstructor = user?.role === 'instructor';
    Promise.all([
      api.get(`/courses/${courseId}/assignments/${assignmentId}`),
      user ? api.get(`/courses/${courseId}/assignments/${assignmentId}/submission`).catch(() => null) : Promise.resolve(null),
      isInstructor ? api.get(`/assignments/${assignmentId}/submissions`).catch((err) => {
        console.error('Error fetching submissions:', err);
        return { data: [] };
      }) : Promise.resolve({ data: [] }),
    ])
      .then(([assignmentRes, submissionRes, submissionsRes]) => {
        setAssignment(assignmentRes.data);
        if (submissionRes && submissionRes.data) {
          setSubmission(submissionRes.data);
        }
        if (submissionsRes && submissionsRes.data) {
          setSubmissions(submissionsRes.data);
          // Initialize grading data with existing grades
          const initialGradingData = {};
          submissionsRes.data.forEach(sub => {
            initialGradingData[sub.id] = {
              marks: sub.marks || '',
              feedback: sub.feedback || ''
            };
          });
          setGradingData(initialGradingData);
        }
      })
      .catch((err) => {
        console.error('Error in useEffect:', err);
        navigate(`/courses/${courseId}?tab=assignments`);
      })
      .finally(() => setLoading(false));
  }, [courseId, assignmentId, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Assignment submitted successfully!');
      setMessageType('success');
      setFile(null);

      // Reload submission data from backend
      const submissionRes = await api.get(`/courses/${courseId}/assignments/${assignmentId}/submission`);
      if (submissionRes.data) {
        setSubmission(submissionRes.data);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission failed.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/courses/${courseId}/assignments/${assignmentId}`);
      navigate(`/courses/${courseId}?tab=assignments`);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  }

  async function handleDownloadAttachment() {
    try {
      const response = await api.get(`/assignments/${assignmentId}/file`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', assignment.file_name || 'attachment');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setMessage('Failed to download attachment. Please try again.');
      setMessageType('error');
    }
  }

  async function handleViewAttachment() {
    try {
      const response = await api.get(`/assignments/${assignmentId}/file`, {
        responseType: 'blob',
      });

      // Determine MIME type from file extension
      const fileName = assignment.file_name || '';
      let mimeType = 'application/octet-stream';
      if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) mimeType = 'application/msword';
      else if (fileName.endsWith('.txt')) mimeType = 'text/plain';

      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      window.open(url, '_blank');
    } catch (err) {
      console.error('View error:', err);
      setMessage('Failed to view attachment. Please try again.');
      setMessageType('error');
    }
  }

  function handleViewSubmissionFile(fileUrl) {
    window.open(fileUrl, '_blank');
  }

  async function handleDownloadSubmissionFile(submissionId, fileName) {
    try {
      const response = await api.get(`/submissions/${submissionId}/file`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'submission');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download submission error:', err);
      setMessage('Failed to download submission file. Please try again.');
      setMessageType('error');
    }
  }

  function handleGradingChange(submissionId, field, value) {
    setGradingData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  }

  async function handleSaveGrade(submissionId) {
    const data = gradingData[submissionId];
    if (!data) return;

    try {
      await api.put(`/submissions/${submissionId}/grade`, {
        marks: data.marks,
        feedback: data.feedback
      });

      setMessage('Grade saved successfully!');
      setMessageType('success');

      // Refresh submissions to get updated data
      const submissionsRes = await api.get(`/assignments/${assignmentId}/submissions`);
      if (submissionsRes.data) {
        setSubmissions(submissionsRes.data);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save grade.');
      setMessageType('error');
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!assignment) return null;

  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  const isPastDue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        <div className="bg-white rounded-lg shadow p-8">
          <Link to={`/courses/${courseId}?tab=assignments`} className="text-blue-600 text-sm hover:underline">
            ← Back to assignments
          </Link>

          <h1 className="text-3xl font-bold mt-4 mb-2">{assignment.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>Total Marks: {assignment.total_marks}</span>
            {assignment.due_date && (
              <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
            )}
          </div>

          <div className="prose max-w-none mb-6">
            <p>{assignment.instructions}</p>
          </div>

          {assignment.file_path && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Attachment</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleViewAttachment}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  👁️ View
                </button>
                <button
                  onClick={handleDownloadAttachment}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  📎 Download ({assignment.file_name || 'attachment'})
                </button>
              </div>
            </div>
          )}

          {isInstructor && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete Assignment
              </button>
            </div>
          )}

          {isInstructor && (
            <div className="mt-6 border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Student Submissions ({submissions.length})</h2>

              {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {submission.student?.name || submission.student_email || 'Unknown Student'}
                          </h3>
                          {submission.student?.email && (
                            <p className="text-sm text-gray-500">{submission.student.email}</p>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        {submission.marks !== null && (
                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded font-medium">
                            {submission.marks}/{assignment.total_marks}
                          </div>
                        )}
                      </div>

                      {/* Submission file */}
                      {submission.file_path && (
                        <div className="mb-4">
                          <p className="font-medium text-gray-700 mb-2">Submitted file:</p>
                          <div className="flex items-center gap-2 bg-white rounded p-3 border">
                            <span className="text-2xl">📄</span>
                            <span className="text-gray-700 flex-1">{submission.file_name || 'Submitted file'}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewSubmissionFile(submission.file_url)}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => handleDownloadSubmissionFile(submission.id, submission.file_name)}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                📎 Download
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grading interface */}
                      <div className="bg-white rounded p-4 border">
                        <h4 className="font-semibold mb-3">
                          {submission.marks !== null ? 'Grade (Read-only)' : 'Grade this submission'}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Marks (out of {assignment.total_marks})</label>
                            {submission.marks !== null ? (
                              <div className="text-lg font-semibold text-green-600">
                                {submission.marks}/{assignment.total_marks}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={assignment.total_marks}
                                value={gradingData[submission.id]?.marks || ''}
                                onChange={(e) => handleGradingChange(submission.id, 'marks', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter marks"
                              />
                            )}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">Feedback (optional)</label>
                          {submission.marks !== null ? (
                            <div className="text-gray-700 bg-gray-50 p-3 rounded">
                              {submission.feedback || 'No feedback provided'}
                            </div>
                          ) : (
                            <textarea
                              value={gradingData[submission.id]?.feedback || ''}
                              onChange={(e) => handleGradingChange(submission.id, 'feedback', e.target.value)}
                              rows={3}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Add feedback for the student..."
                            />
                          )}
                        </div>
                        {submission.marks === null && (
                          <button
                            onClick={() => handleSaveGrade(submission.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            Save Grade
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isStudent && (
            <div className="mt-6 border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Your Submission</h2>

              {submission ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-700 font-medium text-lg">✓ Turned in</span>
                    <span className="text-sm text-gray-500">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Show submitted file */}
                  {submission.file_path && (
                    <div className="mb-4">
                      <p className="font-medium text-gray-700 mb-2">Your work:</p>
                      <div className="flex items-center gap-2 bg-white rounded p-3 border">
                        <span className="text-2xl">📄</span>
                        <span className="text-gray-700">{submission.file_name || 'Submitted file'}</span>
                      </div>
                    </div>
                  )}

                  {submission.marks !== null && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-lg font-semibold text-gray-800">
                        Grade: {submission.marks}/{assignment.total_marks}
                      </p>
                    </div>
                  )}
                  {submission.feedback && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="font-medium text-gray-700">Feedback:</p>
                      <p className="text-gray-600 mt-1">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              ) : isPastDue ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-2xl mb-2">⏰</p>
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Time is over</h3>
                  <p className="text-gray-600">
                    The deadline for this assignment was {new Date(assignment.due_date).toLocaleString()}. 
                    Submissions are no longer accepted.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Upload your work
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                        id="submission-file"
                      />
                      <label htmlFor="submission-file" className="cursor-pointer">
                        {file ? (
                          <div className="text-green-600">
                            📎 {file.name}
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <p className="text-2xl mb-1">📁</p>
                            <p>Click to upload your submission</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!file || submitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}