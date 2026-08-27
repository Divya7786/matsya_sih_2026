import React from 'react';
import { Compass, Satellite, Shield, ExternalLink, Globe, Waves, Anchor, BookOpen, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-[#E5E5E5] text-[#333333] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E5E5E5]">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center font-bold text-white shadow-xs">
                <Compass className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-[#111111] font-mono leading-none">
                  MATSYA AI
                </span>
                <span className="text-[10px] font-bold text-teal-800 uppercase font-sans mt-0.5">
                  Marine Intelligence Platform
                </span>
              </div>
            </div>
            
            <p className="text-xs text-[#555555] leading-relaxed max-w-sm">
              Marine Ecosystem Reasoning & Oceanographic Intelligence (SIH26176). 
              An autonomous intelligence ecosystem integrating ISRO satellite Earth Observation, 
              numerical ocean forecasting, and native multi-dialect voice AI for coastal fisheries and scientific research.
            </p>

            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#444444]">
                INSAT-3DR Telemetry
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#444444]">
                Oceansat-3 OCM-3
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#444444]">
                INCOIS PFZ & SWAN
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase font-mono text-[#111111] tracking-wider">
              Platform & Tools
            </h4>
            <ul className="space-y-1.5 text-xs text-[#555555]">
              <li>
                <button onClick={() => onNavigate('ocean')} className="hover:text-black hover:underline transition">
                  3D Global Ocean Explorer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-black hover:underline transition">
                  Potential Fishing Zones (PFZ)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-black hover:underline transition">
                  Safe Route Optimization
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('fisherman')} className="hover:text-black hover:underline transition">
                  Fisherman Field Console
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('operations-center')} className="hover:text-black hover:underline transition">
                  Operations Center (ISRO)
                </button>
              </li>
            </ul>
          </div>

          {/* Research & Data */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase font-mono text-[#111111] tracking-wider">
              Research & Science
            </h4>
            <ul className="space-y-1.5 text-xs text-[#555555]">
              <li>
                <button onClick={() => onNavigate('research')} className="hover:text-black hover:underline transition">
                  Research Papers Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('resources')} className="hover:text-black hover:underline transition">
                  Marine Data Explorer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('resources')} className="hover:text-black hover:underline transition">
                  Marine Glossary (25+ Terms)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('technology')} className="hover:text-black hover:underline transition">
                  Agentic AI Architecture
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('news')} className="hover:text-black hover:underline transition">
                  Latest Marine News & Bulletins
                </button>
              </li>
            </ul>
          </div>

          {/* Institutional & Legal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase font-mono text-[#111111] tracking-wider">
              Institutional
            </h4>
            <ul className="space-y-1.5 text-xs text-[#555555]">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-black hover:underline transition">
                  About the Mission
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-black hover:underline transition">
                  Partners & Agencies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('resources')} className="hover:text-black hover:underline transition">
                  APIs & Data Access
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-black hover:underline transition">
                  Contact & Support
                </button>
              </li>
              <li>
                <a href="#emergency" onClick={(e) => { e.preventDefault(); onNavigate('services'); }} className="text-rose-700 font-semibold hover:underline">
                  Emergency SAR 1554 Hotline
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Telemetry Status & Disclaimer */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#666666]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[#333333]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>ISRO SAC EO STREAM: LIVE</span>
            </span>
            <span className="text-[#CCCCCC]">|</span>
            <span>Version 2.4.0 (Build 2026.08)</span>
            <span className="text-[#CCCCCC]">|</span>
            <span>SIH Problem Statement: SIH26176</span>
          </div>

            <div className="text-right">
            <p>© 2026 MATSYA AI. Developed for Earth Observation & Coastal Community Safety.</p>
          </div>
        </div>

      </div>
    </footer>
  );
};
