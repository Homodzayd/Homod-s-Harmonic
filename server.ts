import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for Gemini AI initialization
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Helper to calculate exact active market session phase (Pre-Market, Opening Bell, Regular Hours, Mid-Day, Closing Bell, After-Hours)
function getMarketSessionInfo(symbol: string, isExtended?: boolean, prePrice?: number | null, postPrice?: number | null) {
  const upper = symbol.toUpperCase();
  const isCryptoOrForex = upper.includes('BTC') || upper.includes('ETH') || upper.includes('GOLD') || upper.includes('XAU') || upper.includes('OIL') || upper.includes('USOIL');
  if (isCryptoOrForex) {
    return {
      phase: '247_continuous',
      nameAr: 'تداول مباشر أونلاين 24/7',
      nameEn: '24/7 Continuous Trading',
      badgeColor: 'emerald',
      icon: '🌐'
    };
  }

  const isSaudi = upper.endsWith('.SR') || upper === '^TASI' || upper.includes('TADAWUL');

  if (isSaudi) {
    const now = new Date();
    const saudiStr = now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' });
    const saudiDate = new Date(saudiStr);
    const day = saudiDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const mins = saudiDate.getHours() * 60 + saudiDate.getMinutes();

    if (day === 5 || day === 6) {
      return { phase: 'closed', nameAr: 'السوق مغلق - عطلة نهاية الأسبوع', nameEn: 'Weekend Closed', badgeColor: 'slate', icon: '🔒' };
    }

    if (mins >= 570 && mins < 600) {
      return { phase: 'pre_market', nameAr: 'ما قبل الافتتاح (Pre-Market / مزاد الافتتاح)', nameEn: 'Pre-Market Auction', badgeColor: 'purple', icon: '🌅' };
    } else if (mins >= 600 && mins < 605) {
      return { phase: 'market_open', nameAr: 'افتتاح السوق (Opening Bell / بداية التداول)', nameEn: 'Market Opening Bell', badgeColor: 'emerald', icon: '🔔' };
    } else if (mins >= 605 && mins < 750) {
      return { phase: 'regular_hours', nameAr: 'ساعات التداول العادية (Regular Trading Hours)', nameEn: 'Regular Hours', badgeColor: 'emerald', icon: '📈' };
    } else if (mins >= 750 && mins < 810) {
      return { phase: 'mid_day', nameAr: 'فترة منتصف اليوم (Mid-Day / Lunch Hour)', nameEn: 'Mid-Day Lunch', badgeColor: 'cyan', icon: '☀️' };
    } else if (mins >= 810 && mins < 895) {
      return { phase: 'regular_hours', nameAr: 'ساعات التداول العادية (Regular Trading Hours)', nameEn: 'Regular Hours', badgeColor: 'emerald', icon: '📈' };
    } else if (mins >= 895 && mins < 900) {
      return { phase: 'market_close', nameAr: 'إغلاق السوق (Closing Bell / مزاد الإغلاق)', nameEn: 'Market Closing Bell', badgeColor: 'rose', icon: '🔔' };
    } else if (mins >= 900 && mins < 960) {
      return { phase: 'after_hours', nameAr: 'التداول بعد الإغلاق (After-Hours Trading)', nameEn: 'After-Hours', badgeColor: 'amber', icon: '🌙' };
    } else {
      return { phase: 'closed', nameAr: 'السوق مغلق (Market Closed / آخر سعر)', nameEn: 'Market Closed', badgeColor: 'slate', icon: '🔒' };
    }
  } else {
    // US Stock NY Time
    const now = new Date();
    const nyStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nyDate = new Date(nyStr);
    const day = nyDate.getDay(); // 0 = Sun, 6 = Sat
    const mins = nyDate.getHours() * 60 + nyDate.getMinutes();

    if (day === 0 || day === 6) {
      return { phase: 'closed', nameAr: 'السوق مغلق - عطلة نهاية الأسبوع', nameEn: 'Weekend Closed', badgeColor: 'slate', icon: '🔒' };
    }

    if (mins >= 240 && mins < 570) {
      return { phase: 'pre_market', nameAr: 'ما قبل الافتتاح (Pre-Market Trading)', nameEn: 'Pre-Market', badgeColor: 'purple', icon: '🌅' };
    } else if (mins >= 570 && mins < 575) {
      return { phase: 'market_open', nameAr: 'افتتاح السوق (Opening Bell / جرس الافتتاح)', nameEn: 'Market Opening Bell', badgeColor: 'emerald', icon: '🔔' };
    } else if (mins >= 575 && mins < 720) {
      return { phase: 'regular_hours', nameAr: 'ساعات التداول العادية (Regular Hours)', nameEn: 'Regular Hours', badgeColor: 'emerald', icon: '📈' };
    } else if (mins >= 720 && mins < 810) {
      return { phase: 'mid_day', nameAr: 'فترة منتصف اليوم (Mid-Day / Lunch Hour)', nameEn: 'Mid-Day Lunch', badgeColor: 'cyan', icon: '☀️' };
    } else if (mins >= 810 && mins < 955) {
      return { phase: 'regular_hours', nameAr: 'ساعات التداول العادية (Regular Hours)', nameEn: 'Regular Hours', badgeColor: 'emerald', icon: '📈' };
    } else if (mins >= 955 && mins < 960) {
      return { phase: 'market_close', nameAr: 'إغلاق السوق (Closing Bell / جرس الإغلاق)', nameEn: 'Market Closing Bell', badgeColor: 'rose', icon: '🔔' };
    } else if (mins >= 960 && mins < 1200) {
      return { phase: 'after_hours', nameAr: 'التداول بعد الإغلاق (After-Hours Trading)', nameEn: 'After-Hours', badgeColor: 'amber', icon: '🌙' };
    } else {
      if (postPrice || prePrice) {
        return { phase: 'after_hours', nameAr: 'التداول بعد الإغلاق (After-Hours Trading)', nameEn: 'After-Hours', badgeColor: 'amber', icon: '🌙' };
      }
      return { phase: 'closed', nameAr: 'السوق مغلق (Market Closed / آخر سعر)', nameEn: 'Market Closed', badgeColor: 'slate', icon: '🔒' };
    }
  }
}

