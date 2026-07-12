import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const ROLES = [
  { label: 'Fleet Manager', desc: 'Full fleet and analytics access' },
  { label: 'Dispatcher', desc: 'Trip management and scheduling' },
  { label: 'Safety Officer', desc: 'Driver safety and compliance' },
  { label: 'Financial Analyst', desc: 'Expense and revenue tracking' },
];

const ROLE_COLORS: Record<string, string> = {
  'Fleet Manager': '#22c55e',
  'Dispatcher': '#3b82f6',
  'Safety Officer': '#f59e0b',
  'Financial Analyst': '#a78bfa',
};

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const [email, setEmail] = useState('admin@transitops.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', background: 'var(--color-bg)',
    }}>
      {/* Left Brand Panel */}
      <div style={{
        width: '42%', background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px',
      }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-accent)', letterSpacing: '-1px', marginBottom: '8px' }}>
            TransitOps
          </div>
          <div style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Smart Transport Operations Platform.<br />
            Built for fleets that move the world.
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
          Role-Based Access
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ROLES.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: ROLE_COLORS[r.label], flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{r.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', fontSize: '11px', color: 'var(--color-text-dim)' }}>
          © 2026 TransitOps. All rights reserved.
        </div>
      </div>

      {/* Right Login Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Sign In</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '32px' }}>
            Enter your credentials to access TransitOps
          </p>

          {error && (
            <div className="form-error" style={{ marginBottom: '20px' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@transitops.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button type="button" style={{
                background: 'none', border: 'none', color: 'var(--color-accent)',
                fontSize: '13px', cursor: 'pointer',
              }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: '28px', padding: '14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '8px' }}>DEMO CREDENTIALS</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', lineHeight: 1.8 }}>
              <div>admin@transitops.com / admin123</div>
              <div>dispatcher@transitops.com / password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
