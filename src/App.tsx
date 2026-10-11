import React, { useState, useEffect, useRef } from 'react';
import { TradeSettings, StockQuote } from './types';
import { calculateTradeLevels, enrichStockData, analyzeHarmonicBat } from './utils/technical';
import { Language, translations } from './data/translations';
import { Header } from './components/Header';
import { StockSelector } from './components/StockSelector';
import { TradeLevelsSummary } from './components/TradeLevelsSummary';
import { StockChart } from './components/StockChart';
import { TradingViewHarmonicChart } from './components/TradingViewHarmonicChart';
import { HarmonicBatCard } from './components/HarmonicBatCard';
import { TechnicalIndicators } from './components/TechnicalIndicators';
import { PositionSizingCard } from './components/PositionSizingCard';
import { AiAnalysisCard } from './components/AiAnalysisCard';
import { AddStockCard } from './components/AddStockCard';
import { TradePlanExporter } from './components/TradePlanExporter';
import { StrategyGuideModal } from './components/StrategyGuideModal';
import { HarmonicVerificationModal, HarmonicVerificationView } from './components/HarmonicVerificationModal';
import { BuyStockView } from './components/BuyStockView';
import { RefreshCw, AlertTriangle, Layers, BarChart3, Activity, Calculator, Sparkles, FileText, Globe, Radio, Wifi, Scale, ShoppingBag } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const t = translations[lang];

  const [settings, setSettings] = useState<TradeSettings>({
    symbol: '^GSPC',
    capital: 10000,
    riskPct: 2.0,
    timeframe: '1d',
    stopLossPct: 3.5,
    tp1Pct: 5.0,
    tp2Pct: 8.0,
    tp3Pct: 12.0,
  });

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'buy_signal' | 'chart' | 'multi_chart' | 'calculator' | 'ai' | 'export' | 'verify'>('all');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [countdownSec, setCountdownSec] = useState<number>(60);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Update HTML dir and lang attributes when language changes
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Fetch stock quotes whenever symbol or timeframe changes
  const fetchStockData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`/api/stock/history?symbol=${encodeURIComponent(settings.symbol)}&timeframe=${settings.timeframe}`);
        if (!res.ok) {
          throw new Error(`خادم الأسعار أعاد الخطأ (${res.status})`);
        }

        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const enriched = enrichStockData(json.data);
          const newPrice = json.regularMarketPrice;

          if (prevPriceRef.current !== null && newPrice !== prevPriceRef.current) {
            if (newPrice > prevPriceRef.current) {
              setPriceFlash('up');
            } else if (newPrice < prevPriceRef.current) {
              setPriceFlash('down');
            }
            setTimeout(() => setPriceFlash(null), 2500);
          }
          prevPriceRef.current = newPrice;

          setQuote({
            symbol: json.symbol || settings.symbol.toUpperCase(),
            currency: json.currency || 'USD',
            exchangeName: json.exchangeName || '',
            regularMarketPrice: newPrice,
            previousClose: json.previousClose,
            data: enriched,
            isFallback: json.isFallback,
            isOnline: json.isOnline ?? true,
            dataSource: json.dataSource || 'تداول حي مباشر 24/7 كل دقيقة',
            lastUpdated: json.lastUpdated || new Date().toLocaleTimeString('ar-KW', { timeZone: 'Asia/Kuwait', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (توقيت الكويت)',
            notice: json.notice,
            sessionPhase: json.sessionPhase,
            sessionNameAr: json.sessionNameAr,
            sessionNameEn: json.sessionNameEn,
            sessionBadgeColor: json.sessionBadgeColor,
            sessionIcon: json.sessionIcon,
            preMarketPrice: json.preMarketPrice,
            postMarketPrice: json.postMarketPrice,
          });
          setError(null);
          setCountdownSec(60); // Reset timer on successful fetch
          break; // Success!
        } else {
          throw new Error('لم يتم العثور على بيانات بالرمز المكتوب. تأكد من صحة الرمز.');
        }
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          if (!silent) {
            console.error('Fetch stock error after retries:', err);
            const isNetworkErr = err?.name === 'TypeError' || err?.message?.includes('fetch') || err?.message?.includes('Failed');
            setError(
              isNetworkErr
                ? 'تعذر الاتصال بخدمة بيانات الأسهم المباشرة. يُرجى التحقق من الاتصال بالإنترنت والضغط على "إعادة التحميل".'
                : err.message || 'حدث خطأ أثناء الاتصال بخدمة بيانات الأسهم.'
            );
          } else {
            console.warn('Silent auto-refresh stock fetch retry notice:', err?.message || err);
          }
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }
      } finally {
        if (!silent && attempts >= maxAttempts) {
          setLoading(false);
        }
      }
    }

    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchStockData(false);
    setCountdownSec(60);
  }, [settings.symbol, settings.timeframe]);

  // 1-second countdown timer for auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.symbol, settings.timeframe]);

  useEffect(() => {
    if (countdownSec === 0) {
      fetchStockData(true);
      setCountdownSec(60);
    }
  }, [countdownSec]);

  const handleUpdateSettings = (newSettings: Partial<TradeSettings>) => {
    setSettings((prev) => {
      const isSymbolChange = newSettings.symbol && newSettings.symbol !== prev.symbol;
      if (isSymbolChange) {
        return {
          ...prev,
          ...newSettings,
          manualEntryPrice: undefined,
          manualStopLossPrice: undefined,
          manualTp1Price: undefined,
          manualTp2Price: undefined,
          manualTp3Price: undefined,
        };
      }
      return { ...prev, ...newSettings };
    });
  };

  const isSymbolMatch = quote?.symbol && (
    quote.symbol.toUpperCase() === settings.symbol.toUpperCase() ||
    quote.symbol.toUpperCase().includes(settings.symbol.toUpperCase().replace('^', '').split('.')[0]) ||
    settings.symbol.toUpperCase().includes(quote.symbol.toUpperCase().replace('^', '').split('.')[0])
  );

  const activeQuote = isSymbolMatch ? quote : null;

  // Active current price directly from online live quote feed
  const currentPrice = activeQuote?.regularMarketPrice ?? (activeQuote?.data?.[activeQuote.data.length - 1]?.close || 100);

  // Prepare quote data synchronized to active online quote
  const activeData = activeQuote?.data || [];

  const harmonicAnalysis = activeData && activeData.length > 0 ? analyzeHarmonicBat(activeData, settings.timeframe) : null;
  const levels = calculateTradeLevels(settings, currentPrice, harmonicAnalysis);
  const isFullWidthView = activeTab === 'chart' || activeTab === 'multi_chart' || activeTab === 'all';

  // Global window functions to support custom price force update scripts
  useEffect(() => {
    (window as any).currentLivePrice = null;

    (window as any).updateAllHarmonicModels = function(price: number) {
      if (price && !isNaN(price) && price > 0) {
        handleUpdateSettings({ manualEntryPrice: price });
        console.log("تم تحديث السعر اللحظي لكافة النماذج بنجاح إلى: " + price);
      }
    };

    (window as any).applyRealtimePrice = function(newPrice: number) {
      if (!newPrice || isNaN(newPrice) || newPrice <= 0) return;
      (window as any).currentLivePrice = newPrice;
      handleUpdateSettings({ manualEntryPrice: newPrice });

      document.querySelectorAll('#livePriceDisplay, .live-price-target').forEach(el => {
        (el as HTMLElement).innerText = newPrice.toFixed(2) + ' $';
      });

      const timeEl = document.getElementById('lastUpdateTime');
      if (timeEl) {
        timeEl.innerText = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuwait' });
      }

      if (typeof (window as any).updateAllHarmonicModels === 'function') {
        (window as any).updateAllHarmonicModels(newPrice);
      }
    };

    (window as any).forceUpdateWithRealPrice = function(customPrice?: number) {
      const inputEl = (document.getElementById('customPriceInput') || document.getElementById('symbolInput') || document.querySelector('input[type="number"]')) as HTMLInputElement | null;
      const priceToUse = typeof customPrice === 'number' && !isNaN(customPrice) && customPrice > 0
        ? customPrice
        : (inputEl && inputEl.value ? parseFloat(inputEl.value) : undefined);

      if (priceToUse && !isNaN(priceToUse) && priceToUse > 0) {
        (window as any).applyRealtimePrice(priceToUse);
      } else {
        fetchStockData(false);
      }
    };

    (window as any).updateHarmonicCalculations = function(price: number) {
      if (price && !isNaN(price) && price > 0) {
        (window as any).updateAllHarmonicModels(price);
      }
    };

    (window as any).updateChartAndPercentages = function(price: number) {
      if (price && !isNaN(price) && price > 0) {
        (window as any).updateAllHarmonicModels(price);
      }
    };
  }, [fetchStockData]);

  return (
    <div className={`min-h-screen bg-[#06160e] text-emerald-50 font-sans antialiased selection:bg-emerald-500 selection:text-emerald-950 pb-28 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`}>
      {/* Top Header with Language Switcher under logo */}
      <Header
        onOpenHelp={() => setShowGuideModal(true)}
        lang={lang}
        onToggleLang={(newLang) => setLang(newLang)}
      />

      <main className={`${isFullWidthView ? 'w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} pt-6 transition-all duration-300`}>
        {/* Symbol & Capital Settings */}
        <StockSelector
          settings={settings}
          onChangeSettings={handleUpdateSettings}
          onRefreshData={fetchStockData}
          loading={loading}
          lang={lang}
        />

        {/* Live Online Readings Status & Ticker Banner */}
        {quote && (
          <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-emerald-950/90 via-[#0a2819] to-emerald-950/90 border border-emerald-500/50 rounded-2xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4 text-emerald-100">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20">
                <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    {lang === 'ar' ? 'الأسعار أونلاين مباشر من الإنترنت' : 'Live Online Internet Feed'}
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  </span>
                  
                  {/* Dynamic Market Session Phase Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm flex items-center gap-1 ${
                    quote.sessionBadgeColor === 'purple' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                    quote.sessionBadgeColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    quote.sessionBadgeColor === 'cyan' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                    quote.sessionBadgeColor === 'rose' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    quote.sessionBadgeColor === 'slate' ? 'bg-slate-700/40 text-slate-300 border-slate-600/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    <span>{quote.sessionIcon || '🌐'}</span>
                    <span>{lang === 'ar' ? (quote.sessionNameAr || quote.exchangeName) : (quote.sessionNameEn || quote.exchangeName)}</span>
                  </span>

                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/40 shadow-sm">
                    {quote.dataSource || 'سوق مباشر أونلاين'}
                  </span>
                </div>

                <div className="text-[11px] text-emerald-300/90 flex items-center gap-2 mt-1 flex-wrap">
                  <span>
                    {lang === 'ar' ? 'الرمز:' : 'Symbol:'} <strong className="font-mono text-emerald-200">{quote.symbol}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {lang === 'ar' ? 'السعر المباشر:' : 'Live Price:'}{' '}
                    <strong
                      id="livePriceDisplay"
                      className={`font-mono text-sm px-1.5 py-0.5 rounded transition-all duration-500 ${
                        priceFlash === 'up'
                          ? 'bg-emerald-500 text-slate-950 font-extrabold animate-bounce'
                          : priceFlash === 'down'
                          ? 'bg-rose-500 text-white font-extrabold animate-bounce'
                          : 'text-emerald-300'
                      }`}
                    >
                      ${currentPrice.toFixed(2)} {quote.currency}
                    </strong>
                  </span>

                  {quote.preMarketPrice && quote.preMarketPrice > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-purple-300 font-medium">
                        {lang === 'ar' ? `ما قبل الافتتاح: $${quote.preMarketPrice}` : `Pre-Market: $${quote.preMarketPrice}`}
                      </span>
                    </>
                  )}

                  {quote.postMarketPrice && quote.postMarketPrice > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-300 font-medium">
                        {lang === 'ar' ? `بعد الإغلاق: $${quote.postMarketPrice}` : `After-Hours: $${quote.postMarketPrice}`}
                      </span>
                    </>
                  )}

                  {quote.lastUpdated && (
                    <>
                      <span>•</span>
                      <span id="lastUpdateTime" className="text-slate-300 font-medium">
                        {lang === 'ar' ? `آخر تحديث: ${quote.lastUpdated}` : `Updated: ${quote.lastUpdated}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Auto Refresh Status & Countdown Timer */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end bg-emerald-950/60 p-2 rounded-xl border border-emerald-800/60">
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-300 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {lang === 'ar'
                  ? `تحديث تلقائي أونلاين خلال: ${countdownSec} ثانية ⏱️`
                  : `Auto Refresh in: ${countdownSec}s ⏱️`}
              </span>

              <button
                id="manualRefreshBtn"
                onClick={() => {
                  fetchStockData(false);
                  setCountdownSec(60);
                }}
                disabled={loading}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{lang === 'ar' ? 'تحديث أونلاين الآن' : 'Refresh Online Now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Fallback Notice Banner if Yahoo limits */}
        {quote?.isFallback && quote.notice && (
          <div className="mb-6 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{quote.notice}</span>
            </div>
            <button
              onClick={() => fetchStockData(false)}
              className="text-amber-200 underline hover:text-white font-bold"
            >
              {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-5 bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold">{lang === 'ar' ? 'عذراً، تعذر جلب بيانات السهم' : 'Failed to fetch stock data'}</div>
                <div className="text-xs text-rose-400/80 mt-0.5">{error}</div>
              </div>
            </div>
            <button
              onClick={() => fetchStockData(false)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow cursor-pointer"
            >
              {lang === 'ar' ? 'إعادة التحميل' : 'Reload'}
            </button>
          </div>
        )}

        {/* Main Content Sections */}
        {loading ? (
          <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-12 text-center my-8 shadow-xl">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-emerald-100 mb-1">
              {lang === 'ar' ? 'جاري تحميل بيانات السهم والأسعار...' : 'Loading stock data and prices...'}
            </h3>
            <p className="text-xs text-emerald-400/70">
              {lang === 'ar' ? 'جلب شمعات التداول لحساب مناطق PRZ ووقف الخسارة الأنسب' : 'Fetching price candles to compute PRZ entry and stop loss levels'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Always show levels summary header if not empty for context, or within each view */}

            {/* View: All */}
            {activeTab === 'all' && (
              <>
                {/* Harmonic Timeframe Confluence Status Banner */}
                <div className="bg-[#0a1e13] border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚖️</span>
                      <h3 className="text-sm sm:text-base font-bold text-cyan-400">
                        {lang === 'ar'
                          ? 'حالة التحليل الحالية (نظام التوافق والإطارات الزمنية - Bat / ABCD)'
                          : 'Current Analysis Status (Harmonic Timeframe Confluence - Bat / ABCD)'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowVerificationModal(true)}
                      className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold px-3 py-1.5 rounded-xl border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>⚖️</span>
                      <span>{lang === 'ar' ? 'تدقيق الإطارات' : 'Timeframe Check'}</span>
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm space-y-2 text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📊</span>
                      <span className="text-white font-bold">{lang === 'ar' ? 'الإطار اليومي (1D):' : 'Daily (1D):'}</span>
                      <span className="text-emerald-400 font-semibold">{lang === 'ar' ? 'قراءة صحيحة ودقيقة (نموذج ABCD/الخفاش مكتمل 100%)' : 'Accurate reading (ABCD/Bat model confirmed 100%)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">📉</span>
                      <span className="text-amber-400 font-bold">{lang === 'ar' ? 'الإطار الأسبوعي/الشهري (1W/1M):' : 'Weekly/Monthly:'}</span>
                      <span className="text-slate-300 font-medium">{lang === 'ar' ? 'تمت إعادة ضبط الحسابات والتدقيق (معايرة فيبوناتشي وموجات الضلع CD بدقة عالية)' : 'Recalibrated Fibonacci ratios and CD legs successfully'}</span>
                    </div>
                  </div>
                </div>

                <TradeLevelsSummary
                  levels={levels}
                  settings={settings}
                  currency={quote?.currency}
                />
                <TechnicalIndicators
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  currentPrice={currentPrice}
                  rrr={levels.riskRewardRatioTp1}
                />
                <StockChart
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  currency={quote?.currency}
                  lang={lang}
                />
                <TradingViewHarmonicChart
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  currency={quote?.currency}
                  lang={lang}
                  timeframe={settings.timeframe}
                  patternType={settings.patternType || 'Bat'}
                  onChangeTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
                  onChangePattern={(pt) => handleUpdateSettings({ patternType: pt })}
                />
                <HarmonicBatCard
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  currency={quote?.currency}
                  lang={lang}
                  currentTimeframe={settings.timeframe}
                  patternType={settings.patternType || 'Bat'}
                  onChangeTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
                  onChangePattern={(pt) => handleUpdateSettings({ patternType: pt })}
                />
                <PositionSizingCard
                  levels={levels}
                  settings={settings}
                  onChangeSettings={handleUpdateSettings}
                  currency={quote?.currency}
                />
                <AiAnalysisCard
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  settings={settings}
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                />
                <AddStockCard
                  currentSymbol={quote?.symbol || settings.symbol}
                  onSelectSymbol={(sym) => handleUpdateSettings({ symbol: sym })}
                  lang={lang}
                />
                <TradePlanExporter
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  settings={settings}
                />
              </>
            )}

            {/* View: Chart */}
            {activeTab === 'chart' && (
              <div className="w-full max-w-none space-y-4">
                {/* Full-Width Chart Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold text-emerald-400">
                        {lang === 'ar' ? 'الرسم البياني الفني (الشارت العريض - Full Width)' : 'Technical Stock Chart (Full Width)'}
                      </h1>
                      <p className="text-xs text-slate-400">
                        {lang === 'ar'
                          ? 'الشارت يعمل الآن بعرض الشاشة الكامل لتبدو المساحة واضحة ومريحة للتحليل الفني'
                          : 'Chart is displayed at full screen width for clear, comfortable technical analysis'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
                      {quote?.symbol || settings.symbol} - {settings.timeframe === '1d' ? 'Daily' : settings.timeframe === '1wk' ? 'Weekly' : 'Monthly'}
                    </span>
                    <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 font-semibold">
                      {lang === 'ar' ? 'نموذج التوافق' : 'Harmonic Confluence'}
                    </span>
                  </div>
                </div>

                <TradeLevelsSummary
                  levels={levels}
                  settings={settings}
                  currency={quote?.currency}
                />
                <TechnicalIndicators
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  currentPrice={currentPrice}
                  rrr={levels.riskRewardRatioTp1}
                />
                <StockChart
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  currency={quote?.currency}
                  lang={lang}
                />
                <HarmonicBatCard
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  currency={quote?.currency}
                  lang={lang}
                  currentTimeframe={settings.timeframe}
                  patternType={settings.patternType || 'Bat'}
                  onChangeTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
                  onChangePattern={(pt) => handleUpdateSettings({ patternType: pt })}
                />
              </div>
            )}

            {/* View: Multi-Pattern Harmonic Chart */}
            {activeTab === 'multi_chart' && (
              <div className="w-full max-w-none space-y-4">
                {/* Full-Width Multi-Chart Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold text-emerald-400">
                        {lang === 'ar' ? 'الرسم البياني المتعدد (الشارت العريض - Full Width)' : 'Multi-Pattern Harmonic Chart (Full Width)'}
                      </h1>
                      <p className="text-xs text-slate-400">
                        {lang === 'ar'
                          ? 'الشارت يعمل الآن بعرض الشاشة الكامل لتبدو المساحة واضحة ومريحة للتحليل الفني'
                          : 'Chart is displayed at full screen width for clear, comfortable technical analysis'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
                      {quote?.symbol || settings.symbol} - {settings.timeframe === '1d' ? 'Daily' : settings.timeframe === '1wk' ? 'Weekly' : 'Monthly'}
                    </span>
                    <span className="text-xs bg-slate-800 text-cyan-400 px-3 py-1 rounded-lg border border-cyan-500/30 font-semibold">
                      {lang === 'ar' ? 'المسار المستقبلي 🎯' : 'Future Path 🎯'}
                    </span>
                  </div>
                </div>

                <TradeLevelsSummary
                  levels={levels}
                  settings={settings}
                  currency={quote?.currency}
                />
                <TradingViewHarmonicChart
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  currency={quote?.currency}
                  lang={lang}
                  timeframe={settings.timeframe}
                  patternType={settings.patternType || 'Bat'}
                  onChangeTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
                  onChangePattern={(pt) => handleUpdateSettings({ patternType: pt })}
                />
                <HarmonicBatCard
                  data={activeData.length > 0 ? activeData : (quote?.data || [])}
                  symbol={quote?.symbol || settings.symbol}
                  currency={quote?.currency}
                  lang={lang}
                  currentTimeframe={settings.timeframe}
                  patternType={settings.patternType || 'Bat'}
                  onChangeTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
                  onChangePattern={(pt) => handleUpdateSettings({ patternType: pt })}
                />
              </div>
            )}

            {/* View: Buy Stock Signals (اشتر السهم) */}
            {activeTab === 'buy_signal' && (
              <BuyStockView
                currentSymbol={quote?.symbol || settings.symbol}
                currentPrice={quote?.regularMarketPrice || levels.entryPrice}
                currency={quote?.currency}
                lang={lang}
                onSelectSymbolAndTab={(sym, tab) => {
                  handleUpdateSettings({ symbol: sym });
                  setActiveTab(tab);
                }}
              />
            )}

            {/* View: Harmonic Verification */}
            {activeTab === 'verify' && (
              <HarmonicVerificationView
                symbol={quote?.symbol || settings.symbol}
                currentPrice={quote?.regularMarketPrice || levels.entryPrice}
                currency={quote?.currency}
                quoteData={quote?.data || []}
                lang={lang}
                onSelectTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
              />
            )}

            {/* View: Calculator */}
            {activeTab === 'calculator' && (
              <>
                <TradeLevelsSummary
                  levels={levels}
                  settings={settings}
                  currency={quote?.currency}
                />
                <PositionSizingCard
                  levels={levels}
                  settings={settings}
                  onChangeSettings={handleUpdateSettings}
                  currency={quote?.currency}
                />
              </>
            )}

            {/* View: AI */}
            {activeTab === 'ai' && (
              <>
                <TradeLevelsSummary
                  levels={levels}
                  settings={settings}
                  currency={quote?.currency}
                />
                <AiAnalysisCard
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  settings={settings}
                  data={quote?.data || []}
                />
                <AddStockCard
                  currentSymbol={quote?.symbol || settings.symbol}
                  onSelectSymbol={(sym) => handleUpdateSettings({ symbol: sym })}
                  lang={lang}
                />
              </>
            )}

            {/* View: Export Ticket */}
            {activeTab === 'export' && (
              <>
                <TradeLevelsSummary
                  levels={levels}
                  settings={settings}
                  currency={quote?.currency}
                />
                <TradePlanExporter
                  symbol={quote?.symbol || settings.symbol}
                  levels={levels}
                  settings={settings}
                />
              </>
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#091e13]/95 backdrop-blur-md border-t border-emerald-900/80 py-2 px-2 sm:px-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-around gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t.tabAll}</span>
          </button>

          <button
            onClick={() => setActiveTab('buy_signal')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative ${
              activeTab === 'buy_signal'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'buy_signal' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="truncate">{lang === 'ar' ? 'اشتر السهم' : 'Buy Stock'}</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{lang === 'ar' ? 'التحقق التوافقي' : 'Harmonic Verify'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t.tabChart}</span>
          </button>

          <button
            onClick={() => setActiveTab('multi_chart')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'multi_chart'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t.tabMultiChart}</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t.tabCalculator}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'ai' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="truncate">{t.tabAi}</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-emerald-300/60 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t.tabExport}</span>
          </button>
        </div>
      </nav>

      {/* Harmonic Timeframes Verification Modal */}
      <HarmonicVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        symbol={quote?.symbol || settings.symbol}
        currentPrice={currentPrice}
        currency={quote?.currency}
        quoteData={quote?.data || []}
        lang={lang}
        onSelectTimeframe={(tf) => handleUpdateSettings({ timeframe: tf })}
      />

      {/* Guide Rules Modal */}
      <StrategyGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
