import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Scale,
    AlertTriangle,
    CheckCircle2,
    Clock,
    X,
    FileText,
    Send,
    Info,
    ShieldAlert,
    HelpCircle,
    ChevronDown,
} from 'lucide-react';

const COMMON_REASONS = [
    'استنفاد حد المراجعات والتعديلات المتفق عليها',
    'عدم الالتزام بالمواصفات والشروط الفنية للمشروع',
    'التأخير غير المبرر وتجاوز الموعد النهائي للتسليم',
    'رفض استلام العمل أو المماطلة في اعتماد التسليمات',
    'خلاف حول طلب تعديلات إضافية خارج نطاق المشروع',
    'انقطاع التواصل أو صعوبة استمرار العمل المشترك',
    'سبب آخر',
];

export default function DisputeModal({
    isOpen,
    onClose,
    projectId,
    endpoint,
    activeDispute,
    disputes = [],
    userRole = 'client', // 'client' | 'freelancer'
    theme = 'company',   // 'company' | 'freelancer'
}) {
    const isFreelancerTheme = theme === 'freelancer';
    const [selectedTab, setSelectedTab] = useState(activeDispute ? 'status' : 'new');
    const [customReason, setCustomReason] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '',
        details: '',
    });

    if (!isOpen) return null;

    const handleReasonChange = (val) => {
        if (val === 'سبب آخر') {
            setData('reason', customReason ? `أخرى: ${customReason}` : 'سبب آخر');
        } else {
            setData('reason', val);
        }
    };

    const handleCustomReasonChange = (e) => {
        const text = e.target.value;
        setCustomReason(text);
        setData('reason', text.trim() ? `أخرى: ${text}` : 'سبب آخر');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setCustomReason('');
                setSelectedTab('status');
                onClose();
            },
        });
    };

    const primaryBtnClass = isFreelancerTheme
        ? 'bg-[#2a7de1] hover:bg-blue-600 text-white'
        : 'bg-[#28251d] hover:bg-black text-white';

    const accentBadgeClass = isFreelancerTheme
        ? 'bg-blue-50 text-[#2a7de1] border-blue-200'
        : 'bg-amber-50 text-[#b47715] border-amber-200';

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
            dir="rtl"
        >
            <div
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
                            <Scale size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-800">
                                    إبلاغ شكوى وتحكيم المشروع
                                </h3>

                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                التدخل الإداري وفض النزاعات بحيادية وفق شروط العقد والتسليمات
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="إغلاق"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Sub-tabs if there is an active dispute or previous disputes */}
                {(activeDispute || disputes.length > 0) && (
                    <div className="px-6 pt-3 border-b border-slate-100 flex gap-2 shrink-0 bg-white">
                        <button
                            type="button"
                            onClick={() => setSelectedTab('status')}
                            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${selectedTab === 'status'
                                ? isFreelancerTheme
                                    ? 'border-[#2a7de1] text-[#2a7de1]'
                                    : 'border-[#28251d] text-[#28251d]'
                                : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            حالة الشكوى الحالية {activeDispute && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block me-1.5 animate-pulse"></span>}
                        </button>
                        {!activeDispute && (
                            <button
                                type="button"
                                onClick={() => setSelectedTab('new')}
                                className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${selectedTab === 'new'
                                    ? isFreelancerTheme
                                        ? 'border-[#2a7de1] text-[#2a7de1]'
                                        : 'border-[#28251d] text-[#28251d]'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                فتح شكوى جديدة
                            </button>
                        )}
                        {disputes.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTab('history')}
                                className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${selectedTab === 'history'
                                    ? isFreelancerTheme
                                        ? 'border-[#2a7de1] text-[#2a7de1]'
                                        : 'border-[#28251d] text-[#28251d]'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                سجل النزاعات السابقة ({disputes.length})
                            </button>
                        )}
                    </div>
                )}

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-start">
                    {/* VIEW: Active Dispute Status */}
                    {selectedTab === 'status' && activeDispute && (
                        <div className="space-y-4">
                            {/* Status Card */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900">
                                                نزاع مفتوح قيد التحكيم والدراسة
                                            </h4>
                                            <p className="text-[11px] text-amber-700 font-medium">
                                                تاريخ الفتح: {activeDispute.created_at}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200/60 text-amber-900 border border-amber-300">
                                        {activeDispute.status_label || 'قيد الانتظار'}
                                    </span>
                                </div>

                                <div className="bg-white/80 rounded-xl p-3.5 border border-amber-200/60 text-xs space-y-2">
                                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                                        <span>الطرف الشاكي:</span>
                                        <span className="text-slate-800 font-bold">
                                            {activeDispute.is_initiator ? 'أنت (مقدم الشكوى)' : activeDispute.initiated_by_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                                        <span>سبب النزاع:</span>
                                        <span className="text-slate-800 font-bold text-start max-w-[70%]">
                                            {activeDispute.reason}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                        <span className="text-slate-400 block mb-1 font-semibold">تفاصيل الشكوى المقدمة:</span>
                                        <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            {activeDispute.details}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-100/60 p-3 rounded-xl border border-amber-200/50">
                                    <Info size={16} className="shrink-0 mt-0.5 text-amber-700" />
                                    <p className="leading-relaxed">
                                        يقوم فريق التحكيم المستقل في منصة صِلة حالياً بمراجعة شروط المشروع ومسودات التسليمات ومحادثات الطرفين. سيتم إصدار القرار الإداري وإشعاركما مباشرة.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW: Resolved Dispute Details (if activeDispute is resolved or latest resolved shown) */}
                    {selectedTab === 'status' && !activeDispute && disputes.length > 0 && disputes[0].status === 'resolved' && (
                        <div className="space-y-4">
                            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-900">
                                                تم الفصل في النزاع بقرار إداري
                                            </h4>
                                            <p className="text-[11px] text-emerald-700 font-medium">
                                                تاريخ القرار: {disputes[0].resolved_at || disputes[0].created_at}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        {disputes[0].resolution_decision_label || 'مفصول فيه'}
                                    </span>
                                </div>

                                <div className="bg-white/90 rounded-xl p-3.5 border border-emerald-200/60 text-xs space-y-2.5">
                                    <div className="grid grid-cols-2 gap-2 text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="p-2 border-l border-slate-200">
                                            <span className="text-slate-400 block text-[10px] font-semibold">مستحق الخبير</span>
                                            <span className="text-sm font-black text-slate-800">{disputes[0].freelancer_payout_amount} ر.ي</span>
                                        </div>
                                        <div className="p-2">
                                            <span className="text-slate-400 block text-[10px] font-semibold">المسترد لرائد الأعمال</span>
                                            <span className="text-sm font-black text-emerald-700">{disputes[0].client_refund_amount} ر.ي</span>
                                        </div>
                                    </div>

                                    {disputes[0].admin_notes && (
                                        <div className="pt-2">
                                            <span className="text-slate-400 block mb-1 font-semibold">حيثيات وتسبيب القرار الإداري:</span>
                                            <p className="text-slate-700 leading-relaxed font-medium bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                                {disputes[0].admin_notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW: New Dispute Form */}
                    {(selectedTab === 'new' || (!activeDispute && disputes.length === 0)) && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Notice / Rules */}
                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">متى يتم رفع شكوى للتحكيم؟</p>
                                    <p className="text-amber-800">
                                        عند تعثر الوصول إلى حل ودي بين الطرفين (مثل استنفاد عدد المراجعات المسموح بها، التأخر في التسليم، أو عدم مطابقة المخرجات للمواصفات). أموال المشروع معلقة في نظام الضمان وستتم تسويتها بالعدل وفق ما يثبته الفحص.
                                    </p>
                                </div>
                            </div>

                            {/* Reason Select */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    سبب الشكوى  <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={
                                            COMMON_REASONS.includes(data.reason)
                                                ? data.reason
                                                : data.reason.startsWith('أخرى:')
                                                    ? 'سبب آخر'
                                                    : data.reason
                                        }
                                        onChange={(e) => handleReasonChange(e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-xl border appearance-none text-xs sm:text-sm font-medium bg-slate-50 focus:bg-white outline-none transition-all cursor-pointer ${errors.reason ? 'border-rose-500 ring-1 ring-rose-300' : 'border-slate-200 focus:border-slate-400'
                                            }`}
                                    >
                                        <option value="">-- اختر تصنيف المشكلة بدقة --</option>
                                        {COMMON_REASONS.map((reason) => (
                                            <option key={reason} value={reason}>
                                                {reason}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {errors.reason && (
                                    <p className="text-xs text-rose-500 font-semibold">{errors.reason}</p>
                                )}
                            </div>

                            {/* If "Other" selected, show text input */}
                            {(data.reason === 'سبب آخر' || data.reason.startsWith('أخرى:')) && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        حدد السبب المخصص <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customReason}
                                        onChange={handleCustomReasonChange}
                                        placeholder="اكتب عنواناً مختصراً لسبب الشكوى..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-white outline-none focus:border-slate-400 transition-all"
                                    />
                                </div>
                            )}

                            {/* Details Textarea */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700">
                                        شرح المشكلة والمطالب بالتفصيل <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {data.details.length} / 5000 حرف
                                    </span>
                                </div>
                                <textarea
                                    rows={4}
                                    value={data.details}
                                    onChange={(e) => setData('details', e.target.value)}
                                    placeholder="يرجى كتابة ما حدث بالضبط: ما الذي تم الاتفاق عليه، ما هي النقاط الخلافية، وما هو الحل العادل أو التعويض الذي تطلبه من إدارة التحكيم..."
                                    className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium bg-slate-50 focus:bg-white outline-none transition-all leading-relaxed ${errors.details ? 'border-rose-500 ring-1 ring-rose-300' : 'border-slate-200 focus:border-slate-400'
                                        }`}
                                />
                                {errors.details && (
                                    <p className="text-xs text-rose-500 font-semibold">{errors.details}</p>
                                )}
                            </div>

                            {/* Escrow Guarantee Disclaimer */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <ShieldAlert size={16} className="text-emerald-600 shrink-0" />
                                <span>
                                    تذكير: يضمن نظام صِلة عدم ضياع أي حقوق مالية. قرار الأدمن ملزم لكلا الطرفين ويصدر بعد التحقق الشامل.
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.reason || data.details.trim().length < 15}
                                    className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${primaryBtnClass}`}
                                >
                                    <Send size={15} />
                                    <span>{processing ? 'جارٍ الإرسال...' : 'إرسال الشكوى للتحكيم'}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* VIEW: Disputes History */}
                    {selectedTab === 'history' && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 mb-2">سجل النزاعات لهذا المشروع:</h4>
                            {disputes.map((disp, i) => (
                                <div key={disp.id || i} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-800">{disp.reason}</span>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                            {disp.status_label}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-[11px] line-clamp-2">{disp.details}</p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                        <span>بواسطة: {disp.initiated_by_name}</span>
                                        <span>{disp.created_at}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

