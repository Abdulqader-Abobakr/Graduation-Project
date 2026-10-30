import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle, Sparkles } from 'lucide-react';
import { router } from '@inertiajs/react';

const RATING_LABELS = {
    1: 'ضعيف (1 من 5)',
    2: 'مقبول (2 من 5)',
    3: 'جيد (3 من 5)',
    4: 'جيد جداً (4 من 5)',
    5: 'ممتاز جداً (5 من 5)',
};

export default function ProjectRatingModal({
    isOpen,
    onClose,
    project,
    onSuccess,
}) {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setRating(5);
            setHoverRating(0);
            setError(null);
            return;
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !submitting) onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, submitting, onClose]);

    if (!isOpen || !project) return null;

    const currentRating = hoverRating || rating;
    const expertName = project.freelancer_name || project.client || 'الخبير';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            setError('يرجى اختيار تقييم بين 1 و 5 نجوم.');
            return;
        }

        setSubmitting(true);
        setError(null);

        router.post(
            `/company/projects/${project.id}/rate`,
            { rating },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onSuccess?.(rating);
                    onClose?.();
                },
                onError: (errs) => {
                    setSubmitting(false);
                    setError(errs.rating || errs.error || 'تعذر تسجيل التقييم، يرجى المحاولة مرة أخرى.');
                },
            }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !submitting && onClose?.()}
            dir="rtl"
        >
            <div
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 text-start"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                تقييم أداء الخبير
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {project.title}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => !submitting && onClose?.()}
                        disabled={submitting}
                        className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                        aria-label="إغلاق"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-slate-700">
                            كيف تقيّم جودة العمل والتزام الخبير <span className="text-primary font-bold">{expertName}</span> في هذا المشروع؟
                        </p>
                        <p className="text-xs text-slate-400">
                            انقر على النجوم لتحديد تقييمك (من 1 إلى 5 نجوم)
                        </p>
                    </div>

                    {/* Star Rating Buttons */}
                    <div className="flex flex-col items-center justify-center gap-3 py-2">
                        <div className="flex items-center justify-center gap-2" dir="ltr">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = star <= currentRating;
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 rounded-xl transition-all transform hover:scale-115 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                        aria-label={`${star} نجوم`}
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${
                                                isFilled
                                                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                                    : 'text-slate-200 fill-slate-50 hover:text-amber-200'
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected Rating Text Badge */}
                        <div className="min-h-7 flex items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <span>{RATING_LABELS[currentRating] || `${currentRating} من 5 نجوم`}</span>
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting || rating < 1}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1b62c4] transition hover:shadow cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>جاري الحفظ...</span>
                                </span>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    <span>اعتماد التقييم</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => !submitting && onClose?.()}
                            disabled={submitting}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
                        >
                            لاحقاً
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

