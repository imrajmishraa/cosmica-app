import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-glow-bg" />
      <div className="auth-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="title-glow" style={{ fontSize: '32px', marginBottom: '8px' }}>
            COSMICA
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>
            Create Your Asset Portal
          </p>
        </div>

        {error && (
          <div
            className="badge-error"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '14px',
              lineHeight: '1.4',
              display: 'block',
              textTransform: 'none',
              letterSpacing: 'normal',
              fontWeight: 'normal',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              required
              className="form-input"
              type="email"
              id="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              required
              className="form-input"
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              required
              className="form-input"
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button disabled={submitting} type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {submitting ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                  }}
                />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'hsl(var(--text-secondary))' }}>Already have an account? </span>
          <Link
            to="/login"
            style={{
              color: 'hsl(var(--accent))',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color var(--transition-fast)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'hsl(var(--accent-hover))')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'hsl(var(--accent))')}
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
};
