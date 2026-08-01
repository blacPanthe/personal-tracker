import { useState } from 'react';

export default function AuthForm({ mode, onSubmit, onSwitchMode, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="plan-form auth-form" onSubmit={handleSubmit}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{isSignUp ? 'Create your account' : 'Sign in'}</h2>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={isSignUp ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="plan-submit" disabled={loading}>
          {loading ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
        </button>
        {error && <p className="plan-error">{error}</p>}
        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="plan-empty-link" onClick={onSwitchMode}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  );
}
