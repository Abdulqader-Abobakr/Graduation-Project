import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    Download,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    FileText,
    Clock,
    ArrowRight,
    Eye,
} from 'lucide-react';

export default function ProjectWorkspace({ project, onBack }) {
    const [revisionModal, setRevisionModal] = useState({ isOpen: false, deliverableId: null });

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



    const statusLabel = project.status === 'completed' ? 'مكتمل' : 'نشط';
    const statusDot = project.status === 'completed' ? 'bg-emerald-500' : 'bg-[#ffb548]';

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back button */}
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-[#7a7974] hover:text-[#28251d] transition-colors mb-6 font-medium"
            >
                <ChevronRight size={20} />
                العودة للمشاريع
            </button>

            {/* Project header card */}
            <div className="bg-white rounded-3xl border border-[#e6e4de] p-8 shadow-sm mb-8">
                <h1 className="text-2xl font-bold text-[#28251d] mb-2">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm font-medium text-[#7a7974]">
                    <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`}></span>
                        حالة المشروع: {statusLabel}
                    </span>
                </div>
            </div>

            {/* Deliverables section */}
            <div className="space-y-5">
                <h2 className="text-xl font-bold text-[#28251d]">التسليمات ({project.deliverables?.length || 0})</h2>

                {(!project.deliverables || project.deliverables.length === 0) ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-[#e6e4de]">
                        <FileText size={48} className="mx-auto text-[#e6e4de] mb-4" />
                        <p className="text-[#7a7974] font-medium">لم يتم رفع أي تسليمات بعد من قبل المستقل.</p>
                    </div>
                ) : (
                    project.deliverables.map((deliverable, index) => (
                        <div key={deliverable.id} className="bg-white rounded-2xl border border-[#e6e4de] p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                {/* Left: Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-bold text-[#7a7974] bg-slate-100 rounded-lg px-2 py-1">
                                            {index + 1}
                                        </span>
                                        <h3 className="text-lg font-bold text-[#28251d]">{deliverable.title}</h3>

                                        {deliverable.status === 'approved' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                                                <CheckCircle size={14} />
                                                مقبول
                                            </span>
                                        )}
                                        {deliverable.status === 'revision_requested' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                                                <AlertCircle size={14} />
                                                بانتظار التعديل
                                            </span>
                                        )}
                                        {deliverable.status === 'submitted' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                                <Clock size={14} />
                                                بانتظار المراجعة
                                            </span>
                                        )}
                                        {!deliverable.status && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-bold border border-slate-200">
                                                <Clock size={14} />
                                                لم يتم التسليم بعد
                                            </span>
                                        )}
                                    </div>

                                    {deliverable.notes && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl text-sm text-slate-700">
                                            <strong className="block mb-1 text-slate-900">ملاحظات المستقل:</strong>
                                            <p>{deliverable.notes}</p>
                                        </div>
                                    )}

                                    {deliverable.client_feedback && (
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900">
                                            <strong className="flex items-center gap-2 mb-1 text-amber-900">
                                                <MessageSquare size={16} />
                                                ملاحظاتك السابقة للتعديل:
                                            </strong>
                                            <p>{deliverable.client_feedback}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    {(deliverable.file_path || deliverable.external_link) && (
                                        <div className="flex flex-col gap-2">
                                            {/* File Display Box */}
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="w-10 h-10 shrink-0 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate" dir="ltr">
                                                        {deliverable.file_path ? deliverable.file_path.split('/').pop() : 'رابط خارجي'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">مرفق التسليم</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <a
                                                    href={deliverable.file_path ? `/company/projects/${project.id}/deliverables/${deliverable.id}/view` : deliverable.external_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    فتح
                                                </a>
                                                {deliverable.file_path && (
                                                    <a
                                                        href={`/company/projects/${project.id}/deliverables/${deliverable.id}/download`}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-bold text-sm transition-colors"
                                                    >
                                                        <Download size={16} />
                                                        تحميل
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {deliverable.status === 'submitted' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(deliverable.id)}
                                                disabled={processing}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                <CheckCircle size={16} />
                                                قبول التسليم
                                            </button>

                                            {deliverable.remaining_revisions > 0 ? (
                                                <button
                                                    onClick={() => openRevisionModal(deliverable.id)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 rounded-xl font-bold text-sm transition-colors"
                                                >
                                                    <AlertCircle size={16} />
                                                    طلب تعديل ({deliverable.remaining_revisions} متبقي)
                                                </button>
                                            ) : (
                                                <div className="text-center text-xs font-bold text-red-500 mt-1">
                                                    استنفدت الحد الأقصى للتعديلات
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Revision Modal */}
            {revisionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
                        <button
                            onClick={() => setRevisionModal({ isOpen: false, deliverableId: null })}
                            className="absolute top-6 left-6 text-slate-400 hover:text-slate-700"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-[#28251d] mb-4">طلب تعديل على التسليم</h3>
                        <p className="text-sm text-[#7a7974] mb-6">يرجى كتابة ملاحظاتك وتفاصيل التعديل المطلوبة بوضوح.</p>

                        <form onSubmit={submitRevision}>
                            <textarea
                                value={data.client_feedback}
                                onChange={e => setData('client_feedback', e.target.value)}
                                className="w-full h-32 rounded-xl border border-[#e6e4de] bg-slate-50 p-4 text-sm focus:border-amber-500 focus:ring-amber-500 mb-2 resize-none"
                                placeholder="اكتب ملاحظاتك هنا..."
                                required
                            ></textarea>
                            {errors.client_feedback && <span className="text-xs text-red-500">{errors.client_feedback}</span>}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'جاري الإرسال...' : 'إرسال طلب التعديل'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRevisionModal({ isOpen: false, deliverableId: null })}
                                    className="px-6 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
