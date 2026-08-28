import React from 'react';
import {
  Anchor,
  Globe,
  Microscope,
  Download,
  Mic,
  Navigation,
  Wifi,
  Shield,
  Brain,
  Languages,
  ChevronRight,
  Waves,
  Satellite,
} from 'lucide-react';

interface LandingDashboardProps {
  onNavigate: (view: string) => void;
  onOpenDownloadModal: () => void;
}

export const LandingDashboard: React.FC<LandingDashboardProps> = ({ onNavigate, onOpenDownloadModal }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5]">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-white to-sky-50/40" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-6">
            <Satellite className="w-3.5 h-3.5" />
            SIH 2024 — Problem Statement 26176
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-[#111111] tracking-tight leading-tight">
            MATSYA AI
          </h1>
          <p className="mt-3 text-lg md:text-xl font-semibold text-[#333333]">
            Agentic Marine Intelligence Platform
          </p>
          <p className="mt-2 text-sm text-[#666666] tracking-wide">
            Ask. Analyze. Navigate. Decide.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenDownloadModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-white rounded-xl font-bold text-sm shadow-md hover:bg-black transition"
            >
              <Download className="w-4.5 h-4.5" />
              Download Fisherman App
            </button>
            <span className="text-xs text-[#888888]">Voice-first &bull; GPS-aware &bull; Offline-first</span>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-[#111111]">Choose Your Experience</h2>
          <p className="text-sm text-[#666666] mt-1">The same marine intelligence, tailored to your role</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fisherman Card */}
          <div className="group relative bg-white border border-[#E5E5E5] rounded-2xl p-8 hover:border-teal-300 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-5">
              <Anchor className="w-7 h-7 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-[#111111]">Fisherman</h3>
            <p className="text-sm text-[#555555] mt-1 leading-relaxed">
              Voice-first AI Marine Companion
            </p>
            <p className="text-xs text-[#888888] mt-1">Offline-first mobile experience</p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#444444]">
              <li className="flex items-center gap-2"><Mic className="w-3.5 h-3.5 text-teal-600" /> Voice interaction in regional languages</li>
              <li className="flex items-center gap-2"><Navigation className="w-3.5 h-3.5 text-teal-600" /> GPS navigation to fishing zones</li>
              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-teal-600" /> Proactive safety alerts</li>
            </ul>
            <button
              onClick={() => onNavigate('fisherman')}
              className="mt-6 w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              Open Fisherman Experience
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Public Card */}
          <div className="group relative bg-white border border-[#E5E5E5] rounded-2xl p-8 hover:border-sky-300 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-5">
              <Globe className="w-7 h-7 text-sky-700" />
            </div>
            <h3 className="text-lg font-bold text-[#111111]">Public</h3>
            <p className="text-sm text-[#555555] mt-1 leading-relaxed">
              Explore Marine Conditions
            </p>
            <p className="text-xs text-[#888888] mt-1">Simple map-based marine awareness</p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#444444]">
              <li className="flex items-center gap-2"><Waves className="w-3.5 h-3.5 text-sky-600" /> Ocean conditions & weather</li>
              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-sky-600" /> Marine alerts & cyclone info</li>
              <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-sky-600" /> PFZ & general marine data</li>
            </ul>
            <button
              onClick={() => onNavigate('ocean')}
              className="mt-6 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              Explore 3D Ocean Globe
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Researcher Card */}
          <div className="group relative bg-white border border-[#E5E5E5] rounded-2xl p-8 hover:border-violet-300 hover:shadow-lg transition-all">
            <div className="w-14 h-14 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center mb-5">
              <Microscope className="w-7 h-7 text-violet-700" />
            </div>
            <h3 className="text-lg font-bold text-[#111111]">ISRO / Researcher</h3>
            <p className="text-sm text-[#555555] mt-1 leading-relaxed">
              Marine Analytics & Intelligence
            </p>
            <p className="text-xs text-[#888888] mt-1">Advanced scientific analysis</p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#444444]">
              <li className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-violet-600" /> AI-powered anomaly detection</li>
              <li className="flex items-center gap-2"><Microscope className="w-3.5 h-3.5 text-violet-600" /> Historical trends & RAG evidence</li>
              <li className="flex items-center gap-2"><Satellite className="w-3.5 h-3.5 text-violet-600" /> Multi-sensor satellite layers</li>
            </ul>
            <button
              onClick={() => onNavigate('operations-center')}
              className="mt-6 w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              Open Research Dashboard
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="border-t border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-center text-sm font-bold text-[#555555] uppercase tracking-wider mb-8">
            Platform Capabilities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { icon: Brain, label: 'Multi-Agent AI', desc: 'Agentic orchestration' },
              { icon: Wifi, label: 'Real-time Data', desc: 'Live marine telemetry' },
              { icon: Navigation, label: 'GPS Navigation', desc: 'Safe route guidance' },
              { icon: Languages, label: 'Regional Languages', desc: '6 Indian languages' },
              { icon: Shield, label: 'Offline-first', desc: 'Works without internet' },
              { icon: Microscope, label: 'Evidence-based', desc: 'Transparent reasoning' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center">
                <div className="w-11 h-11 mx-auto rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center shadow-xs mb-2.5">
                  <Icon className="w-5 h-5 text-teal-700" />
                </div>
                <p className="text-xs font-bold text-[#111111]">{label}</p>
                <p className="text-[11px] text-[#777777] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#111111]">Built for Smart India Hackathon 2024</p>
            <p className="text-xs text-[#666666] mt-0.5">
              INCOIS + ISRO Collaborative Marine Advisory System — Problem Statement 26176
            </p>
          </div>
          <button
            onClick={onOpenDownloadModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#111111] text-[#111111] rounded-lg font-semibold text-xs hover:bg-[#111111] hover:text-white transition"
          >
            <Download className="w-4 h-4" />
            Get Fisherman App
          </button>
        </div>
      </section>
    </div>
  );
};
