import React, { useState } from 'react';
import { Calculator, DollarSign, Layers, ArrowRightLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TradeLevels, TradeSettings } from '../types';

interface PositionSizingCardProps {
  levels: TradeLevels;
  settings: TradeSettings;
  onChangeSettings: (newSettings: Partial<TradeSettings>) => void;
  currency?: string;
}

export const PositionSizingCard: React.FC<PositionSizingCardProps> = ({
  levels,
  settings,
  onChangeSettings,
  currency = 'USD',
}) => {
  const [customShares, setCustomShares] = useState<number>(levels.positionSize);
  const [useCustomShares, setUseCustomShares] = useState(false);

  const activeSize = useCustomShares ? customShares : levels.positionSize;
  const activeCost = activeSize * levels.entryPrice;
  const activeRiskAmount = activeSize * (levels.entryPrice - levels.stopLoss);
  const activeRiskPctOfCapital = settings.capital > 0 ? (activeRiskAmount / settings.capital) * 100 : 0;

  // Partial profits strategy calculation: 50% TP1, 30% TP2, 20% TP3
  const tp1Profit = activeSize * 0.5 * (levels.tp1 - levels.entryPrice);
  const tp2Profit = activeSize * 0.3 * (levels.tp2 - levels.entryPrice);
  const tp3Profit = activeSize * 0.2 * (levels.tp3 - levels.entryPrice);
  const totalScaledProfit = tp1Profit + tp2Profit + tp3Profit;

  return (
    <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-900/60">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-400" />
            <span>🧮 حاسبة خيارات التداوُل والتخريج الجزئي (Scaled Exits)</span>
          </h3>
          <p className="text-xs text-slate-400">
            اختبار تأثير تغيير كمية الأسهم وتحديد سيناريو جني الأرباح التدريجي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={useCustomShares}
              onChange={(e) => {
                setUseCustomShares(e.target.checked);
                if (e.target.checked) setCustomShares(levels.positionSize);
              }}
              className="accent-emerald-500 rounded"
            />
            <span>تعديل عدد الأسهم يدوياً</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input & Share Adjuster */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">كمية الأسهم النشطة</div>
            {useCustomShares ? (
              <div className="space-y-3">
                <input
                  type="number"
                  min="1"
                  value={customShares}
                  onChange={(e) => setCustomShares(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <div className="text-[11px] text-slate-400">
                  عدد المقترح آلياً حسب المخاطرة: <span className="font-mono text-white">{levels.positionSize}</span>
                </div>
              </div>
            ) : (
              <div className="text-3xl font-black font-mono text-emerald-400 my-2">
                {levels.positionSize.toLocaleString()} <span className="text-xs text-slate-400">سهم</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>قيمة الشراء الكلية:</span>
              <span className="text-slate-200 font-bold">${activeCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>أقصى خسارة حقيقية:</span>
              <span className="text-rose-400 font-bold">${activeRiskAmount.toFixed(2)} ({activeRiskPctOfCapital.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Scaled Profit Scenario (50% TP1, 30% TP2, 20% TP3) */}
        <div className="lg:col-span-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>استراتيجية التخريج والبيع الجزئي (Partial Exits 50% - 30% - 20%)</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                إجمالي الربح المتوقع: +${totalScaledProfit.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">1. إغلاق 50% عند TP1</div>
                <div className="text-xs text-slate-300 font-mono mt-1">${levels.tp1.toFixed(2)}</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  +${tp1Profit.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">({Math.floor(activeSize * 0.5)} سهم)</div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">2. إغلاق 30% عند TP2</div>
                <div className="text-xs text-slate-300 font-mono mt-1">${levels.tp2.toFixed(2)}</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  +${tp2Profit.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">({Math.floor(activeSize * 0.3)} سهم)</div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">3. إغلاق 20% عند TP3</div>
                <div className="text-xs text-slate-300 font-mono mt-1">${levels.tp3.toFixed(2)}</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  +${tp3Profit.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">({Math.floor(activeSize * 0.2)} سهم)</div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span>تكتيك الإدارة: بعد تحقق TP1 يُفضل تحريك أمر إيقاف الخسارة مباشرة إلى سعر الدخول (Break-even).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