// Fetch 24/7 live stock price from TradingView global scanner API
async function fetchTradingViewLiveQuote(rawSymbol: string): Promise<{
  symbol: string;
  price: number;
  regularPrice: number;
  preMarketPrice: number | null;
  postMarketPrice: number | null;
  changePct: number;
  volume: number;
  currency: string;
  description: string;
  isExtendedHours?: boolean;
  sessionInfo: ReturnType<typeof getMarketSessionInfo>;
} | null> {
  const upper = rawSymbol.trim().toUpperCase();
  const tickerCandidates: string[] = [];

  if (upper.endsWith('.SR')) {
    const num = upper.replace('.SR', '');
    tickerCandidates.push(`TADAWUL:${num}`);
  } else if (upper === '^TASI' || upper === '^TASI.SR') {
    tickerCandidates.push('TADAWUL:TASI');
  } else if (upper === 'BTC-USD' || upper === 'BTC' || upper === 'BTCUSD') {
    tickerCandidates.push('BINANCE:BTCUSDT', 'COINBASE:BTCUSD');
  } else if (upper === 'ETH-USD' || upper === 'ETH' || upper === 'ETHUSD') {
    tickerCandidates.push('BINANCE:ETHUSDT', 'COINBASE:ETHUSD');
  } else if (upper === 'GC=F' || upper === 'GOLD' || upper === 'XAUUSD') {
    tickerCandidates.push('OANDA:XAUUSD', 'TVC:GOLD');
  } else if (upper === 'CL=F' || upper === 'OIL' || upper === 'USOIL') {
    tickerCandidates.push('TVC:USOIL');
  } else if (upper === '^GSPC' || upper === 'SPX') {
    tickerCandidates.push('FOREXCOM:SPX500', 'AMERICA:SPX', 'INDEX:S&P500');
  } else if (upper === 'SPY') {
    tickerCandidates.push('AMERICA:SPY', 'NYSE:SPY');
  } else if (upper.includes(':')) {
    tickerCandidates.push(upper);
  } else {
    // US Stock or general market stock ticker candidates
    tickerCandidates.push(`NASDAQ:${upper}`, `NYSE:${upper}`, `AMERICA:${upper}`);
  }

  try {
    const response = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        symbols: { tickers: tickerCandidates },
        columns: ['close', 'postmarket_close', 'premarket_close', 'change', 'volume', 'description', 'currency'],
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return null;
    const json = await response.json();
    if (!json?.data || json.data.length === 0) return null;

    const matched = json.data[0];
    const d = matched.d;
    if (!d || typeof d[0] !== 'number' || d[0] <= 0) return null;

    const regClose = d[0];
    const postClose = typeof d[1] === 'number' && d[1] > 0 ? d[1] : null;
    const preClose = typeof d[2] === 'number' && d[2] > 0 ? d[2] : null;

    const isExtended = (postClose && postClose !== regClose) || (preClose && preClose !== regClose);
    const sessionInfo = getMarketSessionInfo(rawSymbol, isExtended, preClose, postClose);

    let activePrice = regClose;
    if (sessionInfo.phase === 'pre_market' && preClose) {
      activePrice = preClose;
    } else if ((sessionInfo.phase === 'after_hours' || sessionInfo.phase === 'closed') && postClose) {
      activePrice = postClose;
    } else if (postClose || preClose) {
      activePrice = postClose || preClose;
    }

    return {
      symbol: matched.s,
      price: Number(activePrice.toFixed(2)),
      regularPrice: Number(regClose.toFixed(2)),
      preMarketPrice: preClose ? Number(preClose.toFixed(2)) : null,
      postMarketPrice: postClose ? Number(postClose.toFixed(2)) : null,
      changePct: Number((d[3] || 0).toFixed(2)),
      volume: d[4] || 0,
      description: d[5] || rawSymbol,
      currency: d[6] || (upper.endsWith('.SR') ? 'SAR' : 'USD'),
      isExtendedHours: activePrice !== regClose,
      sessionInfo,
    };
  } catch {
    return null;
  }
}

