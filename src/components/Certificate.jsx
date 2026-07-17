export default function Certificate({ certificate, fullWidth = false, categories = [] }) {
    const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const instructorName = certificate.issued_by?.name
        || certificate.issuedBy?.name
        || 'Instructor';

    // Get category name - either from course.category or look up by category_id
    const categoryName = (() => {
        // First check if course has category object with name
        if (certificate.course?.category?.name) {
            return certificate.course.category.name;
        }
        // Then try to look up by category_id
        if (certificate.course?.category_id && categories.length > 0) {
            const category = categories.find(cat => String(cat.id) === String(certificate.course.category_id));
            return category?.name;
        }
        return null;
    })();

    const certStyle = fullWidth ? {
        width: '100%',
        boxSizing: 'border-box',
    } : {
        width: '100%',
        maxWidth: '680px',
        boxSizing: 'border-box',
    };

    return (
        <div
            id="certificate-content"
            style={{
                ...certStyle,
                background: '#fff',
                position: 'relative',
                padding: '30px 20px 25px',
                fontFamily: "Georgia, 'Times New Roman', serif",
                border: '6px solid #4f46e5',
            }}
        >
            <style>{`
                @media (min-width: 640px) {
                    #certificate-content {
                        padding: 40px 40px 35px !important;
                        border-width: 7px !important;
                    }
                }
                @media (min-width: 768px) {
                    #certificate-content {
                        padding: 50px 60px 44px !important;
                        border-width: 8px !important;
                    }
                }
            `}</style>
            {/* Gradient top accent bar */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '3px',
                background: 'linear-gradient(to right, #4f46e5, #818cf8)',
            }} />

            {/* Inner decorative border */}
            <div style={{
                position: 'absolute',
                inset: '10px',
                border: '1px solid #c7d2fe',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e0e7ff',
            }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e1b4b', letterSpacing: '1px' }}>
                    E<span style={{ color: '#4f46e5' }}>Learn</span> Academy
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '8px', color: '#a5b4fc', letterSpacing: '1px' }}>
                    {certificate.certificate_number}
                </div>
            </div>

            {/* Body */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '8px', letterSpacing: '3px', color: '#6366f1', textTransform: 'uppercase', margin: '0 0 8px' }}>
                    Certificate of Completion
                </p>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e0e7ff' }} />
                    <div style={{ width: '4px', height: '4px', background: '#6366f1', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: '1px', background: '#e0e7ff' }} />
                </div>

                <p style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 8px' }}>
                    This is to certify that
                </p>

                {/* Student name */}
                <div style={{
                    fontSize: '20px',
                    fontWeight: '400',
                    color: '#1e1b4b',
                    letterSpacing: '0.3px',
                    borderBottom: '1px solid #c7d2fe',
                    paddingBottom: '8px',
                    display: 'inline-block',
                    minWidth: '150px',
                    margin: '0 0 8px',
                }}>
                    {certificate.student?.name}
                </div>

                <p style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 4px' }}>
                    has successfully completed the course
                </p>

                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e1b4b', margin: '0 0 8px', lineHeight: '1.4' }}>
                    {certificate.course?.title}
                </div>

                {/* Level and Category pills */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {certificate.course?.level && (
                        <span style={{
                            display: 'inline-block',
                            fontSize: '8px',
                            color: '#6366f1',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontFamily: 'Arial, sans-serif',
                            border: '1px solid #c7d2fe',
                            padding: '2px 10px',
                            borderRadius: '15px',
                        }}>
                            {certificate.course.level} level
                        </span>
                    )}
                    {categoryName && (
                        <span style={{
                            display: 'inline-block',
                            fontSize: '8px',
                            color: '#8b5cf6',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontFamily: 'Arial, sans-serif',
                            border: '1px solid #ddd6fe',
                            padding: '2px 10px',
                            borderRadius: '15px',
                        }}>
                            {categoryName}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: '24px',
                paddingTop: '12px',
                borderTop: '1px solid #e0e7ff',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                {/* Instructor */}
                <div style={{ flex: 1, minWidth: '100px' }}>
                    <p style={{ fontSize: '12px', color: '#1e1b4b', fontStyle: 'italic', margin: '0 0 3px' }}>
                        {instructorName}
                    </p>
                    <div style={{ width: '80px', height: '1px', background: '#c7d2fe', marginBottom: '3px' }} />
                    <p style={{ fontSize: '7px', color: '#a5b4fc', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                        Instructor
                    </p>
                </div>

                {/* Seal */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{
                        fontSize: '6px',
                        color: '#fff',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: '500',
                    }}>
                        ELearn<br />Academy<br />✦
                    </div>
                </div>

                {/* Date */}
                <div style={{ textAlign: 'right', flex: 1, minWidth: '100px' }}>
                    <p style={{ fontSize: '11px', color: '#1e1b4b', margin: '0 0 3px' }}>
                        {issuedDate}
                    </p>
                    <div style={{ width: '80px', height: '1px', background: '#c7d2fe', marginBottom: '3px', marginLeft: 'auto' }} />
                    <p style={{ fontSize: '7px', color: '#a5b4fc', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                        Date Issued
                    </p>
                </div>
            </div>

            {/* Responsive styles for larger screens */}
            <style>{`
                @media (min-width: 640px) {
                    #certificate-content .cert-header {
                        fontSize: 15px !important;
                        marginBottom: 20px !important;
                        paddingBottom: 15px !important;
                    }
                    #certificate-content .cert-title {
                        fontSize: 9px !important;
                        letterSpacing: '3.5px' !important;
                        margin-bottom: 10px !important;
                    }
                    #certificate-content .cert-name {
                        fontSize: 28px !important;
                        letterSpacing: '0.4px' !important;
                        paddingBottom: 9px !important;
                        minWidth: '200px' !important;
                        margin-bottom: 9px !important;
                    }
                    #certificate-content .cert-course {
                        fontSize: 18px !important;
                        margin-bottom: 9px !important;
                    }
                    #certificate-content .cert-pill {
                        fontSize: 9px !important;
                        padding: '2.5px 12px' !important;
                    }
                    #certificate-content .cert-footer {
                        marginTop: 32px !important;
                        paddingTop: 15px !important;
                    }
                    #certificate-content .cert-instructor {
                        fontSize: 13px !important;
                    }
                    #certificate-content .cert-seal {
                        width: 56px !important;
                        height: 56px !important;
                    }
                    #certificate-content .cert-seal-text {
                        fontSize: 7px !important;
                        lineHeight: '1.6' !important;
                    }
                    #certificate-content .cert-date {
                        fontSize: 12px !important;
                    }
                }
                @media (min-width: 768px) {
                    #certificate-content .cert-header {
                        fontSize: 17px !important;
                        marginBottom: 24px !important;
                        paddingBottom: 18px !important;
                        letterSpacing: '1.5px' !important;
                    }
                    #certificate-content .cert-cert-number {
                        fontSize: '10px' !important;
                    }
                    #certificate-content .cert-title {
                        fontSize: '10px' !important;
                        letterSpacing: '4px' !important;
                        margin-bottom: 12px !important;
                    }
                    #certificate-content .cert-divider {
                        gap: '12px' !important;
                        margin-bottom: '22px !important';
                    }
                    #certificate-content .cert-divider-dot {
                        width: '5px' !important;
                        height: '5px' !important;
                    }
                    #certificate-content .cert-text {
                        fontSize: '12px' !important;
                        margin-bottom: '10px' !important;
                    }
                    #certificate-content .cert-name {
                        fontSize: '36px' !important;
                        letterSpacing: '0.5px' !important;
                        borderBottom: '1.5px solid #c7d2fe' !important;
                        paddingBottom: '10px' !important;
                        minWidth: '260px' !important;
                        margin-bottom: '10px' !important;
                    }
                    #certificate-content .cert-course {
                        fontSize: '22px' !important;
                        margin-bottom: '10px' !important;
                    }
                    #certificate-content .cert-pill {
                        fontSize: '10px' !important;
                        letterSpacing: '2px' !important;
                        padding: '3px 14px' !important;
                        gap: '8px' !important;
                    }
                    #certificate-content .cert-footer {
                        marginTop: '40px' !important;
                        paddingTop: '18px' !important;
                        gap: '0' !important;
                    }
                    #certificate-content .cert-instructor {
                        fontSize: '15px' !important;
                        margin-bottom: '5px' !important;
                    }
                    #certificate-content .cert-line {
                        width: '140px' !important;
                        marginBottom: '4px' !important;
                    }
                    #certificate-content .cert-label {
                        fontSize: '9px' !important;
                        letterSpacing: '2px' !important;
                    }
                    #certificate-content .cert-seal {
                        width: '64px' !important;
                        height: '64px' !important;
                    }
                    #certificate-content .cert-seal-text {
                        fontSize: '8px' !important;
                        letterSpacing: '0.5px' !important;
                        lineHeight: '1.7' !important;
                    }
                    #certificate-content .cert-date {
                        fontSize: '14px' !important;
                        margin-bottom: '5px' !important;
                    }
                }
            `}</style>
        </div>
    );
}