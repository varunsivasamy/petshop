import React, { useState } from 'react';
import { api, User } from '../../services/api';
import { X, Mail, Lock, UserCheck, KeyRound, Sparkles, Store, Heart } from 'lucide-react';

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
      setError(err.data?.detail || err.message || 'Login failed. Please check your credentials.');
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
        `Account created! Please enter your 6-digit verification code: ${res.verification_code || '999999'}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {mode === 'LOGIN' && 'Welcome to PawHaven'}
              {mode === 'REGISTER' && 'Create Your Account'}
              {mode === 'VERIFY' && 'Verify Your Email'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'LOGIN' && 'Sign in to manage your adoptions or store'}
              {mode === 'REGISTER' && 'Join our caring community of pet lovers'}
              {mode === 'VERIFY' && 'Confirm your account to finish setup'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Account Switcher */}
        {mode === 'LOGIN' && (
          <div className="p-5 bg-rose-50/40 border-b border-rose-100/60">
            <span className="text-[11px] font-bold text-rose-900 mb-2.5 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Quick Demo Sign In:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'owner@petshop.com', 'owner123')}
                className="py-2.5 px-3.5 text-xs font-bold bg-white text-rose-950 border border-rose-200 hover:border-rose-400 rounded-2xl shadow-xs transition-all text-left flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="block font-bold text-slate-900">Store Owner</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Manage Shop</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'customer@example.com', 'customer123')}
                className="py-2.5 px-3.5 text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:border-slate-400 rounded-2xl shadow-xs transition-all text-left flex items-center gap-2"
              >
                <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="block font-bold text-slate-900">Adopter</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Adopt Pets</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {successInfo && (
            <div className="p-3 text-xs rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              {successInfo}
            </div>
          )}

          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-rose transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2 font-medium">
                New to PawHaven?{' '}
                <button
                  type="button"
                  onClick={() => setMode('REGISTER')}
                  className="font-bold text-rose-500 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sarah"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Jenkins"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-2.5 px-3.5 text-xs font-bold rounded-2xl border transition-all ${
                      role === 'CUSTOMER'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Pet Adopter
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('SHOP_OWNER')}
                    className={`py-2.5 px-3.5 text-xs font-bold rounded-2xl border transition-all ${
                      role === 'SHOP_OWNER'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Store Owner
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-rose transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2 font-medium">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="font-bold text-rose-500 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {mode === 'VERIFY' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-3xl text-center space-y-2">
                <KeyRound className="w-10 h-10 text-rose-500 mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-base">Enter Verification Code</h4>
                <p className="text-xs text-slate-400">
                  Please enter the 6-digit confirmation code sent to confirm your email.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest font-bold text-2xl py-3 rounded-2xl border border-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {loading ? 'Verifying...' : 'Confirm & Enter PawHaven'}
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="w-full text-center text-xs text-slate-400 hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
