import React from 'react';
import {
  Waves,
  Wind,
  Thermometer,
  AlertTriangle,
  Fish,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Droplets,
  Clock,
} from 'lucide-react';
import { MOCK_ADVISORIES } from '../data/mockMarineData';

interface PublicDashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: () => void;
}

export const PublicDashboardView: React.FC<PublicDashboardViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const conditions = [
    { label: 'Sea Surface Temperature', value: '28.4°C', icon: Thermometer, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Wave Height', value: '0.9 m', icon: Waves, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
    { label: 'Wind Speed', value: '14 km/h', icon: Wind, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
    { label: 'Chlorophyll-a', value: '2.6 mg/m³', icon: Droplets, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Marine Risk', value: 'LOW', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Fishing Suitability', value: 'FAVOURABLE', icon: Fish, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  ];

  const advisories = MOCK_ADVISORIES.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F0F0F0] transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#333333]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#111111]">Marine Conditions & Alerts</h1>
              <p className="text-xs text-[#666666]">Real-time ocean intelligence for the Indian coastline</p>
            </div>
          </div>
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white rounded-lg text-xs font-semibold hover:bg-black transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            Ask MATSYA AI
          </button>
        </div>

        {/* Marine Condition Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {conditions.map((c) => (
            <div
              key={c.label}
              className={`p-4 rounded-xl bg-white border border-[#E5E5E5] shadow-xs flex flex-col items-center text-center gap-2`}
            >
              <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.color} border ${c.border} flex items-center justify-center`}>
                <c.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666]">{c.label}</span>
              <span className={`text-lg font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>

        {/* Map Placeholder */}
        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-[#E5E5E5] shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-teal-50 to-blue-100 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Waves className="w-10 h-10 text-teal-400 mx-auto opacity-60" />
              <p className="text-sm font-semibold text-[#333333]">Interactive Marine Map</p>
              <p className="text-xs text-[#666666]">Explore ocean conditions across the Indian coastline</p>
            </div>
          </div>
        </div>

        {/* Marine Alerts */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Active Marine Advisories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {advisories.map((adv) => (
              <div
                key={adv.id}
                className={`p-4 rounded-xl border shadow-xs ${
                  adv.severity === 'WARNING'
                    ? 'bg-amber-50 border-amber-200'
                    : adv.severity === 'ALERT'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      adv.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : adv.severity === 'ALERT'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {adv.severity}
                  </span>
                  <span className="text-[10px] text-[#666666]">{adv.region}</span>
                </div>
                <h3 className="text-xs font-bold text-[#111111] mb-1">{adv.title}</h3>
                <p className="text-[11px] text-[#444444] line-clamp-3">{adv.message}</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#888888]">
                  <Clock className="w-3 h-3" />
                  <span>Valid: {adv.validThrough}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Freshness */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] shadow-xs">
          <div className="flex items-center gap-2 text-xs text-[#555555]">
            <Clock className="w-4 h-4 text-[#999999]" />
            <span>
              Data last updated: <strong className="text-[#111111]">{new Date().toLocaleTimeString()}</strong>
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            OPERATIONAL
          </span>
        </div>
      </div>
    </div>
  );
};
