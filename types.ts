
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
  searchVolume: number;
}

export interface AffiliateStrategy {
  title: string;
  description: string;
}

export interface AffiliateAnalysis {
  viabilityScore: number; // 0-100
  difficultyLevel: 'Baixa' | 'Média' | 'Alta';
  verdict: string; // A short summary paragraph
  lowCostStrategies: AffiliateStrategy[];
}

export interface SEOAnalysis {
  keyword: string;
  country: string;
  totalVolumeLast6Months: number;
  averageMonthlyVolume: number;
  cpcGoogle: number;
  cpcMeta: number;
  currencySymbol: string;
  trendPoints: TrendPoint[];
  topRegions: RegionData[];
  relatedTerms: RelatedTerm[]; // Updated structure
  articleTitles: string[];
  insightSummary: string;
  affiliateAnalysis: AffiliateAnalysis; // New section
}

export interface GeneratedArticle {
  seoTitle: string;
  seoSubtitle: string;
  contentPt: string;
  contentSecondLanguage: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  GENERATING_ARTICLE = 'GENERATING_ARTICLE'
}
