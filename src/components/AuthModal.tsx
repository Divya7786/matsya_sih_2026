import React, { useState } from 'react';
import { X, Satellite, ShieldCheck, User, Lock, Mail, CheckCircle2, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { UserProfile, UserRole } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const PRESET_ROLES: UserProfile[] = [
  {
    id: 'user-isro-01',
    name: 'Dr. Vikramaditya Sharma',
    email: 'v.sharma@sac.isro.gov.in',
    role: 'ISRO_SCIENTIST',
    roleTitle: 'Chief Scientist (Earth Observation & Ocean Optics)',
    organization: 'ISRO Space Applications Centre (SAC)',
    badge: 'ISRO SAC Verified',
    clearanceLevel: 'SECRET',
    savedAnalysesCount: 14,
  },
  {
    id: 'user-moes-02',
    name: 'Dr. Radhika Sen',
    email: 'r.sen@incois.gov.in',
    role: 'MARINE_ANALYST',
    roleTitle: 'Senior Oceanographer & PFZ Advisory Lead',
    organization: 'INCOIS, Ministry of Earth Sciences',
    badge: 'INCOIS MoES Verified',
    clearanceLevel: 'CONFIDENTIAL',
    savedAnalysesCount: 9,
  },
  {
    id: 'user-icg-03',
    name: 'Cmdr. Arvind R. Nair',
    email: 'ops.palkbay@indiancoastguard.gov.in',
    role: 'COAST_GUARD',
    roleTitle: 'Regional Maritime SAR Operations Commander',
    organization: 'Indian Coast Guard (Eastern Seaboard)',
    badge: 'Coast Guard 1554',
    clearanceLevel: 'RESTRICTED',
    savedAnalysesCount: 6,
  },
  {
    id: 'user-fish-04',
    name: 'Murugan Selvam',
    email: 'murugan.selvam@kasimedu.tamilnadu.in',
    role: 'FISHERMAN',
    roleTitle: 'Master Seafarer & Coastal Craftsman (Kasimedu)',
    organization: 'Coromandel Coastal Fishermen Society',
    badge: 'Field Voice Pilot',
    clearanceLevel: 'PUBLIC',
    savedAnalysesCount: 4,
  },
  {
    id: 'user-public-05',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@iitb.ac.in',
    role: 'PUBLIC_RESEARCHER',
    roleTitle: 'Postdoctoral Fellow in Physical Oceanography',
    organization: 'Indian Institute of Technology (IIT)',
    badge: 'Academic Researcher',
    clearanceLevel: 'PUBLIC',
    savedAnalysesCount: 3,
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'preset'>('preset');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const customUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email: email || 'scientist@isro.gov.in',
        role: 'ISRO_SCIENTIST',
        roleTitle: 'Authorized Maritime Research Scientist',
        organization: 'ISRO Space Applications Centre',
        badge: 'Authorized Researcher',
        clearanceLevel: 'CONFIDENTIAL',
        savedAnalysesCount: 5,
      };
      onLoginSuccess(customUser);
      onClose();
    }, 600);
  };

  const handleSelectPreset = (preset: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(preset);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white border border-[#E5E5E5] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#111111] text-white p-5 flex items-start justify-between border-b border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Satellite className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight font-mono uppercase">
                MATSYA AI Platform
              </h3>
              <p className="text-xs text-neutral-300">
                Authorized Operations & Research Portal Access
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E5E5E5] bg-[#F7F7F5] p-1.5 gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 px-3 rounded-lg text-center transition ${
              activeTab === 'preset'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#666666] hover:text-black'
            }`}
          >
            Demo Stakeholder Profiles (1-Click)
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-2 px-3 rounded-lg text-center transition ${
              activeTab === 'credentials'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#666666] hover:text-black'
            }`}
          >
            Institutional SSO / Credentials
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'preset' ? (
            <div className="space-y-3">
              <p className="text-xs text-[#666666] leading-relaxed">
                Select a verified institutional stakeholder persona to test role-based capabilities, including the live ISRO Operations Center, INCOIS PFZ workbench, and Coast Guard boundary monitoring:
              </p>

              <div className="space-y-2">
                {PRESET_ROLES.map((roleItem) => (
                  <div
                    key={roleItem.id}
                    onClick={() => handleSelectPreset(roleItem)}
                    className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F5] hover:border-black transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#111111] group-hover:text-teal-900">
                          {roleItem.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#F7F7F5] text-teal-800 border border-teal-200">
                          {roleItem.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#555555] font-mono">{roleItem.roleTitle}</p>
                      <p className="text-[10px] text-[#888888]">{roleItem.organization}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        Sign In <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#111111]">
                  Official Email / Gov ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@isro.gov.in or scientist@moes.gov.in"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CCCCCC] rounded-lg focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#111111]">
                  Security Token / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CCCCCC] rounded-lg focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Authenticating with Central CAS...' : 'Access MATSYA Operations System'}
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E5E5]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono">
                  <span className="bg-white px-2 text-[#888888]">Federated Identity</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPreset(PRESET_ROLES[0])}
                className="w-full py-2 bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E5] text-[#111111] text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Satellite className="w-3.5 h-3.5 text-teal-600" />
                <span>Single Sign-On (ISRO Space Applications Centre CAS)</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-[#F7F7F5] px-6 py-3 border-t border-[#E5E5E5] text-[11px] text-[#666666] flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            256-Bit SSL Encrypted Maritime Data Gateway
          </span>
          <span className="font-mono text-[10px]">SIH26176</span>
        </div>
      </div>
    </div>
  );
};
