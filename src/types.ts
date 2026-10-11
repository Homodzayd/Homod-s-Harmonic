export interface StockDataPoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  rsi?: number;
}

export interface StockQuote {
  symbol: string;
  currency: string;
  exchangeName: string;
  regularMarketPrice: number;
  previousClose: number;
  data: StockDataPoint[];
  isFallback?: boolean;
  isOnline?: boolean;
  dataSource?: string;
  lastUpdated?: string;
  notice?: string;
  sessionPhase?: string;
  sessionNameAr?: string;
  sessionNameEn?: string;
  sessionBadgeColor?: string;
  sessionIcon?: string;
  preMarketPrice?: number | null;
  postMarketPrice?: number | null;
}

export interface TradeSettings {
  symbol: string;
  capital: number;
  riskPct: number; // e.g. 2.0 for 2%
  timeframe: '1d' | '1wk' | '1mo';
  patternType?: HarmonicPatternType;
  stopLossPct: number; // e.g. 3.5 for 3.5%
  tp1Pct: number; // e.g. 5.0
  tp2Pct: number; // e.g. 8.0
  tp3Pct: number; // e.g. 12.0
  manualEntryPrice?: number;
  manualStopLossPrice?: number;
  manualTp1Price?: number;
  manualTp2Price?: number;
  manualTp3Price?: number;
}

export interface FiboRatios {
  abRatio: number;
  bcRatio: number;
  cdRatio: number;
  xdRatio: number;
}

export interface ClassicalPatternResult {
  name: string;
  nameAr: string;
  type: 'Inverse Head & Shoulders' | 'Head & Shoulders' | 'Double Bottom' | 'Double Top' | 'Ascending Triangle';
  description: string;
  descriptionAr: string;
  necklinePrice: number;
}

export type HarmonicPatternType = 'Bat' | 'Gartley' | 'Butterfly' | 'Crab' | 'ABCD';

export interface HarmonicBatAnalysisResult {
  patternType: HarmonicPatternType;
  patternName: string;
  patternNameAr: string;
  xPrice: number;
  aPrice: number;
  bPrice: number; // Activation Level
  cPrice: number; // Pivot C / Level
  dPrice: number; // Target D
  terminalBar: number; // Current Close
  przMin: number;
  przMax: number;
  invalidationPrice: number; // Invalidation Level (SL)
  gapLevel: number;
  fiboRatios: FiboRatios;
  classicalPattern?: ClassicalPatternResult;
  timeframeName: string;
  timeframePriority: string;
  timeframePriorityAr: string;
  strengthScore: number;
  idxX?: number;
  idxA?: number;
  idxB?: number;
  idxC?: number;
  idxD?: number;
  dateX?: string;
  dateA?: string;
  dateB?: string;
  dateC?: string;
  dateD?: string;
  futurePrices?: { date: string; price: number }[];
}

export interface TradeLevels {
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  maxRiskAmount: number;
  riskPerShare: number;
  positionSize: number;
  totalPositionCost: number;
  portfolioAllocationPct: number;
  expectedGainTp1: number;
  expectedGainTp2: number;
  expectedGainTp3: number;
  riskRewardRatioTp1: number;
  riskRewardRatioTp2: number;
  riskRewardRatioTp3: number;
}

export interface MarketPreset {
  symbol: string;
  nameAr: string;
  nameEn: string;
  category: 'US' | 'TASI' | 'KW' | 'INDEX' | 'CRYPTO' | 'COMMODITY';
}
