import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  X, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Share2, 
  ArrowRight, 
  BookOpen, 
  Satellite, 
  Waves,
  CheckCircle2
} from 'lucide-react';
import { MOCK_MARINE_NEWS, MarineNewsItem } from '../data/mockNewsData';

interface NewsViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (query?: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<MarineNewsItem | null>(null);

  const categories = [
    'All',
    'Satellite',
    'Fisheries',
    'Climate',
    'Marine Safety',
    'Technology',
    'Ocean',
    'Research'
  ];

  const filteredNews = MOCK_MARINE_NEWS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
            <Radio className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
            <span>Operational Dispatches & Satellite Bulletins</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            MATSYA AI Marine Intelligence News
          </h1>
          <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Real-time developments in ocean remote sensing, coastal fisheries advisories, 
            mesoscale climate trends, and maritime safety innovations.
          </p>
        </div>

        {/* Search & Categories Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search marine bulletins by keyword, region, or satellite..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F5] border border-[#E5E5E5] rounded-xl text-xs text-[#111111] focus:outline-hidden focus:border-black transition"
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

            {/* Total count badge */}
            <div className="px-4 py-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-xl text-xs font-mono text-[#555555] flex items-center justify-between sm:justify-start gap-2">
              <span>{filteredNews.length} Bulletins Active</span>
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

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <div
              key={news.id}
              onClick={() => setActiveArticle(news)}
              className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:border-black hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="h-44 overflow-hidden bg-neutral-100 relative">
                  <img 
                    src={news.imageUrl} 
                    alt={news.headline}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/70 text-white text-[10px] font-mono backdrop-blur-xs font-bold">
                    {news.category}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#888888]">
                    <span>{news.date}</span>
                    <span>{news.readTime}</span>
                  </div>

                  <h3 className="font-bold text-sm text-[#111111] leading-snug group-hover:text-teal-900 line-clamp-2">
                    {news.headline}
                  </h3>

                  <p className="text-xs text-[#555555] leading-relaxed line-clamp-3">
                    {news.summary}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#777777]">
                  <span className="truncate max-w-[150px]">{news.source}</span>
                  <span className="font-bold text-[#111111] group-hover:underline flex items-center gap-1">
                    <span>Full Bulletin</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Article Modal */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div 
              className="bg-white border border-[#E5E5E5] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-[#111111] text-white flex items-start justify-between border-b border-black">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-teal-300 font-bold border border-white/20">
                      {activeArticle.category}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">{activeArticle.date}</span>
                  </div>
                  <h3 className="font-bold text-base leading-snug">{activeArticle.headline}</h3>
                </div>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#333333]">
                <div className="h-56 rounded-xl overflow-hidden bg-neutral-100">
                  <img 
                    src={activeArticle.imageUrl} 
                    alt={activeArticle.headline}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between text-[11px] font-mono text-[#555555]">
                  <span>Source: <strong className="text-[#111111]">{activeArticle.source}</strong></span>
                  <span>Est. Read: {activeArticle.readTime}</span>
                </div>

                <div className="space-y-3 text-xs text-[#444444] leading-relaxed text-justify">
                  <p className="font-semibold text-[#111111]">
                    {activeArticle.summary}
                  </p>
                  <p>
                    Operational integration with the MATSYA AI multi-agent engine ensures that telemetry updates from this bulletin are immediately accessible to coastal field units, state fisheries departments, and maritime search-and-rescue teams.
                  </p>
                  <p>
                    Data validation continues through synchronized passes with GHRSST Level 4 products and ground-truthed coastal station buoys maintained by the Ministry of Earth Sciences.
                  </p>
                </div>

                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px]">
                  <strong>Interactive Synthesis:</strong> Ask the MATSYA Voice AI for a localized summary of how this news affects your local coastal sector.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#F7F7F5] border-t border-[#E5E5E5] flex items-center justify-between">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold text-[#111111] hover:bg-[#EFEFEA] transition"
                >
                  Close Bulletin
                </button>

                <button
                  onClick={() => {
                    const query = `Explain how this affects fishermen: ${activeArticle.headline}`;
                    setActiveArticle(null);
                    onOpenVoiceModal(query);
                  }}
                  className="px-4 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-black transition flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ask Assistant About This</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
