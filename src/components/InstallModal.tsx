import React, { useState } from 'react';
import { Download, ExternalLink, X, Smartphone, Check, Copy, Share2, Sparkles, Monitor } from 'lucide-react';
import { Language } from '../data/translations';
import appLogo from '../assets/images/app_logo_icon_1785373237302.jpg';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onNativeInstall: () => void;
  lang: Language;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstall,
  lang,
}) => {
  const [activeDevice, setActiveDevice] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#081f14] border border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden text-emerald-50">
        {/* Top Decorative Gradient */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-400/60 shadow-lg bg-[#041209] flex items-center justify-center shrink-0">
              <img
                src={appLogo}
                alt="HOMOD HARMONIC"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.jpg';
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'تثبيت تطبيق HOMOD HARMONIC' : 'Install HOMOD HARMONIC App'}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  PWA App
                </span>
              </h2>
              <p className="text-xs text-emerald-300/80">
                {lang === 'ar' ? 'ثبّته على شاشة هاتفك الرئيسية لتجربة تطبيق كامل ومستقل' : 'Add to home screen for a fast native app experience'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-400/70 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Direct 1-Click Install Button if supported by Browser */}
          {deferredPrompt && (
            <div className="p-4 bg-gradient-to-r from-emerald-900/80 to-teal-950/80 border border-emerald-400/60 rounded-2xl flex flex-col items-center text-center gap-3 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>{lang === 'ar' ? 'متصفحك يدعم التثبيت الفوري بنقرة واحدة' : 'One-click direct install supported'}</span>
              </div>
              <button
                onClick={onNativeInstall}
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تثبيت التطبيق الآن على الجهاز' : 'Install App Now'}</span>
              </button>
            </div>
          )}

          {/* Open in New Tab Action (Essential for Iframe preview users) */}
          <div className="p-4 bg-[#05180f] border border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {lang === 'ar' ? 'فتح في متصفح جديد مستقل' : 'Open in Standalone Browser'}
                </p>
                <p className="text-[11px] text-emerald-300/70">
                  {lang === 'ar' ? 'إذا كنت تشاهد التطبيق داخل المعاينة، افتحه في تبويب جديد لتفعيل التثبيت المباشر' : 'Open outside iframe to enable native install prompt'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenNewTab}
              className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{lang === 'ar' ? 'افتح الآن' : 'Open Tab'}</span>
            </button>
          </div>

          {/* Device Specific Step-by-Step Instructions */}
          <div>
            <div className="text-xs font-bold text-emerald-300 mb-2.5 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ar' ? 'تعليمات التثبيت اليدوي حسب نوع الجهاز:' : 'Manual Installation Steps:'}</span>
            </div>

            {/* Device Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-3 bg-[#041209] p-1.5 rounded-xl border border-emerald-900/80">
              <button
                onClick={() => setActiveDevice('android')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDevice === 'android'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>أندرويد / سامسونج</span>
              </button>
              <button
                onClick={() => setActiveDevice('ios')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDevice === 'ios'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>آيفون / Safari</span>
              </button>
              <button
                onClick={() => setActiveDevice('desktop')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeDevice === 'desktop'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>الكمبيوتر</span>
              </button>
            </div>

            {/* Instructions Content */}
            <div className="p-4 bg-[#041209] border border-emerald-900/80 rounded-2xl text-xs space-y-2.5 leading-relaxed text-emerald-100">
              {activeDevice === 'android' && (
                <ol className="list-decimal list-inside space-y-2 font-medium">
                  <li>
                    {lang === 'ar'
                      ? 'افتح التطبيق من متصفح سامسونج (Samsung Internet) أو كروم (Chrome).'
                      : 'Open in Chrome or Samsung Internet browser.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'اضغط على قائمة الخيارات (⋮) في أقصى أعلى أو أسفل المتصفح.'
                      : 'Tap the 3 dots menu (⋮) in the top right or bottom bar.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) أو "تثبيت التطبيق".'
                      : 'Tap "Add to Home screen" or "Install App".'}
                  </li>
                  <li className="text-emerald-400 font-bold">
                    {lang === 'ar'
                      ? 'سيتم إنشاء أيقونة HOMOD HARMONIC على جوالك مثل أي تطبيق رسمي من المتجر.'
                      : 'The HOMOD HARMONIC icon will be added to your app drawer.'}
                  </li>
                </ol>
              )}

              {activeDevice === 'ios' && (
                <ol className="list-decimal list-inside space-y-2 font-medium">
                  <li>
                    {lang === 'ar'
                      ? 'افتح الرابط في متصفح Safari على جهاز الآيفون أو الآيباد.'
                      : 'Open the link in Safari on iPhone or iPad.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'اضغط على زر المشاركة (Share) ⎘ في شريط الأدوات أسفل المتصفح.'
                      : 'Tap the Share icon ⎘ in the bottom navigation toolbar.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                      : 'Scroll down and select "Add to Home Screen".'}
                  </li>
                  <li className="text-emerald-400 font-bold">
                    {lang === 'ar'
                      ? 'اضغط "إضافة" (Add) أعلى الشاشة ليظهر التطبيق في شاشتك الرئيسية.'
                      : 'Tap "Add" in the top right corner to complete installation.'}
                  </li>
                </ol>
              )}

              {activeDevice === 'desktop' && (
                <ol className="list-decimal list-inside space-y-2 font-medium">
                  <li>
                    {lang === 'ar'
                      ? 'افتح رابط التطبيق في متصفح Chrome أو Edge على الكمبيوتر.'
                      : 'Open app in Chrome or Edge desktop browser.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'اضغط على أيقونة التثبيت (⊕) المجاورة لشريط العنوان URL بالعلى.'
                      : 'Click the install icon (⊕) in the browser address bar.'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'اضغط "تثبيت" لفتح التطبيق في نافذة مستقلة وسريعة.'
                      : 'Click "Install" to launch in a clean standalone window.'}
                  </li>
                </ol>
              )}
            </div>
          </div>

          {/* Copy Link Footer Option */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl transition-all cursor-pointer font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (lang === 'ar' ? 'تم نسخ الرابط!' : 'Copied!') : (lang === 'ar' ? 'نسخ رابط التطبيق' : 'Copy Link')}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-800/40 hover:bg-emerald-800/60 text-emerald-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
