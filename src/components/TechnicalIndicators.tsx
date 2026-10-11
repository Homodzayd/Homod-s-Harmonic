import React from 'react';
import { Activity, ShieldCheck, Compass, Gauge, AlertCircle, ArrowUpRight } from 'lucide-react';
import { StockDataPoint } from '../types';
import { calculateSupportResistance } from '../utils/technical';

interface TechnicalIndicatorsProps {
  data: StockDataPoint[];
  currentPrice: number;
  rrr: number;
}

export const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  data,
  currentPrice,
  rrr,
}) => {
  if (!data || data.length === 0) return null;

  const sr = calculateSupportResistance(data);
  const lastDataPoint = data[data.length - 1];
  const rsi = lastDataPoint?.rsi ?? 50;

  let rsiStatus = 'محايد';
  let rsiBg = 'bg-slate-800 text-slate-300';
  if (rsi > 70) {
    rsiStatus = 'ذروة شراء (مخاطرة عالية) ⚠️';
    rsiBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
  } else if (rsi < 30) {
    rsiStatus = 'ذروة بيع (منطقة ارتداء محتملة) 🎯';
    rsiBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  }

  let rrrVerdict = 'ممتاز (R:R > 1:1.4)';
  let rrrBg = 'text-emerald-400';
  if (rrr < 1.0) {
    rrrVerdict = 'ضعيف (المخاطرة أكبر من العائد) ❌';
    rrrBg = 'text-rose-400';
  } else if (rrr < 1.3) {
    rrrVerdict = 'مقبول (R:R بين 1:1 و 1:1.3)';
    rrrBg = 'text-amber-400';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Trend */}
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300/80 mb-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>الاتجاه العام السائد</span>
        </div>
        <div className="text-lg font-bold text-white mb-1">{sr.trend}</div>
        <p className="text-[11px] text-emerald-400/70">محسوب بناءً على متوسط حركة 30 شمعة</p>
      </div>

      {/* Card 2: Support / Resistance */}
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300/80 mb-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>الدعم والمقاومة القريبة</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-slate-200 mt-1">
          <div>
            <span className="text-rose-400 block text-[10px]">المقاومة:</span>
            <span className="font-bold text-sm">${sr.resistance}</span>
          </div>
          <div className="text-right">
            <span className="text-emerald-400 block text-[10px]">الدعم:</span>
            <span className="font-bold text-sm">${sr.support}</span>
          </div>
        </div>
      </div>

      {/* Card 3: RSI Indicator */}
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300/80 mb-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span>مؤشر القوة النسبية (RSI 14)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black font-mono text-white">{rsi}</span>
          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${rsiBg}`}>
            {rsiStatus}
          </span>
        </div>
      </div>

      {/* Card 4: Risk / Reward Verdict */}
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300/80 mb-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>تقييم عائد الصفقة للمخاطرة</span>
        </div>
        <div className={`text-sm font-bold ${rrrBg} mb-1`}>{rrrVerdict}</div>
        <p className="text-[11px] text-emerald-400/70">
          معدل R:R الحالي للهدف الأول = <span className="font-mono text-white font-bold">1:{rrr.toFixed(1)}</span>
        </p>
      </div>
    </div>
  );
};
