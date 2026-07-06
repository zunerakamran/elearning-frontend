export default function Certificate({ certificate }) {
    const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div
            id="certificate-content"
            className="relative bg-white"
            style={{
                width: '842px',
                minHeight: '595px',
                padding: '60px',
                fontFamily: 'Georgia, serif',
                border: '20px solid #4f46e5',
                boxShadow: '0 0 0 4px #a5b4fc, 0 0 0 8px #4f46e5',
                boxSizing: 'border-box',
            }}
        >
            {/* Corner decorations */}
            {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                <div
                    key={i}
                    className={`absolute ${pos} w-10 h-10 border-4 border-indigo-900`}
                    style={{
                        borderRadius: i === 0 ? '0 0 8px 0' : i === 1 ? '0 0 0 8px' : i === 2 ? '0 8px 0 0' : '8px 0 0 0'
                    }}
                />
            ))}

            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-16 h-16 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                </div>
                <h1 className="text-indigo-900 font-bold tracking-widest uppercase text-sm mb-1">
                    ELearn Academy
                </h1>
                <div className="w-32 h-0.5 bg-indigo-300 mx-auto" />
            </div>

            {/* Certificate title */}
            <div className="text-center mb-8">
                <h2
                    className="text-gray-500 uppercase tracking-widest text-xs mb-2"
                    style={{ letterSpacing: '6px' }}
                >
                    Certificate of Completion
                </h2>
                <div className="flex items-center justify-center gap-4">
                    <div className="h-px bg-gray-300 flex-1" />
                    <span className="text-3xl text-indigo-200">✦</span>
                    <div className="h-px bg-gray-300 flex-1" />
                </div>
            </div>

            {/* Body */}
            <div className="text-center mb-8">
                <p className="text-gray-500 text-sm mb-4">This is to certify that</p>
                <h2
                    className="text-indigo-900 mb-4"
                    style={{ fontSize: '36px', fontWeight: 'bold', borderBottom: '2px solid #c7d2fe', paddingBottom: '8px', display: 'inline-block', minWidth: '300px' }}
                >
                    {certificate.student?.name}
                </h2>
                <p className="text-gray-500 text-sm mt-4 mb-2">has successfully completed the course</p>
                <h3
                    className="text-gray-800 font-bold mb-2"
                    style={{ fontSize: '22px' }}
                >
                    {certificate.course?.title}
                </h3>
                <p className="text-gray-400 text-xs uppercase tracking-widest">
                    {certificate.course?.level} level
                </p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-12">
                {/* Issued by */}
                <div className="text-center">
                    <div className="w-40 border-t-2 border-gray-400 pt-2">
                        <p className="text-gray-800 font-semibold text-sm">{certificate.issuedBy?.name}</p>
                        <p className="text-gray-400 text-xs">Instructor</p>
                    </div>
                </div>

                {/* Certificate number */}
                <div className="text-center">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2">
                        <p className="text-indigo-400 text-xs uppercase tracking-widest mb-1">Certificate No.</p>
                        <p className="text-indigo-700 font-mono font-bold text-sm">{certificate.certificate_number}</p>
                    </div>
                </div>

                {/* Date */}
                <div className="text-center">
                    <div className="w-40 border-t-2 border-gray-400 pt-2">
                        <p className="text-gray-800 font-semibold text-sm">{issuedDate}</p>
                        <p className="text-gray-400 text-xs">Date Issued</p>
                    </div>
                </div>
            </div>
        </div>
    );
}