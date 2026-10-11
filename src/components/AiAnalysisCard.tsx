import React, { useState } from 'react';
import { Sparkles, RefreshCw, Bot, AlertCircle, CheckCircle } from 'lucide-react';
import { TradeLevels, TradeSettings, StockDataPoint } from '../types';

interface AiAnalysisCardProps {
  symbol: string;
  levels: TradeLevels;
  settings: TradeSettings;
  data: StockDataPoint[];
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({
  symbol,
  levels,
  settings,
  data,
}) => {
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setError(null);

    const recentHigh = data.length ? Math.max(...data.slice(-20).map((d) => d.high)) : levels.entryPrice;
    const recentLow = data.length ? Math.min(...data.slice(-20).map((d) => d.low)) : levels.entryPrice;
    const firstClose = data.length ? data[Math.max(0, data.length - 20)].close : levels.entryPrice;
    const changePct = firstClose ? (((levels.entryPrice - firstClose) / firstClose) * 100).toFixed(1) : '0';

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          currentPrice: levels.entryPrice,
          stopLoss: levels.stopLoss,
          tp1: levels.tp1,
          tp2: levels.tp2,
          tp3: levels.tp3,
          capital: settings.capital,
          riskPct: settings.riskPct,
          positionSize: levels.positionSize,
          dataSummary: {
            recentHigh,
            recentLow,
            changePct,
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.analysis) {
        setAnalysisText(json.analysis);
      } else {
        throw new Error(json.error || 'فشل الحصول على الاستجابة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التواصل مع خادم الذكاء الاصطناعي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-900/60">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🤖 مساعد الذكاء الاصطناعي لتحليل حركة السعر (Price Action AI)</span>
            </h3>
            <p className="text-xs text-slate-400">
              استخراج تقرير فني شامل وملاحظات تداول معتمدة نموذج Gemini
            </p>
          </div>
        </div>

        <button
          onClick={fetchAiAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          <span>{analysisText ? 'تحديث التحليل' : 'استخراج التقرير الذكي'}</span>
        </button>
      </div>

      {loading && (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-sm text-slate-300 font-medium">
            جاري قراءة حركة السعر وحساب مستويات PRZ وإعداد التقرير التداولي...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !analysisText && !error && (
        <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
          انقر فوق زر <span className="text-emerald-400 font-bold">"استخراج التقرير الذكي"</span> للحصول على تقييم شامل لحركة سعر السهم والمستويات الفنية.
        </div>
      )}

      {analysisText && !loading && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans space-y-2">
          {analysisText}
        </div>
      )}
    </div>
  );
};
