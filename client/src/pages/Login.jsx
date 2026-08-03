// src/pages/Login.jsx
// -----------------------------------------------------------------------
// Presentational + form-state logic only - all actual auth work
// (Firebase call + backend sync) lives in AuthContext.login /
// loginWithGoogle. This page just calls those and handles UI feedback.
// -----------------------------------------------------------------------

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/common/Button.jsx';
import { AuthLayout } from '../components/common/AuthLayout.jsx';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Firebase errors have a `.code` - translate the common ones into
      // plain language rather than showing "auth/invalid-credential".
      setError('Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Google sign-in was cancelled or failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mb-6 text-sm text-ink-muted">Sign in to keep talking with Nova.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-void px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-nova-amber"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-void px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-nova-amber"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-xs text-ink-faint">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <Button variant="secondary" onClick={handleGoogleLogin} isLoading={isSubmitting} className="w-full">
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to Nova?{' '}
        <Link to="/register" className="font-medium text-nova-amber hover:text-nova-amber-bright">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
