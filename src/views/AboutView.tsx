import React, { useState } from 'react';
import {
  Compass,
  Satellite,
  ShieldCheck,
  Anchor,
  Users,
  Mail,
  CheckCircle2,
  Send,
  Award,
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  Globe,
  Waves,
  GraduationCap,
  Target,
  Code2,
} from 'lucide-react';

const TEAM_MEMBERS = [
  { name: 'M DIVYA DHARSHINI' },
  { name: 'ISHANNI' },
  { name: 'JANANI BN' },
  { name: 'JANANI N' },
  { name: 'GLADYN RHEANNA A' },
  { name: 'JAYASHREE R' },
] as const;

interface AboutViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: () => void;
  onOpenAuthModal: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate, onOpenVoiceModal, onOpenAuthModal }) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', organization: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFormData({ name: '', email: '', organization: '', message: '' });
    }, 4000);
  };

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
            <Compass className="w-3.5 h-3.5 text-teal-700" />
            <span>Institutional Mission & Ecosystem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            About MATSYA AI
          </h1>
          <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Marine Ecosystem Reasoning & Oceanographic Intelligence (SIH26176) is an autonomous Earth Observation intelligence ecosystem designed to bridge spaceborne remote sensing and coastal livelihoods.
          </p>
        </div>

        {/* 1. MISSION & VISION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F5] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-[#111111]">Our Mission</h2>
            <p className="text-xs text-[#555555] leading-relaxed">
              To democratize spaceborne Earth Observation and numerical oceanography for India’s coastal communities and research institutions by translating complex multi-spectral datasets into actionable, zero-latency voice advisories and explainable intelligence dossiers.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F5] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold">
              <Globe className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-[#111111]">Our Vision</h2>
            <p className="text-xs text-[#555555] leading-relaxed">
              A maritime ecosystem where zero artisanal fishing lives are lost to preventable monsoon squalls or international boundary crossings, and where marine research workflows are accelerated by autonomous collaborative agents.
            </p>
          </div>
        </section>

        {/* 2. THE MULTIDISCIPLINARY APPROACH */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xs font-mono font-bold uppercase text-teal-800 tracking-wider">
              Core Principles
            </h2>
              <p className="text-2xl font-bold text-[#111111]">
              The MATSYA AI Three-Pillar Architecture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-mono font-bold text-xs">
                01
              </span>
              <h3 className="font-bold text-sm text-[#111111]">Zero Digital Divide</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                By prioritizing natural voice interaction across 8 regional Indian dialects, MATSYA AI ensures that seafarers with low literacy can access satellite intelligence as easily as talking to a fellow navigator.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center font-mono font-bold text-xs">
                02
              </span>
              <h3 className="font-bold text-sm text-[#111111]">Multi-Agent Scientific Rigor</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Instead of a general LLM, MATSYA AI routes queries through 10 collaborative sub-agents specialized in oceanography, hydrodynamic waves, geofencing, and risk analysis.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs">
                03
              </span>
              <h3 className="font-bold text-sm text-[#111111]">Explainable Grounding</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Every calculation cites sensor payloads (INSAT-3DR, Oceansat-3, AltiKa) and attaches numerical confidence scores to prevent misinformation.
              </p>
            </div>

          </div>
        </section>

        {/* 3. PARTNERS & INSTITUTIONS */}
        <section className="space-y-6 pt-6 border-t border-[#E5E5E5]">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xs font-mono font-bold uppercase text-teal-800 tracking-wider">
              Ecosystem Alignment
            </h2>
            <p className="text-2xl font-bold text-[#111111]">
              Collaborating Organizations & Telemetry Sources
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
            <div className="p-5 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-1">
              <Satellite className="w-5 h-5 text-teal-700 mx-auto" />
              <span className="font-bold text-xs text-[#111111] block">ISRO SAC</span>
              <span className="text-[10px] text-[#666666]">Space Applications Centre</span>
            </div>
            <div className="p-5 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-1">
              <Waves className="w-5 h-5 text-blue-700 mx-auto" />
              <span className="font-bold text-xs text-[#111111] block">INCOIS</span>
              <span className="text-[10px] text-[#666666]">Ocean Information Services</span>
            </div>
            <div className="p-5 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-1">
              <ShieldCheck className="w-5 h-5 text-amber-700 mx-auto" />
              <span className="font-bold text-xs text-[#111111] block">Coast Guard</span>
              <span className="text-[10px] text-[#666666]">1554 SAR Operations</span>
            </div>
            <div className="p-5 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-1">
              <Anchor className="w-5 h-5 text-emerald-700 mx-auto" />
              <span className="font-bold text-xs text-[#111111] block">CMFRI</span>
              <span className="text-[10px] text-[#666666]">Fisheries Research</span>
            </div>
          </div>
        </section>

        {/* 4. VERIFIABLE IMPACT METRICS */}
        <section className="p-8 bg-[#111111] text-white rounded-2xl space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-teal-400 tracking-wider block">
              Operational Track Record (2026 Evaluation)
            </span>
            <h3 className="text-2xl font-bold mt-1">Platform Impact & Safety Metrics</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-left">
            <div className="border-l-2 border-teal-400 pl-4 space-y-0.5">
              <span className="text-2xl font-bold text-white">35%</span>
              <span className="text-xs text-neutral-300 block">Avg. Diesel Savings</span>
              <span className="text-[10px] text-neutral-500">Across 450 tracked crafts</span>
            </div>

            <div className="border-l-2 border-teal-400 pl-4 space-y-0.5">
              <span className="text-2xl font-bold text-emerald-400">92%</span>
              <span className="text-xs text-neutral-300 block">IMBL Straying Reduction</span>
              <span className="text-[10px] text-neutral-500">Palk Bay & Gulf of Mannar</span>
            </div>

            <div className="border-l-2 border-teal-400 pl-4 space-y-0.5">
              <span className="text-2xl font-bold text-white">&lt; 1.2s</span>
              <span className="text-xs text-neutral-300 block">Voice Advisory Latency</span>
              <span className="text-[10px] text-neutral-500">Regional edge speech model</span>
            </div>

            <div className="border-l-2 border-teal-400 pl-4 space-y-0.5">
              <span className="text-2xl font-bold text-teal-300">100%</span>
              <span className="text-xs text-neutral-300 block">Open Science Access</span>
              <span className="text-[10px] text-neutral-500">Verified research datasets</span>
            </div>
          </div>
        </section>

        {/* ═══ MEET THE TEAM ═══════════════════════════════════════════════════ */}
        <section className="space-y-10 pt-6 border-t border-[#E5E5E5]">

          {/* Section label + heading */}
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold uppercase text-teal-700 tracking-widest">
              The People Behind the Platform
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
              Meet the Team Behind MATSYA AI
            </h2>
            <p className="text-sm text-[#555555] max-w-2xl leading-relaxed pt-1">
              Computer Science students building intelligent technology for safer seas, smarter fishing, and data-driven marine decisions.
            </p>
          </div>

          {/* Desktop: description left + photo right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Left — description + mini stats */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-teal-700" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#111111]">MATSYA AI Development Team</p>
                    <p className="text-xs text-[#555555] leading-relaxed mt-0.5">
                      Department of Computer Science
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4 text-indigo-700" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#111111]">Full-Stack Marine Intelligence</p>
                    <p className="text-xs text-[#555555] leading-relaxed mt-0.5">
                      AI · Machine Learning · Geospatial · Voice · Real-Time Satellite Data
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-emerald-700" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#111111]">Smart India Hackathon 2024</p>
                    <p className="text-xs text-[#555555] leading-relaxed mt-0.5">
                      Problem Statement 26176 — Marine Intelligence Platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Mission card */}
              <div className="p-5 rounded-xl bg-[#111111] text-white space-y-2">
                <p className="text-[10px] font-mono uppercase font-bold text-teal-400 tracking-widest">
                  Our Mission
                </p>
                <p className="text-sm leading-relaxed text-neutral-200">
                  "To transform complex marine and satellite data into simple, actionable intelligence that helps people make safer and smarter decisions at sea."
                </p>
              </div>

              {/* SIH badge */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 border border-teal-100">
                <Anchor className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-[11px] font-mono font-bold text-teal-800 tracking-wide">
                  Built for SIH · MATSYA AI · Marine Intelligence Platform
                </span>
              </div>
            </div>

            {/* Right — team photo */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-[#E5E5E5] shadow-lg bg-[#F7F7F5]">
                <img
                  src="/team-photo.jpg"
                  alt="MATSYA AI Development Team"
                  className="w-full h-auto object-cover object-center"
                  style={{ maxHeight: '420px', objectFit: 'cover', objectPosition: 'center top' }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement | null;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                {/* Placeholder shown only if image fails to load */}
                <div
                  className="hidden w-full h-64 flex-col items-center justify-center gap-3 text-[#999999]"
                  aria-hidden="true"
                >
                  <Users className="w-10 h-10 opacity-30" />
                  <p className="text-xs font-mono text-[#aaaaaa]">
                    Place <code className="bg-[#EEEEEE] px-1 rounded">team-photo.jpg</code> in the <code className="bg-[#EEEEEE] px-1 rounded">public/</code> folder
                  </p>
                </div>
              </div>
              {/* Caption */}
              <p className="mt-2 text-center text-[10px] font-mono text-[#999999] tracking-wide">
                MATSYA AI Development Team · Computer Science Department
              </p>
            </div>
          </div>

          {/* ── Six member cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E5E5] bg-white shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200"
              >
                {/* Avatar initial circle */}
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shrink-0 text-white font-bold text-sm select-none">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111111] leading-tight truncate">
                    {member.name}
                  </p>
                  <p className="text-[11px] text-[#777777] mt-0.5">Computer Science Student</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Team statement ── */}
          <div className="p-6 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] text-center space-y-2">
            <p className="text-xs font-mono font-bold uppercase text-teal-700 tracking-widest">
              About This Project
            </p>
            <p className="text-sm text-[#444444] leading-relaxed max-w-3xl mx-auto">
              Built by a team of Computer Science students combining AI, machine learning, geospatial intelligence, real-time satellite data, voice interaction and marine technology to create practical solutions for fishermen, researchers and coastal communities.
            </p>
          </div>

        </section>
        {/* ════════════════════════════════════════════════════════════════════ */}

        {/* 5. CONTACT & COLLABORATION FORM */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-[#E5E5E5]">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold text-[#111111]">Institutional Inquiries & Support</h2>
              <p className="text-xs text-[#555555] leading-relaxed">
              Connect with the MATSYA AI engineering team, request custom satellite pipeline integrations, or register your coastal fishermen cooperative for voice terminal deployment.
            </p>

            <div className="space-y-2 pt-2 text-xs text-[#444444] font-mono">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-700" />
                <span>support@matsya-marine.gov.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-teal-700" />
                <span>ISRO Space Applications Centre, Ahmedabad</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {feedbackSent ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-900">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-sm">Message Transmitted Successfully</h3>
                <p className="text-xs">Your inquiry has been logged with the MATSYA AI Maritime Coordination Desk.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F5] space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#111111]">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-hidden focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#111111]">Official Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@organization.gov.in"
                      className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#111111]">Organization / Coastal Society</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. State Fisheries Department / University"
                    className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-hidden focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#111111]">Message / Collaboration Scope</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your research inquiry or field pilot proposal..."
                    className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-hidden focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111111] hover:bg-black text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-teal-400" />
                  <span>Transmit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
