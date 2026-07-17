import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        api.get('/admin/certificates')
            .then((res) => setCertificates(res.data))
            .catch(() => {
                setCertificates([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredCertificates = certificates.filter((cert) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            cert.student?.name?.toLowerCase().includes(searchLower) ||
            cert.student?.email?.toLowerCase().includes(searchLower) ||
            cert.issuedBy?.name?.toLowerCase().includes(searchLower) ||
            cert.course?.title?.toLowerCase().includes(searchLower) ||
            cert.certificate_number?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div>
                <h1 className="text-white text-2xl font-bold">Certificates</h1>
                <p className="text-gray-400 text-sm mt-1">View all certificates issued by instructors to students</p>
            </div>

            {/* Search */}
            <div className="bg-[#151922] border border-white/5 rounded-2xl p-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by student, instructor, course, or certificate number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Certificates Grid */}
            {certificates.length === 0 ? (
                <EmptyState
                    icon={
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    }
                    title="No certificates found"
                    titleClassName="text-white"
                    description="No certificates have been issued yet."
                />
            ) : filteredCertificates.length === 0 ? (
                <div className="bg-[#151922] border border-white/5 rounded-2xl p-12 text-center">
                    <p className="text-gray-400">No certificates match your search.</p>
                </div>
            ) : (
                <div className="bg-[#151922] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-300">Certificate #</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-300">Student</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-300">Course</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-300">Issued By</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-300">Issued On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCertificates.map((cert) => (
                                    <tr key={cert.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded">
                                                {cert.certificate_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-white">{cert.student?.name}</p>
                                                <p className="text-xs text-gray-500">{cert.student?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-white line-clamp-1">{cert.course?.title}</p>
                                                <Badge variant="info" className="capitalize mt-1">{cert.course?.level}</Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-white">{cert.issuedBy?.name || cert.course?.instructor?.name}</p>
                                                {(cert.issuedBy?.is_verified || cert.course?.instructor?.is_verified) && (
                                                    <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                    </svg>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(cert.issued_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
