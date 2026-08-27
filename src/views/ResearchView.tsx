import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  ExternalLink, 
  Sparkles, 
  X, 
  Tag, 
  Award, 
  Database, 
  Calendar,
  Layers,
  CheckCircle2,
  Copy,
  ArrowRight,
  Activity
} from 'lucide-react';
import { MOCK_RESEARCH_PAPERS, ResearchPaper } from '../data/mockResearchData';
import { CausalAnalysisPanel } from '../components/CausalAnalysisPanel';

interface ResearchViewProps {
  onNavigate: (view: string) => void;
}

export const ResearchView: React.FC<ResearchViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'papers' | 'causal'>('causal');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePaper, setActivePaper] = useState<ResearchPaper | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  const categories = [
    'All',
    'Earth Observation',
    'Fisheries',
    'Ocean Climate',
    'Marine Safety',
    'Artificial Intelligence',
    'Marine Biodiversity'
  ];

  const filteredPapers = MOCK_RESEARCH_PAPERS.filter((paper) => {
    const matchesCategory = selectedCategory === 'All' || paper.category === selectedCategory;
    const matchesSearch = 
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      paper.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCitation = (paper: ResearchPaper) => {
    const citation = `${paper.authors.join(', ')} (${paper.year}). ${paper.title}. ${paper.journal}. https://doi.org/${paper.doi}`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>Scientific Publications & Causal Knowledge Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              MATSYA AI Marine Research & Analytics
            </h1>
            <p className="text-sm text-[#555555] leading-relaxed">
              Curated peer-reviewed oceanographic studies, satellite remote sensing validation trials, 
              and 4-tier causal attribution models powered by MATSYA AI multi-agent telemetry.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#F7F7F5] p-1.5 rounded-xl border border-[#E5E5E5]">
            <button
              onClick={() => setActiveTab('causal')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'causal'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>4-Tier Causal Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('papers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'papers'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Papers Directory ({MOCK_RESEARCH_PAPERS.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Causal Analysis Panel */}
        {activeTab === 'causal' && (
          <div className="space-y-6">
            <CausalAnalysisPanel initialRegion="Coromandel Coast / Bay of Bengal" />
          </div>
        )}

        {/* Tab 2: Papers Directory */}
        {activeTab === 'papers' && (
          <div className="space-y-6">
            {/* Search & Filter Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search papers by keyword, author, DOI, or ocean basin..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F5] border border-[#E5E5E5] rounded-xl text-xs text-[#111111] focus:outline-hidden focus:border-black transition font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-[#888888] hover:text-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick stats badge */}
                <div className="px-4 py-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-xl text-xs font-mono text-[#555555] flex items-center justify-between sm:justify-start gap-2">
                  <span>{filteredPapers.length} Studies Found</span>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-1 text-xs font-semibold scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Research Papers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => setActivePaper(paper)}
                  className="p-6 rounded-2xl border border-[#E5E5E5] bg-white hover:border-black hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#555555]">
                        {paper.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#888888]">{paper.year}</span>
                    </div>

                    <h3 className="font-bold text-sm text-[#111111] group-hover:text-teal-900 leading-snug line-clamp-2">
                      {paper.title}
                    </h3>

                    <p className="text-xs text-[#555555] font-mono line-clamp-1">
                      {paper.authors.join(', ')}
                    </p>

                    <p className="text-xs text-[#666666] leading-relaxed line-clamp-3">
                      {paper.abstract}
                    </p>

                    {/* Keywords Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {paper.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] text-[#555555]">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                    <span className="text-[#888888] font-mono text-[11px] truncate max-w-[160px]">
                      {paper.journal}
                    </span>
                    <span className="text-teal-700 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Study</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paper Detail Modal */}
        {activePaper && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-[#E5E5E5]">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#555555]">
                    {activePaper.category} • {activePaper.year}
                  </span>
                  <h2 className="text-lg font-bold text-[#111111]">{activePaper.title}</h2>
                </div>
                <button
                  onClick={() => setActivePaper(null)}
                  className="p-1.5 rounded-lg bg-[#F7F7F5] text-[#777777] hover:text-[#111111]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-[#111111] block mb-0.5">Authors</span>
                  <p className="text-[#555555] font-mono">{activePaper.authors.join(', ')}</p>
                </div>
                <div>
                  <span className="font-bold text-[#111111] block mb-0.5">Journal & Publication</span>
                  <p className="text-[#555555]">{activePaper.journal}</p>
                </div>
                <div>
                  <span className="font-bold text-[#111111] block mb-0.5">Abstract</span>
                  <p className="text-[#444444] leading-relaxed bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E5E5E5]">
                    {activePaper.abstract}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
                <button
                  onClick={() => handleCopyCitation(activePaper)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5E5] hover:bg-[#F7F7F5] text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCitation ? 'Citation Copied!' : 'Copy Citation'}</span>
                </button>

                <button
                  onClick={() => setActivePaper(null)}
                  className="px-5 py-2 bg-[#111111] text-white rounded-xl text-xs font-semibold hover:bg-black transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
