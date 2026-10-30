import { useEffect, useId, useRef } from 'react';
import { Trash2, X } from 'lucide-react';

export default function DeleteConfirmationModal({
    isOpen,
    title = 'تأكيد الحذف',
    description = 'هل أنت متأكد من رغبتك في الحذف؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmLabel = 'نعم، احذف',
    isProcessing = false,
    onCancel,
    onConfirm,
}) {
    const cancelButtonRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!isOpen) return undefined;

        const previouslyFocused = document.activeElement;
        cancelButtonRef.current?.focus();

        return () => {
            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && !isProcessing) {
            event.preventDefault();
            onCancel();
            return;
        }

        if (event.key !== 'Tab') return;

        const buttons = event.currentTarget.querySelectorAll('button:not(:disabled)');
        const firstButton = buttons[0];
        const lastButton = buttons[buttons.length - 1];

        if (!firstButton || !lastButton) {
            event.preventDefault();
        } else if (event.shiftKey && document.activeElement === firstButton) {
            event.preventDefault();
            lastButton.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
            event.preventDefault();
            firstButton.focus();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isProcessing) onCancel();
            }}
        >
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                dir="rtl"
                onKeyDown={handleKeyDown}
                className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white text-start shadow-2xl shadow-slate-950/25"
            >
                <div className="p-6 sm:p-7">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                            <Trash2 size={22} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <h2 id={titleId} className="text-lg font-bold text-slate-900">
                                {title}
                            </h2>
                            <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
                                {description}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isProcessing}
                            aria-label="إغلاق"
                            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-start sm:px-7">

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-rose-600/20 transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 size={16} />
                        {isProcessing ? 'جارٍ الحذف...' : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
