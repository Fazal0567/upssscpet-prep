import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  KeyRound,
  Zap,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    sendPasswordReset,
    loginAsGuestAspirant,
    unlockAdminWithKey,
    changeAdminPasskey,
    isCustomPasskeyActive
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'admin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminPasskey, setAdminPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Change passkey sub-state
  const [isChangingPasskey, setIsChangingPasskey] = useState(false);
  const [currentKeyInput, setCurrentKeyInput] = useState('');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [confirmKeyInput, setConfirmKeyInput] = useState('');
  const [showChangeNewKey, setShowChangeNewKey] = useState(false);

  if (!isOpen) return null;

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsOperationNotAllowed(false);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long');
        await registerWithEmail(email, password, name);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSuccess('Password reset link has been sent to your email.');
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('operation-not-allowed') || err?.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setError('Email/Password provider is currently not enabled in Firebase Console.');
      } else {
        setIsOperationNotAllowed(false);
        setError(msg.replace('Firebase: ', '') || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminPasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const ok = unlockAdminWithKey(adminPasskey);
    if (!ok) {
      setError('❌ Invalid Admin Passkey! Please enter the authorized administrator passkey.');
      return;
    }
    setSuccess('Admin Security Passkey verified! Admin Portal unlocked.');
    setTimeout(() => onClose(), 600);
  };

  const handleChangePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!currentKeyInput.trim()) {
      setError('Please enter your current admin passkey.');
      return;
    }
    if (!newKeyInput.trim() || newKeyInput.trim().length < 5) {
      setError('New passkey must be at least 5 characters long.');
      return;
    }
    if (newKeyInput.trim() !== confirmKeyInput.trim()) {
      setError('New passkey and confirmation passkey do not match.');
      return;
    }
    const res = changeAdminPasskey(currentKeyInput, newKeyInput);
    if (res.success) {
      setSuccess(res.message);
      setIsChangingPasskey(false);
      setCurrentKeyInput('');
      setNewKeyInput('');
      setConfirmKeyInput('');
      setAdminPasskey(newKeyInput.trim());
    } else {
      setError(res.message);
    }
  };

  const handleCandidateGoogleSignIn = async () => {
    setError(null);
    setIsOperationNotAllowed(false);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        loginAsGuestAspirant();
        onClose();
      } else {
        setError(err?.message || 'Google sign-in could not be completed.');
      }
    }
  };

  const handleGuestSignIn = () => {
    loginAsGuestAspirant();
    onClose();
  };

  const isAdminView = mode === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header background banner */}
        <div className={`px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 text-white ${
          isAdminView
            ? 'bg-gradient-to-r from-amber-700 via-slate-900 to-indigo-950'
            : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isAdminView ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' : 'bg-white/20 text-white'
            }`}>
              {isAdminView ? 'Restricted Admin Access' : 'UPSSSC PET 2026'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            {mode === 'login' && 'Candidate Sign In'}
            {mode === 'register' && 'Create Candidate Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'admin' && 'Admin Portal Access'}
          </h3>
          <p className="text-xs text-blue-100 mt-0.5">
            {isAdminView
              ? 'Enter administrator passkey to access question management.'
              : 'Sign in to access mock tests, practice questions, and track your performance.'}
          </p>
        </div>

        {/* Tab switcher: Only shown when opened in candidate flow */}
        {initialMode !== 'admin' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <button
              onClick={() => { setMode('login'); setError(null); setIsOperationNotAllowed(false); }}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                mode === 'login' ? 'border-blue-600 text-blue-600 bg-white font-bold' : 'border-transparent hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setIsOperationNotAllowed(false); }}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                mode === 'register' ? 'border-blue-600 text-blue-600 bg-white font-bold' : 'border-transparent hover:text-slate-900'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => { setMode('admin'); setError(null); setIsOperationNotAllowed(false); }}
              className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1 ${
                mode === 'admin' ? 'border-amber-500 text-amber-700 bg-white font-bold' : 'border-transparent hover:text-slate-900 text-slate-500'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Helpful Banner for auth/operation-not-allowed in candidate mode */}
          {isOperationNotAllowed && !isAdminView ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2.5 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="font-bold text-amber-900 text-xs">
                  Email/Password Not Enabled in Firebase
                </div>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You can continue immediately with <b>Google Sign-In</b> or <b>Instant Guest Practice</b>.
              </p>
              <button
                type="button"
                onClick={handleCandidateGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Continue with Google</span>
              </button>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          ) : null}

          {success && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* =================================================================== */}
          {/* ADMIN VERIFICATION MODE: EXCLUSIVELY ADMIN PASSKEY */}
          {/* =================================================================== */}
          {isAdminView ? (
            <div className="space-y-4">
              {/* Security Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center justify-between text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>{isChangingPasskey ? 'Update Master Passkey' : 'Administrator Verification'}</span>
                  </div>
                  {isCustomPasskeyActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-800 font-semibold">
                      Custom Key
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {isChangingPasskey
                    ? 'Enter your current passkey followed by your new passkey to update admin credentials.'
                    : 'Enter the secure administrator passkey to unlock question bank management and administrative tools.'}
                </p>
              </div>

              {isChangingPasskey ? (
                /* Change Passkey Form */
                <form onSubmit={handleChangePasskeySubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Admin Passkey
                    </label>
                    <input
                      type="password"
                      required
                      value={currentKeyInput}
                      onChange={(e) => setCurrentKeyInput(e.target.value)}
                      placeholder="Enter current passkey"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Admin Passkey
                    </label>
                    <div className="relative">
                      <input
                        type={showChangeNewKey ? 'text' : 'password'}
                        required
                        value={newKeyInput}
                        onChange={(e) => setNewKeyInput(e.target.value)}
                        placeholder="Enter new passkey (min. 5 chars)"
                        className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowChangeNewKey(!showChangeNewKey)}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showChangeNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Admin Passkey
                    </label>
                    <input
                      type={showChangeNewKey ? 'text' : 'password'}
                      required
                      value={confirmKeyInput}
                      onChange={(e) => setConfirmKeyInput(e.target.value)}
                      placeholder="Re-enter new passkey"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPasskey(false);
                        setError(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Passkey</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Passkey Authentication Form */
                <>
                  <form onSubmit={handleAdminPasskeySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Master Admin Passkey
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          autoFocus
                          value={adminPasskey}
                          onChange={(e) => setAdminPasskey(e.target.value)}
                          placeholder="Enter Admin Passkey..."
                          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 font-mono shadow-xs"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Confidential security passkey reserved for administrator.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Verify Passkey & Unlock Portal</span>
                    </button>
                  </form>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPasskey(true);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change Admin Passkey</span>
                    </button>
                  </div>
                </>
              )}

              {initialMode !== 'admin' && (
                <div className="pt-2 text-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    ← Candidate? Back to Candidate Sign In
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* =================================================================== */
            /* STANDARD CANDIDATE LOGIN / REGISTER / FORGOT */
            /* =================================================================== */
            <>
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCandidateGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-sm group"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* 1-Click Guest Candidate Practice Access */}
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                    <span>Instant Guest Practice (No Sign-In Required)</span>
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                      or with email / password
                    </span>
                  </div>
                </div>
              )}

              {/* Candidate Form */}
              <form onSubmit={handleCandidateSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aspirant@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md disabled:opacity-50"
                >
                  <span>
                    {submitting
                      ? 'Please wait...'
                      : mode === 'login'
                      ? 'Sign In'
                      : mode === 'register'
                      ? 'Create Account'
                      : 'Send Password Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Back to Candidate Sign In
                </button>
              ) : (
                <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Administrator?</span>
                  <button
                    type="button"
                    onClick={() => { setMode('admin'); setError(null); }}
                    className="text-amber-700 hover:text-amber-800 font-bold text-[11px] flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Admin Passkey Login →</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
