import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  ChevronDown, 
  Globe as GlobeIcon, 
  Mic, 
  LogIn, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Anchor, 
  Satellite, 
  Volume2, 
  VolumeX,
  Layers,
  Cpu,
  Waves,
  Activity,
  Award,
  BellRing
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/mockMarineData';
import { UserProfile } from '../types/auth';
import { soundEffects } from '../services/soundEffects';

interface HeaderNavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onOpenVoiceModal: (initialQuery?: string) => void;
  onOpenAuthModal: () => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentView,
  onNavigate,
  selectedLanguage,
  onSelectLanguage,
  onOpenVoiceModal,
  onOpenAuthModal,
  user,
  onLogout
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => soundEffects.isSoundEnabled());
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setIsLangMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownItemClick = (view: string) => {
    soundEffects.play('nav');
    onNavigate(view);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const navDropdowns = {
    ocean: {
      title: 'Ocean',
      items: [
        { label: '3D Global Ocean', desc: 'Interactive planetary WebGL Earth model', view: 'ocean' },
        { label: 'Multi-Variable Layers', desc: 'SST, Chlorophyll, Salinity & SWH', view: 'ocean' },
        { label: 'Regional Ocean Basins', desc: 'Bay of Bengal, Arabian Sea & Indian Ocean', view: 'ocean' },
        { label: 'Ocean Analytics', desc: 'Real-time telemetry and station inspectors', view: 'ocean' },
      ]
    },
    services: {
      title: 'Services',
      items: [
        { label: 'Marine Intelligence', desc: 'Autonomous ocean reasoning & advisories', view: 'services' },
        { label: 'Potential Fishing Zones', desc: 'INCOIS & Oceansat-3 chlorophyll match', view: 'services' },
        { label: 'Marine Safety & Swells', desc: 'Wave hazard indexes & vessel safety', view: 'services' },
        { label: 'Weather Intelligence', desc: 'Monsoon squall tracking & wind vectors', view: 'services' },
        { label: 'Route Optimization', desc: 'Safe waypoint corridors avoiding reefs', view: 'services' },
        { label: 'Geospatial Intelligence', desc: 'IMBL and marine sanctuary geofences', view: 'services' },
        { label: 'Fisherman Assistance', desc: 'Voice-first multi-dialect field mode', view: 'fisherman' },
      ]
    },
    technology: {
      title: 'Technology',
      items: [
        { label: 'Agentic AI Architecture', desc: '10 collaborative marine reasoning agents', view: 'technology' },
        { label: 'Earth Observation Data', desc: 'INSAT-3DR & Oceansat-3 ingestion', view: 'technology' },
        { label: 'Geospatial AI', desc: 'Spatial-temporal anomaly detection algorithms', view: 'technology' },
        { label: 'Voice AI & Multilingual NLP', desc: 'Regional speech models with zero latency', view: 'technology' },
        { label: 'Explainable AI', desc: 'Evidence fusion matrices and citing', view: 'technology' },
      ]
    },
    research: {
      title: 'Research',
      items: [
        { label: 'Research Papers', desc: 'Peer-reviewed studies and demonstration records', view: 'research' },
        { label: 'Ocean Climate Studies', desc: 'Thermal anomalies and decadal warming', view: 'research' },
        { label: 'Fisheries Research', desc: 'Biomass migrations and artisanal catch trends', view: 'research' },
        { label: 'Publications & Datasets', desc: 'Open scientific publications directory', view: 'research' },
      ]
    },
    resources: {
      title: 'Resources',
      items: [
        { label: 'Marine Data Explorer', desc: 'Browse all satellite rasters & models', view: 'resources' },
        { label: 'Marine Glossary', desc: 'Scientific oceanographic definitions', view: 'resources' },
        { label: 'API & Data Access', desc: 'Developer documentation and integration', view: 'resources' },
        { label: 'Marine Advisories & Reports', desc: 'Official bulletins and PDF dossiers', view: 'resources' },
        { label: 'Learning Center & FAQs', desc: 'Frequently asked questions and guides', view: 'resources' },
      ]
    },
    about: {
      title: 'About',
      items: [
        { label: 'About MATSYA AI', desc: 'Mission, vision and scientific foundation', view: 'about' },
        { label: 'Our Approach', desc: 'Bridging space science and human livelihoods', view: 'about' },
        { label: 'Institutional Partners', desc: 'ISRO SAC, INCOIS, Coast Guard & MoES', view: 'about' },
        { label: 'Impact & Metrics', desc: 'Safety outcomes, fuel savings and outreach', view: 'about' },
        { label: 'Contact & Collaboration', desc: 'Inquiries and institutional access', view: 'about' },
      ]
    }
  };

  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] shadow-xs" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Project Identity Area - Cleanly Aligned */}
        <div 
          id="matsya-brand-header-logo"
          onClick={() => {
            soundEffects.play('nav');
            onNavigate('home');
          }}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          {/* Centered Icon */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#111111] rounded-xl flex items-center justify-center font-bold text-white shadow-xs group-hover:bg-black transition-colors shrink-0">
            <Compass className="w-5 h-5 text-teal-400" />
          </div>

          {/* Clean Aligned Branding Hierarchy */}
          <div className="flex flex-col justify-center">
            {/* Primary Project Name & SIH Badge */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#111111] font-mono leading-none">
                MATSYA AI
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#F7F7F5] text-[#555555] border border-[#E5E5E5] leading-none">
                SIH26176
              </span>
            </div>

            {/* Platform Brand Identity & Clean Subtitle */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 uppercase tracking-tight font-sans leading-none">
                Marine Intelligence Platform
              </span>
              <span className="text-[10px] text-[#999999] hidden 2xl:inline leading-none">•</span>
              <p className="text-[10px] text-[#666666] tracking-tight hidden 2xl:inline leading-none font-normal">
                Earth Observation & Ocean Ecosystem Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center Main Desktop Navigation with Dropdowns */}
        <nav className="hidden xl:flex items-center gap-1 text-xs">
          <button
            id="nav-link-home"
            onClick={() => {
              soundEffects.play('nav');
              onNavigate('home');
            }}
            className={`px-3 py-2 rounded-md font-semibold transition ${
              currentView === 'home' 
                ? 'text-[#111111] bg-[#F7F7F5]' 
                : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
            }`}
          >
            Home
          </button>

          {/* Ocean Dropdown */}
          <div className="relative">
            <button
              id="nav-dropdown-ocean"
              onClick={() => {
                soundEffects.play('click');
                setActiveDropdown(activeDropdown === 'ocean' ? null : 'ocean');
              }}
              className={`px-3 py-2 rounded-md font-semibold flex items-center gap-1 transition ${
                currentView === 'ocean' 
                  ? 'text-[#111111] bg-[#F7F7F5]' 
                  : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
              }`}
            >
              <span>Ocean</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#777777] transition-transform ${activeDropdown === 'ocean' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'ocean' && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#888888] tracking-wider border-b border-[#E5E5E5] mb-1">
                  Global Earth GIS
                </div>
                {navDropdowns.ocean.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.view)}
                    className="p-2.5 rounded-lg hover:bg-[#F7F7F5] cursor-pointer transition flex flex-col"
                  >
                    <span className="font-bold text-xs text-[#111111]">{item.label}</span>
                    <span className="text-[11px] text-[#666666] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services Dropdown */}
          <div className="relative">
            <button
              id="nav-dropdown-services"
              onClick={() => {
                soundEffects.play('click');
                setActiveDropdown(activeDropdown === 'services' ? null : 'services');
              }}
              className={`px-3 py-2 rounded-md font-semibold flex items-center gap-1 transition ${
                currentView === 'services' 
                  ? 'text-[#111111] bg-[#F7F7F5]' 
                  : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
              }`}
            >
              <span>Services</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#777777] transition-transform ${activeDropdown === 'services' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'services' && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#888888] tracking-wider border-b border-[#E5E5E5] mb-1">
                  Operational Marine Solutions
                </div>
                {navDropdowns.services.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.view)}
                    className="p-2.5 rounded-lg hover:bg-[#F7F7F5] cursor-pointer transition flex flex-col"
                  >
                    <span className="font-bold text-xs text-[#111111]">{item.label}</span>
                    <span className="text-[11px] text-[#666666] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technology Dropdown */}
          <div className="relative">
            <button
              id="nav-dropdown-technology"
              onClick={() => {
                soundEffects.play('click');
                setActiveDropdown(activeDropdown === 'technology' ? null : 'technology');
              }}
              className={`px-3 py-2 rounded-md font-semibold flex items-center gap-1 transition ${
                currentView === 'technology' 
                  ? 'text-[#111111] bg-[#F7F7F5]' 
                  : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
              }`}
            >
              <span>Technology</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#777777] transition-transform ${activeDropdown === 'technology' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'technology' && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#888888] tracking-wider border-b border-[#E5E5E5] mb-1">
                  Architecture & Agentic AI
                </div>
                {navDropdowns.technology.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.view)}
                    className="p-2.5 rounded-lg hover:bg-[#F7F7F5] cursor-pointer transition flex flex-col"
                  >
                    <span className="font-bold text-xs text-[#111111]">{item.label}</span>
                    <span className="text-[11px] text-[#666666] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Dropdown */}
          <div className="relative">
            <button
              id="nav-dropdown-research"
              onClick={() => {
                soundEffects.play('click');
                setActiveDropdown(activeDropdown === 'research' ? null : 'research');
              }}
              className={`px-3 py-2 rounded-md font-semibold flex items-center gap-1 transition ${
                currentView === 'research' 
                  ? 'text-[#111111] bg-[#F7F7F5]' 
                  : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
              }`}
            >
              <span>Research</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#777777] transition-transform ${activeDropdown === 'research' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'research' && (
              <div className="absolute top-full left-0 mt-1.5 w-76 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#888888] tracking-wider border-b border-[#E5E5E5] mb-1">
                  Scientific Knowledge
                </div>
                {navDropdowns.research.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.view)}
                    className="p-2.5 rounded-lg hover:bg-[#F7F7F5] cursor-pointer transition flex flex-col"
                  >
                    <span className="font-bold text-xs text-[#111111]">{item.label}</span>
                    <span className="text-[11px] text-[#666666] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* News Nav */}
          <button
            id="nav-link-news"
            onClick={() => {
              soundEffects.play('nav');
              onNavigate('news');
            }}
            className={`px-3 py-2 rounded-md font-semibold transition ${
              currentView === 'news' 
                ? 'text-[#111111] bg-[#F7F7F5]' 
                : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
            }`}
          >
            News
          </button>

          {/* Resources Dropdown */}
          <div className="relative">
            <button
              id="nav-dropdown-resources"
              onClick={() => {
                soundEffects.play('click');
                setActiveDropdown(activeDropdown === 'resources' ? null : 'resources');
              }}
              className={`px-3 py-2 rounded-md font-semibold flex items-center gap-1 transition ${
                currentView === 'resources' 
                  ? 'text-[#111111] bg-[#F7F7F5]' 
                  : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
              }`}
            >
              <span>Resources</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#777777] transition-transform ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'resources' && (
              <div className="absolute top-full left-0 mt-1.5 w-76 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#888888] tracking-wider border-b border-[#E5E5E5] mb-1">
                  Data & Documentation
                </div>
                {navDropdowns.resources.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.view)}
                    className="p-2.5 rounded-lg hover:bg-[#F7F7F5] cursor-pointer transition flex flex-col"
                  >
                    <span className="font-bold text-xs text-[#111111]">{item.label}</span>
                    <span className="text-[11px] text-[#666666] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Dropdown */}
          <div className="relative">
            <button
              id="nav-dropdown-about"
              onClick={() => {
                soundEffects.play('click');
                setActiveDropdown(activeDropdown === 'about' ? null : 'about');
              }}
              className={`px-3 py-2 rounded-md font-semibold flex items-center gap-1 transition ${
                currentView === 'about' 
                  ? 'text-[#111111] bg-[#F7F7F5]' 
                  : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F7F5]'
              }`}
            >
              <span>About</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#777777] transition-transform ${activeDropdown === 'about' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'about' && (
              <div className="absolute top-full right-0 mt-1.5 w-76 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold text-[#888888] tracking-wider border-b border-[#E5E5E5] mb-1">
                  Institutional Background
                </div>
                {navDropdowns.about.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.view)}
                    className="p-2.5 rounded-lg hover:bg-[#F7F7F5] cursor-pointer transition flex flex-col"
                  >
                    <span className="font-bold text-xs text-[#111111]">{item.label}</span>
                    <span className="text-[11px] text-[#666666] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions: Sound-Effect Control, Language, Ask MATSYA, Login / Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* UI Sound Effects Toggle (Completely separate from background video) */}
          <button
            id="header-ui-sound-effects-toggle"
            onClick={() => {
              const next = soundEffects.toggleSound();
              setIsSoundOn(next);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              isSoundOn 
                ? 'bg-teal-50 hover:bg-teal-100/80 border-teal-200 text-teal-900' 
                : 'bg-[#F7F7F5] hover:bg-[#EFEFEA] border-[#E5E5E5] text-[#777777]'
            }`}
            title={isSoundOn ? "Website Sound Effects: ON" : "Website Sound Effects: OFF"}
            aria-label="Website Sound Effects Control"
          >
            {isSoundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#888888]" />
            )}
            <span className="hidden sm:inline text-[11px] font-mono font-medium">
              {isSoundOn ? 'SFX ON' : 'SFX OFF'}
            </span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              id="header-lang-btn"
              onClick={() => {
                soundEffects.play('click');
                setIsLangMenuOpen(!isLangMenuOpen);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E5] text-xs font-semibold text-[#111111] flex items-center gap-1.5 transition"
              title="Change Language"
            >
              <GlobeIcon className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">{selectedLangObj.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-[#777777]" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-48 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-1.5 z-50 animate-in fade-in">
                <div className="px-3 py-1 text-[10px] font-mono font-bold text-[#888888] uppercase border-b border-[#E5E5E5] mb-1">
                  Select Language (மொழி)
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      soundEffects.play('click');
                      onSelectLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs rounded-lg flex items-center justify-between transition ${
                      selectedLanguage === lang.code
                        ? 'bg-[#111111] text-white font-bold'
                        : 'text-[#333333] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] font-mono opacity-80">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MATSYA Voice AI Trigger */}
          <button
            id="header-ask-matsya-voice-btn"
            onClick={() => {
              soundEffects.play('sonar');
              onOpenVoiceModal();
            }}
            className="px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition active:scale-95 border border-black"
          >
            <Mic className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span className="hidden md:inline">Voice AI</span>
          </button>

          {/* Authentication Action or Profile Badge */}
          {user ? (
            <div className="relative">
              <button
                id="header-user-profile-btn"
                onClick={() => {
                  soundEffects.play('click');
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] hover:bg-[#EFEFEA] transition"
              >
                <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-xs font-bold text-[#111111] block leading-none">{user.name}</span>
                  <span className="text-[9px] font-mono text-teal-700 font-semibold">{user.organization}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#777777]" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-white rounded-xl border border-[#E5E5E5] shadow-xl p-3 z-50 space-y-3 animate-in fade-in">
                  <div className="pb-2 border-b border-[#E5E5E5]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#111111]">{user.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {user.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#666666] block truncate">{user.email}</span>
                    <span className="text-[10px] text-[#888888] font-mono block mt-0.5">{user.roleTitle}</span>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        soundEffects.play('nav');
                        onNavigate('operations-center');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold rounded-lg bg-[#F7F7F5] hover:bg-[#111111] hover:text-white transition flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Satellite className="w-3.5 h-3.5 text-teal-600" />
                        <span>Operations Center</span>
                      </span>
                      <span className="text-[10px] font-mono">LIVE</span>
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.play('nav');
                        onNavigate('fisherman');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs rounded-lg text-[#333333] hover:bg-[#F7F7F5] transition flex items-center gap-2"
                    >
                      <Anchor className="w-3.5 h-3.5 text-[#555555]" />
                      <span>Fisherman Mode</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#E5E5E5]">
                    <button
                      onClick={() => {
                        soundEffects.play('click');
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="header-login-btn"
                onClick={() => {
                  soundEffects.play('modal');
                  onOpenAuthModal();
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#111111] hover:bg-[#F7F7F5] transition border border-[#E5E5E5] flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-[#555555]" />
                <span>Login</span>
              </button>

              <button
                id="header-isro-signin-btn"
                onClick={() => {
                  soundEffects.play('modal');
                  onOpenAuthModal();
                }}
                className="hidden sm:flex px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#111111] text-white hover:bg-black transition shadow-xs items-center gap-1.5"
              >
                <Satellite className="w-3.5 h-3.5 text-teal-400" />
                <span>ISRO Sign In</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => {
              soundEffects.play('click');
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="xl:hidden p-2 rounded-lg text-[#111111] hover:bg-[#F7F7F5] border border-[#E5E5E5] transition"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-[#E5E5E5] px-4 py-4 space-y-3 shadow-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDropdownItemClick('home')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'home' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              Home Overview
            </button>
            <button
              onClick={() => handleDropdownItemClick('ocean')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'ocean' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              3D Ocean Explorer
            </button>
            <button
              onClick={() => handleDropdownItemClick('services')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'services' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              Marine Services
            </button>
            <button
              onClick={() => handleDropdownItemClick('technology')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'technology' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              Technology & AI
            </button>
            <button
              onClick={() => handleDropdownItemClick('research')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'research' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              Research Papers
            </button>
            <button
              onClick={() => handleDropdownItemClick('news')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'news' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              Marine News
            </button>
            <button
              onClick={() => handleDropdownItemClick('resources')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'resources' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              Data & Resources
            </button>
            <button
              onClick={() => handleDropdownItemClick('about')}
              className={`p-2.5 rounded-lg text-left font-bold ${currentView === 'about' ? 'bg-[#111111] text-white' : 'bg-[#F7F7F5] text-[#111111]'}`}
            >
              About MATSYA AI
            </button>
          </div>

          <div className="pt-2 border-t border-[#E5E5E5] space-y-2">
            <button
              onClick={() => handleDropdownItemClick('fisherman')}
              className="w-full py-2.5 px-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Anchor className="w-4 h-4 text-teal-700" />
              <span>Enter Fisherman Field Mode</span>
            </button>

            <button
              onClick={() => {
                if (user) {
                  handleDropdownItemClick('operations');
                } else {
                  setIsMobileMenuOpen(false);
                  onOpenAuthModal();
                }
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-[#111111] text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Satellite className="w-4 h-4 text-teal-400" />
              <span>{user ? 'Open Operations Center' : 'ISRO / Research Sign In'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
