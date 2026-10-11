import React, { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, Download, Smartphone } from 'lucide-react';
import { Language, translations } from '../data/translations';
import { InstallModal } from './InstallModal';
import appLogo from '../assets/images/app_logo_icon_1785373237302.jpg';

interface HeaderProps {
  onOpenHelp: () => void;
  lang: Language;
  onToggleLang: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp, lang, onToggleLang }) => {
  const t = translations[lang];
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
        setShowInstallModal(false);
      }
    }
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      handleNativeInstall();
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <header className="bg-[#0a2115] border-b border-emerald-900/80 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* Logo Image + Lang Switcher Under Logo */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20 bg-[#05140b] flex items-center justify-center transition-transform hover:scale-105">
                <img
                  src={appLogo}
                  alt="HOMOD HARMONIC Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== window.location.origin + '/logo.jpg') {
                      target.src = '/logo.jpg';
                    }
                  }}
                />
              </div>

              {/* Language Switcher under logo */}
              <div className="flex items-center bg-[#06160e] p-0.5 rounded-lg border border-emerald-900/80 text-[10px] font-semibold">
                <button
                  onClick={() => onToggleLang('ar')}
                  className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    lang === 'ar'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-emerald-300/60 hover:text-white'
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => onToggleLang('en')}
                  className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-emerald-300/60 hover:text-white'
                  }`}
                >
                  Eng
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
                HOMOD HARMONIC
              </h1>
              <p className="text-xs text-emerald-400/80 font-medium">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="p-2 text-emerald-950 bg-emerald-400 hover:bg-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1 shadow cursor-pointer"
                title={lang === 'ar' ? 'تثبيت التطبيق على الجوال' : 'Install App'}
              >
                <Smartphone className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تثبيت' : 'Install'}</span>
              </button>
            )}
            <button
              onClick={onOpenHelp}
              className="p-2 text-emerald-300 hover:text-white bg-[#0f2d1d] rounded-lg border border-emerald-800/80 text-xs flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-all cursor-pointer animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'ar' ? '📲 تثبيت التطبيق على الهاتف' : '📲 Install Mobile App'}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 text-xs bg-[#0f2d1d]/90 px-3 py-1.5 rounded-lg border border-emerald-800/80 text-emerald-200">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>{t.riskNotice}</span>
          </div>

          <button
            onClick={onOpenHelp}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-100 bg-[#0f2d1d] hover:bg-emerald-900/80 rounded-lg border border-emerald-800/80 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>{t.guideBtn}</span>
          </button>
        </div>
      </div>

      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onNativeInstall={handleNativeInstall}
        lang={lang}
      />
    </header>
  );
};
