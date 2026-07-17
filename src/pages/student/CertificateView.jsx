import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Certificate from '../../components/Certificate';

export default function CertificateView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [certificate, setCertificate] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/my-certificates'),
            api.get('/categories')
        ]).then(([certsRes, catsRes]) => {
            const cert = certsRes.data.find(c => c.id === parseInt(id));
            if (cert) {
                setCertificate(cert);
                setCategories(catsRes.data);
            } else {
                navigate('/my-certificates');
            }
        })
            .catch(() => navigate('/my-certificates'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    function handlePrint() {
        window.print();
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            </div>
        </div>
    );

    if (!certificate) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with back button and print button */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/my-certificates')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Certificates
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Certificate
                    </button>
                </div>

                {/* Full-width certificate */}
                <div className="flex justify-center">
                    <Certificate certificate={certificate} categories={categories} fullWidth={true} />
                </div>
            </div>
        </div>
    );
}
