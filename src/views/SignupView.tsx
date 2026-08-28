import React, { useState } from 'react';
import { Satellite, Mail, Lock, User, Building, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiSignup, storeToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';

interface SignupViewProps {
  onSignupSuccess: (user: AuthUser, token: string) => void;
  onNavigate: (view: string) => void;
}

const ROLES = [
  { value: 'ISRO_SCIENTIST', label: 'ISRO Scientist' },
  { value: 'MARINE_ANALYST', label: 'Marine Analyst / INCOIS' },
  { value: 'COAST_GUARD', label: 'Coast Guard' },
  { value: 'PUBLIC_RESEARCHER', label: 'Academic Researcher' },
  { value: 'FISHERMAN', label: 'Fisherman / Field Operator' },
];

export const SignupView: React.FC<SignupViewProps> = ({ onSignupSuccess, onNavigate }) => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    organization: '',
    designation: '',
    role: 'PUBLIC_RESEARCHER',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { token, user } = await apiSignup({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim(),
        organization: form.organization.trim(),
        designation: form.designation.trim(),
        role: form.role,
      });
      storeToken(token);
      onSignupSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#111111] rounded-2xl mb-4">
            <Satellite className="w-7 h-7 text-teal-400" />
          </div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">MATSYA AI</h1>
          <p className="text-sm text-[#666666] mt-1">Create your research account</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8">
          <h2 className="text-base font-bold text-[#111111] mb-6">Register for access</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input required value={form.full_name} onChange={set('full_name')}
                  placeholder="Dr. Priya Krishnan"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Official Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input type="email" required value={form.email} onChange={set('email')}
                  placeholder="name@isro.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Organization</label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input value={form.organization} onChange={set('organization')}
                  placeholder="ISRO Space Applications Centre"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Designation</label>
              <input value={form.designation} onChange={set('designation')}
                placeholder="Senior Research Scientist"
                className="w-full px-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Role</label>
              <select value={form.role} onChange={set('role')}
                className="w-full px-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600 bg-white">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input type="password" required value={form.password} onChange={set('password')}
                  placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input type="password" required value={form.confirm} onChange={set('confirm')}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#CCCCCC] rounded-lg focus:outline-none focus:border-teal-600" />
                {form.confirm && form.password === form.confirm && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-2.5" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-[#888888] mt-4">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="text-teal-700 font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>

        <button onClick={() => onNavigate('home')} className="w-full text-center mt-4 text-xs text-[#888888] hover:text-[#333333] transition">
          ← Back to Home
        </button>
      </div>
    </div>
  );
};
