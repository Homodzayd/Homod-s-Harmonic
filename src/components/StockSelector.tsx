import React, { useState, useMemo } from 'react';
import { Search, DollarSign, Percent, Sliders, RefreshCw, Zap, ChevronDown, Check } from 'lucide-react';
import { TradeSettings, MarketPreset } from '../types';
import { POPULAR_PRESETS } from '../utils/technical';
import { Language, translations } from '../data/translations';

interface StockSelectorProps {
  settings: TradeSettings;
  onChangeSettings: (newSettings: Partial<TradeSettings>) => void;
  onRefreshData: () => void;
  loading: boolean;
  lang?: Language;
}

export const StockSelector: React.FC<StockSelectorProps> = ({
  settings,
  onChangeSettings,
  onRefreshData,
  loading,
  lang = 'ar',
}) => {
  const t = translations[lang];
  const [symbolInput, setSymbolInput] = useState(settings.symbol);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep symbol input in sync when settings.symbol changes from outside
  React.useEffect(() => {
    setSymbolInput(settings.symbol);
  }, [settings.symbol]);

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_PRESETS;
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_PRESETS.filter(
      (p) =>
        p.symbol.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSubmitSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbolInput.trim()) {
      onChangeSettings({ symbol: symbolInput.trim() });
      setDropdownOpen(false);
    }
  };

  const handleSelectPreset = (preset: MarketPreset) => {
    setSymbolInput(preset.symbol);
    onChangeSettings({ symbol: preset.symbol });
    setDropdownOpen(false);
  };

  return (
    <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl p-4 sm:p-5 shadow-xl text-emerald-50 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-900/60">
        {/* Symbol Search Bar with Dropdown for 225 US Stocks */}
        <div className="flex-1 relative">
          <form onSubmit={handleSubmitSymbol} className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-400">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <input
                type="text"
                value={symbolInput}
                onChange={(e) => {
                  setSymbolInput(e.target.value);
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 bg-[#05140b] border border-emerald-900/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-emerald-600/70 transition-all font-mono font-bold"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{t.searchBtn}</span>
            </button>
          </form>

          {/* 225 US Stocks Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute z-50 mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-h-80 overflow-y-auto p-2 scrollbar-thin">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-slate-800 text-xs text-slate-400">
                <span>{t.availableUsStocks} ({filteredPresets.length})</span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="text-slate-500 hover:text-slate-300 text-[11px]"
                >
                  {t.close} ✕
                </button>
              </div>

              {filteredPresets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  {t.noMatchingStock}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = settings.symbol.toUpperCase() === preset.symbol;
                    const stockName = lang === 'en' ? preset.nameEn : preset.nameAr;
                    return (
                      <button
                        key={preset.symbol}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden dir-ltr">
                          <span className="font-mono font-bold text-emerald-400">{preset.symbol}</span>
                          <span className="text-slate-400 text-[11px] truncate font-sans">{stockName}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#05140b] p-1 border border-emerald-900/80 rounded-xl">
          <button
            onClick={() => onChangeSettings({ timeframe: '1d' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              settings.timeframe === '1d'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            {t.timeframe1d}
          </button>
          <button
            onClick={() => onChangeSettings({ timeframe: '1wk' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              settings.timeframe === '1wk'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            {t.timeframe1wk}
          </button>
          <button
            onClick={() => onChangeSettings({ timeframe: '1mo' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              settings.timeframe === '1mo'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            {t.timeframe1mo}
          </button>
        </div>
      </div>

      {/* Quick Market Presets Bar (Top 12 US Stocks) */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <span className="text-xs text-emerald-400/80 font-medium whitespace-nowrap">{t.quickPicks}</span>
        {POPULAR_PRESETS.slice(0, 12).map((preset) => (
          <button
            key={preset.symbol}
            onClick={() => handleSelectPreset(preset)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all whitespace-nowrap cursor-pointer ${
              settings.symbol.toUpperCase() === preset.symbol
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-[#05140b]/80 border-emerald-900/80 text-emerald-200 hover:border-emerald-700 hover:text-white'
            }`}
          >
            {preset.symbol} <span className="text-[10px] opacity-70 font-sans">({lang === 'en' ? preset.nameEn : preset.nameAr})</span>
          </button>
        ))}
      </div>

      {/* Capital & Risk Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-emerald-900/60">
        {/* Total Capital */}
        <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60">
          <label className="text-xs text-emerald-300/70 font-medium flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.totalCapital}</span>
          </label>
          <input
            type="number"
            min="100"
            step="500"
            value={settings.capital}
            onChange={(e) => onChangeSettings({ capital: Number(e.target.value) || 0 })}
            className="w-full bg-[#0a2115] border border-emerald-900/80 rounded-lg px-3 py-1.5 text-sm font-bold text-white font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Risk Percentage Slider */}
        <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-emerald-300/70 font-medium flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.riskPerTrade}</span>
            </label>
            <span className="text-xs font-bold text-amber-400 font-mono">{settings.riskPct}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.5"
            value={settings.riskPct}
            onChange={(e) => onChangeSettings({ riskPct: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer bg-emerald-950 h-1.5 rounded-lg"
          />
        </div>

        {/* Custom Target Percentages Toggle */}
        <div className="bg-[#05140b]/80 p-3 rounded-xl border border-emerald-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-200">{t.customTargets}</div>
            <div className="text-[11px] text-slate-400">{t.customTargetsDefault}</div>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1 transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? t.hide : t.customize}</span>
          </button>
        </div>
      </div>

      {/* Advanced Custom Targets Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
          <div>
            <label className="text-[11px] text-rose-400 font-semibold block mb-1">{t.stopLossPct}</label>
            <input
              type="number"
              step="0.1"
              value={settings.stopLossPct}
              onChange={(e) => onChangeSettings({ stopLossPct: Number(e.target.value) || 3.5 })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-emerald-400 font-semibold block mb-1">{t.tp1Pct}</label>
            <input
              type="number"
              step="0.5"
              value={settings.tp1Pct}
              onChange={(e) => onChangeSettings({ tp1Pct: Number(e.target.value) || 5 })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-emerald-400 font-semibold block mb-1">{t.tp2Pct}</label>
            <input
              type="number"
              step="0.5"
              value={settings.tp2Pct}
              onChange={(e) => onChangeSettings({ tp2Pct: Number(e.target.value) || 8 })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-emerald-400 font-semibold block mb-1">{t.tp3Pct}</label>
            <input
              type="number"
              step="0.5"
              value={settings.tp3Pct}
              onChange={(e) => onChangeSettings({ tp3Pct: Number(e.target.value) || 12 })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
};
