import React from 'react';
import { X, BookOpen, ShieldCheck, Target, Zap } from 'lucide-react';

interface StrategyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyGuideModal: React.FC<StrategyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05140b]/90 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0a2115] border border-emerald-900/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-emerald-100">
        <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">🦇 دليل الخفاش المالي | Homod Harmonic</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs leading-relaxed">
          {/* Section 1 */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-emerald-400 text-sm mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              1. ما هي منطقة التحول السعري (PRZ - Potential Reversal Zone)؟
            </h4>
            <p className="text-slate-300">
              منطقة PRZ هي النقطة التي تلتقي فيها مستويات الدعم الفني وحجم التداول لتقديم فرصة دخول مرتفعة الاحتمالية. السعر الحالي المنعكس في التطبيق يمثل نقطة الانطلاق لتحديد إيقاف الخسارة والأهداف.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-amber-400 text-sm mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              2. معادلة حساب حجم المركز (Position Sizing Formula)
            </h4>
            <p className="text-slate-300 mb-2">
              القاعدة الذهبية لإدارة المخاطر تنص على عدم الرهان بمبلغ ثوانٍ ثابت، بل تحديد عدد الأسهم بناءً على المسافة إلى وقف الخسارة:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-300 text-center font-bold">
              عدد الأسهم = أقصى مبلغ مخاطرة مسموح ($) ÷ المخاطرة لكل سهم ($)
            </div>
            <p className="text-slate-400 mt-2">
              حيث: <br />
              • أقصى مخاطرة = رأس المال × نسبة المخاطرة المحددة (مثلاً 2%) <br />
              • المخاطرة لكل سهم = سعر الدخول - سعر وقف الخسارة
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-teal-400 text-sm mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              3. جني الأرباح والتخريج التدريجي (Partial Profit Taking)
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li><strong className="text-white">TP1 (+5%):</strong> جني أرباح 50% من الكمية وتأمين الصفقة بتحريك الـ SL إلى سعر الدخول.</li>
              <li><strong className="text-white">TP2 (+8%):</strong> جني أرباح 30% إضافية لمتابعة الاتجاه.</li>
              <li><strong className="text-white">TP3 (+12%):</strong> الخروج التام أو تتبع الأرباح بالوقف المتحرك (Trailing Stop).</li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
          >
            فهمت القواعد
          </button>
        </div>
      </div>
    </div>
  );
};
