import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Trash2, CheckCircle2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { Language, translations } from '../data/translations';

interface AddStockCardProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  lang?: Language;
}

const STORAGE_KEY = 'homod_harmonic_custom_stocks';
const DEFAULT_STOCKS = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'MSFT', 'AMZN', 'META', 'GOOGL', 'PLTR', '2222.SR'];

export const AddStockCard: React.FC<AddStockCardProps> = ({
  currentSymbol,
  onSelectSymbol,
  lang = 'ar',
}) => {
  const [inputSymbol, setInputSymbol] = useState('');
  const [stocks, setStocks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved custom stocks:', e);
    }
    return DEFAULT_STOCKS;
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Sync stocks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
    } catch (e) {
      console.error('Error saving custom stocks:', e);
    }
  }, [stocks]);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputSymbol.trim().toUpperCase();
    if (!clean) return;

    // Add to list if not already present
    if (!stocks.includes(clean)) {
      setStocks((prev) => [clean, ...prev]);
    }

    // Switch to this stock
    onSelectSymbol(clean);
    setInputSymbol('');

    // Show temporary notification
    const msg = lang === 'ar' ? `تمت إضافة السهم ${clean} وتحويل التحليل عليه بنجاح` : `Added ${clean} for analysis successfully`;
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveStock = (symbolToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStocks((prev) => prev.filter((s) => s !== symbolToRemove));
  };

  return (
    <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-5 shadow-xl mb-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'ar' ? 'إضافة سهم للتحليل' : 'Add Stock for Analysis'}</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded-full border border-emerald-500/30">
                {lang === 'ar' ? 'سريع ومباشر' : 'Instant'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'أدخل رمز أي سهم (أمريكي، تاسي، إلخ) لإضافته مباشرة لقائمة التحليل'
                : 'Enter any stock symbol (US, TASI, etc.) to add it directly to analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Add Stock Input Form */}
      <form onSubmit={handleAddStock} className="flex flex-col sm:flex-row items-center gap-3 mb-5">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'أدخل رمز السهم هنا (مثال: NVDA, TSLA, AAPL, 2222.SR)...'
                : 'Enter stock symbol here (e.g. NVDA, TSLA, AAPL)...'
            }
            className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 transition-all font-mono font-bold uppercase"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={!inputSymbol.trim()}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'ar' ? 'أضف السهم للتحليل' : 'Add Stock'}</span>
        </button>
      </form>

      {/* Custom Saved Stocks List Chips */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'الأسهم المضافة للتحليل السريع:' : 'Added Stocks for Quick Analysis:'}</span>
          </span>
          <span className="text-[11px] text-slate-500">
            ({stocks.length} {lang === 'ar' ? 'أسهم' : 'stocks'})
          </span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 scrollbar-thin">
          {stocks.map((sym) => {
            const isActive = currentSymbol.toUpperCase() === sym;
            return (
              <div
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400 scale-105'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <span dir="ltr">{sym}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                )}
                <button
                  type="button"
                  onClick={(e) => handleRemoveStock(sym, e)}
                  title={lang === 'ar' ? 'حذف السهم من القائمة' : 'Remove stock'}
                  className={`p-0.5 rounded-md transition-colors ${
                    isActive
                      ? 'hover:bg-slate-950/20 text-slate-900'
                      : 'hover:bg-rose-500/20 text-slate-500 hover:text-rose-400'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
