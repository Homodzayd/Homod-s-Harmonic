import React, { useState } from 'react';
import { Copy, Check, Share2, FileText } from 'lucide-react';
import { TradeLevels, TradeSettings } from '../types';

interface TradePlanExporterProps {
  symbol: string;
  levels: TradeLevels;
  settings: TradeSettings;
}

export const TradePlanExporter: React.FC<TradePlanExporterProps> = ({
  symbol,
  levels,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  const generateTicketText = () => {
    return `📊 خطة تداول وحجم المركز | ${symbol.toUpperCase()}
----------------------------------
📍 منطقة الدخول (PRZ): $${levels.entryPrice.toFixed(2)}
🛑 وقف الخسارة (SL): $${levels.stopLoss.toFixed(2)} (-${settings.stopLossPct}%)
🎯 الهدف الأول (TP1): $${levels.tp1.toFixed(2)} (+${settings.tp1Pct}%)
🎯 الهدف الثاني (TP2): $${levels.tp2.toFixed(2)} (+${settings.tp2Pct}%)
🎯 الهدف الثالث (TP3): $${levels.tp3.toFixed(2)} (+${settings.tp3Pct}%)
----------------------------------
💰 رأس المال: $${settings.capital.toLocaleString()}
🛡️ أقصى مخاطرة مسموحة (${settings.riskPct}%): $${levels.maxRiskAmount.toFixed(2)}
📦 كمية الأسهم الموصى بها: ${levels.positionSize.toLocaleString()} سهم
💵 إجمالي تكلفة الصفقة: $${levels.totalPositionCost.toFixed(2)}
📈 نسبة العائد إلى المخاطرة (R:R): 1:${levels.riskRewardRatioTp1.toFixed(1)}
----------------------------------
🦇 تم إنشاؤه عبر: الخفاش المالي | Homod Harmonic`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateTicketText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-900/60">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">📋 تذكرة الصفقة وسجل التداول (Trade Log Export)</h3>
        </div>

        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'تم النسخ!' : 'نسخ التذكرة'}</span>
        </button>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all dir-ltr">
        {generateTicketText()}
      </div>
    </div>
  );
};
