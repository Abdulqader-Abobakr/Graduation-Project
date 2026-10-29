import React, { useState, useEffect } from 'react';
import {
    Shield,
    ShieldCheck,
    Scale,
    FileText,
    CheckCircle2,
    XCircle,
    X,
    Lock,
    Building2,
    UserCheck,
    AlertCircle,
    Gavel,
    Bot,
    Wallet,
    Layers,
    Clock,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

export default function TermsAndPrivacyModal({
    isOpen,
    onAccept,
    onDecline,
    onClose,
    requireDecision = false,
    hasAgreed = false,
}) {
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!isOpen || requireDecision) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, requireDecision, onClose]);

    if (!isOpen) return null;

    const handleDeclineClick = () => {
        if (onDecline) {
            onDecline();
        } else if (onClose) {
            onClose();
        }
    };

    const handleAcceptClick = () => {
        if (onAccept) {
            onAccept();
        } else if (onClose) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
            dir="rtl"
            onClick={!requireDecision ? onClose : undefined}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shrink-0 relative">
                    {!requireDecision && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="إغلاق"
                            title="إغلاق"
                        >
                            <X size={18} />
                        </button>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                            <Scale size={22} />
                        </div>
                        <div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white">
                                    سياسة الاستخدام وحماية البيانات والخصوصية
                                </h2>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                                منصة صِلة (Sila Platform) - الإطار التعاقدي، المالي، وحوكمة العمل
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-white/10 overflow-x-auto text-xs no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            عرض كامل الوثيقة
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('client')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                                activeTab === 'client'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            رائد الأعمال / الشركة
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('freelancer')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                                activeTab === 'freelancer'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            الخبير المستقل
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('disputes')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                                activeTab === 'disputes'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            فض النزاعات والحوكمة
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-5 sm:p-7 overflow-y-auto space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed flex-1">
                    {/* SECTION 1: ENTREPRENEUR / CLIENT */}
                    {(activeTab === 'all' || activeTab === 'client') && (
                        <section className="space-y-5 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2.5 pb-2.5 border-b border-blue-100">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        أولاً: السياسة الخاصة بـ "رائد الأعمال / الشركة" (Entrepreneur / Client)
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        شروط الخدمة، آليات التعاقد، الدفع المضمون، وحماية خصوصية المنشآت
                                    </p>
                                </div>
                            </div>

                            {/* [A] Terms for Client */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm text-blue-900">
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    <span>[أ] سياسة وشروط الاستخدام لرائد الأعمال:</span>
                                </h4>
                                <ol className="space-y-3 pr-2 list-decimal list-inside text-slate-700 leading-relaxed font-normal">
                                    <li>
                                        <strong className="text-slate-900 font-semibold">التوثيق:</strong> يلتزم رائد الأعمال بإدخال بيانات نشاطه التجاري بدقة ورفع السجل التجاري أو البطاقة الشخصية (حتى 10MB) لاعتماد حسابه من المشرف والحصول على شارة "حساب موثق".
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">نشر الطلبات والتفاوض:</strong> ينشر رائد الأعمال طلبه (عاماً للجميع أو خاصاً لخبير محدد) ضمن مجالات التقنية والتسويق الأربعة المعتمدة. يحق له تعديل الطلب أو حذفه قبل استلام أي عرض، ويُقفل التعديل تلقائياً فور استلام أول عرض سعر.
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">إيداع الميزانية والضمان المالي:</strong> عند قبول العرض، يحول رائد الأعمال قيمة المشروع ويرفع إيصال التحويل (حتى 50MB). بعد توثيق المشرف للإيصال، يتفعل المشروع ويُحجز المبلغ في "الرصيد المعلق" لمحفظة الخبير بحيث يظل مقفلاً وغير قابل للسحب طوال فترة التنفيذ.
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">المراجعة وسقف التعديلات:</strong> يراجع رائد الأعمال مخرجات كل مرحلة بالتتابع، ويحق له طلب تعديلات في حدود "عداد التعديلات المتبقية" المتفق عليه؛ وينقص العداد بمقدار (1) مع كل طلب تعديل حتى يصل للصفر (0).
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">الاعتماد النهائي والملكية الفكرية:</strong> لا يتحرر المبلغ إلى "الرصيد المتاح" للخبير إلا بعد موافقة رائد الأعمال النهائية على آخر تسليم واكتمال المشروع بنسبة 100%، وحينها تنتقل ملكية جميع المخرجات وحقوق استخدامها التجاري لرائد الأعمال.
                                    </li>
                                </ol>
                            </div>

                            {/* [B] Privacy for Client */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm text-blue-950">
                                    <Shield size={16} className="text-blue-600" />
                                    <span>[ب] سياسة الخصوصية وحماية البيانات لرائد الأعمال:</span>
                                </h4>
                                <ul className="space-y-2.5 pr-2 list-disc list-inside text-slate-700 leading-relaxed font-normal">
                                    <li>
                                        <strong className="text-slate-900 font-semibold">البيانات المجمعة:</strong> تشمل بيانات الحساب والمنشأة، وثيقة السجل التجاري/الهوية، تفاصيل المشاريع والمحادثات، وإيصالات التحويل المالي.
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">السرية والعزل السحابي:</strong> تُحفظ وثائق التوثيق في حاوية سحابية معزولة، وإيصالات الدفع في حاوية مستقلة بمعرفات مشفرة؛ ولا يطلع عليها سوى مشرف المنصة المختص، ولا تُشارك بيانات رائد الأعمال أو مشاريعه مع أي طرف ثالث.
                                    </li>
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* SECTION 2: FREELANCER / EXPERT */}
                    {(activeTab === 'all' || activeTab === 'freelancer') && (
                        <section className="space-y-5 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2.5 pb-2.5 border-b border-emerald-100">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <UserCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        ثانياً: السياسة الخاصة بـ "الخبير المستقل" (Tech & Marketing Expert)
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        شروط تقديم العروض، ضمان الأتعاب، مراحل التسليم، وسحب المستحقات
                                    </p>
                                </div>
                            </div>

                            {/* [A] Terms for Freelancer */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm text-emerald-950">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                    <span>[أ] سياسة وشروط الاستخدام للخبير المستقل:</span>
                                </h4>
                                <ol className="space-y-3 pr-2 list-decimal list-inside text-slate-700 leading-relaxed font-normal">
                                    <li>
                                        <strong className="text-slate-900 font-semibold">التوثيق والملف المهني:</strong> يلتزم الخبير برفع بطاقته الشخصية أو جواز سفره (حتى 10MB) للحصول على شارة "خبير موثق"، وتحديد تخصصاته من ضمن الـ 16 تخصصاً فرعياً، ورفع أعمال أصلية من إنجازه الشخصي في معرض الأعمال.
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">تقديم العروض المرحلية:</strong> يقدم الخبير عرضه متضمناً السعر الإجمالي، المدة، سقف التعديلات المسموحة، وتقسيم العمل إلى مراحل مرتبة يوزع عليها النظام السعر بدقة (100%).
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">ضمان الأتعاب عبر الرصيد المعلق:</strong> لا يبدأ الخبير العمل إلا بعد توثيق المشرف لإيصال الدفع وإيداع كامل ميزانية المشروع في محفظة الخبير تحت بند "الرصيد المعلق" كضمان مرئي ومؤكد لمستحقاته.
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">التسليم المتسلسل والحماية من التعديلات اللانهائية:</strong> يرفع الخبير تسليمات كل مرحلة بالتتابع (حتى 50MB)، ويحميه النظام برمجياً بإغلاق طلبات التعديل الإضافية فور وصول عداد التعديلات المتبقية إلى الصفر (0).
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">التحرير المشروط والسحب المحلي:</strong> فور اعتماد رائد الأعمال لآخر تسليم واكتمال المشروع 100%، ينتقل المبلغ تلقائياً من "الرصيد المعلق" إلى "الرصيد المتاح"، ويمكن للخبير سحبه عبر: (1) التحويل البنكي المحلي، (2) محفظة "جيب"، أو (3) الحوالات المالية المحلية. وفي حال رفض السحب لخطأ في البيانات يُعاد المبلغ تلقائياً للرصيد المتاح.
                                    </li>
                                </ol>
                            </div>

                            {/* [B] Privacy for Freelancer */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm text-emerald-950">
                                    <Lock size={16} className="text-emerald-600" />
                                    <span>[ب] سياسة الخصوصية وحماية البيانات للخبير المستقل:</span>
                                </h4>
                                <ul className="space-y-2.5 pr-2 list-disc list-inside text-slate-700 leading-relaxed font-normal">
                                    <li>
                                        <strong className="text-slate-900 font-semibold">البيانات المجمعة:</strong> تشمل البيانات الشخصية والمهنية، وثيقة الهوية الوطنية، نماذج معرض الأعمال، وسجل الأرصدة وبيانات حسابات السحب المحلية.
                                    </li>
                                    <li>
                                        <strong className="text-slate-900 font-semibold">السرية والعزل السحابي:</strong> تُعزل وثيقة الهوية في حاوية محمية لا يطلع عليها سوى المشرف، وتُحفظ بيانات الحسابات البنكية وأرقام محفظة "جيب" وأرصدة المحفظة بسرية تامة مع عزل الصلاحيات وتشفير كلمات المرور والجلسات.
                                    </li>
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* SECTION 3: GOVERNANCE & DISPUTES */}
                    {(activeTab === 'all' || activeTab === 'disputes') && (
                        <section className="space-y-5 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2.5 pb-2.5 border-b border-amber-100">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <Gavel size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        ثالثاً: حوكمة المنصة، فض النزاعات، والأحكام العامة
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        آلية التحكيم الثلاثي، الالتزام بالقنوات الرسمية، ونطاق عمل المساعد الذكي
                                    </p>
                                </div>
                            </div>

                            {/* Dispute Engine */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/90 space-y-3.5">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm text-amber-950">
                                    <Scale size={16} className="text-amber-700" />
                                    <span>1. محرك فض النزاعات الثلاثي المبني على الأدلة:</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed font-medium">
                                    في حال نشوء خلاف تعاقدي، يفحص مشرف المنصة المستقل سجل الطلب والمحادثات والتسليمات المرفوعة داخل المنصة ويصدر حكماً نهائياً وملزماً وفق حالة النزاع:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3.5 bg-white rounded-xl border border-red-200 text-slate-800 space-y-1 shadow-2xs">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[11px]">
                                            استرداد 100% لرائد الأعمال
                                        </span>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            عند عدم تسليم الخبير للعمل أو إخلاله الجوهري بالمواصفات المتفق عليها.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-white rounded-xl border border-emerald-200 text-slate-800 space-y-1 shadow-2xs">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                                            صرف 100% للخبير
                                        </span>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            عند التزام الخبير الكامل بتسليم المراحل والمواصفات والتعديلات المتفق عليها ورفض رائد الأعمال غير المبرر للاعتماد.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-white rounded-xl border border-blue-200 text-slate-800 space-y-1 shadow-2xs">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold text-[11px]">
                                            تسوية منصفة بالتساوي (50% - 50%)
                                        </span>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            في حالات المسؤولية المشتركة أو الإنجاز الجزئي المنتفع به.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Official Channels & Smart Assistant */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm text-slate-800">
                                    <Bot size={16} className="text-[#2a7de1]" />
                                    <span>2. القنوات الرسمية والمساعد الذكي لإرشاد الاستخدام:</span>
                                </h4>
                                <ul className="space-y-2 pr-2 list-disc list-inside text-slate-700 leading-relaxed font-normal">
                                    <li>
                                        لا يُعتد بأي محادثات أو تسليمات أو تحويلات مالية تتم خارج القنوات الرسمية لمنصة "صِلة".
                                    </li>
                                    <li>
                                        يقتصر دور "المساعد الذكي للمنصة" على إرشاد المستخدمين لكيفية استخدام المنصة وفهم خطواتها فقط.
                                    </li>
                                </ul>
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer Actions (Decision Mode Only) */}
                {requireDecision && (
                    <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0">
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleDeclineClick}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                <XCircle size={16} className="text-slate-400" />
                                <span>غير موافق (العودة للرئيسية)</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleAcceptClick}
                                className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} className="text-white" />
                                <span>نعم، قرأت المقالة كاملة وأنا موافق</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