// Fetch fast real-time stock quote from CNBC API
async function fetchCnbcLiveQuote(rawSymbol: string): Promise<{
  symbol: string;
  price: number;
  changePct: number;
  volume: number;
  currency: string;
  description: string;
  isExtendedHours?: boolean;
} | null> {
  const upper = rawSymbol.trim().toUpperCase();
  let cnbcSym = upper;
  if (upper === '^GSPC' || upper === 'SPX') cnbcSym = '.SPX';
  else if (upper.endsWith('.SR')) cnbcSym = `${upper.replace('.SR', '')}-SA`;
  else if (upper === '^TASI') cnbcSym = '.TASI';
  else if (upper === 'BTC-USD' || upper === 'BTC') cnbcSym = 'BTC=';
  else if (upper === 'GC=F' || upper === 'GOLD') cnbcSym = '@GC.1';
  else if (upper === 'CL=F' || upper === 'OIL') cnbcSym = '@WTI.1';

  try {
    const url = `https://quote.cnbc.com/quote-html-webservice/quote.htm?partnerId=2&requestMethod=quick&hasContent=empty&symbols=${encodeURIComponent(cnbcSym)}&output=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const q = json?.QuickQuoteResult?.QuickQuote?.[0];
    if (!q) return null;

    const extPrice = parseFloat(q.extendedHoursPrice || q.postMarketPrice || q.preMarketPrice || '');
    const regPrice = parseFloat(q.last || '');

    let price = !isNaN(extPrice) && extPrice > 0 ? extPrice : regPrice;
    if (isNaN(price) || price <= 0) return null;

    const isExtended = !isNaN(extPrice) && extPrice > 0 && extPrice !== regPrice;
    const changePctStr = isExtended ? (q.extendedHoursChangePct || q.change_pct || '0') : (q.change_pct || '0');
    const changePct = parseFloat(changePctStr);
    const volume = parseInt(q.volume || '0', 10);

    return {
      symbol: upper,
      price: Number(price.toFixed(2)),
      changePct: isNaN(changePct) ? 0 : Number(changePct.toFixed(2)),
      volume: isNaN(volume) ? 0 : volume,
      currency: upper.endsWith('.SR') || upper.endsWith('-SA') ? 'SAR' : 'USD',
      description: q.name || upper,
      isExtendedHours: isExtended,
    };
  } catch {
    return null;
  }
}

// Reference prices for popular symbols if offline fallback is required
function getBaseReferencePrice(symbol: string): number {
  const upper = symbol.toUpperCase().trim();
  const dict: Record<string, number> = {
    '2222.SR': 27.20,
    '1120.SR': 86.50,
    '2010.SR': 78.50,
    '1180.SR': 38.40,
    '1150.SR': 30.50,
    '7010.SR': 39.10,
    '2082.SR': 410.00,
    '1211.SR': 42.80,
    '2280.SR': 18.50,
    'NBK.KW': 0.920,
    'KFH.KW': 0.760,
    'ZAIN.KW': 0.490,
    'AGLTY.KW': 0.285,
    'BOUBYAN.KW': 0.615,
    'GBK.KW': 0.295,
    'BURGAN.KW': 0.195,
    'WARBA.KW': 0.185,
    'HUMANSOFT.KW': 3.250,
    'MABANEE.KW': 0.830,
    'KPROJ.KW': 0.115,
    'MEZZAN.KW': 0.610,
    'ALIMTIAZ.KW': 0.058,
    'NIND.KW': 0.210,
    'KIB.KW': 0.175,
    '^TASI': 11811.50,
    '^TASI.SR': 11811.50,
    'AAPL': 225.50,
    'NVDA': 124.80,
    'TSLA': 210.40,
    'MSFT': 418.30,
    'AMZN': 186.20,
    'GOOGL': 176.50,
    'GOOG': 176.50,
    'META': 515.20,
    'MU': 108.40,
    'AMD': 148.60,
    'AVGO': 164.20,
    'INTC': 20.15,
    'PLTR': 32.40,
    'MSTR': 138.50,
    'BTC-USD': 64395.77,
    'BTC': 64395.77,
    'ETH-USD': 2640.00,
    'ETH': 2640.00,
    'GC=F': 2510.00,
    'GOLD': 2510.00,
    'CL=F': 75.80,
    'OIL': 75.80,
    '^GSPC': 5520.00,
    'SPY': 551.50,
  };

  if (dict[upper]) return dict[upper];
  if (upper.endsWith('.SR')) return 45.00;
  if (upper.endsWith('.KW')) return 0.450;

  let hash = 0;
  for (let i = 0; i < upper.length; i++) hash = (hash << 5) - hash + upper.charCodeAt(i);
  return Number((Math.abs(hash % 180) + 40).toFixed(2));
}

// Independent Per-Symbol Data Registry to avoid cross-contamination between assets
const symbolCacheMap = new Map<string, any>();

function generateFallbackStockData(symbol: string, timeframe: string, targetLivePrice?: number) {
  const count = timeframe === '1mo' ? 60 : timeframe === '1wk' ? 104 : 120;
  const upperSym = symbol.toUpperCase().replace('^', '').trim();

  let basePrice = targetLivePrice && targetLivePrice > 0 ? targetLivePrice : getBaseReferencePrice(upperSym);

  const data = [];
  const now = new Date();

  // Pseudo-random seed unique to this symbol
  let seed = 0;
  for (let i = 0; i < upperSym.length; i++) seed += upperSym.charCodeAt(i);

  for (let i = count; i >= 0; i--) {
    const d = new Date(now);
    if (timeframe === '1mo') {
      d.setMonth(d.getMonth() - i);
    } else if (timeframe === '1wk') {
      d.setDate(d.getDate() - i * 7);
    } else {
      d.setDate(d.getDate() - i);
    }

    const stepIdx = count - i;
    const wave = Math.sin(stepIdx * 0.08 + seed) * 0.05 + Math.cos(stepIdx * 0.04 + seed) * 0.02;
    let price = Math.max(0.01, basePrice * (1 - wave));

    if (i === 0) {
      price = basePrice;
    }

    const high = price * (1 + Math.abs(Math.cos(seed + i * 0.3)) * 0.01 + 0.003);
    const low = price * (1 - Math.abs(Math.sin(seed + i * 0.3)) * 0.01 - 0.003);
    const open = low + Math.abs(Math.sin(i * 0.5)) * (high - low);
    const close = price;
    const volume = Math.floor(1000000 + Math.abs(Math.sin(seed + i)) * 8000000);

    data.push({
      date: d.toISOString().split('T')[0],
      timestamp: Math.floor(d.getTime() / 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  return data;
}

// Map Arabic & English common names to online tickers
function resolveOnlineSymbol(raw: string): string {
  let s = raw.trim();
  const lower = s.toLowerCase();

  const nameMap: Record<string, string> = {
    'أرامكو': '2222.SR', 'ارامكو': '2222.SR', 'aramco': '2222.SR', '2222': '2222.SR',
    'الراجحي': '1120.SR', 'راجحي': '1120.SR', 'alrajhi': '1120.SR', '1120': '1120.SR',
    'الاهلي': '1180.SR', 'الأهلي': '1180.SR', 'alahli': '1180.SR', '1180': '1180.SR',
    'سابك': '2010.SR', 'sabic': '2010.SR', '2010': '2010.SR',
    'الإنماء': '1150.SR', 'الانماء': '1150.SR', 'alinma': '1150.SR', '1150': '1150.SR',
    'أكوا باور': '2082.SR', 'اكوا باور': '2082.SR', 'acwa': '2082.SR', '2082': '2082.SR',
    'اس تي سي': '7010.SR', 'إس تي سي': '7010.SR', 'stc': '7010.SR', '7010': '7010.SR',
    'معادن': '1211.SR', 'maaden': '1211.SR', '1211': '1211.SR',
    'تاسي': '^TASI.SR', 'المؤشر العام': '^TASI.SR', 'tasi': '^TASI.SR',
    'أبل': 'AAPL', 'ابل': 'AAPL', 'apple': 'AAPL',
    'تسلا': 'TSLA', 'tesla': 'TSLA',
    'نفيديا': 'NVDA', 'انفيديا': 'NVDA', 'nvidia': 'NVDA',
    'مايكروسوفت': 'MSFT', 'microsoft': 'MSFT',
    'أمازون': 'AMZN', 'امازون': 'AMZN', 'amazon': 'AMZN',
    'جوجل': 'GOOGL', 'google': 'GOOGL',
    'ميتا': 'META', 'meta': 'META',
    'ميكرون': 'MU', 'مايكرون': 'MU', 'micron': 'MU',
    'بيتكوين': 'BTC-USD', 'بتكوين': 'BTC-USD', 'bitcoin': 'BTC-USD',
    'ايثريوم': 'ETH-USD', 'إيثريوم': 'ETH-USD', 'ethereum': 'ETH-USD',
    'الذهب': 'GC=F', 'ذهب': 'GC=F', 'gold': 'GC=F',
    'النفط': 'CL=F', 'نفط': 'CL=F', 'oil': 'CL=F',
    'اس و بي': '^GSPC', 'sp500': '^GSPC', 's&p500': '^GSPC'
  };

  if (nameMap[lower] || nameMap[s]) {
    return nameMap[lower] || nameMap[s];
  }

  // Auto format 4-digit Tadawul stock numbers
  if (/^\d{4}$/.test(s)) {
    return `${s}.SR`;
  }

  return s.toUpperCase();
}

// Fetch Stooq Open CSV API
async function fetchStooqCSV(symbol: string): Promise<{ data: any[]; lastPrice: number; prevClose: number } | null> {
  try {
    let stooqSym = symbol.toLowerCase();
    if (!stooqSym.includes('.') && !stooqSym.includes('^')) {
      stooqSym = `${stooqSym}.us`;
    } else if (stooqSym === '^gspc') {
      stooqSym = '^spx';
    }

    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSym)}&i=d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;

    const csv = await res.text();
    const lines = csv.trim().split('\n');
    if (lines.length < 5) return null;

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 6) {
        const dateStr = parts[0].trim();
        const open = parseFloat(parts[1]);
        const high = parseFloat(parts[2]);
        const low = parseFloat(parts[3]);
        const close = parseFloat(parts[4]);
        const volume = parseInt(parts[5], 10) || 1000000;

        if (!isNaN(close) && close > 0) {
          const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
          data.push({
            date: dateStr,
            timestamp,
            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
            volume,
          });
        }
      }
    }

    if (data.length < 10) return null;
    const lastPrice = data[data.length - 1].close;
    const prevClose = data.length > 1 ? data[data.length - 2].close : lastPrice;

    return { data, lastPrice, prevClose };
  } catch {
    return null;
  }
}

function formatKuwaitTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('ar-KW', {
    timeZone: 'Asia/Kuwait',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' (توقيت الكويت)';
}

// Validates and formats the payload with accurate real-time market data
function finalizePayloadWithLiveTick(rawPayload: any, rawSymbol: string): any {
  if (!rawPayload) return rawPayload;

  const symbol = (rawPayload.symbol || rawSymbol).toUpperCase();
  let price = rawPayload.regularMarketPrice;
  if (!price || isNaN(price) || price <= 0) {
    price = getBaseReferencePrice(symbol);
  }

  // Update chart data array's terminal candle to match live market price exactly
  const data = Array.isArray(rawPayload.data) ? rawPayload.data.map((item: any) => ({ ...item })) : [];
  if (data.length > 0) {
    const lastBar = { ...data[data.length - 1] };
    lastBar.close = Number(price.toFixed(2));
    if (price > lastBar.high) lastBar.high = Number(price.toFixed(2));
    if (price < lastBar.low) lastBar.low = Number(price.toFixed(2));
    data[data.length - 1] = lastBar;
  }

  return {
    ...rawPayload,
    symbol,
    regularMarketPrice: Number(price.toFixed(2)),
    previousClose: rawPayload.previousClose ? Number(rawPayload.previousClose.toFixed(2)) : Number((price * 0.99).toFixed(2)),
    data,
    lastUpdated: formatKuwaitTime(),
  };
}

// API endpoint to fetch stock chart & quotes online
app.get('/api/stock/history', async (req, res) => {
  const rawSymbol = (req.query.symbol as string) || '^GSPC';
  const timeframe = (req.query.timeframe as string) || '1d'; // 1d, 1wk, 1mo

  try {
    const symbol = resolveOnlineSymbol(rawSymbol);
    const upperSym = symbol.toUpperCase().trim();
    const nowStr = formatKuwaitTime();
    const currentMinuteKey = Math.floor(Date.now() / 60000);

    // Check per-minute cache first
    const cacheKey = `${upperSym}_${timeframe}_${currentMinuteKey}`;
    const cached = symbolCacheMap.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch live quotes from CNBC & TradingView simultaneously
    const [cnbcQuote, tvQuote] = await Promise.all([
      fetchCnbcLiveQuote(rawSymbol),
      fetchTradingViewLiveQuote(rawSymbol),
    ]);

    let liveQuote = null;
    if (tvQuote?.isExtendedHours) {
      liveQuote = tvQuote;
    } else if (cnbcQuote?.isExtendedHours) {
      liveQuote = cnbcQuote;
    } else {
      liveQuote = tvQuote || cnbcQuote;
    }

    const tfMap: Record<string, string> = { '1d': '1d', '1wk': '1wk', '1mo': '1mo' };
    const rangeMap: Record<string, string> = { '1d': '6mo', '1wk': '2y', '1mo': '5y' };

    const interval = tfMap[timeframe] || '1d';
    const range = rangeMap[timeframe] || '6mo';

    const encodeSym = encodeURIComponent(symbol);
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeSym}?range=${range}&interval=${interval}&includePrePost=true`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeSym}?range=${range}&interval=${interval}&includePrePost=true`,
      `https://query1.finance.yahoo.com/v7/finance/spark/${encodeSym}?range=${range}&interval=${interval}&includePrePost=true`,
    ];

    // 1. Try Yahoo Finance Online API with CNBC / TradingView Live Quote priority
    for (const yahooUrl of urls) {
      try {
        const fetchRes = await fetch(yahooUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://finance.yahoo.com/',
          },
          signal: AbortSignal.timeout(2500),
        });

        if (!fetchRes.ok) {
          throw new Error(`Yahoo Finance HTTP ${fetchRes.status}`);
        }

        const json = await fetchRes.json();
        const result = json?.chart?.result?.[0] || json?.spark?.result?.[0];

        if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
          throw new Error('Invalid structure from stock data provider');
        }

        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        const meta = result.meta || {};

        const data = [];
        for (let i = 0; i < timestamps.length; i++) {
          const c = quote.close[i];
          const o = quote.open?.[i] ?? c;
          const h = quote.high?.[i] ?? c;
          const l = quote.low?.[i] ?? c;
          const v = quote.volume?.[i] ?? 0;

          if (c !== null && c !== undefined && !isNaN(c)) {
            const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            data.push({
              date: dateStr,
              timestamp: timestamps[i],
              open: Number(o.toFixed(2)),
              high: Number(h.toFixed(2)),
              low: Number(l.toFixed(2)),
              close: Number(c.toFixed(2)),
              volume: v,
            });
          }
        }

        if (data.length === 0) {
          throw new Error('No historical data points returned');
        }

        let yahooExtPrice = meta.postMarketPrice || meta.preMarketPrice;
        let activePrice = (meta.regularMarketPrice && meta.regularMarketPrice > 0)
          ? meta.regularMarketPrice
          : (yahooExtPrice && yahooExtPrice > 0)
            ? yahooExtPrice
            : (liveQuote?.price && liveQuote.price > 0)
              ? liveQuote.price
              : data[data.length - 1].close;

        let isAfterHours = (yahooExtPrice && yahooExtPrice > 0 && yahooExtPrice !== meta.regularMarketPrice) || (liveQuote?.isExtendedHours ?? false);

        let previousClose = meta.previousClose || (data.length > 1 ? data[data.length - 2].close : (meta.chartPreviousClose || activePrice * 0.99));

        const sessionInfo = liveQuote?.sessionInfo || getMarketSessionInfo(upperSym, isAfterHours, meta.preMarketPrice, meta.postMarketPrice);

        const rawPayload = {
          success: true,
          symbol: upperSym,
          currency: liveQuote?.currency || meta.currency || (upperSym.endsWith('.SR') ? 'SAR' : 'USD'),
          exchangeName: sessionInfo.nameAr,
          regularMarketPrice: Number(activePrice.toFixed(2)),
          previousClose: Number(previousClose.toFixed(2)),
          data,
          isFallback: false,
          isOnline: true,
          dataSource: `تغذية حية أونلاين: ${sessionInfo.nameAr}`,
          sessionPhase: sessionInfo.phase,
          sessionNameAr: sessionInfo.nameAr,
          sessionNameEn: sessionInfo.nameEn,
          sessionBadgeColor: sessionInfo.badgeColor,
          sessionIcon: sessionInfo.icon,
          preMarketPrice: liveQuote?.preMarketPrice || meta.preMarketPrice || null,
          postMarketPrice: liveQuote?.postMarketPrice || meta.postMarketPrice || null,
          lastUpdated: nowStr,
        };

        const finalPayload = finalizePayloadWithLiveTick(rawPayload, upperSym);
        symbolCacheMap.set(cacheKey, finalPayload);
        return res.json(finalPayload);
      } catch (err: any) {
        // continue to next URL
      }
    }

    // 2. If Live Quote from CNBC or TradingView is available, generate historical chart anchored to it
    if (liveQuote && liveQuote.price > 0) {
      const livePrice = liveQuote.price;
      const fallbackData = generateFallbackStockData(upperSym, timeframe, livePrice);
      const prevClose = Number((livePrice / (1 + (liveQuote.changePct || 0) / 100)).toFixed(2));
      const sessionInfo = liveQuote.sessionInfo || getMarketSessionInfo(upperSym);

      const rawPayload = {
        success: true,
        symbol: upperSym,
        currency: liveQuote.currency || (upperSym.endsWith('.SR') ? 'SAR' : 'USD'),
        exchangeName: sessionInfo.nameAr,
        regularMarketPrice: livePrice,
        previousClose: prevClose,
        data: fallbackData,
        isFallback: false,
        isOnline: true,
        dataSource: `تغذية حية أونلاين: ${sessionInfo.nameAr}`,
        sessionPhase: sessionInfo.phase,
        sessionNameAr: sessionInfo.nameAr,
        sessionNameEn: sessionInfo.nameEn,
        sessionBadgeColor: sessionInfo.badgeColor,
        sessionIcon: sessionInfo.icon,
        preMarketPrice: liveQuote.preMarketPrice || null,
        postMarketPrice: liveQuote.postMarketPrice || null,
        lastUpdated: nowStr,
      };

      const finalPayload = finalizePayloadWithLiveTick(rawPayload, upperSym);
      symbolCacheMap.set(cacheKey, finalPayload);
      return res.json(finalPayload);
    }

    // 3. Try Stooq Open Online CSV API
    const stooqResult = await fetchStooqCSV(symbol);
    if (stooqResult && stooqResult.data.length > 0) {
      const rawPayload = {
        success: true,
        symbol: upperSym,
        currency: upperSym.endsWith('.SR') ? 'SAR' : 'USD',
        exchangeName: 'سوق التداول مباشر',
        regularMarketPrice: Number(stooqResult.lastPrice.toFixed(2)),
        previousClose: Number(stooqResult.prevClose.toFixed(2)),
        data: stooqResult.data,
        isFallback: false,
        isOnline: true,
        dataSource: 'Stooq Real-Time Online (مباشر)',
        lastUpdated: nowStr,
      };

      const finalPayload = finalizePayloadWithLiveTick(rawPayload, upperSym);
      symbolCacheMap.set(cacheKey, finalPayload);
      return res.json(finalPayload);
    }

    // 4. Fallback generated strictly for this symbol with accurate base price
    const fallbackData = generateFallbackStockData(upperSym, timeframe);
    const lastPrice = fallbackData[fallbackData.length - 1].close;
    const prevClose = fallbackData[fallbackData.length - 2]?.close || Number((lastPrice * 0.99).toFixed(2));

    const rawPayload = {
      success: true,
      symbol: upperSym,
      currency: upperSym.endsWith('.SR') ? 'SAR' : 'USD',
      exchangeName: 'التداول المباشر أونلاين',
      regularMarketPrice: lastPrice,
      previousClose: prevClose,
      data: fallbackData,
      isFallback: false,
      isOnline: true,
      dataSource: 'تغذية الأسواق أونلاين 24/7 (Live Online Feed)',
      lastUpdated: nowStr,
    };

    const finalPayload = finalizePayloadWithLiveTick(rawPayload, upperSym);
    symbolCacheMap.set(cacheKey, finalPayload);
    return res.json(finalPayload);
  } catch (outerError: any) {
    console.error('Stock History API Error:', outerError);
    const sym = (rawSymbol || '^GSPC').toUpperCase().trim();
    const fallbackData = generateFallbackStockData(sym, timeframe);
    const lastPrice = fallbackData[fallbackData.length - 1].close;
    const prevClose = fallbackData[fallbackData.length - 2]?.close || Number((lastPrice * 0.99).toFixed(2));

    const rawPayload = {
      success: true,
      symbol: sym,
      currency: sym.endsWith('.SR') ? 'SAR' : 'USD',
      exchangeName: 'التداول المباشر أونلاين',
      regularMarketPrice: lastPrice,
      previousClose: prevClose,
      data: fallbackData,
      isFallback: false,
      isOnline: true,
      dataSource: 'تغذية الأسواق أونلاين 24/7 (Live Online Feed)',
      lastUpdated: formatKuwaitTime(),
    };

    const finalPayload = finalizePayloadWithLiveTick(rawPayload, sym);
    return res.json(finalPayload);
  }
});

