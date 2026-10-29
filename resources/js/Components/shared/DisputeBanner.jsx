import React from 'react';
import { Scale, AlertTriangle, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function DisputeBanner({ activeDispute, latestResolvedDispute, onOpenDisputeModal }) {
    if (activeDispute) {
        return (
            <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                        <Scale size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-amber-950">
                                نزاع قيد التحكيم الإداري
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                                {activeDispute.status_label || 'قيد المراجعة'}
                            </span>
                        </div>
                        <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">
                            السبب: <span className="font-bold">{activeDispute.reason}</span> — فريق التحكيم يراجع ملابسات المشروع وسجلات العمل للبت في القضية.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenDisputeModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                    <span>عرض تفاصيل النزاع</span>
                    <ChevronLeft size={16} />
                </button>
            </div>
        );
    }

    if (latestResolvedDispute && latestResolvedDispute.status === 'resolved') {
        return (
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-emerald-950">
                                تم الفصل في النزاع بقرار تحكيمي
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 border border-emerald-300">
                                {latestResolvedDispute.resolution_decision_label || 'مفصول فيه'}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed">
                            صدر القرار الإداري لتسوية المشروع وحفظ حقوق الطرفين.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenDisputeModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                    <span>عرض تفاصيل القرار</span>
                    <ChevronLeft size={16} />
                </button>
            </div>
        );
    }

    return null;
}

