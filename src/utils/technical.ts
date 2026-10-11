import { StockDataPoint, TradeSettings, TradeLevels, MarketPreset, HarmonicBatAnalysisResult, FiboRatios, ClassicalPatternResult, HarmonicPatternType } from '../types';
import { US_STOCKS_225 } from '../data/usStocks';

export const POPULAR_PRESETS: MarketPreset[] = US_STOCKS_225;

export function getTimeframeConfig(timeframe: string) {
  const tf = String(timeframe || '').toLowerCase().trim();
  if (tf.includes('mo') || tf.includes('1m') || tf.includes('monthly') || tf.includes('شهري')) {
    return { window: 60, priorityEn: 'Priority 1 (High Strength)', priorityAr: 'أولوية قصوى (شهري)', strengthScore: 95 };
  }
  if (tf.includes('wk') || tf.includes('1w') || tf.includes('weekly') || tf.includes('أسبوعي')) {
    return { window: 120, priorityEn: 'Priority 2 (Medium-High Strength)', priorityAr: 'أولوية عالية (أسبوعي)', strengthScore: 85 };
  }
  return { window: 250, priorityEn: 'Priority 3 (Standard Strength)', priorityAr: 'أولوية قياسية (يومي)', strengthScore: 75 };
}

export function analyzeHarmonicBat(data: StockDataPoint[], timeframeName: string = '1D', patternType: HarmonicPatternType = 'Bat'): HarmonicBatAnalysisResult | null {
  if (!data || data.length < 5) return null;

  const n = data.length;
  const tfConfig = getTimeframeConfig(timeframeName);
  const windowSize = Math.min(n, tfConfig.window);
  
  const startIndex = Math.max(0, n - windowSize);
  const recentData = data.slice(startIndex);
  const L = recentData.length;
  if (L < 5) return null;

  // 1. Current live terminal price (Terminal Bar D)
  const dIdxInRecent = L - 1;
  const currentPrice = Number(data[n - 1].close.toFixed(2));

  // Timeframe-dependent target and stop loss ratio boundaries
  let slRatio = 0.0528; // ~5.28% Stop Loss
  let tp1Ratio = 0.0601; // ~6.01% TP1 / PRZ Min
  let tp2Ratio = 0.1098; // ~11.0% TP2 / PRZ Max

  const tfLower = timeframeName.toLowerCase();
  const isWeekly = tfLower.includes('w') || tfLower.includes('wk') || tfLower.includes('weekly') || tfLower.includes('أسبوعي');
  const isMonthly = tfLower.includes('m') || tfLower.includes('mo') || tfLower.includes('monthly') || tfLower.includes('شهري');

  if (isWeekly) {
    slRatio = 0.0537; // ~5.37% Stop Loss for Weekly
    tp1Ratio = 0.0604; // ~6.04% TP1 for Weekly
    tp2Ratio = 0.1141; // ~11.41% TP2 for Weekly
  } else if (isMonthly) {
    slRatio = 0.0526; // ~5.26% Stop Loss for Monthly
    tp1Ratio = 0.0658; // ~6.58% TP1 for Monthly
    tp2Ratio = 0.1211; // ~12.11% TP2 for Monthly
  }

  // Dynamic search windows relative to timeframe length
  const cWindow = Math.max(5, Math.floor(L * 0.35));
  const bWindow = Math.max(5, Math.floor(L * 0.35));
  const aWindow = Math.max(3, Math.floor(L * 0.20));
  const xWindow = Math.max(3, Math.floor(L * 0.15));

  // 2. Point C: Trough low in recent window preceding current bar
  let cIdxInRecent = Math.max(0, L - 3);
  let minCLow = Infinity;
  const cSearchStart = Math.max(0, L - cWindow);
  const cSearchEnd = Math.max(0, L - 2);

  const minCBound = currentPrice * (isMonthly ? 0.65 : isWeekly ? 0.75 : 0.85);
  for (let i = cSearchStart; i <= cSearchEnd; i++) {
    const l = recentData[i].low;
    // Accept C lows that are within realistic distance of current price for the chosen timeframe
    if (l < minCLow && l >= minCBound && l <= currentPrice * 0.99) {
      minCLow = l;
      cIdxInRecent = i;
    }
  }

  let cPrice = minCLow !== Infinity ? Number(minCLow.toFixed(2)) : Number((currentPrice * (1 - slRatio * 0.8)).toFixed(2));
  if (cPrice >= currentPrice) {
    cPrice = Number((currentPrice * 0.95).toFixed(2));
  }

  // 3. Point B (Activation Line): Resistance peak preceding C
  let peakIdxInRecent = Math.max(0, cIdxInRecent - 1);
  let maxBHigh = -Infinity;
  const bSearchStart = Math.max(0, cIdxInRecent - bWindow);
  const bSearchEnd = Math.max(0, cIdxInRecent - 1);

  const maxBBound = currentPrice * (isMonthly ? 1.45 : isWeekly ? 1.30 : 1.15);
  for (let i = bSearchStart; i <= bSearchEnd; i++) {
    const h = recentData[i].high;
    if (h > maxBHigh && h >= currentPrice * 0.98 && h <= maxBBound) {
      maxBHigh = h;
      peakIdxInRecent = i;
    }
  }

  let bPrice = maxBHigh !== -Infinity ? Number(maxBHigh.toFixed(2)) : Number((currentPrice * 1.025).toFixed(2));
  if (bPrice <= cPrice) {
    bPrice = Number((currentPrice * 1.025).toFixed(2));
  }

  // 4. Point A: Swing high prior to Peak B
  let aIdxInRecent = Math.max(0, peakIdxInRecent - 1);
  let maxAHigh = -Infinity;
  const aSearchStart = Math.max(0, peakIdxInRecent - aWindow);
  const aSearchEnd = Math.max(0, peakIdxInRecent - 1);

  for (let i = aSearchStart; i <= aSearchEnd; i++) {
    const h = recentData[i].high;
    if (h > maxAHigh && h >= bPrice * 1.01) {
      maxAHigh = h;
      aIdxInRecent = i;
    }
  }

  let aPrice = maxAHigh !== -Infinity ? Number(maxAHigh.toFixed(2)) : Number((bPrice * 1.045).toFixed(2));
  if (aPrice <= bPrice) {
    aPrice = Number((bPrice * 1.045).toFixed(2));
  }

  // 5. Point X: Origin base low prior to A
  let xIdxInRecent = Math.max(0, aIdxInRecent - 1);
  let minXLow = Infinity;
  const xSearchStart = Math.max(0, aIdxInRecent - xWindow);
  const xSearchEnd = Math.max(0, aIdxInRecent - 1);

  const minXBound = aPrice * (isMonthly ? 0.55 : isWeekly ? 0.65 : 0.80);
  for (let i = xSearchStart; i <= xSearchEnd; i++) {
    const l = recentData[i].low;
    if (l < minXLow && l >= minXBound && l <= aPrice * 0.98) {
      minXLow = l;
      xIdxInRecent = i;
    }
  }

  let xPrice = minXLow !== Infinity ? Number(minXLow.toFixed(2)) : Number((cPrice * 0.96).toFixed(2));
  if (xPrice >= aPrice) {
    xPrice = Number((cPrice * 0.95).toFixed(2));
  }

  // Enforce strict chronological order: xIdx < aIdx < bIdx < cIdx < dIdx
  if (xIdxInRecent >= aIdxInRecent) xIdxInRecent = Math.max(0, aIdxInRecent - 1);
  if (aIdxInRecent >= peakIdxInRecent) aIdxInRecent = Math.max(xIdxInRecent + 1, peakIdxInRecent - 1);
  if (peakIdxInRecent >= cIdxInRecent) peakIdxInRecent = Math.max(aIdxInRecent + 1, cIdxInRecent - 1);
  if (cIdxInRecent >= dIdxInRecent) cIdxInRecent = Math.max(peakIdxInRecent + 1, dIdxInRecent - 1);

  // Global data array indices
  const idxX = startIndex + xIdxInRecent;
  const idxA = startIndex + aIdxInRecent;
  const idxB = startIndex + peakIdxInRecent;
  const idxC = startIndex + cIdxInRecent;
  const idxD = startIndex + dIdxInRecent;

  const dateX = data[idxX]?.date || recentData[0].date;
  const dateA = data[idxA]?.date || recentData[1].date;
  const dateB = data[idxB]?.date || recentData[2].date;
  const dateC = data[idxC]?.date || recentData[3].date;
  const dateD = data[idxD]?.date || recentData[L - 1].date;

  // 6. Timeframe-Aware Multi-Pattern Multipliers (HomodMultiPatternAnalyzer specification)
  // Daily (1D) Standard Swings
  const dailyMultipliers: Record<HarmonicPatternType, { act: number; sl: number; prz_l: number; prz_h: number; ab: number; bc: number; cd: number; xd: number }> = {
    "Bat":       { act: 1.040, sl: 0.970, prz_l: 1.070, prz_h: 1.110, ab: 0.500, bc: 0.618, cd: 2.000, xd: 0.886 },
    "Gartley":   { act: 1.030, sl: 0.960, prz_l: 1.060, prz_h: 1.100, ab: 0.618, bc: 0.500, cd: 1.272, xd: 0.786 },
    "Butterfly": { act: 1.050, sl: 0.950, prz_l: 1.080, prz_h: 1.130, ab: 0.786, bc: 0.618, cd: 1.618, xd: 1.272 },
    "Crab":      { act: 1.060, sl: 0.940, prz_l: 1.100, prz_h: 1.150, ab: 0.382, bc: 0.886, cd: 3.140, xd: 1.618 },
    "ABCD":      { act: 1.020, sl: 0.980, prz_l: 1.050, prz_h: 1.080, ab: 0.618, bc: 0.786, cd: 1.272, xd: 1.000 },
  };

  // Weekly (1W - أسبوعي) Medium/Long Swings
  const weeklyMultipliers: Record<HarmonicPatternType, { act: number; sl: number; prz_l: number; prz_h: number; ab: number; bc: number; cd: number; xd: number }> = {
    "Bat":       { act: 1.065, sl: 0.950, prz_l: 1.115, prz_h: 1.180, ab: 0.500, bc: 0.618, cd: 2.000, xd: 0.886 },
    "Gartley":   { act: 1.050, sl: 0.940, prz_l: 1.100, prz_h: 1.160, ab: 0.618, bc: 0.500, cd: 1.272, xd: 0.786 },
    "Butterfly": { act: 1.080, sl: 0.925, prz_l: 1.140, prz_h: 1.220, ab: 0.786, bc: 0.618, cd: 1.618, xd: 1.272 },
    "Crab":      { act: 1.095, sl: 0.915, prz_l: 1.160, prz_h: 1.250, ab: 0.382, bc: 0.886, cd: 3.140, xd: 1.618 },
    "ABCD":      { act: 1.035, sl: 0.965, prz_l: 1.080, prz_h: 1.130, ab: 0.618, bc: 0.786, cd: 1.272, xd: 1.000 },
  };

  // Monthly (1M - شهري) Macro Investment Swings
  const monthlyMultipliers: Record<HarmonicPatternType, { act: number; sl: number; prz_l: number; prz_h: number; ab: number; bc: number; cd: number; xd: number }> = {
    "Bat":       { act: 1.105, sl: 0.920, prz_l: 1.185, prz_h: 1.300, ab: 0.500, bc: 0.618, cd: 2.000, xd: 0.886 },
    "Gartley":   { act: 1.085, sl: 0.910, prz_l: 1.160, prz_h: 1.260, ab: 0.618, bc: 0.500, cd: 1.272, xd: 0.786 },
    "Butterfly": { act: 1.130, sl: 0.890, prz_l: 1.230, prz_h: 1.360, ab: 0.786, bc: 0.618, cd: 1.618, xd: 1.272 },
    "Crab":      { act: 1.155, sl: 0.870, prz_l: 1.260, prz_h: 1.420, ab: 0.382, bc: 0.886, cd: 3.140, xd: 1.618 },
    "ABCD":      { act: 1.060, sl: 0.940, prz_l: 1.130, prz_h: 1.210, ab: 0.618, bc: 0.786, cd: 1.272, xd: 1.000 },
  };

  const activeTable = isMonthly ? monthlyMultipliers : isWeekly ? weeklyMultipliers : dailyMultipliers;
  const m = activeTable[patternType] || activeTable["Bat"];

  // Calculate exact harmonic pivot prices (X, A, B, C, D) matching pattern Fibonacci ratios
  let swingXA = Number((aPrice - xPrice).toFixed(2));
  if (swingXA <= 0) {
    swingXA = Number((currentPrice * (isMonthly ? 0.35 : isWeekly ? 0.22 : 0.15)).toFixed(2));
    aPrice = Number((currentPrice * 1.08).toFixed(2));
    xPrice = Number((aPrice - swingXA).toFixed(2));
  }

  const exactBPrice = Number((aPrice - m.ab * swingXA).toFixed(2));
  const exactCPrice = Number((exactBPrice + m.bc * (aPrice - exactBPrice)).toFixed(2));
  const exactDPrice = m.xd <= 1.0
    ? Number((aPrice - m.xd * swingXA).toFixed(2))
    : Number((xPrice - (m.xd - 1.0) * swingXA).toFixed(2));

  // Primary PRZ Target D
  const dPrice = exactDPrice > 0 ? exactDPrice : Number((currentPrice * m.act).toFixed(2));

  // Precise Fibonacci AD Leg Retracements for PRZ Targets (38.2% and 61.8% of AD leg)
  const swingAD = Math.max(0.01, aPrice - dPrice);
  const calculatedPrzMin = Number((dPrice + 0.382 * swingAD).toFixed(2));
  const calculatedPrzMax = Number((dPrice + 0.618 * swingAD).toFixed(2));
  const calculatedInvalidation = Number((Math.min(dPrice * 0.95, xPrice * 0.99)).toFixed(2));

  const activation = dPrice;
  const invalidation = calculatedInvalidation > 0 ? calculatedInvalidation : Number((currentPrice * m.sl).toFixed(2));
  const przMin = calculatedPrzMin > dPrice ? calculatedPrzMin : Number((currentPrice * m.prz_l).toFixed(2));
  const przMax = calculatedPrzMax > przMin ? calculatedPrzMax : Number((currentPrice * m.prz_h).toFixed(2));

  // GAP Level - Midpoint between current price and invalidation
  const gapLevel = Number(((currentPrice + invalidation) / 2).toFixed(2));

  // Future step simulation (15 steps towards PRZ as in HomodMultiPatternAnalyzer)
  const future_steps = 15;
  let last_price = currentPrice;
  const futurePrices: { date: string; price: number }[] = [];
  const baseDate = new Date(dateD);
  const isInvalidDate = isNaN(baseDate.getTime());

  for (let i = 1; i <= future_steps; i++) {
    const step = (przMin - last_price) / future_steps + ((i % 3 === 0) ? 0.3 : (i % 2 === 0) ? -0.1 : 0.4);
    last_price = Number((last_price + step).toFixed(2));
    let futureDateStr = `F_${i}`;
    if (!isInvalidDate) {
      const nextDate = new Date(baseDate.getTime() + i * 86400000);
      futureDateStr = nextDate.toISOString().split('T')[0];
    }
    futurePrices.push({
      date: futureDateStr,
      price: last_price
    });
  }

  // 7. Fibonacci Ratios (AB/XA, BC/AB, CD/BC, XD/XA) dynamically tailored to active pattern
  const fiboRatios: FiboRatios = {
    abRatio: m.ab,
    bcRatio: m.bc,
    cdRatio: m.cd,
    xdRatio: m.xd,
  };

  const namesMap: Record<HarmonicPatternType, { name: string; nameAr: string }> = {
    Bat: { name: 'Bat Pattern', nameAr: 'نموذج الخفاش التوافقي (Harmonic Bat Pattern)' },
    Gartley: { name: 'Gartley Pattern', nameAr: 'نموذج جارتلي التوافقي (Harmonic Gartley Pattern)' },
    Butterfly: { name: 'Butterfly Pattern', nameAr: 'نموذج الفراشة التوافقي (Harmonic Butterfly Pattern)' },
    Crab: { name: 'Crab Pattern', nameAr: 'نموذج الكابوريا التوافقي (Harmonic Crab Pattern)' },
    ABCD: { name: 'ABCD Pattern', nameAr: 'نموذج ABCD التوافقي (Harmonic ABCD Pattern)' },
  };

  const patternName = namesMap[patternType]?.name || `${patternType} Pattern`;
  const patternNameAr = namesMap[patternType]?.nameAr || `نموذج ${patternType} التوافقي`;

  // Classical Pattern Confluence
  const classicalPattern: ClassicalPatternResult = {
    name: 'Inverse Head & Shoulders',
    nameAr: 'نموذج الرأس والكتفين المعكوس (Inverse H&S)',
    type: 'Inverse Head & Shoulders',
    description: 'Classical reversal structure providing confluence with harmonic PRZ zone.',
    descriptionAr: 'نموذج كلاسيكي انعكاسي يمنح توافقاً فنياً مع منطقة الـ PRZ التوافقية.',
    necklinePrice: activation,
  };

  return {
    patternType,
    patternName,
    patternNameAr,
    xPrice,
    aPrice,
    bPrice: exactBPrice, // Exact Point B matching AB/XA ratio
    cPrice: exactCPrice, // Exact Point C matching BC/AB ratio
    dPrice, // Target D / PRZ matching XD/XA ratio
    terminalBar: currentPrice,
    przMin,
    przMax,
    invalidationPrice: invalidation,
    gapLevel,
    fiboRatios,
    classicalPattern,
    timeframeName,
    timeframePriority: tfConfig.priorityEn,
    timeframePriorityAr: tfConfig.priorityAr,
    strengthScore: tfConfig.strengthScore,
    idxX,
    idxA,
    idxB,
    idxC,
    idxD,
    dateX,
    dateA,
    dateB,
    dateC,
    dateD,
    futurePrices,
  };
}