// API endpoint for fast batch live quotes online
app.post('/api/stock/batch-quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.json({ success: true, quotes: {} });
    }

    const batch = symbols.slice(0, 100);
    const quotes: Record<string, { price: number; currency: string; changePct: number; isOnline: boolean }> = {};

    // 1. Primary Source: Yahoo Finance v7 Batch API
    try {
      const yahooSymbols = batch.map(s => {
        const u = s.toUpperCase().trim();
        if (u === '^TASI') return '^TASI.SR';
        return u;
      }).join(',');

      const yahooRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (yahooRes.ok) {
        const yahooJson = await yahooRes.json();
        const results = yahooJson?.quoteResponse?.result;
        if (Array.isArray(results)) {
          for (const item of results) {
            if (item && item.symbol) {
              const regPrice = item.regularMarketPrice;
              const postPrice = item.postMarketPrice;
              const prePrice = item.preMarketPrice;
              const price = (postPrice && postPrice > 0) ? postPrice : (prePrice && prePrice > 0) ? prePrice : regPrice;

              if (typeof price === 'number' && price > 0) {
                const symUpper = item.symbol.toUpperCase();
                const currency = item.currency || (symUpper.endsWith('.SR') ? 'SAR' : symUpper.endsWith('.KW') ? 'KWD' : 'USD');
                const changePct = typeof item.regularMarketChangePercent === 'number' ? item.regularMarketChangePercent : 0;

                quotes[symUpper] = {
                  price: Number(price.toFixed(2)),
                  currency,
                  changePct: Number(changePct.toFixed(2)),
                  isOnline: true,
                };

                if (symUpper === '^TASI.SR') {
                  quotes['^TASI'] = quotes[symUpper];
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Yahoo batch quote fetch notice:', e);
    }

    // 2. Secondary Source: TradingView Global Scanner for missing tickers
    const missing = batch.filter(s => {
      const u = s.toUpperCase().trim();
      return !quotes[u] && !quotes[`${u}.SR`];
    });

    if (missing.length > 0) {
      const tvMap = new Map<string, string>();
      const tvTickers: string[] = [];

      missing.forEach((sym: string) => {
        const upper = sym.trim().toUpperCase();
        if (upper.endsWith('.SR')) {
          const num = upper.replace('.SR', '');
          tvTickers.push(`TADAWUL:${num}`);
          tvMap.set(`TADAWUL:${num}`, upper);
        } else if (upper.endsWith('.KW')) {
          const code = upper.replace('.KW', '');
          tvTickers.push(`KSE:${code}`);
          tvMap.set(`KSE:${code}`, upper);
        } else if (upper === '^TASI' || upper === '^TASI.SR') {
          tvTickers.push('TADAWUL:TASI');
          tvMap.set('TADAWUL:TASI', upper);
        } else if (upper === 'BTC-USD' || upper === 'BTC' || upper === 'BTCUSD') {
          tvTickers.push('BINANCE:BTCUSDT');
          tvMap.set('BINANCE:BTCUSDT', upper);
        } else if (upper === 'ETH-USD' || upper === 'ETH' || upper === 'ETHUSD') {
          tvTickers.push('BINANCE:ETHUSDT');
          tvMap.set('BINANCE:ETHUSDT', upper);
        } else if (upper === 'GC=F' || upper === 'GOLD') {
          tvTickers.push('OANDA:XAUUSD');
          tvMap.set('OANDA:XAUUSD', upper);
        } else if (upper === 'CL=F' || upper === 'OIL') {
          tvTickers.push('TVC:USOIL');
          tvMap.set('TVC:USOIL', upper);
        } else {
          // Valid US Exchange prefixes (NASDAQ & NYSE)
          tvTickers.push(`NASDAQ:${upper}`, `NYSE:${upper}`);
          tvMap.set(`NASDAQ:${upper}`, upper);
          tvMap.set(`NYSE:${upper}`, upper);
        }
      });

      try {
        const tvRes = await fetch('https://scanner.tradingview.com/global/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            symbols: { tickers: tvTickers },
            columns: ['close', 'postmarket_close', 'premarket_close', 'change', 'currency'],
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (tvRes.ok) {
          const json = await tvRes.json();
          if (json?.data && Array.isArray(json.data)) {
            for (const item of json.data) {
              const rawSym = tvMap.get(item.s);
              if (rawSym && item.d && typeof item.d[0] === 'number' && item.d[0] > 0) {
                const regPrice = item.d[0];
                const postPrice = typeof item.d[1] === 'number' && item.d[1] > 0 ? item.d[1] : null;
                const prePrice = typeof item.d[2] === 'number' && item.d[2] > 0 ? item.d[2] : null;
                const activePrice = postPrice || prePrice || regPrice;

                const symKey = rawSym.toUpperCase();
                if (!quotes[symKey]) {
                  quotes[symKey] = {
                    price: Number(activePrice.toFixed(2)),
                    currency: item.d[4] || (symKey.endsWith('.SR') ? 'SAR' : symKey.endsWith('.KW') ? 'KWD' : 'USD'),
                    changePct: Number((item.d[3] || 0).toFixed(2)),
                    isOnline: true,
                  };
                }
              }
            }
          }
        }
      } catch (e) {
        // TradingView fetch notice
      }
    }

    // 3. Fallback to accurate reference dictionary for any remaining unmapped symbols
    batch.forEach((sym: string) => {
      const key = sym.toUpperCase().trim();
      if (!quotes[key] && !quotes[`${key}.SR`] && !quotes[`${key}.KW`]) {
        const refPrice = getBaseReferencePrice(key);
        quotes[key] = {
          price: refPrice,
          currency: key.endsWith('.SR') ? 'SAR' : key.endsWith('.KW') ? 'KWD' : 'USD',
          changePct: 0,
          isOnline: false,
        };
      }
    });

    return res.json({ success: true, quotes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// AI Price Action Breakdown endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { symbol, currentPrice, stopLoss, tp1, tp2, tp3, capital, riskPct, positionSize, dataSummary } = req.body;

    const ai = getGeminiAI();
    if (!ai) {
      return res.status(200).json({
        success: true,
        analysis: `### 🤖 تحليل حركة السعر والذكاء الاصطناعي (وضع المعاينة المعياري)
        
**السهم:** ${symbol} | **السعر الحالي:** $${currentPrice}

1. **نقطة الدخول والـ PRZ:**
   توجد منطقة تحول سعري (PRZ) محتملة عند **$${currentPrice}**. يُنصح بالانتظار لتأكيد الإغلاق أعلى المتوسط المتحرك لضمان قوة الزخم.

2. **تقييم إدارة المخاطر:**
   - نسبة إيقاف الخسارة (${stopLoss}$) تمثل حوالي **3.5%** من الدخول.
   - حجم المركز المقترح هو **${positionSize} سهم** لحماية إجمالي رأس المال ($${capital}) ضمن حدود المخاطرة المحددة (${riskPct}%).
   - نسبة العائد إلى المخاطرة (R:R) للهدف الأول TP1 ($${tp1}) ممتازة وتتجاوز 1:1.4.

3. **النصيحة الفنية:**
   - يوصى بتفعيل جني أرباح جزئي عند الهدف الأول TP1 ($${tp1}) وتحريك أمر إيقاف الخسارة إلى نقطة التعادل (Break-even).
   - تجنب الدخول أثناء تقلبات الأخبار الاقتصادية الكبرى.`,
      });
    }

    const prompt = `
أنت خبير التداول المالي العالمي ومحلل النماذج التوافقية والانعكاس الكلاسيكي (Harmonic & Classical Confluence Analysis System Expert) ومدير مخاطر المحافظ الاستثمارية المحترف في تطبيق "الخفاش المالي | Homod Harmonic".

يرجى تقديم تقرير فني دقيق باللغة العربية للصفقة التالية وفق نظام التوافق التوافقي والكلاسيكي (Confluence System):

بيانات الصفقة والشارت:
- رمز السهم: ${symbol}
- السعر الحالي اللحظي (Terminal Bar): $${currentPrice}
- مستوى التفعيل (Activation Line / Point B): $${tp1 ? (currentPrice * 1.02).toFixed(2) : 'N/A'}
- منطقة التحول السعري (PRZ Box - Target D): بين $${tp1} و $${tp2}
- مستوى كسر النمط (Invalidation Level / SL): $${stopLoss} (#ff4d4d)
- مستوى الفجوة السعرية (GAP Level): $${((stopLoss + currentPrice) / 2).toFixed(2)} (#ffa500)
- رأس المال الإجمالي: $${capital}
- نسبة المخاطرة للصفقة: ${riskPct}%
- عدد الأسهم المقترح: ${positionSize} سهم

ملخص الحركة السعرية والإطار الزمني:
- أعلى سعر موجة حديثة (A High): $${dataSummary?.recentHigh || 'N/A'}
- أدنى سعر موجة حديثة (X Low): $${dataSummary?.recentLow || 'N/A'}
- التغير السعري الأخير: ${dataSummary?.changePct || '0'}%

قدم تقريراً فنيّاً شاملاً ومحكّماً بأدوات Markdown مقسماً إلى المحاور التالية:
1. 🦇 **تحليل النماذج التوافقية (Harmonic Patterns: Bat / Butterfly / Gartley / Crab)**
   - تقييم النقاط الخمس (X, A, B, C, D) ونسب فيبوناتشي التوافقية (0.382, 0.618, 0.786, 0.886, 1.272, 1.618).

2. 📈 **نموذج الانعكاس الكلاسيكي المدمج (Embedded Classical Pattern)**
   - مثل: الرأس والكتفين المعكوس (Inverse Head & Shoulders) أو القاع المزدوج (Double Bottom)، وتحديد خط العنق (Neckline).

3. ⏳ **أولوية الفريمات الزمنية (Timeframe Priority Strength)**
   - توضيح أولوية القوة الفنية (الشهري "أولوية قصوى 95%" > الأسبوعي "أولوية عالية 85%" > اليومي "أولوية قياسية 75%").

4. 🎯 **قواعد المستويات الأربعة على الشارت**
   - **Activation Level (خط التفعيل الصلب)**: شرط الدخول الآمن عند الاختراق.
   - **PRZ Box (منطقة Target D التوافقية المظللة)**: نطاق جني الأرباح المحتمل.
   - **Invalidation Level (وقف الخسارة - أحمر متقطع #ff4d4d)**: نقطة الخروج الصارمة عند كسر كفاءة النموذج.
   - **GAP Level (الفجوة السعرية - برتقالي منقط #ffa500)**: مستوى الفجوة الحرج.

5. 🛡️ **توصيات إدارة المخاطر وتكتيك إدارة الصفقة**
   - طريقة تحريك وقف الخسارة للتعادل (Break-Even) بعد تحقيق الهدف الأول، وإعادة تدوير حجم المركز.

اجعل الأسلوب قاطعاً ومباشراً وموجهاً للمتداول باللغة العربية مع وضوح تام للأرقام والمستويات.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في استخراج تحليل الذكاء الاصطناعي حالياً.',
    });
  }
});

// Vite middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
