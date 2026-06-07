import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Button, Input, Card } from '../components/common/FormElements.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const getErrorMessage = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object' || !('response' in error)) {
      return undefined;
    }

    const typedError = error as {
      response?: { status?: number; data?: unknown };
    };
    const response = typedError.response;
    const payload = response?.data;

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: string }).message;
      if (message) {
        return message;
      }
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (response?.status === 403) {
      return 'Your account is disabled or you do not have permission to log in.';
    }

    if (response?.status === 401) {
      return 'Invalid email or password.';
    }

    return undefined;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email, password);
      console.info('Login succeeded for:', email);
      setAuth(response.data.user, response.data.accessToken);
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Login failed:', error);

      const message = getErrorMessage(error);
      setError(
        message ||
          'Login failed. Please check your email and password, then try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.16),_transparent_24%),linear-gradient(180deg,_#090f1f_0%,_#0f172a_50%,_#111827_100%)]" />
      <div className="absolute left-[-4rem] top-20 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl animate-glow" />
      <div className="absolute right-[-6rem] bottom-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl animate-glow" />

      <div className="relative z-10 flex min-h-screen flex-col justify-center px-4 py-10">
        <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between px-2">
          <div className="animate-fade-up">
            <p className="section-chip mb-3 w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Macheke Medical Lab
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Macheke Medical Laboratory
              <span className="block bg-gradient-to-r from-sky-300 to-blue-500 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Streamline reception check-ins, lab processing, approvals, and result delivery with a polished clinical workflow.
            </p>
          </div>
          <div className="hidden xl:block animate-float">
            <div className="section-chip">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Secure patient and staff access
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-lg animate-fade-up border-white/10 bg-slate-900/70">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to Home
            </Link>
            <button
              type="button"
              onClick={() => setShowInfo((current) => !current)}
              aria-expanded={showInfo}
              aria-label="Toggle login info"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-sky-400/20 to-blue-500/20 text-slate-100 shadow-lg shadow-sky-500/10 transition duration-300 hover:-translate-y-0.5 hover:border-sky-300/40 hover:from-sky-400/30 hover:to-blue-500/30 hover:text-white"
            >
              <span className="text-base font-semibold">i</span>
            </button>
          </div>

          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">
              Secure Portal Access
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Login</h2>
            <p className="mt-3 text-sm text-slate-300">
              One portal for patients and staff, with accounts issued through reception and logged in here.
            </p>
          </div>

          {showInfo && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-400/10 shadow-lg shadow-sky-500/10 animate-fade-up">
              <div className="border-b border-white/10 px-4 py-3 text-sm font-medium text-sky-100">
                Login information
              </div>
              <div className="space-y-3 px-4 py-4 text-sm text-sky-50/90">
                <p>• Patients and staff use this same login page.</p>
                <p>• Patient accounts are created at reception with the default password Password123!.</p>
                <p>• Use the email and password issued by the lab team or reception, then change it in your account.</p>
                <p>• If login fails, check the email/password or ask reception to confirm the account is active.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            {error && <p className="mb-4 text-red-300">{error}</p>}
            <Button
              variant="primary"
              loading={loading}
              loadingText="Signing in..."
              className="group relative w-full overflow-hidden rounded-full border border-sky-300/25 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 py-3.5 text-base font-semibold tracking-wide text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(59,130,246,0.38)] focus:ring-2 focus:ring-sky-300/60"
              type="submit"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Login
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </span>
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
