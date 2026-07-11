import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function MyCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/my-certificates')
            .then((res) => setCertificates(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
                    <p className="text-gray-500">
                        Certificates issued to you by your instructors
                    </p>
                </div>

                {certificates.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        }
                        title="No certificates yet"
                        description="Complete courses and ask your instructor to issue you a certificate."
                        actionText="Browse Courses"
                        onAction={() => window.location.href = '/courses'}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                                <div className="h-32 bg-gradient-to-br from-amber-400 to-amber-600 relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="success" className="bg-white/90 backdrop-blur-sm">Issued</Badge>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                                        {cert.course?.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="info" className="capitalize">{cert.course?.level}</Badge>
                                    </div>
                                    <div className="text-sm text-gray-500 mb-4">
                                        <p className="mb-1">
                                            Issued by <span className="font-medium text-gray-700">{cert.issuedBy?.name}</span>
                                        </p>
                                        <p>
                                            {new Date(cert.issued_at).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/my-certificates/${cert.id}`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 px-4 py-2 rounded-lg hover:from-indigo-100 hover:to-indigo-200 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}