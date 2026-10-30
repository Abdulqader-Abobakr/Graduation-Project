import React, { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    Download,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    FileText,
    Clock,
    Eye,
    ExternalLink,
    RefreshCw,
    Link as LinkIcon,
    FileCheck2,
    Scale,
    Star,
} from 'lucide-react';
import DisputeModal from '../../Components/shared/DisputeModal';
import DisputeBanner from '../../Components/shared/DisputeBanner';
import ProjectRatingModal from '../../Components/shared/ProjectRatingModal';

export default function ProjectWorkspace({ project, onBack }) {
    const [revisionModal, setRevisionModal] = useState({ isOpen: false, deliverableId: null });
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [hasDismissedRatingPrompt, setHasDismissedRatingPrompt] = useState(false);

    useEffect(() => {
        if (project?.status === 'completed' && (project.rating === null || project.rating === undefined) && !hasDismissedRatingPrompt) {
            const timer = setTimeout(() => setIsRatingModalOpen(true), 600);
            return () => clearTimeout(timer);
        }
    }, [project?.status, project?.rating, hasDismissedRatingPrompt]);

    const disputes = project.disputes || [];
    const activeDispute = project.active_dispute || disputes.find(d => ['open', 'under_review'].includes(d.status));
    const latestResolvedDispute = disputes.find(d => d.status === 'resolved');

    // Auto-refresh: polls workspace changes every 4 seconds when tab is active and modal is closed
    useEffect(() => {
        const interval = setInterval(() => {
            if (!document.hidden && !revisionModal.isOpen) {
                router.reload({
                    only: ['workspaceProject'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [revisionModal.isOpen]);

    const { data, setData, post, processing, reset, errors } = useForm({
        status: '',
        client_feedback: '',
    });

    const handleApprove = (deliverableId) => {
        if (!confirm('هل أنت متأكد من قبول هذا التسليم؟ لن تتمكن من التراجع عن هذا الإجراء.')) return;

        router.post(`/company/projects/${project.id}/deliverables/${deliverableId}/review`, 
            { status: 'approved' },
            { preserveScroll: true }
        );
    };

    const submitRevision = (e) => {
        e.preventDefault();
        router.post(`/company/projects/${project.id}/deliverables/${revisionModal.deliverableId}/review`, 
            { status: 'revision_requested', client_feedback: data.client_feedback },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRevisionModal({ isOpen: false, deliverableId: null });
                    reset();
                }
            }
        );
    };

    const openRevisionModal = (deliverableId) => {
        setData('client_feedback', '');
        setRevisionModal({ isOpen: true, deliverableId });
    };

    const statusLabel = project.status === 'completed' ? 'مكتمل' : 'نشط ومستمر';
    const statusDot = project.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500';

    const deliverables = project.deliverables || [];
    const approvedCount = deliverables.filter(d => d.status === 'approved').length;
    const totalCount = deliverables.length;
    const progressPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    const projectRemainingRevisions = project.remaining_revisions ?? deliverables[0]?.remaining_revisions ?? 0;
    const projectRevisionLimit = project.revision_limit ?? 2;

    return (
        <div className="max-w-5xl mx-auto pb-16" dir="rtl">
            {/* Header Navigation */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm cursor-pointer"
                >
                    <ChevronRight size={18} />
                    <span>العودة لقائمة المشاريع</span>
                </button>

                <button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(true)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        activeDispute
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 ring-2 ring-amber-200'
                            : 'border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700'
                    }`}
                >
                    <Scale size={15} className={activeDispute ? 'text-amber-600' : 'text-rose-600'} />
                    <span>إبلاغ شكوى عن المشروع</span>
                    {activeDispute && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                </button>
            </div>

            {/* Dispute Banner (if active or recently resolved) */}
            <DisputeBanner
                activeDispute={activeDispute}
                latestResolvedDispute={latestResolvedDispute}
                onOpenDisputeModal={() => setIsDisputeModalOpen(true)}
            />

            {/* Rating Prompt Banner for Completed Projects */}
            {project.status === 'completed' && !project.rating && (
                <div className="bg-gradient-to-l from-amber-500/10 via-amber-50 to-white border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">
                                تم إكمال المشروع واعتماد كافة التسليمات بنجاح!
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5 font-medium">
                                يرجى تقييم أداء الخبير ({project.freelancer_name || 'الخبير'}) لدعم ملفه ومساعدة رواد الأعمال في اختياره.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsRatingModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
                    >
                        <Star size={15} className="fill-white" />
                        <span>تقييم الخبير الآن</span>
                    </button>
                </div>
            )}

            {/* Project Overview Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#ffb548] bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                                مساحة عمل المشروع
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                                {statusLabel}
                            </span>
                            {project.rating ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                                    <div className="flex items-center gap-0.5" dir="ltr">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                size={13}
                                                className={s <= project.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-slate-100'}
                                            />
                                        ))}
                                    </div>
                                    <span>تقييمك: {project.rating} / 5</span>
                                </div>
                            ) : project.status === 'completed' ? (
                                <button
                                    type="button"
                                    onClick={() => setIsRatingModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                                >
                                    <Star size={13} className="fill-white" />
                                    <span>تقييم الخبير ★</span>
                                </button>
                            ) : null}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug break-words">
                            {project.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        <div className="px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-start">
                            <span className="text-[10px] text-slate-400 font-medium block">التسليمات المنجزة</span>
                            <span className="text-sm font-bold text-slate-800">{approvedCount} من {totalCount}</span>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-start">
                            <span className="text-[10px] text-slate-400 font-medium block">تعديلات المشروع المتبقية</span>
                            <span className="text-sm font-bold text-slate-800">
                                {projectRemainingRevisions} من {projectRevisionLimit}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>نسبة اكتمال مراحل المشروع</span>
                        <span className="font-bold text-slate-800">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/70">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                                project.status === 'completed' ? 'bg-emerald-500' : 'bg-[#ffb548]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Deliverables Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">مراحل وتسليمات العمل ({totalCount})</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                            راجع مرفقات وروابط كل مرحلة، واعتمد التسليم أو اطلب تعديلاً عند الحاجة.
                        </p>
                    </div>
                </div>

                {(!deliverables || deliverables.length === 0) ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600 font-semibold text-sm">لم يتم تحديد أي تسليمات لهذا المشروع بعد.</p>
                    </div>
                ) : (
                    deliverables.map((deliverable, index) => {
                        const isApproved = deliverable.status === 'approved';
                        const isRevisionRequested = deliverable.status === 'revision_requested';
                        const isSubmitted = deliverable.status === 'submitted';
                        const hasSubmission = Boolean(deliverable.file_path || deliverable.external_link);

                        return (
                            <div
                                key={deliverable.id}
                                className={`bg-white rounded-2xl border transition-all shadow-2xs p-5 sm:p-6 space-y-5 ${
                                    isSubmitted
                                        ? 'border-blue-200 ring-1 ring-blue-100'
                                        : isRevisionRequested
                                        ? 'border-amber-200'
                                        : isApproved
                                        ? 'border-emerald-200'
                                        : 'border-slate-200/90'
                                }`}
                            >
                                {/* Card Top: Title & Status Badges */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">
                                                {deliverable.title}
                                            </h3>
                                            {deliverable.submitted_at && (
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    تاريخ التسليم: {deliverable.submitted_at}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {isApproved && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                                <CheckCircle size={14} />
                                                <span>تم الاعتماد والقبول</span>
                                            </span>
                                        )}
                                        {isRevisionRequested && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                                                <AlertCircle size={14} />
                                                <span>بانتظار تعديل الخبير</span>
                                            </span>
                                        )}
                                        {isSubmitted && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                                <Clock size={14} />
                                                <span>تسليم جديد بانتظار المراجعة</span>
                                            </span>
                                        )}
                                        {!deliverable.status && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-bold border border-slate-200">
                                                <Clock size={14} />
                                                <span>لم يتم التسليم بعد</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Deliverable Artifacts (File Attachment & External Link) */}
                                {hasSubmission ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                                        {/* File Card */}
                                        {deliverable.file_path && (
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2a7de1] shrink-0">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-800 truncate" dir="ltr">
                                                            {deliverable.file_name || deliverable.file_path.split('/').pop()}
                                                        </p>
                                                        <span className="text-[11px] text-slate-400 font-medium">
                                                            ملف مرفق منجز
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                                                    <a
                                                        href={deliverable.view_url || `/company/projects/${project.id}/deliverables/${deliverable.id}/view`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                                    >
                                                        <Eye size={14} />
                                                        <span>معاينة الملف</span>
                                                    </a>
                                                    <a
                                                        href={deliverable.download_url || `/company/projects/${project.id}/deliverables/${deliverable.id}/download`}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                                    >
                                                        <Download size={14} />
                                                        <span>تحميل الملف</span>
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* External Link Card */}
                                        {deliverable.external_link && (
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                                        <LinkIcon size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[11px] text-purple-600 font-bold block">
                                                            رابط خارجي للعمل
                                                        </span>
                                                        <p className="text-xs font-bold text-slate-800 truncate font-mono mt-0.5" dir="ltr">
                                                            {deliverable.external_link}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/60">
                                                    <a
                                                        href={deliverable.external_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                                    >
                                                        <ExternalLink size={14} />
                                                        <span>فتح الرابط الخارجي</span>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
                                        لم يقم الخبير برفع ملفات أو روابط لهذه المرحلة حتى الآن.
                                    </div>
                                )}

                                {/* Freelancer Notes */}
                                {deliverable.notes && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-700 space-y-1">
                                        <span className="font-bold text-slate-900 block">شرح وملاحظات الخبير على التسليم:</span>
                                        <p className="leading-relaxed whitespace-pre-line text-slate-700">{deliverable.notes}</p>
                                    </div>
                                )}

                                {/* Previous Client Revision Feedback */}
                                {deliverable.client_feedback && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 space-y-1">
                                        <strong className="flex items-center gap-2 font-bold text-amber-900">
                                             <MessageSquare size={16} />
                                             <span>ملاحظات التعديل المرسلة للخبير:</span>
                                        </strong>
                                        <p className="leading-relaxed whitespace-pre-line text-amber-800">{deliverable.client_feedback}</p>
                                    </div>
                                )}

                                {/* Action Buttons Toolbar */}
                                {isSubmitted && (
                                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                        {projectRemainingRevisions > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => openRevisionModal(deliverable.id)}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-amber-400 text-amber-700 hover:bg-amber-50 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <AlertCircle size={16} />
                                                <span>طلب تعديل</span>
                                            </button>
                                        ) : (
                                            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                                                تم استنفاد كافة التعديلات المسموحة للمشروع (0 متبقي)
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleApprove(deliverable.id)}
                                            disabled={processing}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                                        >
                                            <CheckCircle size={16} />
                                            <span>قبول واعتماد التسليم</span>
                                        </button>
                                    </div>
                                )}

                                {isApproved && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                                        <FileCheck2 size={16} className="text-emerald-600" />
                                        <span>تم اعتماد هذا التسليم والموافقة عليه رسمياً.</span>
                                    </div>
                                )}

                                {isRevisionRequested && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                                        <Clock size={16} className="text-amber-600" />
                                        <span>بانتظار قيام الخبير برفع النسخة المعدلة بناءً على ملاحظاتك.</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Revision Modal */}
            {revisionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-xs p-4">
                    <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl text-start sm:p-6">
                        <button
                            type="button"
                            onClick={() => setRevisionModal({ isOpen: false, deliverableId: null })}
                            className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-1">طلب تعديل على التسليم</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mb-4">
                            يرجى كتابة ملاحظاتك وتفاصيل التعديل المطلوبة بدقة لتصل إلى الخبير.
                        </p>

                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between mb-4">
                            <span>يُخصم التعديل من رصيد تعديلات المشروع الكلي</span>
                            <span className="font-bold text-amber-800">المتبقي: {projectRemainingRevisions} من {projectRevisionLimit}</span>
                        </div>

                        <form onSubmit={submitRevision} className="space-y-4">
                            <div>
                                <textarea
                                    value={data.client_feedback}
                                    onChange={e => setData('client_feedback', e.target.value)}
                                    className="w-full h-36 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none leading-relaxed"
                                    placeholder="اكتب التعديلات المطلوبة بوضوح هنا..."
                                    required
                                />
                                {errors.client_feedback && (
                                    <p className="text-xs text-rose-500 font-semibold mt-1">{errors.client_feedback}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                                >
                                    {processing ? 'جاري الإرسال...' : 'إرسال طلب التعديل'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRevisionModal({ isOpen: false, deliverableId: null })}
                                    className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dispute Arbitration Modal */}
            <DisputeModal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                projectId={project.id}
                endpoint={`/company/projects/${project.id}/disputes`}
                activeDispute={activeDispute}
                disputes={disputes}
                userRole="client"
                theme="company"
            />

            {/* Project Star Rating Modal */}
            <ProjectRatingModal
                isOpen={isRatingModalOpen}
                onClose={() => {
                    setIsRatingModalOpen(false);
                    setHasDismissedRatingPrompt(true);
                }}
                project={project}
                onSuccess={(newRating) => {
                    project.rating = newRating;
                    setIsRatingModalOpen(false);
                }}
            />
        </div>
    );
}
