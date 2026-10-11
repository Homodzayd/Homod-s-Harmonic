import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Customized,
} from 'recharts';
import { StockDataPoint, TradeLevels, HarmonicPatternType } from '../types';
import { analyzeHarmonicBat } from '../utils/technical';
import { Language, translations } from '../data/translations';
import { Layers, Sliders, Sparkles, Moon, Sun, Target } from 'lucide-react';

interface TradingViewHarmonicChartProps {
  data: StockDataPoint[];
  symbol: string;
  levels: TradeLevels;
  currency?: string;
  lang?: Language;
  timeframe?: string;
  patternType?: HarmonicPatternType;
  onChangeTimeframe?: (tf: '1d' | '1wk' | '1mo') => void;
  onChangePattern?: (pt: HarmonicPatternType) => void;
}

export const TradingViewHarmonicChart: React.FC<TradingViewHarmonicChartProps> = ({
  data,
  symbol,
  levels,
  currency = 'USD',
  lang = 'ar',
  timeframe = '1d',
  patternType = 'Bat',
  onChangeTimeframe,
  onChangePattern,
}) => {
  const t = translations[lang];
  const [selectedTf, setSelectedTf] = useState<string>(timeframe);
  const [selectedPattern, setSelectedPattern] = useState<HarmonicPatternType>(patternType);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showFuture, setShowFuture] = useState(true);
  const [showRatios, setShowRatios] = useState(true);
  const [showActivation, setShowActivation] = useState(true);
  const [showGap, setShowGap] = useState(true);
  const [showTerminalBar, setShowTerminalBar] = useState(true);
  const [isDoubleWidth, setIsDoubleWidth] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (isDoubleWidth && scrollRef.current) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDoubleWidth, data]);

  React.useEffect(() => {
    if (timeframe) {
      setSelectedTf(timeframe);
    }
  }, [timeframe]);

  React.useEffect(() => {
    if (patternType) {
      setSelectedPattern(patternType);
    }
  }, [patternType]);

  if (!data || data.length === 0) return null;

  const analysis = analyzeHarmonicBat(data, selectedTf, selectedPattern);

  const n = data.length;
  const dateX = analysis?.dateX || data[analysis?.idxX ?? Math.floor(n * 0.1)]?.date || data[0]?.date;
  const dateA = analysis?.dateA || data[analysis?.idxA ?? Math.floor(n * 0.35)]?.date || data[Math.floor(n * 0.35)]?.date;
  const dateB = analysis?.dateB || data[analysis?.idxB ?? Math.floor(n * 0.5)]?.date || data[Math.floor(n * 0.5)]?.date;
  const dateC = analysis?.dateC || data[analysis?.idxC ?? Math.floor(n * 0.65)]?.date || data[Math.floor(n * 0.65)]?.date;
  const dateD = analysis?.dateD || data[analysis?.idxD ?? Math.floor(n * 0.85)]?.date || data[n - 1]?.date;

  const priceX = analysis?.xPrice ?? levels.entryPrice * 0.88;
  const priceA = analysis?.aPrice ?? levels.tp3;
  const priceB = analysis?.bPrice ?? levels.entryPrice * 1.05;
  const priceC = analysis?.cPrice ?? levels.tp2;
  const priceD = analysis?.dPrice ?? analysis?.przMin ?? levels.entryPrice;

  // Key TradingView Harmonic Levels - Always format PRZ from Lowest to Highest
  const rawPrz1 = Number(analysis?.przMin ?? levels.entryPrice * 0.985);
  const rawPrz2 = Number(analysis?.przMax ?? levels.entryPrice * 1.015);
  const przMinVal = Math.min(rawPrz1, rawPrz2);
  const przMaxVal = Math.max(rawPrz1, rawPrz2);
  const przBottom = przMinVal.toFixed(2);
  const przTop = przMaxVal.toFixed(2);
  const activationPrice = (analysis?.bPrice ?? priceB).toFixed(2);
  const terminalBarPrice = (analysis?.terminalBar ?? levels.entryPrice).toFixed(2);
  const invalidationPrice = levels.stopLoss.toFixed(2);
  const gapPrice = (analysis?.gapLevel && analysis.gapLevel > levels.stopLoss && analysis.gapLevel < levels.entryPrice
    ? analysis.gapLevel
    : (levels.entryPrice + levels.stopLoss) / 2
  ).toFixed(2);

  // Generate 15 future projected bars (Homod Financial Analyzer future path towards PRZ)
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const result = data.map((d, i) => ({
      ...d,
      futureClose: i === data.length - 1 ? d.close : undefined,
    }));

    if (!showFuture) return result;

    const lastBar = data[data.length - 1];
    const terminalPrice = lastBar ? lastBar.close : 100;
    const targetPrz = przMinVal > terminalPrice ? przMinVal : terminalPrice * 1.07;
    const futureSteps = 15;
    let currVal = terminalPrice;
    const stepIncrement = (targetPrz - currVal) / futureSteps;

    for (let f = 1; f <= futureSteps; f++) {
      const noise = (Math.sin(f * 0.7) * 0.35 + (f % 2 === 0 ? 0.25 : -0.25)) * (Math.abs(stepIncrement) * 0.3);
      currVal = Number((currVal + stepIncrement + noise).toFixed(2));
      const futureDateLabel = lang === 'ar' ? `مستقبلي +${f}` : `Future +${f}`;

      result.push({
        date: futureDateLabel,
        close: undefined as any,
        open: undefined as any,
        high: currVal,
        low: currVal,
        volume: 0,
        futureClose: currVal,
      });
    }

    return result;
  }, [data, przMinVal, showFuture, lang]);

  // Calculate clean Y-axis domain bounds based on active stock prices, future path & key levels
  const rawPrices = [
    ...chartData.map((d) => d.close),
    ...chartData.map((d) => d.futureClose),
    ...chartData.map((d) => d.high),
    ...chartData.map((d) => d.low),
    priceX,
    priceA,
    priceB,
    priceC,
    priceD,
    przMinVal,
    przMaxVal,
    Number(activationPrice),
    Number(invalidationPrice),
    Number(terminalBarPrice),
  ].filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);

  const rawMin = Math.min(...rawPrices);
  const rawMax = Math.max(...rawPrices);
  const pad = Math.max(1, (rawMax - rawMin) * 0.08);
  const yMin = Number((Math.max(0.1, rawMin - pad)).toFixed(2));
  const yMax = Number((rawMax + pad).toFixed(2));

  const isLight = theme === 'light';
  const bgColor = isLight ? 'bg-emerald-50 text-emerald-950 border-emerald-200' : 'bg-[#0a2115] text-emerald-100 border-emerald-900/80';
  const canvasBg = isLight ? '#f0fdf4' : '#07190f';
  const gridColor = isLight ? '#dcfce7' : '#133623';
  const textColor = isLight ? '#064e3b' : '#ecfdf5';

  const abRatio = analysis?.fiboRatios?.abRatio ?? 0.382;
  const bcRatio = analysis?.fiboRatios?.bcRatio ?? 1.211;
  const cdRatio = analysis?.fiboRatios?.cdRatio ?? 2.107;
  const xdRatio = analysis?.fiboRatios?.xdRatio ?? 0.886;

  // Custom Overlay for Harmonic Triangles + Fibonacci Ratios
  const CustomHarmonicBatOverlay = (props: any) => {
    const { xAxisMap, yAxisMap } = props;
    if (!xAxisMap || !yAxisMap) return null;

    const xAxis = Object.values(xAxisMap)[0] as any;
    const yAxis = Object.values(yAxisMap)[0] as any;
    if (!xAxis || !yAxis || !xAxis.scale || !yAxis.scale) return null;

    const pts = [
      { name: 'X', xVal: dateX, yVal: priceX },
      { name: 'A', xVal: dateA, yVal: priceA },
      { name: 'B', xVal: dateB, yVal: priceB },
      { name: 'C', xVal: dateC, yVal: priceC },
      { name: 'D', xVal: dateD, yVal: priceD },
    ];

    const coords = pts.map((p) => {
      const cx = xAxis.scale(p.xVal);
      const cy = yAxis.scale(p.yVal);
      return { name: p.name, cx, cy, yVal: p.yVal };
    });

    if (coords.some((c) => isNaN(c.cx) || isNaN(c.cy))) return null;

    const poly1 = `${coords[0].cx},${coords[0].cy} ${coords[1].cx},${coords[1].cy} ${coords[2].cx},${coords[2].cy}`;
    const poly2 = `${coords[2].cx},${coords[2].cy} ${coords[3].cx},${coords[3].cy} ${coords[4].cx},${coords[4].cy}`;

    // Fibonacci Ratio Midpoint Calculations
    const abMidX = (coords[1].cx + coords[2].cx) / 2;
    const abMidY = (coords[1].cy + coords[2].cy) / 2;

    const bcMidX = (coords[2].cx + coords[3].cx) / 2;
    const bcMidY = (coords[2].cy + coords[3].cy) / 2;

    const cdMidX = (coords[3].cx + coords[4].cx) / 2;
    const cdMidY = (coords[3].cy + coords[4].cy) / 2;

    const xdMidX = (coords[0].cx + coords[4].cx) / 2;
    const xdMidY = (coords[0].cy + coords[4].cy) / 2;

    return (
      <g className="tv-harmonic-overlay">
        <defs>
          <linearGradient id="wingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={isLight ? 0.35 : 0.4} />
            <stop offset="100%" stopColor="#000000" stopOpacity={isLight ? 0.2 : 0.2} />
          </linearGradient>
          <linearGradient id="wingGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity={isLight ? 0.35 : 0.25} />
            <stop offset="100%" stopColor="#059669" stopOpacity={isLight ? 0.18 : 0.12} />
          </linearGradient>
        </defs>

        {/* Triangle Wing X-A-B */}
        <polygon
          points={poly1}
          fill="url(#wingGradient1)"
          stroke="#000000"
          strokeWidth={2.2}
        />
        {/* Triangle Wing B-C-D */}
        <polygon
          points={poly2}
          fill="url(#wingGradient2)"
          stroke={isLight ? '#059669' : '#10b981'}
          strokeWidth={2.2}
        />

        {/* Individual Leg Connectors */}
        <line x1={coords[0].cx} y1={coords[0].cy} x2={coords[1].cx} y2={coords[1].cy} stroke="#000000" strokeWidth={2.5} />
        <line x1={coords[1].cx} y1={coords[1].cy} x2={coords[2].cx} y2={coords[2].cy} stroke="#000000" strokeWidth={2.5} />
        <line x1={coords[2].cx} y1={coords[2].cy} x2={coords[3].cx} y2={coords[3].cy} stroke="#10b981" strokeWidth={2.5} />
        <line x1={coords[3].cx} y1={coords[3].cy} x2={coords[4].cx} y2={coords[4].cy} stroke="#10b981" strokeWidth={2.5} />

        {/* X-D Base Dashed Line */}
        <line
          x1={coords[0].cx}
          y1={coords[0].cy}
          x2={coords[4].cx}
          y2={coords[4].cy}
          stroke="#f59e0b"
          strokeWidth={1.8}
          strokeDasharray="4 4"
        />

        {/* B-D Secondary Connector Line */}
        <line
          x1={coords[2].cx}
          y1={coords[2].cy}
          x2={coords[4].cx}
          y2={coords[4].cy}
          stroke="#8b5cf6"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />

        {/* Activation Horizontal Line extending right from Point B */}
        {showActivation && (
          <g className="activation-ray">
            <line
              x1={coords[2].cx}
              y1={coords[2].cy}
              x2={coords[2].cx + 400}
              y2={coords[2].cy}
              stroke="#0284c7"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <g transform={`translate(${coords[2].cx + 60}, ${coords[2].cy - 12})`}>
              <rect
                x={0}
                y={0}
                width={86}
                height={22}
                rx={5}
                fill={isLight ? '#ffffff' : '#0f172a'}
                stroke="#0284c7"
                strokeWidth={1.5}
              />
              <text
                x={43}
                y={15}
                fill="#0284c7"
                fontSize={11}
                fontWeight="bold"
                textAnchor="middle"
                className="font-mono"
              >
                Activation
              </text>
            </g>
          </g>
        )}

        {/* Fibonacci Ratio Badges */}
        {showRatios && (
          <g className="fibo-ratios font-mono font-bold text-[11px]">
            {/* AB leg ratio */}
            <rect x={abMidX - 22} y={abMidY - 10} width={44} height={18} rx={4} fill={isLight ? '#ffffff' : '#1e293b'} stroke="#000000" strokeWidth={1.2} />
            <text x={abMidX} y={abMidY + 3} fill={isLight ? '#000000' : '#e4e4e7'} fontSize={10} textAnchor="middle">{abRatio}</text>

            {/* BC leg ratio */}
            <rect x={bcMidX - 22} y={bcMidY - 10} width={44} height={18} rx={4} fill={isLight ? '#ffffff' : '#1e293b'} stroke="#10b981" strokeWidth={1.2} />
            <text x={bcMidX} y={bcMidY + 3} fill={isLight ? '#059669' : '#10b981'} fontSize={10} textAnchor="middle">{bcRatio}</text>

            {/* CD leg ratio */}
            <rect x={cdMidX - 22} y={cdMidY - 10} width={44} height={18} rx={4} fill={isLight ? '#ffffff' : '#1e293b'} stroke="#10b981" strokeWidth={1.2} />
            <text x={cdMidX} y={cdMidY + 3} fill={isLight ? '#059669' : '#10b981'} fontSize={10} textAnchor="middle">{cdRatio}</text>

            {/* XD PRZ ratio */}
            <rect x={xdMidX - 22} y={xdMidY - 10} width={44} height={18} rx={4} fill={isLight ? '#ffffff' : '#1e293b'} stroke="#f59e0b" strokeWidth={1.5} />
            <text x={xdMidX} y={xdMidY + 3} fill="#f59e0b" fontSize={10} textAnchor="middle">{xdRatio}</text>
          </g>
        )}

        {/* Watermark Logo */}
        <g opacity={0.15}>
          <circle cx={coords[2].cx} cy={coords[2].cy + 60} r={32} fill={isLight ? '#000000' : '#ffffff'} />
          <text x={coords[2].cx} y={coords[2].cy + 64} fill={isLight ? '#ffffff' : '#000000'} fontSize={20} textAnchor="middle">🦇</text>
          <text x={coords[2].cx} y={coords[2].cy + 82} fill={isLight ? '#000000' : '#ffffff'} fontSize={9} textAnchor="middle" fontWeight="bold">@Homod_Harmonic</text>
        </g>

        {/* Point Vertices (X, A, B, C, D) with Glowing Rings & Price Badges */}
        {coords.map((c) => {
          const isUp = c.name === 'A' || c.name === 'C';
          const labelY = isUp ? c.cy - 16 : c.cy + 22;
          const pillBg = isLight ? '#ffffff' : '#0f172a';
          const pillBorder = c.name === 'X' || c.name === 'A' || c.name === 'B' ? '#000000' : '#10b981';

          return (
            <g key={c.name} className="harmonic-vertex">
              {/* Outer Glow Ring */}
              <circle cx={c.cx} cy={c.cy} r={8} fill={pillBorder} fillOpacity={0.25} />
              {/* Inner Solid Dot */}
              <circle cx={c.cx} cy={c.cy} r={4.5} fill={pillBorder} stroke="#ffffff" strokeWidth={1.5} />

              {/* Vertex Label Badge */}
              <g transform={`translate(${c.cx}, ${labelY})`}>
                <rect x={-34} y={-10} width={68} height={20} rx={6} fill={pillBg} stroke={pillBorder} strokeWidth={1.2} />
                <text x={0} y={3} fill={isLight ? '#0f172a' : '#f8fafc'} fontSize={10} fontWeight="bold" textAnchor="middle" className="font-mono">
                  {c.name}: ${c.yVal.toFixed(1)}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className={`mt-6 rounded-2xl border p-4 sm:p-5 shadow-xl transition-all ${bgColor}`}>
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b pb-3 border-current/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-lg">
            🦇
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 flex-wrap">
              <span>
                {lang === 'ar'
                  ? `الرسم البياني المتعدد (الشارت العريض) - نموذج (${selectedPattern}) - ${symbol} [الإطار: ${selectedTf === '1d' ? 'يومي (Daily)' : selectedTf === '1wk' ? 'أسبوعي (Weekly)' : 'شهري (Monthly)'}]`
                  : `Multi-Pattern Harmonic Chart (Full Width) - (${selectedPattern}) - ${symbol} [Timeframe: ${selectedTf.toUpperCase()}]`}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                {lang === 'ar' ? 'الشارت العريض (Full Width)' : 'Full Width Chart'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                {analysis?.timeframePriorityAr || analysis?.timeframePriority}
              </span>
            </h3>
            <p className="text-xs opacity-70">
              {lang === 'ar'
                ? 'الشارت يعمل الآن بعرض الشاشة الكامل (Full Width) لتبدو المساحة واضحة ومريحة للتحليل الفني ومقارنة النماذج'
                : 'Chart is displayed at full screen width for clear, comfortable technical analysis and pattern comparison'}
            </p>
          </div>
        </div>

        {/* Timeframe & Pattern Filter Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pattern Switcher (HomodMultiPatternAnalyzer) */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-500/30 text-xs font-mono">
            {(['Bat', 'Gartley', 'Butterfly', 'Crab', 'ABCD'] as const).map((pt) => (
              <button
                key={pt}
                onClick={() => {
                  setSelectedPattern(pt);
                  if (onChangePattern) onChangePattern(pt);
                }}
                className={`px-2 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                  selectedPattern === pt
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {pt}
              </button>
            ))}
          </div>

          {/* Dynamic Timeframe Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-current/10 text-xs font-mono">
            {(['1d', '1wk', '1mo'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setSelectedTf(tf);
                  if (onChangeTimeframe) onChangeTimeframe(tf);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                  selectedTf === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {tf === '1d' ? 'DAILY' : tf === '1wk' ? 'WEEKLY' : 'MONTHLY'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                : 'bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-white'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isLight ? (lang === 'ar' ? 'داكن' : 'Dark') : (lang === 'ar' ? 'أبيض' : 'Light')}</span>
          </button>

          <button
            onClick={() => setShowFuture(!showFuture)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              showFuture
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'opacity-50 border-current'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'المسار المستقبلي' : 'Future Path'}</span>
          </button>

          <button
            onClick={() => setShowRatios(!showRatios)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              showRatios
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'opacity-50 border-current'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fibo Ratios</span>
          </button>

          <button
            onClick={() => setShowActivation(!showActivation)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showActivation ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'opacity-50 border-current'
            }`}
          >
            Activation
          </button>

          <button
            onClick={() => setShowGap(!showGap)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showGap ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'opacity-50 border-current'
            }`}
          >
            GAP
          </button>

          <button
            onClick={() => setIsDoubleWidth(!isDoubleWidth)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isDoubleWidth
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 opacity-75'
            }`}
          >
            <span>↔️</span>
            <span>{isDoubleWidth ? (lang === 'ar' ? 'عرض مضاعف (2X)' : 'Double Width (2X)') : (lang === 'ar' ? 'عرض الشاشة (1X)' : 'Screen Width (1X)')}</span>
          </button>
        </div>
      </div>

      {/* معلومات السعر داخل الشارت (الشارت العريض 100%) */}
      <div className="flex flex-wrap justify-between items-center px-4 py-2.5 bg-slate-950/80 rounded-xl mb-3 text-xs border border-slate-800 gap-2 shadow-inner">
        <span className="text-emerald-400 font-bold">
          {lang === 'ar'
            ? `السعر الحالي (Term): ${currency} ${terminalBarPrice}`
            : `Current Price (Term): ${currency} ${terminalBarPrice}`}
        </span>
        <span className="text-rose-400 font-bold">
          {lang === 'ar'
            ? `وقف الخسارة SL: ${currency} ${invalidationPrice}`
            : `Stop Loss SL: ${currency} ${invalidationPrice}`}
        </span>
        <span className="text-cyan-400 font-bold">
          {lang === 'ar'
            ? `منطقة PRZ: ${currency} ${przMinVal} - ${przMaxVal}`
            : `PRZ Zone: ${currency} ${przMinVal} - ${przMaxVal}`}
        </span>
        <span className="text-amber-400 font-bold flex items-center gap-1">
          <span>📈</span>
          <span>{lang === 'ar' ? 'الشارت يعمل الآن بعرض الشاشة الكامل (Full Width)' : 'Full Width Chart Active'}</span>
        </span>
      </div>

      {/* Visual Scroll Hint for Double Width */}
      {isDoubleWidth && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-cyan-950/50 border border-cyan-800/60 rounded-xl mb-3 text-xs text-cyan-300 shadow-sm">
          <span className="flex items-center gap-2 font-bold">
            <span className="text-base">↔️</span>
            <span>{lang === 'ar' ? 'وضع الشارت العريض المضاعف (2X) فعال الآن - اسحب الشارت يميناً ويساراً لرؤية الشموع والمناطق بوضوح تام' : 'Double Width Chart (2X) Active - Swipe left/right to inspect all candles clearly'}</span>
          </span>
          <span className="text-[11px] bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold whitespace-nowrap">
            {lang === 'ar' ? 'اسحب للتنقل ↔️' : 'Swipe horizontally ↔️'}
          </span>
        </div>
      )}

      {/* Main TradingView Style Canvas with 850px Height & Double Width Scrollable Container */}
      <div
        ref={scrollRef}
        className="h-[620px] sm:h-[760px] md:h-[880px] w-full dir-ltr relative rounded-xl overflow-x-auto overflow-y-hidden border border-current/15 shadow-2xl"
        style={{ backgroundColor: canvasBg }}
      >
        <div className={`h-full transition-all duration-300 ${isDoubleWidth ? 'min-w-[1050px] sm:min-w-[1600px] lg:min-w-[2200px]' : 'min-w-full'} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 50, right: isMobile ? 45 : 65, left: 15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={true} />

            <XAxis
              dataKey="date"
              stroke={textColor}
              fontSize={isMobile ? 9 : 10}
              tickLine={false}
              opacity={0.7}
            />

            <YAxis
              orientation="right"
              domain={[yMin, yMax]}
              stroke={textColor}
              fontSize={isMobile ? 10 : 11}
              tickLine={false}
              opacity={0.85}
              tickFormatter={(v) => `$${v.toFixed(2)}`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#d4d4d8' : '#334155',
                borderRadius: '12px',
                fontSize: '12px',
                color: textColor,
              }}
            />

            {/* Candle/Line Price Action */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#000000"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls={false}
              name={lang === 'ar' ? 'السهم الحالي (تاريخي)' : 'Historical Price'}
            />

            {/* Future Projected Path (Homod Financial Analyzer 15 steps trajectory) */}
            {showFuture && (
              <Line
                type="monotone"
                dataKey="futureClose"
                stroke="#ff9900"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#ff9900' }}
                activeDot={{ r: 6 }}
                connectNulls={true}
                name={lang === 'ar' ? 'الرسم البياني المستقبلي (المتوقع)' : 'Future Projected Chart'}
              />
            )}

            {/* PRZ Potential Reversal Zone Box */}
            <ReferenceArea
              {...({
                y1: Number(przBottom),
                y2: Number(przTop),
                fill: '#10b981',
                fillOpacity: isLight ? 0.22 : 0.16,
                stroke: '#10b981',
                strokeWidth: 1,
                strokeDasharray: '3 3',
                label: {
                  value: 'PRZ Potential Reversal Zone',
                  fill: '#10b981',
                  fontSize: isMobile ? 10 : 12,
                  fontWeight: 'bold',
                  position: 'insideLeft',
                  dx: isMobile ? 10 : 25,
                  dy: 0,
                },
              } as any)}
            />

            {/* Upper PRZ Boundary Line */}
            <ReferenceLine
              y={Number(przTop)}
              stroke="#10b981"
              strokeWidth={1.5}
              label={{
                value: `(${przTop})`,
                fill: '#10b981',
                fontSize: isMobile ? 10 : 11,
                fontWeight: 'bold',
                position: 'insideRight',
                dx: isMobile ? -10 : -30,
                dy: -12,
              }}
            />

            {/* Lower PRZ Boundary Line */}
            <ReferenceLine
              y={Number(przBottom)}
              stroke="#10b981"
              strokeWidth={1.5}
              label={{
                value: `(${przBottom})`,
                fill: '#10b981',
                fontSize: isMobile ? 10 : 11,
                fontWeight: 'bold',
                position: 'insideRight',
                dx: isMobile ? -10 : -30,
                dy: 12,
              }}
            />

            {/* Activation Level Solid Line */}
            {showActivation && (
              <ReferenceLine
                y={Number(activationPrice)}
                stroke="#0284c7"
                strokeWidth={2}
                label={{
                  value: isMobile ? `Act ($${activationPrice})` : `Activation ($${activationPrice})`,
                  fill: '#0284c7',
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 'bold',
                  position: 'insideLeft',
                  dx: 15,
                  dy: -14,
                }}
              />
            )}

            {/* GAP Level Dotted Line */}
            {showGap && (
              <ReferenceLine
                y={Number(gapPrice)}
                stroke="#ffa500"
                strokeDasharray="2 2"
                strokeWidth={1.5}
                label={{
                  value: isMobile ? `GAP ($${gapPrice})` : `GAP ($${gapPrice})`,
                  fill: '#ffa500',
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 'bold',
                  position: 'insideLeft',
                  dx: 15,
                  dy: 12,
                }}
              />
            )}

            {/* Terminal Bar Line */}
            {showTerminalBar && (
              <ReferenceLine
                y={Number(terminalBarPrice)}
                stroke={textColor}
                strokeWidth={1.5}
                label={{
                  value: isMobile ? `Term ($${terminalBarPrice})` : `Terminal Bar ($${terminalBarPrice})`,
                  fill: textColor,
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 'bold',
                  position: 'insideRight',
                  dx: isMobile ? -15 : -80,
                  dy: -14,
                }}
              />
            )}

            {/* Invalidation Level Red Dashed Line (#ff4d4d) */}
            <ReferenceLine
              y={Number(invalidationPrice)}
              stroke="#ff4d4d"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: isMobile ? `SL ($${invalidationPrice})` : `Invalidation Level ($${invalidationPrice})`,
                fill: '#ff4d4d',
                fontSize: isMobile ? 10 : 12,
                fontWeight: 'bold',
                position: 'insideRight',
                dx: isMobile ? -15 : -80,
                dy: 12,
              }}
            />

            {/* Harmonic & Fibonacci Overlay */}
            <Customized component={CustomHarmonicBatOverlay} />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Summary Bar - Display Order: X Price | A Price | B (Activation) | PRZ Target Range | Invalidation Level (SL) */}
      <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs flex-wrap gap-3">
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap font-mono">
          <span className="text-slate-400">
            <strong className="text-slate-200">X Price:</strong> ${priceX.toFixed(2)}
          </span>
          <span className="text-slate-400">
            <strong className="text-slate-200">A Price:</strong> ${priceA.toFixed(2)}
          </span>
          <span className="text-slate-400">
            <strong className="text-sky-400">B (Activation):</strong> ${activationPrice}
          </span>
          <span className="text-slate-400">
            <strong className="text-emerald-400">PRZ Target Range:</strong>{' '}
            <span dir="ltr" className="inline-block font-mono text-emerald-300 font-semibold" style={{ unicodeBidi: 'bidi-override' }}>
              ${przBottom} - ${przTop}
            </span>
          </span>
          <span className="text-slate-400">
            <strong className="text-rose-400">Invalidation Level (SL):</strong> ${invalidationPrice}
          </span>
        </div>

        <div className="font-sans text-[11px] opacity-75">
          {lang === 'ar' ? 'التوافق الفني المالي لنموذج الخفاش والانعكاس الكلاسيكي' : 'Harmonic & Classical Confluence Analysis'}
        </div>
      </div>
    </div>
  );
};
