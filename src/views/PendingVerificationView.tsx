import React, { useState } from 'react';
import { Clock, CheckCircle2, LogOut, RefreshCw, Satellite, Mail, ArrowRight } from 'lucide-react';

interface PendingVerificationViewProps {
  onLogout: () => void;
  onNavigate: (view: string) => void;
  onCheckStatus?: () => Promise<void>;
}

export const PendingVerificationView: React.FC<PendingVerificationViewProps> = ({
  onLogout,
  onNavigate,
  onCheckStatus,
}) => {
  const [checking, setChecking] = useState(false);
  const [stillPending, setStillPending] = useState(false);

  const handleCheck = async () => {
    if (!onCheckStatus) return;
    setChecking(true);
    setStillPending(false);
    try {
      await onCheckStatus();
      // If still here after check, still pending
      setStillPending(true);
      setTimeout(() => setStillPending(false), 4000);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-8 text-center space-y-5">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-xl font-black text-[#111111]">Account Pending Verification</h1>
            <p className="text-sm text-[#666666] mt-2">
              Your registration was submitted successfully. An ISRO/MoES administrator will review your
              account before you can access the Operations Center.
            </p>
          </div>

          {/* Steps */}
          <div className="bg-[#F7F7F5] rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-[#333333]">Registration submitted successfully</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </div>
              <span className="text-xs text-[#333333] font-medium">Awaiting admin verification — typically within 1–2 business days</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-40">
              <div className="w-4 h-4 rounded-full border-2 border-[#CCCCCC] shrink-0" />
              <span className="text-xs text-[#666666]">Access to ISRO Operations Center granted</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
            <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Contact your supervisor or ISRO system admin if you need expedited access.
            </p>
          </div>

          {/* Check Status */}
          {stillPending ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-amber-700 font-medium">
              <Clock className="w-4 h-4" />
              Still pending — check back soon
            </div>
          ) : (
            <button
              onClick={handleCheck}
              disabled={checking || !onCheckStatus}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Check Verification Status
                </>
              )}
            </button>
          )}

          {/* Nav actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 py-2 bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E5] text-[#111111] text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              Back to Home
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={onLogout}
              className="flex-1 py-2 bg-white hover:bg-[#F7F7F5] border border-[#E5E5E5] text-[#666666] text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
          <Satellite className="w-3.5 h-3.5 text-[#666666]" />
          <span className="text-[10px] text-[#666666] font-mono">MATSYA AI — ISRO Marine Intelligence Platform</span>
        </div>
      </div>
    </div>
  );
};
