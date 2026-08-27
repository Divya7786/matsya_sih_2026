import React from 'react';
import { X, Download, Check, Smartphone, QrCode } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  'Voice-first interaction',
  'Offline maps & navigation',
  'GPS-aware routing',
  'PFZ zone guidance',
  'Marine safety alerts',
  'Geofence boundary warnings',
  'Safe route guidance',
  'Regional language support (Tamil, Hindi, Telugu, Malayalam, Kannada)',
];

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mt-20 mb-10 overflow-hidden border border-[#E5E5E5]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111111]">MATSYA AI</h2>
              <p className="text-xs text-[#555555]">Fisherman Companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F0F0F0] transition"
          >
            <X className="w-4 h-4 text-[#555555]" />
          </button>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">Features</span>
          <ul className="space-y-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-[#222222]">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Download Section */}
        <div className="px-6 py-5 bg-[#F7F7F5] border-t border-[#E5E5E5] space-y-4">
          <button
            disabled
            className="w-full py-3 px-4 bg-[#111111] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 opacity-50 cursor-not-allowed"
          >
            <Download className="w-4.5 h-4.5" />
            <span>Download for Android</span>
          </button>
          <p className="text-center text-xs text-amber-700 font-medium">
            Android build coming soon
          </p>

          {/* QR Code Placeholder */}
          <div className="flex items-center justify-center">
            <div className="w-28 h-28 border-2 border-dashed border-[#CCCCCC] rounded-xl flex flex-col items-center justify-center gap-1.5 bg-white">
              <QrCode className="w-8 h-8 text-[#AAAAAA]" />
              <span className="text-[10px] text-[#999999] font-medium">QR Code</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-between">
          <span className="text-[11px] text-[#666666]">v2.0.0-beta &bull; Offline-first</span>
          <span className="text-[11px] text-[#888888]">Requires Android 8.0+ &amp; GPS</span>
        </div>
      </div>
    </div>
  );
};
