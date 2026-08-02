import { useState } from 'react';

export default function AuthForm({ mode, onSubmit, onSwitchMode, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) await onSubmit(name, email, password, remember);
      else await onSubmit(email, password, remember);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <img src="/logo-wordmark.svg" alt="Baseline" className="auth-brand-mark" width={160} height={48} />

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${!isSignUp ? ' active' : ''}`}
            onClick={() => !isSignUp || onSwitchMode()}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab${isSignUp ? ' active' : ''}`}
            onClick={() => isSignUp || onSwitchMode()}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-subtext">
            {isSignUp ? 'Sign up to start tracking with Baseline.' : 'Sign in to access your Baseline account.'}
          </p>

          {isSignUp && (
            <input type="text" placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={isSignUp ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="auth-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Keep me logged in
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : isSignUp ? 'Sign up →' : 'Sign in →'}
          </button>

          {error && <p className="plan-error">{error}</p>}

          <p className="auth-footer">By continuing you agree to Baseline's Privacy Policy.</p>
        </form>
      </div>
    </div>
  );
}
