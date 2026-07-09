import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

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
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    const isInstructor = user?.role === 'instructor';
    Promise.all([
      api.get(`/courses/${courseId}/assignments/${assignmentId}`),
      user ? api.get(`/assignments/${assignmentId}/my-submission`).catch(() => null) : Promise.resolve(null),
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
      const submissionRes = await api.get(`/assignments/${assignmentId}/my-submission`);
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

  function handleDelete() {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/courses/${courseId}/assignments/${assignmentId}`);
          navigate(`/courses/${courseId}?tab=assignments`);
        } catch (err) {
          setMessage(err.response?.data?.message || 'Delete failed.');
          setMessageType('error');
        }
      },
    });
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
  if (!assignment) return null;

  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  const isPastDue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <Link to={`/courses/${courseId}?tab=assignments`} className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to assignments
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{assignment.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
            <Badge variant="info">Total Marks: {assignment.total_marks}</Badge>
            {assignment.due_date && (
              <Badge variant={isPastDue ? 'danger' : 'success'}>
                Due: {new Date(assignment.due_date).toLocaleString()}
              </Badge>
            )}
          </div>

          <div className="prose prose-indigo max-w-none mb-6 text-gray-700">
            <p>{assignment.instructions}</p>
          </div>

          {assignment.file_path && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Attachment</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleViewAttachment}
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button
                  onClick={handleDownloadAttachment}
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download ({assignment.file_name || 'attachment'})
                </button>
              </div>
            </div>
          )}

          {isInstructor && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-md hover:scale-[1.02] transition-all duration-200 font-medium cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Assignment
              </button>
            </div>
          )}

          {isInstructor && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Student Submissions ({submissions.length})</h2>

              {submissions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
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
                          <Badge variant="success">{submission.marks}/{assignment.total_marks}</Badge>
                        )}
                      </div>

                      {/* Submission file */}
                      {submission.file_path && (
                        <div className="mb-4">
                          <p className="font-medium text-gray-700 mb-2">Submitted file:</p>
                          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-gray-700 flex-1">{submission.file_name || 'Submitted file'}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewSubmissionFile(submission.file_url)}
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => handleDownloadSubmissionFile(submission.id, submission.file_name)}
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grading interface */}
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          {submission.marks !== null ? 'Grade (Read-only)' : 'Grade this submission'}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Marks (out of {assignment.total_marks})</label>
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter marks"
                              />
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (optional)</label>
                          {submission.marks !== null ? (
                            <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {submission.feedback || 'No feedback provided'}
                            </div>
                          ) : (
                            <textarea
                              value={gradingData[submission.id]?.feedback || ''}
                              onChange={(e) => handleGradingChange(submission.id, 'feedback', e.target.value)}
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Add feedback for the student..."
                            />
                          )}
                        </div>
                        {submission.marks === null && (
                          <button
                            onClick={() => handleSaveGrade(submission.id)}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-md hover:scale-[1.02] transition-all duration-200 font-medium cursor-pointer"
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
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Submission</h2>

              {submission ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium text-lg">Turned in</span>
                      <p className="text-sm text-gray-500">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Show submitted file */}
                  {submission.file_path && (
                    <div className="mb-4">
                      <p className="font-medium text-gray-700 mb-2">Your work:</p>
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
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
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Time is over</h3>
                  <p className="text-gray-600">
                    The deadline for this assignment was {new Date(assignment.due_date).toLocaleString()}. 
                    Submissions are no longer accepted.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload your work
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                        id="submission-file"
                      />
                      <label htmlFor="submission-file" className="cursor-pointer">
                        {file ? (
                          <div className="text-green-600">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="font-medium">{file.name}</p>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p>Click to upload your submission</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!file || submitting}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
}