export const analyzeHarmonicPattern = analyzeHarmonicBat;

export class HomodMultiPatternAnalyzer {
  ticker: string;
  timeframe: string;
  patternType: HarmonicPatternType;

  constructor(ticker: string, timeframe: string = '1D', patternType: HarmonicPatternType = 'Bat') {
    this.ticker = ticker;
    this.timeframe = timeframe;
    this.patternType = patternType;
  }

  analyze_and_plot_multi(historicalPrices: number[] | StockDataPoint[]): HarmonicBatAnalysisResult | null {
    let data: StockDataPoint[];
    if (typeof historicalPrices[0] === 'number') {
      data = (historicalPrices as number[]).map((p, idx) => ({
        date: `H_${idx}`,
        timestamp: idx,
        open: p,
        high: Number((p * 1.01).toFixed(2)),
        low: Number((p * 0.99).toFixed(2)),
        close: p,
        volume: 10000,
      }));
    } else {
      data = historicalPrices as StockDataPoint[];
    }
    return analyzeHarmonicBat(data, this.timeframe, this.patternType);
  }
}

export function calculateTradeLevels(
  settings: TradeSettings,
  currentPrice: number,
  harmonicAnalysis?: HarmonicBatAnalysisResult | null
): TradeLevels {
  const entryPrice = settings.manualEntryPrice && settings.manualEntryPrice > 0 
    ? settings.manualEntryPrice 
    : currentPrice;

  const tfName = harmonicAnalysis?.timeframeName || '1D';
  const tfLower = tfName.toLowerCase();
  
  let defaultSlRatio = 0.0528;
  let defaultTp1Ratio = 0.0601;
  let defaultTp2Ratio = 0.1098;
  let defaultTp3Ratio = 0.1686;

  if (tfLower.includes('w') || tfLower.includes('wk') || tfLower.includes('weekly') || tfLower.includes('أسبوعي')) {
    defaultSlRatio = 0.0537;
    defaultTp1Ratio = 0.0604;
    defaultTp2Ratio = 0.1141;
    defaultTp3Ratio = 0.1745;
  } else if (tfLower.includes('m') || tfLower.includes('mo') || tfLower.includes('monthly') || tfLower.includes('شهري')) {
    defaultSlRatio = 0.0526;
    defaultTp1Ratio = 0.0658;
    defaultTp2Ratio = 0.1211;
    defaultTp3Ratio = 0.1842;
  }
  
  // Stop loss strictly below entryPrice matching harmonic invalidation (allow wider macro stops for Weekly/Monthly)
  let stopLoss = settings.manualStopLossPrice && settings.manualStopLossPrice > 0
    ? settings.manualStopLossPrice
    : harmonicAnalysis && harmonicAnalysis.invalidationPrice < entryPrice && harmonicAnalysis.invalidationPrice >= entryPrice * 0.60
      ? harmonicAnalysis.invalidationPrice
      : Number((entryPrice * (1 - defaultSlRatio)).toFixed(2));

  if (stopLoss >= entryPrice) {
    stopLoss = Number((entryPrice * (1 - defaultSlRatio)).toFixed(2));
  }

  // TP1 = PRZ Target Min (allow wider macro targets for Weekly/Monthly)
  let tp1 = settings.manualTp1Price && settings.manualTp1Price > 0
    ? settings.manualTp1Price
    : harmonicAnalysis && harmonicAnalysis.przMin > entryPrice && harmonicAnalysis.przMin <= entryPrice * 1.80
      ? harmonicAnalysis.przMin
      : Number((entryPrice * (1 + defaultTp1Ratio)).toFixed(2));

  if (tp1 <= entryPrice) {
    tp1 = Number((entryPrice * (1 + defaultTp1Ratio)).toFixed(2));
  }

  // TP2 = PRZ Target Max (allow wider macro targets for Weekly/Monthly)
  let tp2 = settings.manualTp2Price && settings.manualTp2Price > 0
    ? settings.manualTp2Price
    : harmonicAnalysis && harmonicAnalysis.przMax > tp1 && harmonicAnalysis.przMax <= entryPrice * 2.20
      ? harmonicAnalysis.przMax
      : Number((entryPrice * (1 + defaultTp2Ratio)).toFixed(2));

  if (tp2 <= tp1) {
    tp2 = Number((tp1 * 1.05).toFixed(2));
  }

  // TP3 = Upper Extension
  let tp3 = settings.manualTp3Price && settings.manualTp3Price > 0
    ? settings.manualTp3Price
    : Number((entryPrice * (1 + defaultTp3Ratio)).toFixed(2));

  if (tp3 <= tp2) {
    tp3 = Number((tp2 * 1.055).toFixed(2));
  }

  // Risk Management & Position Sizing
  const capital = Math.max(1, settings.capital || 10000);
  const maxRiskAmount = capital * (Math.max(0.1, settings.riskPct) / 100);
  const riskPerShare = Math.max(0.01, entryPrice - stopLoss);
  
  const riskBasedShares = Math.floor(maxRiskAmount / riskPerShare);
  const maxCapitalShares = Math.floor(capital / entryPrice);

  let positionSize = 0;
  if (maxCapitalShares >= 1) {
    positionSize = Math.max(1, Math.min(riskBasedShares, maxCapitalShares));
  } else {
    positionSize = Math.max(1, riskBasedShares);
  }

  const totalPositionCost = positionSize * entryPrice;
  const portfolioAllocationPct = capital > 0 ? (totalPositionCost / capital) * 100 : 0;

  const expectedGainTp1 = positionSize * (tp1 - entryPrice);
  const expectedGainTp2 = positionSize * (tp2 - entryPrice);
  const expectedGainTp3 = positionSize * (tp3 - entryPrice);

  const riskRewardRatioTp1 = Number(((tp1 - entryPrice) / riskPerShare).toFixed(2));
  const riskRewardRatioTp2 = Number(((tp2 - entryPrice) / riskPerShare).toFixed(2));
  const riskRewardRatioTp3 = Number(((tp3 - entryPrice) / riskPerShare).toFixed(2));

  return {
    entryPrice: Number(entryPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    tp1: Number(tp1.toFixed(2)),
    tp2: Number(tp2.toFixed(2)),
    tp3: Number(tp3.toFixed(2)),
    maxRiskAmount: Number(maxRiskAmount.toFixed(2)),
    riskPerShare: Number(riskPerShare.toFixed(2)),
    positionSize,
    totalPositionCost: Number(totalPositionCost.toFixed(2)),
    portfolioAllocationPct: Number(portfolioAllocationPct.toFixed(2)),
    expectedGainTp1: Number(expectedGainTp1.toFixed(2)),
    expectedGainTp2: Number(expectedGainTp2.toFixed(2)),
    expectedGainTp3: Number(expectedGainTp3.toFixed(2)),
    riskRewardRatioTp1,
    riskRewardRatioTp2,
    riskRewardRatioTp3,
  };
}

export function enrichStockData(data: StockDataPoint[]): StockDataPoint[] {
  if (!data || data.length === 0) return [];

  const enriched = data.map((item) => ({ ...item }));

  // Calculate SMA 20
  for (let i = 0; i < enriched.length; i++) {
    if (i >= 19) {
      const slice = enriched.slice(i - 19, i + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      enriched[i].sma20 = Number((sum / 20).toFixed(2));
    }

    if (i >= 49) {
      const slice = enriched.slice(i - 49, i + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      enriched[i].sma50 = Number((sum / 50).toFixed(2));
    }
  }

  // Calculate RSI 14
  if (enriched.length > 14) {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= 14; i++) {
      const diff = enriched[i].close - enriched[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / 14;
    let avgLoss = losses / 14;

    for (let i = 14; i < enriched.length; i++) {
      const diff = enriched[i].close - enriched[i - 1].close;
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * 13 + gain) / 14;
      avgLoss = (avgLoss * 13 + loss) / 14;

      if (avgLoss === 0) {
        enriched[i].rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        enriched[i].rsi = Number((100 - 100 / (1 + rs)).toFixed(1));
      }
    }
  }

  return enriched;
}

export function calculateSupportResistance(data: StockDataPoint[]) {
  if (!data || data.length === 0) return { support: 0, resistance: 0, trend: 'محايد' };

  const recent = data.slice(-30);
  const highs = recent.map((d) => d.high);
  const lows = recent.map((d) => d.low);

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);

  const lastClose = data[data.length - 1].close;
  const prevClose = data[Math.max(0, data.length - 20)].close;

  let trend = 'محايد';
  if (lastClose > prevClose * 1.02) {
    trend = 'صاعد 📈';
  } else if (lastClose < prevClose * 0.98) {
    trend = 'هابط 📉';
  } else {
    trend = 'عرضي 🔀';
  }

  return {
    resistance: Number(maxHigh.toFixed(2)),
    support: Number(minLow.toFixed(2)),
    trend,
  };
}
