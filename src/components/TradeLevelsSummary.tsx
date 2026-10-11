import React from 'react';
import { Target, ShieldAlert, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { TradeLevels, TradeSettings } from '../types';

interface TradeLevelsSummaryProps {
  levels: TradeLevels;
  settings: TradeSettings;
  currency?: string;
}

export const TradeLevelsSummary: React.FC<TradeLevelsSummaryProps> = ({
  levels,
  settings,
  currency = 'USD',
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'SR' || currency === 'SAR' ? 'SAR' : 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const slLossPct = levels.entryPrice > 0 ? (((levels.entryPrice - levels.stopLoss) / levels.entryPrice) * 100).toFixed(1) : settings.stopLossPct;
  const tp1GainPct = levels.entryPrice > 0 ? (((levels.tp1 - levels.entryPrice) / levels.entryPrice) * 100).toFixed(1) : settings.tp1Pct;
  const tp2GainPct = levels.entryPrice > 0 ? (((levels.tp2 - levels.entryPrice) / levels.entryPrice) * 100).toFixed(1) : settings.tp2Pct;
  const tp3GainPct = levels.entryPrice > 0 ? (((levels.tp3 - levels.entryPrice) / levels.entryPrice) * 100).toFixed(1) : settings.tp3Pct;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Column 1: Trade Levels (نقاط التداول) */}
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-900/60">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <span>📍 نقاط التداول (Trade Levels)</span>
            </h3>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
              PRZ Strategy
            </span>
          </div>

          <div className="space-y-3">
            {/* PRZ Entry Zone */}
            <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-sky-300 font-semibold">منطقة الدخول المحددة (PRZ):</div>
                <div className="text-xs text-slate-400">سعر الشراء المستهدف المعتمد</div>
              </div>
              <div className="text-lg font-bold font-mono text-sky-300">
                {formatCurrency(levels.entryPrice)}
              </div>
            </div>

            {/* Stop Loss Level */}
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-rose-300 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>وقف الخسارة (Stop Loss):</span>
                </div>
                <div className="text-[11px] text-rose-400/80">
                  انخفاض (-{slLossPct}%) | مخاطرة للسهم: {formatCurrency(levels.riskPerShare)}
                </div>
              </div>
              <div className="text-lg font-bold font-mono text-rose-400">
                {formatCurrency(levels.stopLoss)}
              </div>
            </div>

            {/* Target 1 */}
            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الهدف الأول (TP1):</span>
                </div>
                <div className="text-[11px] text-emerald-400/80">
                  ربح (+{tp1GainPct}%) | R:R = 1:{levels.riskRewardRatioTp1.toFixed(1)}
                </div>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {formatCurrency(levels.tp1)}
              </div>
            </div>

            {/* Target 2 */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الهدف الثاني (TP2):</span>
                </div>
                <div className="text-[11px] text-emerald-400/80">
                  ربح (+{tp2GainPct}%) | R:R = 1:{levels.riskRewardRatioTp2.toFixed(1)}
                </div>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {formatCurrency(levels.tp2)}
              </div>
            </div>

            {/* Target 3 */}
            <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الهدف الثالث (TP3):</span>
                </div>
                <div className="text-[11px] text-emerald-400/80">
                  ربح (+{tp3GainPct}%) | R:R = 1:{levels.riskRewardRatioTp3.toFixed(1)}
                </div>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {formatCurrency(levels.tp3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Position Sizing & Capital Management (إدارة رأس المال) */}
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-900/60">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" />
              <span>💰 إدارة رأس المال (Position Sizing)</span>
            </h3>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
              {settings.riskPct}% Risk Policy
            </span>
          </div>

          <div className="space-y-3">
            {/* Capital & Allowed Risk */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60">
                <div className="text-[11px] text-emerald-300/70 font-medium">إجمالي رأس المال</div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  {formatCurrency(settings.capital)}
                </div>
              </div>
              <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60">
                <div className="text-[11px] text-amber-400 font-medium">المخاطرة المسموحة ({settings.riskPct}%)</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-1">
                  {formatCurrency(levels.maxRiskAmount)}
                </div>
              </div>
            </div>

            {/* Position Share Size */}
            <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>عدد الأسهم المقترح (Position Size):</span>
                </div>
                <div className="text-xs text-emerald-400/70 mt-0.5">
                  حساب دقيق لضمان عدم تجاوز أقصى خسارة مسموحة
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-300">
                {levels.positionSize.toLocaleString()} <span className="text-xs font-normal text-emerald-400">سهم</span>
              </div>
            </div>

            {/* Total Position Cost & Portfolio % */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60">
                <div className="text-[11px] text-emerald-300/70 font-medium">تكلُفة الصفقة الإجمالية</div>
                <div className="text-sm font-bold font-mono text-emerald-200 mt-1">
                  {formatCurrency(levels.totalPositionCost)}
                </div>
              </div>
              <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60">
                <div className="text-[11px] text-emerald-300/70 font-medium">نسبة التخصيص من المحفظة</div>
                <div className="text-sm font-bold font-mono text-teal-400 mt-1">
                  {levels.portfolioAllocationPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Projected Gain at TP1 */}
            <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60 flex items-center justify-between">
              <div className="text-xs text-emerald-200 font-medium">
                الربح المتوقع عند الهدف الأول (TP1):
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                +{formatCurrency(levels.expectedGainTp1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
