import React, { useState, useEffect } from 'react';
import { Mail, Copy, Check, ExternalLink, Send, X, MessageSquare } from 'lucide-react';

const SUPPORT_EMAIL = 'sila.platform.2026@gmail.com';

export default function ContactEmailModal({ isOpen, onClose }) {
    const [copied, setCopied] = useState(false);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(SUPPORT_EMAIL);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = SUPPORT_EMAIL;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy email:', err);
        }
    };

    const encodedSubject = encodeURIComponent(subject.trim() || 'استفسار حول منصة صلة');
    const encodedBody = encodeURIComponent(body.trim());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodedSubject}${body.trim() ? `&body=${encodedBody}` : ''}`;
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}${body.trim() ? `&body=${encodedBody}` : ''}`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            dir="rtl"
        >
            <div
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                تواصل مع الدعم عبر البريد
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                نسعد بالرد على استفساراتكم واقتراحاتكم في أسرع وقت
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        aria-label="إغلاق"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Email Card with Copy button */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-slate-500">
                                عنوان البريد الإلكتروني الرسمي:
                            </span>
                            {copied && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                                    <Check className="w-3.5 h-3.5" />
                                    تم النسخ بنجاح!
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
                            <span className="font-mono text-sm sm:text-base font-semibold text-slate-800 select-all" dir="ltr">
                                {SUPPORT_EMAIL}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    copied
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>تم النسخ</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>نسخ</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Quick message compose inputs */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            <span>كتابة رسالة أو استفسار سريع (اختياري):</span>
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="موضوع الرسالة (مثال: استفسار عن خدمات المنصة)"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-right"
                        />
                        <textarea
                            rows={3}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="اكتب استفسارك أو رسالتك هنا..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-right resize-none"
                        />
                    </div>

                    {/* Send Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <a
                            href={gmailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition hover:shadow cursor-pointer text-center"
                        >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            <span>فتح في بريد Gmail</span>
                        </a>

                        <a
                            href={mailtoUrl}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer text-center"
                        >
                            <Send className="w-4 h-4 text-primary shrink-0" />
                            <span>تطبيق البريد الافتراضي</span>
                        </a>
                    </div>
                </div>

                {/* Footer note */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                        ساعات الاستجابة: يتم الرد على الاستفسارات في أقرب وقت ممكن
                    </p>
                </div>
            </div>
        </div>
    );
}

