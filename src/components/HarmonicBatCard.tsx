import React from 'react';
import { StockDataPoint, HarmonicBatAnalysisResult, HarmonicPatternType } from '../types';
import { analyzeHarmonicBat } from '../utils/technical';
import { Language, translations } from '../data/translations';
import { ShieldAlert, Zap, Target, Layers, ArrowUpRight, Activity } from 'lucide-react';

interface HarmonicBatCardProps {
  data: StockDataPoint[];
  symbol: string;
  currency?: string;
  lang?: Language;
  currentTimeframe?: string;
  patternType?: HarmonicPatternType;
  onChangeTimeframe?: (tf: '1d' | '1wk' | '1mo') => void;
  onChangePattern?: (pt: HarmonicPatternType) => void;
}

export const HarmonicBatCard: React.FC<HarmonicBatCardProps> = ({
  data,
  symbol,
  currency = 'USD',
  lang = 'ar',
  currentTimeframe = '1d',
  patternType = 'Bat',
  onChangeTimeframe,
  onChangePattern,
}) => {
  const t = translations[lang];
  const [selectedTf, setSelectedTf] = React.useState<string>(currentTimeframe);
  const [selectedPattern, setSelectedPattern] = React.useState<HarmonicPatternType>(patternType);

  React.useEffect(() => {
    if (currentTimeframe) {
      setSelectedTf(currentTimeframe);
    }
  }, [currentTimeframe]);

  React.useEffect(() => {
    if (patternType) {
      setSelectedPattern(patternType);
    }
  }, [patternType]);

  const tfNameMap: Record<string, { ar: string; en: string }> = {
    '1d': { ar: 'يومي (Daily)', en: 'Daily (1D)' },
    '1wk': { ar: 'أسبوعي (Weekly)', en: 'Weekly (1W)' },
    '1mo': { ar: 'شهري (Monthly)', en: 'Monthly (1M)' },
  };

  const patternMap: Record<HarmonicPatternType, { ar: string; en: string }> = {
    'Bat': { ar: 'الخفاش (Bat)', en: 'Bat' },
    'Gartley': { ar: 'جارتلي (Gartley)', en: 'Gartley' },
    'Butterfly': { ar: 'الفراشة (Butterfly)', en: 'Butterfly' },
    'Crab': { ar: 'الكابوريا (Crab)', en: 'Crab' },
    'ABCD': { ar: 'ABCD', en: 'ABCD' },
  };

  const tfLabel = tfNameMap[selectedTf]?.[lang === 'ar' ? 'ar' : 'en'] || selectedTf;
  const analysis: HarmonicBatAnalysisResult | null = analyzeHarmonicBat(data, selectedTf, selectedPattern);

  if (!analysis) return null;

  const przMinVal = Math.min(Number(analysis.przMin), Number(analysis.przMax));
  const przMaxVal = Math.max(Number(analysis.przMin), Number(analysis.przMax));
  const przLow = przMinVal.toFixed(2);
  const przHigh = przMaxVal.toFixed(2);

  return (
    <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Pattern Selector Bar (Multi-Pattern Analyzer) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-900/40">
        <span className="text-xs font-bold text-emerald-300">
          {lang === 'ar' ? 'اختر النموذج التوافقي (Multi-Pattern Analyzer):' : 'Select Harmonic Pattern:'}
        </span>
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['Bat', 'Gartley', 'Butterfly', 'Crab', 'ABCD'] as const).map((pt) => (
            <button
              key={pt}
              onClick={() => {
                setSelectedPattern(pt);
                if (onChangePattern) onChangePattern(pt);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPattern === pt
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {patternMap[pt]?.[lang === 'ar' ? 'ar' : 'en'] || pt}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-black/40 border border-emerald-500/30 flex items-center justify-center text-xl">
            🦇
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{lang === 'ar' ? analysis.patternNameAr : analysis.patternName}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30 font-bold">
                {analysis.timeframePriorityAr || analysis.timeframePriority}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? `تكامل التحليل التوافقي الخماسي (X-A-B-C-D) مع النمط الكلاسيكي المدمج (${analysis.classicalPattern?.nameAr})`
                : `Harmonic 5-point confluence (X-A-B-C-D) with embedded ${analysis.classicalPattern?.name}`}
            </p>
          </div>
        </div>

        {/* Timeframe Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['1d', '1wk', '1mo'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setSelectedTf(tf);
                if (onChangeTimeframe) onChangeTimeframe(tf);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all font-mono font-bold cursor-pointer ${
                selectedTf === tf
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Terminal Bar / Current Price */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{lang === 'ar' ? 'السعر الحالي / Terminal Bar' : 'Terminal Bar (Current)'}</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${analysis.terminalBar.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">
            {lang === 'ar' ? 'السعر اللحظي الحالي للشمعة' : 'Live quote price terminal'}
          </div>
        </div>

        {/* Activation Level (B) */}
        <div className="bg-sky-950/30 border border-sky-800/50 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-sky-300">
            <span>{lang === 'ar' ? 'Activation (خط التفعيل)' : 'Activation Level'}</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-300">
            ${analysis.bPrice.toFixed(2)}
          </div>
          <div className="text-[11px] text-sky-400/80">
            {lang === 'ar' ? 'النقطة B / خط اختراق التفعيل' : 'Point B trigger line'}
          </div>
        </div>

        {/* Invalidation Level (SL) */}
        <div className="bg-rose-950/30 border border-rose-800/50 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>{lang === 'ar' ? 'Invalidation (وقف الخسارة)' : 'Invalidation Level (SL)'}</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">
            ${analysis.invalidationPrice.toFixed(2)}
          </div>
          <div className="text-[11px] text-rose-400/80">
            {lang === 'ar' ? 'مستوى كسر كفاءة النموذج (#ff4d4d)' : 'Pattern invalidation threshold'}
          </div>
        </div>

        {/* PRZ Target Range (D) */}
        <div className="bg-emerald-950/30 border border-emerald-800/50 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>{lang === 'ar' ? 'PRZ Target Range (الهدف D)' : 'PRZ Target D Range'}</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-300" dir="ltr" style={{ unicodeBidi: 'bidi-override' }}>
            ${przLow} - ${przHigh}
          </div>
          <div className="text-[11px] text-emerald-400/80">
            {lang === 'ar' ? `نسبة XD: ${analysis.fiboRatios.xdRatio}` : `XD Ratio: ${analysis.fiboRatios.xdRatio}`}
          </div>
        </div>
      </div>

      {/* Fibonacci Ratios Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-around text-xs flex-wrap gap-2">
        <span className="text-slate-400 font-mono">
          <strong className="text-slate-200">AB Ratio:</strong> {analysis.fiboRatios.abRatio}
        </span>
        <span className="text-slate-400 font-mono">
          <strong className="text-slate-200">BC Ratio:</strong> {analysis.fiboRatios.bcRatio}
        </span>
        <span className="text-slate-400 font-mono">
          <strong className="text-slate-200">CD Ratio:</strong> {analysis.fiboRatios.cdRatio}
        </span>
        <span className="text-slate-400 font-mono">
          <strong className="text-emerald-400">XD PRZ Ratio:</strong> {analysis.fiboRatios.xdRatio}
        </span>
        <span className="text-slate-400 font-mono">
          <strong className="text-amber-400">GAP Level:</strong> ${analysis.gapLevel.toFixed(2)}
        </span>
      </div>

      {/* Bottom Summary Bar - Display Order: X Price | A Price | B (Activation) | PRZ Target Range | Invalidation Level (SL) */}
      <div className="bg-slate-950/90 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs flex-wrap gap-3">
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap font-mono">
          <span className="text-slate-400">
            <strong className="text-slate-200">X Price:</strong> ${analysis.xPrice.toFixed(2)}
          </span>
          <span className="text-slate-400">
            <strong className="text-slate-200">A Price:</strong> ${analysis.aPrice.toFixed(2)}
          </span>
          <span className="text-slate-400">
            <strong className="text-sky-400">B (Activation):</strong> ${analysis.bPrice.toFixed(2)}
          </span>
          <span className="text-slate-400">
            <strong className="text-emerald-400">PRZ Target Range:</strong>{' '}
            <span dir="ltr" className="inline-block font-mono text-emerald-300 font-semibold" style={{ unicodeBidi: 'bidi-override' }}>
              ${przLow} - ${przHigh}
            </span>
          </span>
          <span className="text-slate-400">
            <strong className="text-rose-400">Invalidation Level (SL):</strong> ${analysis.invalidationPrice.toFixed(2)}
          </span>
        </div>

        <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {lang === 'ar' ? `نظام التوافق التوافقي الكلاسيكي | ${tfLabel}` : `Harmonic Confluence System | ${tfLabel}`}
          </span>
        </div>
      </div>
    </div>
  );
};
