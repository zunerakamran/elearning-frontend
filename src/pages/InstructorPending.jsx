import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function InstructorPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // If for some reason an approved instructor lands here, redirect them
  useEffect(() => {
    if (user && user.instructor_status === 'approved') {
      navigate('/instructor/dashboard');
    }
  }, [user, navigate]);

  async function handleLogout() {
    try {
      await logout();
    } catch (_) {
      // even if logout API fails, clear local state
    }
    navigate('/login');
  }

  return (
    <div className="instructor-pending-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .instructor-pending-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Animated background orbs */
        .instructor-pending-root::before,
        .instructor-pending-root::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 8s ease-in-out infinite;
        }
        .instructor-pending-root::before {
          width: 500px;
          height: 500px;
          background: #818cf8;
          top: -150px;
          right: -150px;
          animation-delay: 0s;
        }
        .instructor-pending-root::after {
          width: 400px;
          height: 400px;
          background: #a78bfa;
          bottom: -120px;
          left: -120px;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        .card {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          max-width: 520px;
          width: 100%;
          text-align: center;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
        }

        /* Clock/hourglass icon ring */
        .icon-ring {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(129,140,248,0.25), rgba(167,139,250,0.25));
          border: 2px solid rgba(129,140,248,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.75rem;
          animation: pulse-ring 3s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(129,140,248,0.3); }
          50% { box-shadow: 0 0 0 16px rgba(129,140,248,0); }
        }

        .icon-ring svg {
          width: 48px;
          height: 48px;
          color: #a5b4fc;
          animation: spin-slow 6s linear infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(251,191,36,0.15);
          border: 1px solid rgba(251,191,36,0.3);
          color: #fbbf24;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 1.25rem;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          background: #fbbf24;
          border-radius: 50%;
          animation: blink 1.4s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #f1f5f9;
          margin: 0 0 0.75rem;
          line-height: 1.3;
        }

        .subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .steps {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: left;
          margin-bottom: 2rem;
        }
        .steps-title {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin: 0 0 1rem;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 0.85rem;
        }
        .step-item:last-child { margin-bottom: 0; }
        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #818cf8, #a78bfa);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .step-text {
          color: #cbd5e1;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .step-text strong {
          color: #e2e8f0;
        }

        .btn-logout {
          width: 100%;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #818cf8, #a78bfa);
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-logout:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(129,140,248,0.4);
        }
        .btn-logout:active {
          transform: translateY(0);
        }

        .footer-note {
          margin-top: 1.25rem;
          font-size: 0.8rem;
          color: #475569;
        }
        .footer-note a {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }
        .footer-note a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="card">
        {/* Animated clock icon */}
        <div className="icon-ring" aria-hidden="true">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Status badge */}
        <div className="badge">
          <span className="badge-dot" />
          Pending Approval
        </div>

        <h1>Your account is under review</h1>

        <p className="subtitle">
          Thank you for registering as an instructor{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          Your application has been submitted and is awaiting approval from our admin team.
          You'll receive access once approved.
        </p>

        {/* Steps */}
        <div className="steps">
          <p className="steps-title">What happens next?</p>

          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-text">
              <strong>Admin reviews your application</strong> — our team will verify your details.
            </div>
          </div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-text">
              <strong>You'll be notified</strong> via email when your account is approved or if additional info is needed.
            </div>
          </div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-text">
              <strong>Full access granted</strong> — once approved, log in to start creating and publishing courses.
            </div>
          </div>
        </div>

        <button id="instructor-pending-logout-btn" onClick={handleLogout} className="btn-logout">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Back to Login
        </button>

        <p className="footer-note">
          Need help?{' '}
          <a href="mailto:support@elearning.com">Contact support</a>
        </p>
      </div>
    </div>
  );
}
