import React, { useEffect, useRef } from 'react';
import {
  Anchor,
  Satellite,
  Globe,
  Mic,
  ArrowRight,
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface CinematicOceanHeroProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (initialQuery?: string) => void;
  onOpenAuthModal: () => void;
}

const FALLBACK_FISHERMAN_IMG = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';
const FALLBACK_SCIENTIST_IMG = 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80';
const FALLBACK_PUBLIC_IMG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

export const CinematicOceanHero: React.FC<CinematicOceanHeroProps> = ({
  onNavigate,
  onOpenVoiceModal,
  onOpenAuthModal
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);


  return (
    <div 
      className="relative min-h-[92vh] flex flex-col justify-center border-b border-[#E5E5E5] overflow-hidden select-none bg-[#030d1a]"
    >
      {/* 1. Background Video Layer */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        style={{ backgroundColor: '#030d1a' }}
        src="/ocean-hero.mp4"
      />

      {/* 2. Dark overlay for readable text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/55 pointer-events-none z-[1]" />

      {/* 3. Hero Content Wrapper */}
      <div className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-16 w-full flex-1 flex flex-col justify-center">
        
        {/* Top Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8 sm:mb-10">
          
          {/* Mission & Project Name Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-bold tracking-wider uppercase shadow-xl">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 font-extrabold text-sm tracking-wide">MATSYA AI</span>
            <span className="text-white/40">|</span>
            <span className="text-neutral-300">SIH26176</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-white drop-shadow-md">
            Intelligent Ocean Insights for Every Decision.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto font-normal drop-shadow-sm">
            Connect satellite Earth Observation, oceanographic data, weather intelligence and collaborative AI agents to make safer and smarter marine decisions.
          </p>

          {/* Subtitle / Role Prompt */}
          <div className="pt-2">
            <h2 className="text-xs font-mono font-bold tracking-widest text-teal-300 uppercase drop-shadow-sm">
              WHO ARE YOU?
            </h2>
            <p className="text-xs text-white/75 mt-0.5">
              Choose your tailored operations experience
            </p>
          </div>
        </div>

        {/* THREE LARGE PROFESSIONAL ROLE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto w-full">
          
          {/* CARD 1 — FISHERMAN */}
          <div 
            onClick={() => {
              soundEffects.play('click');
              onNavigate('fisherman');
            }}
            className="group bg-white rounded-2xl border border-neutral-200 shadow-xl hover:shadow-2xl hover:border-teal-600 transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden cursor-pointer"
          >
            {/* Realistic Fisherman Photography */}
            <div className="relative h-48 sm:h-52 overflow-hidden bg-neutral-100">
              <img
                src="/src/assets/images/fisherman_indian_sea_1787401360042.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_FISHERMAN_IMG;
                }}
                alt="Indian Fisherman on coastal boat"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/50 text-[11px] font-mono font-bold text-teal-800">
                <Anchor className="w-3.5 h-3.5 text-teal-700" />
                <span>COASTAL COMMUNITY</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[11px] font-mono text-teal-200 block uppercase tracking-wider">Voice-First AI</span>
                <h3 className="text-xl font-bold text-white tracking-tight">FISHERMAN</h3>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold text-teal-700 uppercase">
                  "Safer seas. Smarter fishing."
                </p>
                <p className="text-sm text-[#333333] leading-relaxed">
                  Get fishing-zone intelligence, weather alerts, sea-state conditions, route guidance and marine safety information through AI voice assistance.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#111111] group-hover:text-teal-700 transition flex items-center gap-1.5">
                  <span>ENTER FISHERMAN MODE</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 font-mono text-neutral-600">
                  8 Languages
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2 — ISRO / MARINE SCIENTIST */}
          <div 
            onClick={() => {
              soundEffects.play('click');
              onOpenAuthModal();
            }}
            className="group bg-white rounded-2xl border border-neutral-200 shadow-xl hover:shadow-2xl hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden cursor-pointer"
          >
            {/* Realistic Scientist Photography */}
            <div className="relative h-48 sm:h-52 overflow-hidden bg-neutral-100">
              <img
                src="/src/assets/images/isro_marine_scientist_1787401383203.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_SCIENTIST_IMG;
                }}
                alt="ISRO Space and Marine Scientist in Operations Room"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/50 text-[11px] font-mono font-bold text-indigo-900">
                <Satellite className="w-3.5 h-3.5 text-indigo-700" />
                <span>ISRO / MoES OPERATIONS</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[11px] font-mono text-indigo-200 block uppercase tracking-wider">Mission Control</span>
                <h3 className="text-xl font-bold text-white tracking-tight">ISRO / MARINE SCIENTIST</h3>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold text-indigo-700 uppercase">
                  "Observe. Analyse. Reason."
                </p>
                <p className="text-sm text-[#333333] leading-relaxed">
                  Access satellite observations, oceanographic datasets, AI-assisted spatial analysis, anomaly detection, marine intelligence and explainable decision support.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#111111] group-hover:text-indigo-700 transition flex items-center gap-1.5">
                  <span>ENTER SCIENTIST WORKSPACE</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 font-mono text-indigo-700 font-bold">
                  Auth Required
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3 — PUBLIC / COASTAL USER */}
          <div 
            onClick={() => {
              soundEffects.play('click');
              onNavigate('ocean');
            }}
            className="group bg-white rounded-2xl border border-neutral-200 shadow-xl hover:shadow-2xl hover:border-sky-600 transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden cursor-pointer"
          >
            {/* Realistic Public Observer Photography */}
            <div className="relative h-48 sm:h-52 overflow-hidden bg-neutral-100">
              <img
                src="/src/assets/images/coastal_public_user_1787401399449.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_PUBLIC_IMG;
                }}
                alt="Coastal Citizen observing the Ocean"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/50 text-[11px] font-mono font-bold text-sky-900">
                <Globe className="w-3.5 h-3.5 text-sky-700" />
                <span>GLOBAL 3D GIS</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[11px] font-mono text-sky-200 block uppercase tracking-wider">Planetary Explorer</span>
                <h3 className="text-xl font-bold text-white tracking-tight">PUBLIC / COASTAL USER</h3>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold text-sky-700 uppercase">
                  "Understand your ocean."
                </p>
                <p className="text-sm text-[#333333] leading-relaxed">
                  Explore ocean conditions, marine weather, coastal hazards, current events, research and interactive global ocean data.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#111111] group-hover:text-sky-700 transition flex items-center gap-1.5">
                  <span>EXPLORE OCEAN</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 font-mono text-sky-700 font-bold">
                  Interactive 3D
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Direct Action Bar below Cards */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            id="hero-quick-ask-matsya-btn"
            onClick={() => {
              soundEffects.play('sonar');
              onOpenVoiceModal();
            }}
            className="px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-bold font-mono rounded-xl shadow-lg transition flex items-center gap-2 border border-white/20"
          >
            <Mic className="w-4 h-4 text-teal-400" />
            <span>MATSYA VOICE AI</span>
          </button>

          <button
            id="hero-quick-explore-btn"
            onClick={() => {
              soundEffects.play('nav');
              onNavigate('ocean');
            }}
            className="px-6 py-3 bg-white/95 hover:bg-white border border-neutral-300 text-[#111111] text-xs font-bold font-mono rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Globe className="w-4 h-4 text-teal-700" />
            <span>OPEN 3D GLOBE</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>

      </div>
    </div>
  );
};
