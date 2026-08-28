import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radio,
  Search,
  X,
  MapPin,
  ArrowRight,
  Navigation,
  Globe as GlobeIcon,
  Wifi,
  WifiOff,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { MOCK_MARINE_NEWS, MarineNewsItem } from '../data/mockNewsData';
import { newsService, NewsArticle } from '../services/newsService';
import { requestPosition, type GeoPosition } from '../services/geolocation';

interface NewsViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (query?: string) => void;
}

// Category-based fallback images
const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  Weather: [
    'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=800&q=80'
  ],
  Fishing: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520626428408-cde3c7eaf066?auto=format&fit=crop&w=800&q=80'
  ],
  Safety: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582826419334-e9a67e4b1f53?auto=format&fit=crop&w=800&q=80'
  ],
  'Ocean News': [
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80'
  ]
};

const getRelevantImage = (article: NewsArticle | MarineNewsItem, category: string, index: number): string => {
  // Use article image if available and valid
  if (article.imageUrl && article.imageUrl.startsWith('http')) {
    return article.imageUrl;
  }

  // Use category-based fallback with variety
  const categoryImages = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Ocean News'];
  return categoryImages[index % categoryImages.length];
};

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const [feedMode, setFeedMode] = useState<'near-me' | 'global'>('near-me');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | MarineNewsItem | null>(null);
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const autoRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Simple categories for fishermen
  const categories = [
    'All',
    'Weather',
    'Fishing',
    'Safety',
    'Ocean News'
  ];

  // Map technical categories to simple ones
  const categoryMap: Record<string, string> = {
    'Climate': 'Weather',
    'Marine Safety': 'Safety',
    'Fisheries': 'Fishing',
    'Ocean': 'Ocean News',
    'Satellite': 'Ocean News',
    'Research': 'Ocean News',
    'Technology': 'Ocean News',
    'Environment': 'Ocean News',
    'Science': 'Ocean News',
    'Weather': 'Weather'
  };

  // Fetch news from API
  const fetchNews = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    if (!showLoader) setIsRefreshing(true);

    try {
      let response;
      if (feedMode === 'near-me') {
        const region = userPosition?.region || 'India';
        response = await newsService.fetchLocalNews(region);
      } else {
        response = await newsService.fetchGlobalNews();
      }

      if (response.success && response.articles.length > 0) {
        // Remove duplicates by URL and title
        const uniqueArticles = response.articles.filter((article, index, self) =>
          index === self.findIndex((a) =>
            a.link === article.link ||
            (a.title.toLowerCase().trim() === article.title.toLowerCase().trim() && a.source === article.source)
          )
        );

        // Merge with mock data for demo purposes (mock data provides user-friendly content)
        const combinedArticles = [...MOCK_MARINE_NEWS.map(item => ({
          ...item,
          id: item.id,
          link: '#',
          pubDate: item.date,
          imageUrl: item.imageUrl,
          isLocal: item.isLocal || false,
          isCached: false
        })), ...uniqueArticles];

        // Remove duplicates from combined list
        const finalArticles = combinedArticles.filter((article, index, self) =>
          index === self.findIndex((a) =>
            a.title.toLowerCase().trim() === article.title.toLowerCase().trim()
          )
        );

        // Sort by newest first
        finalArticles.sort((a, b) => {
          const dateA = new Date(a.pubDate || 0).getTime();
          const dateB = new Date(b.pubDate || 0).getTime();
          return dateB - dateA;
        });

        setArticles(finalArticles);
        setLastUpdated(new Date());
      } else if (response.cached) {
        // Using cached data
        setLastUpdated(response.lastUpdated ? new Date(response.lastUpdated) : null);
      } else {
        // Fallback to mock data only
        setArticles(MOCK_MARINE_NEWS.map(item => ({
          ...item,
          id: item.id,
          link: '#',
          pubDate: item.date,
          imageUrl: item.imageUrl,
          isLocal: item.isLocal || false
        })));
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data
      setArticles(MOCK_MARINE_NEWS.map(item => ({
        ...item,
        id: item.id,
        link: '#',
        pubDate: item.date,
        imageUrl: item.imageUrl,
        isLocal: item.isLocal || false
      })));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [feedMode, userPosition]);

  // Load user location on mount
  useEffect(() => {
    requestPosition().then(pos => {
      if (pos.status === 'success') {
        setUserPosition(pos);
      }
    });
  }, []);

  // Fetch news on mount and when feedMode changes
  useEffect(() => {
    fetchNews(true);
  }, [fetchNews]);

  // Automatic refresh every 5 minutes
  useEffect(() => {
    if (autoRefreshTimer.current) {
      clearInterval(autoRefreshTimer.current);
    }

    autoRefreshTimer.current = setInterval(() => {
      fetchNews(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [fetchNews]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchNews(false); // Refresh when coming back online
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchNews]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchNews(false);
  };

  // Load more handler
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Fetch AI summary when article is opened
  const handleArticleClick = async (article: NewsArticle | MarineNewsItem) => {
    setActiveArticle(article);
    setAiSummary('');
    setLoadingSummary(true);

    try {
      const region = userPosition?.region || 'your area';
      const summary = await newsService.generateWhatThisMeans(article as NewsArticle, region);
      setAiSummary(summary);
    } catch (error) {
      console.error('Error fetching AI summary:', error);
      setAiSummary('Check the full article for more details.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const filteredNews = articles.filter((item) => {
    const matchesMode = feedMode === 'global' || item.isLocal;
    const itemSimpleCategory = categoryMap[item.category] || 'Ocean News';
    const matchesCategory = selectedCategory === 'All' || itemSimpleCategory === selectedCategory;
    const title = 'simpleHeadline' in item ? (item.simpleHeadline || item.headline) : (item.title || '');
    const summary = 'simpleSummary' in item ? (item.simpleSummary || item.summary) : (item.description || '');
    const location = item.location || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesCategory && matchesSearch;
  });

  const sortedNews = [...filteredNews];

  const getSimpleCategory = (category: string) => {
    return categoryMap[category] || 'Ocean News';
  };

  // Get category color (teal/blue theme)
  const getCategoryColor = (category: string) => {
    const simpleCategory = getSimpleCategory(category);
    const colors: Record<string, string> = {
      'Weather': 'bg-blue-600',
      'Fishing': 'bg-teal-600',
      'Safety': 'bg-cyan-600',
      'Ocean News': 'bg-sky-600'
    };
    return colors[simpleCategory] || 'bg-teal-600';
  };

  // Get priority color
  const getPriorityColor = (priority?: 'urgent' | 'important' | 'info') => {
    if (priority === 'urgent') return 'text-red-600';
    if (priority === 'important') return 'text-orange-600';
    return 'text-teal-600';
  };

  // Get relative time
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  // Display only limited articles initially
  const displayedNews = sortedNews.slice(0, displayCount);
  const hasMore = displayedNews.length < sortedNews.length;

  // Breaking news items (top stories)
  const breakingNews = sortedNews.slice(0, 5);
  const heroStories = sortedNews.slice(0, 5);
  const secondaryStories = sortedNews.slice(5, 9);
  const latestUpdates = sortedNews.slice(9, 13);

  // Auto-rotate ticker every 5 seconds
  useEffect(() => {
    if (breakingNews.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % breakingNews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [breakingNews.length]);

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (heroStories.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroStories.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroStories.length]);

  const currentTickerNews = breakingNews[tickerIndex];
  const currentHeroNews = heroStories[heroIndex];

  // Helper to get article title
  const getArticleTitle = (article: NewsArticle | MarineNewsItem) => {
    if ('simpleHeadline' in article) return article.simpleHeadline || article.headline;
    return (article as NewsArticle).title;
  };

  // Helper to get article summary
  const getArticleSummary = (article: NewsArticle | MarineNewsItem) => {
    if ('simpleSummary' in article) return article.simpleSummary || article.summary;
    return (article as NewsArticle).description;
  };

  return (
    <div className="bg-white min-h-screen text-[#111111]">

      {/* Breaking News Ticker */}
      {!isLoading && breakingNews.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-1.5 bg-teal-600 rounded-md flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Breaking News</span>
              </div>
              <span className={`px-2 py-1 ${getCategoryColor(currentTickerNews.category)} rounded text-[10px] font-bold text-white uppercase`}>
                {getSimpleCategory(currentTickerNews.category)}
              </span>
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-white font-medium truncate">
                {getArticleTitle(currentTickerNews)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setTickerIndex(prev => (prev - 1 + breakingNews.length) % breakingNews.length)}
                className="p-1 hover:bg-white/10 rounded transition"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setTickerIndex(prev => (prev + 1) % breakingNews.length)}
                className="p-1 hover:bg-white/10 rounded transition"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedMode('near-me')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                feedMode === 'near-me'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-[#F7F7F5] text-[#555555] hover:bg-[#EFEFEA] border border-[#E5E5E5]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Near Me</span>
            </button>
            <button
              onClick={() => setFeedMode('global')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                feedMode === 'global'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-[#F7F7F5] text-[#555555] hover:bg-[#EFEFEA] border border-[#E5E5E5]'
              }`}
            >
              <GlobeIcon className="w-4 h-4" />
              <span>Global</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-[#F7F7F5] text-[#555555] hover:bg-[#EFEFEA] border border-[#E5E5E5] disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {getRelativeTime(lastUpdated.toISOString())}</span>
            </div>
          )}

          {!isOnline && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline - Cached</span>
            </div>
          )}

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                className="w-full pl-9 pr-9 py-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-teal-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5">
                  <X className="w-4 h-4 text-[#888888]" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-[#F7F7F5] text-[#555555] hover:text-black border border-[#E5E5E5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            <p className="text-sm text-[#888888] font-medium">Loading marine news...</p>
          </div>
        )}

        {/* Hero Section */}
        {!isLoading && currentHeroNews && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Hero Story */}
            <div className="lg:col-span-2">
              <div className="relative group cursor-pointer" onClick={() => handleArticleClick(currentHeroNews)}>
                <div className="relative h-[400px] rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={getRelevantImage(currentHeroNews, getSimpleCategory(currentHeroNews.category), 0)}
                    alt={getArticleTitle(currentHeroNews)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Category Tag */}
                  <div className={`absolute bottom-4 left-4 px-3 py-1.5 ${getCategoryColor(currentHeroNews.category)} rounded-lg shadow-lg`}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {getSimpleCategory(currentHeroNews.category)}
                    </span>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroIndex(prev => (prev - 1 + heroStories.length) % heroStories.length);
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroIndex(prev => (prev + 1) % heroStories.length);
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {currentHeroNews.location && (
                    <div className="flex items-center gap-1.5 text-teal-700">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{currentHeroNews.location}</span>
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-[#111111] leading-tight group-hover:text-teal-700 transition">
                    {getArticleTitle(currentHeroNews)}
                  </h2>

                  <p className="text-sm text-[#555555] leading-relaxed line-clamp-2">
                    {getArticleSummary(currentHeroNews)}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-[#888888]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{getRelativeTime(currentHeroNews.pubDate || ('date' in currentHeroNews ? currentHeroNews.date : ''))}</span>
                    </div>
                    <span>•</span>
                    <span className="font-medium text-[#111111]">{currentHeroNews.source}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stories Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {secondaryStories.map((news, idx) => (
                <div
                  key={news.id}
                  onClick={() => handleArticleClick(news)}
                  className="cursor-pointer group"
                >
                  <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={getRelevantImage(news, getSimpleCategory(news.category), idx + 1)}
                      alt={getArticleTitle(news)}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-2 left-2 px-2 py-1 ${getCategoryColor(news.category)} rounded text-[9px] font-bold text-white uppercase`}>
                      {getSimpleCategory(news.category)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-[#111111] leading-snug group-hover:text-teal-700 transition line-clamp-2">
                    {getArticleTitle(news)}
                  </h3>
                  <p className="text-xs text-[#888888] mt-1">
                    {getRelativeTime(news.pubDate || ('date' in news ? news.date : ''))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Updates Row */}
        {!isLoading && latestUpdates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#111111]">Latest Updates</h3>
              <div className="flex items-center gap-2 text-xs text-[#888888]">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-teal-600" />
                    <span>Live Feed</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cached</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestUpdates.map((news, idx) => (
                <div
                  key={news.id}
                  onClick={() => handleArticleClick(news)}
                  className="group cursor-pointer bg-white border border-[#E5E5E5] rounded-xl overflow-hidden hover:border-teal-600 hover:shadow-lg transition-all"
                >
                  <div className="relative h-32 bg-slate-100">
                    <img
                      src={getRelevantImage(news, getSimpleCategory(news.category), idx + 5)}
                      alt={getArticleTitle(news)}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-2 left-2 px-2 py-1 ${getCategoryColor(news.category)} rounded text-[9px] font-bold text-white uppercase`}>
                      {getSimpleCategory(news.category)}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-[#111111] leading-snug group-hover:text-teal-700 transition line-clamp-2">
                      {getArticleTitle(news)}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-[#888888]">
                      <Clock className="w-3 h-3" />
                      <span>{getRelativeTime(news.pubDate || ('date' in news ? news.date : ''))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && hasMore && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 transition flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Load More Articles</span>
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && sortedNews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Search className="w-16 h-16 text-[#CCCCCC]" />
            <p className="text-sm text-[#888888] font-medium">No news articles found</p>
            <p className="text-xs text-[#AAAAAA]">Try adjusting your filters or search query</p>
          </div>
        )}

      </div>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 ${getCategoryColor(activeArticle.category)} rounded text-[10px] font-bold uppercase`}>
                    {getSimpleCategory(activeArticle.category)}
                  </span>
                  {activeArticle.location && (
                    <span className="flex items-center gap-1 text-xs text-slate-300">
                      <MapPin className="w-3 h-3" />
                      {activeArticle.location}
                    </span>
                  )}
                  {!activeArticle.location && activeArticle.isLocal === false && (
                    <span className="flex items-center gap-1 text-xs text-slate-300">
                      <GlobeIcon className="w-3 h-3" />
                      International
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg leading-snug">
                  {getArticleTitle(activeArticle)}
                </h3>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="h-48 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={getRelevantImage(activeArticle, getSimpleCategory(activeArticle.category), 0)}
                  alt={getArticleTitle(activeArticle)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Summary Section */}
              <div>
                <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">Summary</h4>
                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5]">
                  <p className="text-sm text-[#333333] leading-relaxed">
                    {getArticleSummary(activeArticle)}
                  </p>
                </div>
              </div>

              {/* AI-Generated "Why it matters" */}
              {loadingSummary && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  <p className="text-sm text-teal-800">Generating explanation...</p>
                </div>
              )}

              {!loadingSummary && aiSummary && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <p className="text-xs font-bold text-teal-900 mb-2 flex items-center gap-1.5">
                    <span>🌊</span>
                    <span>Why This Matters</span>
                  </p>
                  <p className="text-sm text-teal-800 leading-relaxed">
                    {aiSummary}
                  </p>
                </div>
              )}

              {/* Existing whatThisMeans from mock data */}
              {'whatThisMeans' in activeArticle && activeArticle.whatThisMeans && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <p className="text-xs font-bold text-cyan-900 mb-2">💡 Additional Context</p>
                  <p className="text-sm text-cyan-800 leading-relaxed">
                    {activeArticle.whatThisMeans}
                  </p>
                </div>
              )}

              {'whatToDo' in activeArticle && activeArticle.whatToDo && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-bold text-blue-900 mb-2">✓ What You Should Know</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {activeArticle.whatToDo}
                  </p>
                </div>
              )}

              {/* Source and Time */}
              <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5] flex items-center justify-between text-xs">
                <div>
                  <p className="text-[#888888]">Source</p>
                  <p className="font-bold text-[#111111]">{activeArticle.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#888888]">Published</p>
                  <p className="font-bold text-[#111111]">
                    {getRelativeTime(activeArticle.pubDate || ('date' in activeArticle ? activeArticle.date : ''))}
                  </p>
                </div>
              </div>

              {/* Original Article Link */}
              {('link' in activeArticle && activeArticle.link && activeArticle.link !== '#') && (
                <a
                  href={activeArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-[#111111] transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Read Original Article</span>
                </a>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F7F7F5] border-t border-[#E5E5E5] flex items-center gap-3">
              <button
                onClick={() => setActiveArticle(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm font-bold text-[#111111] hover:bg-[#EFEFEA] transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const query = `Tell me more about: ${getArticleTitle(activeArticle)}`;
                  setActiveArticle(null);
                  onOpenVoiceModal(query);
                }}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Ask Voice AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
