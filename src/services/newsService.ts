// News Service - Fetches and caches marine/ocean news
// Uses backend API proxy to hide API keys

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  link: string;
  imageUrl: string;
  pubDate: string;
  source: string;
  category: string;
  location?: string;
  region?: string;
  priority?: 'urgent' | 'important' | 'info';
  isLocal?: boolean;
  timestamp?: string;
  isCached?: boolean;
}

interface NewsResponse {
  success: boolean;
  articles: NewsArticle[];
  cached?: boolean;
  lastUpdated?: string;
}

const NEWS_CACHE_KEY = 'matsya_news_cache';
const NEWS_CACHE_TIMESTAMP_KEY = 'matsya_news_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

class NewsService {
  private cacheEnabled = true;

  /**
   * Fetch local news based on user's region
   */
  async fetchLocalNews(region?: string): Promise<NewsResponse> {
    try {
      const cached = this.getCached();
      if (cached && this.isCacheValid()) {
        return {
          success: true,
          articles: cached.filter(a => a.isLocal),
          cached: true,
          lastUpdated: this.getCacheTimestamp()
        };
      }

      const response = await fetch(`/api/news/local?region=${encodeURIComponent(region || 'India')}`);
      if (!response.ok) throw new Error('Failed to fetch local news');

      const data = await response.json();
      const articles = this.normalizeArticles(data.articles || [], true);

      this.setCached(articles);

      return {
        success: true,
        articles: articles.filter(a => a.isLocal),
        cached: false,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching local news:', error);

      // Return cached data if available
      const cached = this.getCached();
      if (cached && cached.length > 0) {
        return {
          success: false,
          articles: cached.filter(a => a.isLocal),
          cached: true,
          lastUpdated: this.getCacheTimestamp()
        };
      }

      return { success: false, articles: [], cached: false };
    }
  }

  /**
   * Fetch global ocean/marine news
   */
  async fetchGlobalNews(): Promise<NewsResponse> {
    try {
      const cached = this.getCached();
      if (cached && this.isCacheValid()) {
        return {
          success: true,
          articles: cached,
          cached: true,
          lastUpdated: this.getCacheTimestamp()
        };
      }

      const response = await fetch('/api/news/global');
      if (!response.ok) throw new Error('Failed to fetch global news');

      const data = await response.json();
      const articles = this.normalizeArticles(data.articles || [], false);

      this.setCached(articles);

      return {
        success: true,
        articles,
        cached: false,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching global news:', error);

      // Return cached data if available
      const cached = this.getCached();
      if (cached && cached.length > 0) {
        return {
          success: false,
          articles: cached,
          cached: true,
          lastUpdated: this.getCacheTimestamp()
        };
      }

      return { success: false, articles: [], cached: false };
    }
  }

  /**
   * Generate AI-powered "What this means" summary
   */
  async generateWhatThisMeans(article: NewsArticle, userRegion?: string): Promise<string> {
    try {
      const response = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          region: userRegion,
          isLocal: article.isLocal
        })
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      return data.summary || 'No additional information available at this time.';
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return 'Check the full article for more details.';
    }
  }

  /**
   * Normalize articles from API response
   */
  private normalizeArticles(articles: any[], isLocal: boolean): NewsArticle[] {
    return articles.map((article, index) => {
      // Determine priority based on keywords
      let priority: 'urgent' | 'important' | 'info' = 'info';
      const titleLower = (article.title || '').toLowerCase();
      const descLower = (article.description || '').toLowerCase();

      const urgentKeywords = ['tsunami', 'cyclone', 'warning', 'alert', 'danger', 'emergency', 'evacuation'];
      const importantKeywords = ['storm', 'rough', 'strong wind', 'heavy rain', 'advisory', 'caution'];

      if (urgentKeywords.some(k => titleLower.includes(k) || descLower.includes(k))) {
        priority = 'urgent';
      } else if (importantKeywords.some(k => titleLower.includes(k) || descLower.includes(k))) {
        priority = 'important';
      }

      return {
        id: article.article_id || `news-${Date.now()}-${index}`,
        title: article.title || 'No title',
        description: article.description || article.content || 'No description available',
        content: article.content,
        link: article.link || '#',
        imageUrl: article.image_url || article.imageUrl || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
        pubDate: article.pubDate || new Date().toISOString(),
        source: article.source_id || article.source || 'Unknown',
        category: this.mapCategory(article.category),
        location: article.location,
        region: article.region,
        priority,
        isLocal,
        timestamp: this.getRelativeTime(article.pubDate),
        isCached: false
      };
    });
  }

  /**
   * Map API categories to user-friendly categories
   */
  private mapCategory(category?: string[]): string {
    if (!category || category.length === 0) return 'Ocean News';

    const cat = category[0].toLowerCase();
    if (cat.includes('environment')) return 'Environment';
    if (cat.includes('science')) return 'Science';
    if (cat.includes('weather')) return 'Weather';
    if (cat.includes('disaster')) return 'Weather & Cyclones';

    return 'Ocean News';
  }

  /**
   * Get relative time string
   */
  private getRelativeTime(dateString?: string): string {
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
  }

  /**
   * Cache management
   */
  private getCached(): NewsArticle[] | null {
    if (!this.cacheEnabled || typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(NEWS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private setCached(articles: NewsArticle[]): void {
    if (!this.cacheEnabled || typeof window === 'undefined') return;

    try {
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(articles));
      localStorage.setItem(NEWS_CACHE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to cache news:', error);
    }
  }

  private getCacheTimestamp(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(NEWS_CACHE_TIMESTAMP_KEY) || '';
  }

  private isCacheValid(): boolean {
    const timestamp = this.getCacheTimestamp();
    if (!timestamp) return false;

    const cacheDate = new Date(timestamp);
    const now = new Date();
    return (now.getTime() - cacheDate.getTime()) < CACHE_DURATION;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(NEWS_CACHE_KEY);
    localStorage.removeItem(NEWS_CACHE_TIMESTAMP_KEY);
  }
}

export const newsService = new NewsService();
