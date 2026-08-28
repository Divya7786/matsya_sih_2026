import React, { useState } from 'react';
import { Satellite, Mail, Lock, ArrowRight, AlertCircle, Anchor } from 'lucide-react';
import { apiLogin, storeToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onNavigate: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiLogin(email.trim().toLowerCase(), password);
      storeToken(token);
      onLoginSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#111111] rounded-2xl mb-4">
            <Satellite className="w-7 h-7 text-teal-400" />
          </div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">MATSYA AI</h1>
          <p className="text-sm text-[#666666] mt-1">ISRO Operations & Research Portal</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8">
          <h2 className="text-base font-bold text-[#111111] mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@isro.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-[#888888] mt-4">
            No account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-teal-700 font-semibold hover:underline"
            >
              Create one
            </button>
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E5E5]" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-white px-2 text-[#888888]">or try demo profiles</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('auth-demo')}
            className="w-full py-2 bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E5] text-[#111111] text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Anchor className="w-3.5 h-3.5 text-teal-600" />
            Use Demo Stakeholder Profile (1-Click)
          </button>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="w-full text-center mt-4 text-xs text-[#888888] hover:text-[#333333] transition"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};
