import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Certificate from '../../components/Certificate';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function CourseCertificates() {
    const { id } = useParams();
    const [students, setStudents] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [course, setCourse] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [search, setSearch] = useState('');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
    });

    useEffect(() => {
        Promise.all([
            api.get(`/courses/${id}`),
            api.get(`/courses/${id}/students`),
            api.get(`/courses/${id}/certificates`),
            api.get('/categories'),
        ]).then(([courseRes, studentsRes, certsRes, catsRes]) => {
            setCourse(courseRes.data);
            setStudents(studentsRes.data);
            setCertificates(certsRes.data);
            setCategories(catsRes.data);
        }).finally(() => setLoading(false));
    }, [id]);

    function hasCertificate(studentId) {
        return certificates.find((c) => c.student?.id === studentId);
    }

    function getCertificateWithCourse(cert) {
        // Ensure the certificate has course information with category_id
        return {
            ...cert,
            course: {
                ...(cert.course || {}),
                ...course,
                category_id: course.category_id,
            }
        };
    }

    async function handleIssue(studentId) {
        setIssuing(studentId);
        try {
            const res = await api.post(`/courses/${id}/certificates`, {
                student_id: studentId,
            });
            setCertificates([res.data, ...certificates]);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to issue certificate.');
        } finally {
            setIssuing(null);
        }
    }

    function handleRevoke(certificate) {
        setConfirmModal({
            isOpen: true,
            title: 'Revoke Certificate',
            message: `Are you sure you want to revoke the certificate for ${certificate.student?.name}? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal({ ...confirmModal, isOpen: false });
                try {
                    await api.delete(`/courses/${id}/certificates/${certificate.id}`);
                    setCertificates(certificates.filter((c) => c.id !== certificate.id));
                    if (viewing?.id === certificate.id) setViewing(null);
                } catch (err) {
                    alert('Failed to revoke certificate.');
                }
            },
        });
    }

    function handlePrint(cert) {
        setViewing(cert);
        setTimeout(() => window.print(), 300);
    }

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <Link
                        to="/instructor/dashboard"
                        className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-3 sm:mt-4">{course?.title}</h1>
                    <p className="text-gray-500 mt-1 text-sm sm:text-base">Certificate Management</p>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{students.length}</p>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Enrolled Students</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{certificates.length}</p>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Certificates Issued</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-400">{students.length - certificates.length}</p>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Pending</p>
                    </div>
                </div>

                {/* Students table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <h2 className="font-bold text-gray-900 text-sm sm:text-base">Students</h2>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-500 text-sm sm:text-base">No students enrolled.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 text-xs sm:text-sm">#</th>
                                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 text-xs sm:text-sm">Student</th>
                                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 text-xs sm:text-sm">Certificate</th>
                                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 text-xs sm:text-sm">Issued On</th>
                                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 text-xs sm:text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {filteredStudents.map((student, index) => {
                                    const cert = hasCertificate(student.id);
                                    return (
                                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">{index + 1}</td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                <p className="font-medium text-gray-900 text-xs sm:text-sm">{student.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">{student.email}</p>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                {cert ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 sm:px-2.5 py-1 rounded-full">
                                                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Issued
                                                        </span>
                                                        <p className="font-mono text-xs text-gray-400 mt-1 truncate max-w-[120px] sm:max-w-none">
                                                            {cert.certificate_number}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 sm:px-2.5 py-1 rounded-full">
                                                        Not issued
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs">
                                                {cert
                                                    ? new Date(cert.issued_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })
                                                    : '—'}
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                    {cert ? (
                                                        <>
                                                            <button
                                                                onClick={() => setViewing(viewing?.id === cert.id ? null : getCertificateWithCourse(cert))}
                                                                className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:from-indigo-100 hover:to-indigo-200 hover:shadow-md text-xs font-medium cursor-pointer transition-all duration-200"
                                                            >
                                                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                <span className="hidden sm:inline">{viewing?.id === cert.id ? 'Hide' : 'Preview'}</span>
                                                                <span className="sm:hidden">{viewing?.id === cert.id ? 'Hide' : 'View'}</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrint(cert)}
                                                                className="inline-flex items-center gap-1 bg-gradient-to-r from-green-50 to-green-100 text-green-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:from-green-100 hover:to-green-200 hover:shadow-md text-xs font-medium cursor-pointer transition-all duration-200"
                                                            >
                                                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                                </svg>
                                                                Print
                                                            </button>
                                                            <button
                                                                onClick={() => handleRevoke(cert)}
                                                                className="inline-flex items-center gap-1 bg-gradient-to-r from-red-50 to-red-100 text-red-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:from-red-100 hover:to-red-200 hover:shadow-md text-xs font-medium cursor-pointer transition-all duration-200"
                                                            >
                                                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Revoke
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleIssue(student.id)}
                                                            disabled={issuing === student.id}
                                                            className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                                                        >
                                                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                            </svg>
                                                            {issuing === student.id ? 'Issuing...' : 'Issue'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>

                {/* Inline certificate preview */}
                {/* Full width certificate preview */}
                {viewing && (
                    <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h2 className="font-bold text-gray-700 text-sm sm:text-base">Certificate Preview</h2>
                            <button
                                onClick={() => setViewing(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm"
                            >
                                Close ✕
                            </button>
                        </div>
                        <div style={{ width: '100%' }}>
                            <Certificate certificate={viewing} categories={categories} fullWidth />
                        </div>
                    </div>
                )}
            </div>

            {/* Print-only */}
            {viewing && (
                <div className="print-only">
                    <Certificate certificate={viewing} categories={categories} />
                </div>
            )}

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