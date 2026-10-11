import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
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
import { Activity, BarChart2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Language, translations } from '../data/translations';

interface StockChartProps {
  data: StockDataPoint[];
  symbol: string;
  levels: TradeLevels;
  currency?: string;
  lang?: Language;
  timeframe?: string;
  patternType?: HarmonicPatternType;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  symbol,
  levels,
  currency = 'USD',
  lang = 'ar',
  timeframe = '1d',
  patternType = 'Bat',
}) => {
  const t = translations[lang];
  const [showBatPattern, setShowBatPattern] = useState(true);
  const [showPRZ, setShowPRZ] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [isDoubleWidth, setIsDoubleWidth] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        {lang === 'ar'
          ? 'لا تتوفر بيانات رسم بياني حالياً للرمز المحدد.'
          : 'No chart data available for the selected symbol.'}
      </div>
    );
  }

  const przLow = Math.min(levels.tp1, levels.tp2);
  const przHigh = Math.max(levels.tp1, levels.tp2);
  const rawBottom = przLow > 0 ? przLow : levels.entryPrice * 0.98;
  const rawTop = przHigh > 0 ? przHigh : levels.entryPrice * 1.02;
  const przBottom = Math.min(rawBottom, rawTop);
  const przTop = Math.max(rawBottom, rawTop);

  const entry = levels.entryPrice || data[data.length - 1]?.close || 100;
  const rawLows = data.map((d) => d.low).concat([levels.stopLoss]).filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);
  const rawHighs = data.map((d) => d.high).concat([levels.tp3, przTop]).filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);

  const minPrice = Number((Math.min(...(rawLows.length > 0 ? rawLows : [entry * 0.90])) * 0.98).toFixed(2));
  const maxPrice = Number((Math.max(...(rawHighs.length > 0 ? rawHighs : [entry * 1.10])) * 1.02).toFixed(2));

  const analysis = analyzeHarmonicBat(data, timeframe, patternType as HarmonicPatternType);

  // Custom Harmonic Bat Pattern SVG Overlay Component for Recharts
  const CustomHarmonicOverlay = (props: any) => {
    if (!showBatPattern || !data || data.length < 5) return null;
    const { xAxisMap, yAxisMap } = props;
    if (!xAxisMap || !yAxisMap) return null;

    const xAxis = Object.values(xAxisMap)[0] as any;
    const yAxis = Object.values(yAxisMap)[0] as any;
    if (!xAxis || !yAxis || !xAxis.scale || !yAxis.scale) return null;

    const n = data.length;
    const dateX = analysis?.dateX || data[analysis?.idxX ?? Math.floor(n * 0.1)]?.date || data[0]?.date;
    const dateA = analysis?.dateA || data[analysis?.idxA ?? Math.floor(n * 0.35)]?.date || data[Math.floor(n * 0.35)]?.date;
    const dateB = analysis?.dateB || data[analysis?.idxB ?? Math.floor(n * 0.5)]?.date || data[Math.floor(n * 0.5)]?.date;
    const dateC = analysis?.dateC || data[analysis?.idxC ?? Math.floor(n * 0.65)]?.date || data[Math.floor(n * 0.65)]?.date;
    const dateD = analysis?.dateD || data[analysis?.idxD ?? Math.floor(n * 0.85)]?.date || data[n - 1]?.date;

    const priceX = analysis?.xPrice ?? data[Math.floor(n * 0.1)]?.low ?? levels.entryPrice * 0.88;
    const priceA = analysis?.aPrice ?? data[Math.floor(n * 0.35)]?.high ?? levels.tp3;
    const priceB = analysis?.bPrice ?? data[Math.floor(n * 0.5)]?.high ?? levels.entryPrice * 1.05;
    const priceC = analysis?.cPrice ?? data[Math.floor(n * 0.65)]?.low ?? levels.tp2;
    const priceD = analysis?.dPrice ?? analysis?.przMin ?? data[n - 1]?.close ?? levels.entryPrice;

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

    return (
      <g className="harmonic-overlay">
        {/* Triangle X-A-B */}
        <polygon
          points={poly1}
          fill="rgba(56, 189, 248, 0.16)"
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        {/* Triangle B-C-D */}
        <polygon
          points={poly2}
          fill="rgba(56, 189, 248, 0.16)"
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />

        {/* Dashed Connecting Line X-D */}
        <line
          x1={coords[0].cx}
          y1={coords[0].cy}
          x2={coords[4].cx}
          y2={coords[4].cy}
          stroke="#38bdf8"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.6}
        />

        {/* Pivot Point Markers and Text Labels */}
        {coords.map((c) => (
          <g key={c.name}>
            <circle
              cx={c.cx}
              cy={c.cy}
              r={5}
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth={1.5}
            />
            <text
              x={c.cx}
              y={c.cy > 180 ? c.cy + 16 : c.cy - 10}
              fill="#ffffff"
              fontSize={12}
              fontWeight="bold"
              textAnchor="middle"
              className="font-mono"
            >
              {c.name}
            </text>
          </g>
        ))}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as StockDataPoint;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-mono text-slate-200">
          <div className="text-slate-400 font-sans border-b border-slate-800 pb-1 mb-1 font-bold">
            {t.date}: {p.date}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">{t.closePrice}:</span>
            <span className="font-bold text-emerald-400">${p.close}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">{t.openPrice}:</span>
            <span className="text-slate-300">${p.open}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">{t.highPrice}:</span>
            <span className="text-emerald-300">${p.high}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">{t.lowPrice}:</span>
            <span className="text-rose-300">${p.low}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-800/80 pt-1">
            <span className="text-slate-400">{t.volume}:</span>
            <span className="text-amber-400">{p.volume.toLocaleString()}</span>
          </div>
          {p.sma20 && (
            <div className="flex justify-between gap-4">
              <span className="text-indigo-400">SMA 20:</span>
              <span className="text-indigo-300">${p.sma20}</span>
            </div>
          )}
          {p.rsi && (
            <div className="flex justify-between gap-4">
              <span className="text-teal-400">RSI 14:</span>
              <span className="text-teal-300">{p.rsi}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <span>{t.chartTitle}</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
              {lang === 'ar' ? 'الشارت العريض (Full Width)' : 'Full Width Chart'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            {lang === 'ar'
              ? 'الشارت يعمل الآن بعرض الشاشة الكامل لتبدو المساحة واضحة ومريحة للتحليل الفني'
              : 'Chart is displayed at full screen width for clear, comfortable technical analysis'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setShowBatPattern(!showBatPattern)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showBatPattern
                ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>{t.batPatternToggle}</span>
          </button>

          <button
            onClick={() => setShowPRZ(!showPRZ)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showPRZ
                ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>{t.przZoneToggle}</span>
          </button>

          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showSMA
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.smaToggle}</span>
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showVolume
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>{t.volumeToggle}</span>
          </button>

          <button
            onClick={() => setChartType(chartType === 'area' ? 'line' : 'area')}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            {chartType === 'area' ? t.chartTypeArea : t.chartTypeLine}
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
            ? `السعر الحالي (Term): ${currency} ${data[data.length - 1]?.close || levels.entryPrice}`
            : `Current Price (Term): ${currency} ${data[data.length - 1]?.close || levels.entryPrice}`}
        </span>
        <span className="text-rose-400 font-bold">
          {lang === 'ar'
            ? `وقف الخسارة SL: ${currency} ${levels.stopLossPrice}`
            : `Stop Loss SL: ${currency} ${levels.stopLossPrice}`}
        </span>
        <span className="text-cyan-400 font-bold">
          {lang === 'ar'
            ? `منطقة PRZ: ${currency} ${levels.przMin} - ${levels.przMax}`
            : `PRZ Zone: ${currency} ${levels.przMin} - ${levels.przMax}`}
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

      {/* Chart Canvas */}
      <div
        ref={scrollRef}
        className="h-[520px] sm:h-[640px] md:h-[740px] w-full dir-ltr relative rounded-xl overflow-x-auto overflow-y-hidden border border-slate-800 shadow-inner"
      >
        <div className={`h-full transition-all duration-300 ${isDoubleWidth ? 'min-w-[1050px] sm:min-w-[1600px] lg:min-w-[2200px]' : 'min-w-full'} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 40, left: 10, bottom: 15 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={30}
            />

            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              fontSize={11}
              orientation="right"
              tickFormatter={(v) => `$${v}`}
              width={60}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* PRZ Shaded Rectangle Zone */}
            {showPRZ && (
              <ReferenceArea
                {...({
                  y1: przBottom,
                  y2: przTop,
                  fill: '#38bdf8',
                  fillOpacity: 0.14,
                  stroke: '#38bdf8',
                  strokeDasharray: '2 2',
                  label: {
                    value: `PRZ Target Zone ($${przBottom.toFixed(2)} - $${przTop.toFixed(2)})`,
                    fill: '#38bdf8',
                    fontSize: 10,
                    fontWeight: 'bold',
                    position: 'insideTopLeft',
                  },
                } as any)}
              />
            )}

            {/* Volume bars */}
            {showVolume && (
              <Bar
                dataKey="volume"
                yAxisId={0}
                fill="#334155"
                opacity={0.3}
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* Main Price Area/Line */}
            {chartType === 'area' ? (
              <Area
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGradient)"
                name="سعر الإغلاق"
              />
            ) : (
              <Line
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="سعر الإغلاق"
              />
            )}

            {/* Custom Harmonic Bat Pattern Layer */}
            <Customized component={CustomHarmonicOverlay} />

            {/* Moving Averages */}
            {showSMA && (
              <>
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA 20"
                />
                <Line
                  type="monotone"
                  dataKey="sma50"
                  stroke="#c084fc"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA 50"
                />
              </>
            )}

            {/* Invalidation / Stop Loss Reference Line */}
            <ReferenceLine
              y={levels.stopLoss}
              stroke="#f43f5e"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: `Invalidation / SL: $${levels.stopLoss.toFixed(2)}`,
                fill: '#f43f5e',
                fontSize: 11,
                fontWeight: 'bold',
                position: 'insideLeft',
                dx: 15,
                dy: -10,
              }}
            />

            {/* PRZ Entry Line */}
            <ReferenceLine
              y={levels.entryPrice}
              stroke="#000000"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `PRZ (Entry): $${levels.entryPrice.toFixed(2)}`,
                fill: '#000000',
                fontSize: 11,
                position: 'insideLeft',
                dx: 15,
                dy: -10,
              }}
            />

            {/* Take Profit Levels */}
            <ReferenceLine
              y={levels.tp1}
              stroke="#34d399"
              strokeDasharray="2 2"
              strokeWidth={1.5}
              label={{
                value: `TP1: $${levels.tp1.toFixed(2)}`,
                fill: '#34d399',
                fontSize: 11,
                position: 'insideLeft',
                dx: 15,
                dy: -10,
              }}
            />

            <ReferenceLine
              y={levels.tp2}
              stroke="#10b981"
              strokeDasharray="2 2"
              strokeWidth={1.5}
              label={{
                value: `TP2: $${levels.tp2.toFixed(2)}`,
                fill: '#10b981',
                fontSize: 11,
                position: 'insideLeft',
                dx: 15,
                dy: -10,
              }}
            />

            <ReferenceLine
              y={levels.tp3}
              stroke="#059669"
              strokeDasharray="2 2"
              strokeWidth={1.5}
              label={{
                value: `TP3: $${levels.tp3.toFixed(2)}`,
                fill: '#059669',
                fontSize: 11,
                position: 'insideLeft',
                dx: 15,
                dy: -10,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Legend Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
            <span>{lang === 'ar' ? 'نموذج الخفاش (X-A-B-C-D)' : 'Bat Pattern (X-A-B-C-D)'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <span>{lang === 'ar' ? 'منطقة الانعكاس PRZ' : 'PRZ Reversal Zone'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>{lang === 'ar' ? 'مستوى الإلغاء (SL)' : 'Invalidation Level (SL)'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>{lang === 'ar' ? 'الأهداف TP1/2/3' : 'Targets TP1/2/3'}</span>
          </span>
        </div>
        <div>
          {lang === 'ar'
            ? 'تحديث تلقائي للمستويات والنموذج حسب الأسعار المتاحة'
            : 'Auto-updated harmonic levels & pattern based on market prices'}
        </div>
      </div>
    </div>
  );
};
