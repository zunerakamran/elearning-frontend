export default function Certificate({ certificate, fullWidth = false }) {
    const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const instructorName = certificate.issued_by?.name
        || certificate.issuedBy?.name
        || 'Instructor';

    const certStyle = fullWidth ? {
        width: '100%',
        boxSizing: 'border-box',
    } : {
        width: '680px',
        boxSizing: 'border-box',
    };

    return (
        <div
            id="certificate-content"
            style={{
                ...certStyle,
                background: '#fff',
                position: 'relative',
                padding: '50px 60px 44px',
                fontFamily: "Georgia, 'Times New Roman', serif",
                border: '8px solid #4f46e5',
            }}
        >
            {/* Gradient top accent bar */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                background: 'linear-gradient(to right, #4f46e5, #818cf8)',
            }} />

            {/* Inner decorative border */}
            <div style={{
                position: 'absolute',
                inset: '14px',
                border: '1px solid #c7d2fe',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '18px',
                borderBottom: '1px solid #e0e7ff',
            }}>
                <div style={{ fontSize: '17px', fontWeight: '500', color: '#1e1b4b', letterSpacing: '1.5px' }}>
                    E<span style={{ color: '#4f46e5' }}>Learn</span> Academy
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '10px', color: '#a5b4fc', letterSpacing: '1px' }}>
                    {certificate.certificate_number}
                </div>
            </div>

            {/* Body */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '10px', letterSpacing: '4px', color: '#6366f1', textTransform: 'uppercase', margin: '0 0 12px' }}>
                    Certificate of Completion
                </p>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e0e7ff' }} />
                    <div style={{ width: '5px', height: '5px', background: '#6366f1', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: '1px', background: '#e0e7ff' }} />
                </div>

                <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px' }}>
                    This is to certify that
                </p>

                {/* Student name */}
                <div style={{
                    fontSize: '36px',
                    fontWeight: '400',
                    color: '#1e1b4b',
                    letterSpacing: '0.5px',
                    borderBottom: '1.5px solid #c7d2fe',
                    paddingBottom: '10px',
                    display: 'inline-block',
                    minWidth: '260px',
                    margin: '0 0 10px',
                }}>
                    {certificate.student?.name}
                </div>

                <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 6px' }}>
                    has successfully completed the course
                </p>

                <div style={{ fontSize: '22px', fontWeight: '500', color: '#1e1b4b', margin: '0 0 10px' }}>
                    {certificate.course?.title}
                </div>

                {/* Level pill — only render if level exists */}
                {certificate.course?.level && (
                    <span style={{
                        display: 'inline-block',
                        fontSize: '10px',
                        color: '#6366f1',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: 'Arial, sans-serif',
                        border: '1px solid #c7d2fe',
                        padding: '3px 14px',
                        borderRadius: '20px',
                    }}>
                        {certificate.course.level} level
                    </span>
                )}
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: '40px',
                paddingTop: '18px',
                borderTop: '1px solid #e0e7ff',
            }}>
                {/* Instructor */}
                <div>
                    <p style={{ fontSize: '15px', color: '#1e1b4b', fontStyle: 'italic', margin: '0 0 5px' }}>
                        {instructorName}
                    </p>
                    <div style={{ width: '140px', height: '1px', background: '#c7d2fe', marginBottom: '4px' }} />
                    <p style={{ fontSize: '9px', color: '#a5b4fc', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                        Instructor
                    </p>
                </div>

                {/* Seal */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        fontSize: '8px',
                        color: '#fff',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        lineHeight: '1.7',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: '500',
                    }}>
                        ELearn<br />Academy<br />✦
                    </div>
                </div>

                {/* Date */}
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', color: '#1e1b4b', margin: '0 0 5px' }}>
                        {issuedDate}
                    </p>
                    <div style={{ width: '140px', height: '1px', background: '#c7d2fe', marginBottom: '4px', marginLeft: 'auto' }} />
                    <p style={{ fontSize: '9px', color: '#a5b4fc', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                        Date Issued
                    </p>
                </div>
            </div>
        </div>
    );
}