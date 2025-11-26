
export interface TrendPoint {
  month: string;
  searches: number;
}

export interface RegionData {
  name: string;
  volume: number; // 0-100 score or raw volume
}

export interface RelatedTerm {
  term: string;
  translatedTerm: string; // Translation to Portuguese
  searchVolume: number;
}

export interface SearchQuery {
  query: string;
  translatedQuery: string;
}

export interface SubstackAnalysis {
  viability: 'Baixa' | 'Média' | 'Alta';
  strategy: string; // Detailed strategy for Substack
  seoImpact: string; // How it affects SEO
}

export interface AffiliateStrategy {
  title: string;
  description: string;
}

export interface AffiliateAnalysis {
  viabilityScore: number; // 0-100
  difficultyLevel: 'Baixa' | 'Média' | 'Alta';
  productVerdict: string; // Detailed product analysis in PT
  substackAnalysis: SubstackAnalysis; // Specific Substack deep dive
  lowCostStrategies: AffiliateStrategy[];
}

export interface SEOAnalysis {
  keyword: string;
  country: string; // Can be "Global" or a comma-separated list
  totalVolumeLast6Months: number;
  averageMonthlyVolume: number;
  cpcGoogle: number;
  cpcMeta: number;
  currencySymbol: string;
  trendPoints: TrendPoint[];
  topRegions: RegionData[];
  relatedTerms: RelatedTerm[];
  commonSearchQueries: SearchQuery[]; // New field for search intents
  articleTitles: string[];
  insightSummary: string;
  affiliateAnalysis: AffiliateAnalysis; 
}

export interface GeneratedArticle {
  seoTitlePt: string;
  seoSubtitlePt: string;
  seoSlugPt: string; // New field for URL slug
  seoTitleNative: string;
  seoSubtitleNative: string;
  seoSlugNative: string; // New field for URL slug
  contentPt: string;
  contentNative: string; // Renamed from contentSecondLanguage for clarity, this is the 1st version shown
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  GENERATING_ARTICLE = 'GENERATING_ARTICLE'
}
