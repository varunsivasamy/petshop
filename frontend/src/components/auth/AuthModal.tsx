import React, { useState } from 'react';
import { api, User } from '../../services/api';
import { X, ShieldCheck, Mail, Lock, UserCheck, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SHOP_OWNER'>('CUSTOMER');
  const [verificationCode, setVerificationCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(customEmail || email, customPass || password);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.data?.detail || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });
      setSuccessInfo(
        `Registration complete! For testing, your verification code is: ${res.verification_code || '999999'}`
      );
      if (res.verification_code) {
        setVerificationCode(res.verification_code);
      }
      setMode('VERIFY');
    } catch (err: any) {
      setError(err.data?.email?.[0] || err.data?.detail || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.verify(email, verificationCode);
      // Fetch fresh profile
      const user = await api.getProfile();
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.data?.detail || err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {mode === 'LOGIN' && 'Sign In to PetShop'}
              {mode === 'REGISTER' && 'Create Your Account'}
              {mode === 'VERIFY' && 'Verify Real User Identity'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'LOGIN' && 'Access customer adoption or owner management'}
              {mode === 'REGISTER' && 'Join with real identity verification'}
              {mode === 'VERIFY' && 'Confirm your account with the verification code'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Logins for Showcase */}
        {mode === 'LOGIN' && (
          <div className="p-5 bg-indigo-50/50 border-b border-indigo-100/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-2 block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Instant Demo Roles:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'owner@petshop.com', 'owner123')}
                className="py-2 px-3 text-xs font-semibold bg-white text-indigo-950 border border-indigo-200 hover:border-indigo-400 rounded-xl shadow-xs transition-all text-left"
              >
                <span className="block font-bold text-indigo-700">Shop Owner</span>
                <span className="text-[10px] text-slate-500">Inventory & Orders</span>
              </button>
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'customer@example.com', 'customer123')}
                className="py-2 px-3 text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:border-slate-400 rounded-xl shadow-xs transition-all text-left"
              >
                <span className="block font-bold text-slate-800">Verified Customer</span>
                <span className="text-[10px] text-slate-500">Browse & Adopt</span>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {successInfo && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              {successInfo}
            </div>
          )}

          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In with JWT'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('REGISTER')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Create Account
                </button>
              </p>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sarah"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Jenkins"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      role === 'CUSTOMER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('SHOP_OWNER')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      role === 'SHOP_OWNER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Shop Owner
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating...' : 'Register Account'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {mode === 'VERIFY' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-2">
                <KeyRound className="w-8 h-8 text-indigo-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Real User Verification Code</h4>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit verification code to confirm you are a real user.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-widest font-mono text-xl py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {loading ? 'Verifying...' : 'Verify Real User & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="w-full text-center text-xs text-slate-500 hover:underline"
              >
                Return to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
