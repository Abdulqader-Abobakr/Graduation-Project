import React, { useState, useEffect } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import TermsAndPrivacyModal from '../../Components/TermsAndPrivacyModal';

// ==================== FORGOT PASSWORD MODAL ====================
function ForgotPasswordModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            setError('البريد الإلكتروني غير صحيح');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const res = await fetch('/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ email: trimmedEmail }),
            });
            const resData = await res.json();
            if (!res.ok) {
                setError(resData.message || (resData.errors?.email ? resData.errors.email[0] : 'حدث خطأ أثناء إرسال الرابط.'));
            } else {
                setIsSent(true);
            }
        } catch (err) {
            setError('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsSent(false);
        setEmail('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div
                className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100"
                style={{ animation: 'fadeInUp 0.3s ease-out' }}
            >
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                        {isSent ? 'تم الإرسال!' : 'نسيت كلمة المرور؟'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        {isSent ? 'تم إرسال تعليمات إعادة التعيين إلى بريدك الإلكتروني' : 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور'}
                    </p>
                </div>

                {isSent ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-bold text-green-900 mb-1">تفقد بريدك الإلكتروني</h4>
                            <p className="text-xs text-green-800 leading-relaxed">
                                أرسلنا رابط إعادة التعيين إلى:
                            </p>
                            <p className="text-sm font-semibold text-green-900 font-mono my-1.5" dir="ltr">{email}</p>
                            <p className="text-[11px] text-green-700 leading-normal">
                                يرجى فحص صندوق الوارد ومجلد الرسائل غير المرغوب فيها (Spam) والنقر على الرابط لتعيين كلمة مرور جديدة.
                            </p>
                        </div>
                        <button type="button" onClick={() => setIsSent(false)} className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300">إعادة إرسال</button>
                        <button type="button" onClick={handleClose} className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary-dark">العودة لتسجيل الدخول</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 text-right">البريد الإلكتروني المسجل</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError('');
                                    }}
                                    placeholder="example@company.com"
                                    required
                                    className={`w-full rounded-xl border ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pr-10 pl-4 py-3.5 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all`}
                                    dir="ltr"
                                />
                            </div>
                            {error && (
                                <div className="mt-2 flex items-center gap-1.5 text-red-500 text-right">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs">{error}</p>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-primary-dark hover:shadow-xl hover:shadow-blue-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    جاري الإرسال...
                                </span>
                            ) : 'إرسال رابط التعيين'}
                        </button>
                        <button type="button" onClick={handleClose} className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]">إلغاء</button>
                    </form>
                )}
            </div>
        </div>
    );
}

// ==================== LOGIN COMPONENT ====================
function getInitialCredentials(pageProps) {
    try {
        const localRemember = localStorage.getItem('sila_remember_me') === 'true';
        const localEmail = localStorage.getItem('sila_remembered_email') || '';
        const localPassword = localStorage.getItem('sila_remembered_password') || '';

        if (localRemember && localEmail) {
            return {
                email: localEmail,
                password: localPassword,
                remember: true,
            };
        }
    } catch (e) {
        // ignore storage errors
    }

    if (pageProps?.remembered && pageProps?.rememberedEmail) {
        return {
            email: pageProps.rememberedEmail || '',
            password: pageProps.rememberedPassword || '',
            remember: true,
        };
    }

    return {
        email: '',
        password: '',
        remember: false,
    };
}

function Login() {
    const pageProps = usePage().props;
    const { flash = {} } = pageProps;
    const initialCreds = getInitialCredentials(pageProps);

    const { data, setData, post, processing, errors } = useForm({
        email: initialCreds.email,
        password: initialCreds.password,
        remember: initialCreds.remember,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Sync remembered credentials on mount (from localStorage or encrypted server cookie props)
    useEffect(() => {
        const creds = getInitialCredentials(pageProps);
        if (creds.remember && creds.email) {
            setData({
                email: creds.email,
                password: creds.password,
                remember: true,
            });
            try {
                localStorage.setItem('sila_remember_me', 'true');
                localStorage.setItem('sila_remembered_email', creds.email);
                localStorage.setItem('sila_remembered_password', creds.password);
            } catch (e) {
                // ignore
            }
        }
    }, []);

    // Live-persist to localStorage whenever remember is checked and user types email/password
    useEffect(() => {
        try {
            if (data.remember) {
                localStorage.setItem('sila_remember_me', 'true');
                localStorage.setItem('sila_remembered_email', (data.email || '').trim());
                localStorage.setItem('sila_remembered_password', data.password || '');
            }
        } catch (e) {
            // ignore
        }
    }, [data.email, data.password, data.remember]);

    const handleRememberChange = (e) => {
        const checked = e.target.checked;
        setData('remember', checked);
        try {
            if (checked) {
                localStorage.setItem('sila_remember_me', 'true');
                localStorage.setItem('sila_remembered_email', (data.email || '').trim());
                localStorage.setItem('sila_remembered_password', data.password || '');
            } else {
                localStorage.removeItem('sila_remember_me');
                localStorage.removeItem('sila_remembered_email');
                localStorage.removeItem('sila_remembered_password');
            }
        } catch (err) {
            // ignore
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (data.remember) {
                localStorage.setItem('sila_remember_me', 'true');
                localStorage.setItem('sila_remembered_email', (data.email || '').trim());
                localStorage.setItem('sila_remembered_password', data.password || '');
            } else {
                localStorage.removeItem('sila_remember_me');
                localStorage.removeItem('sila_remembered_email');
                localStorage.removeItem('sila_remembered_password');
            }
        } catch (err) {
            // ignore
        }
        post('/login');
    };

    return (
        <>
            <div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center px-3 sm:px-6 py-6 sm:py-8" dir="rtl">
                <Link
                    href="/"
                    className="hidden sm:flex absolute right-3 top-3 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-primary-dark hover:shadow-xl hover:shadow-blue-300 active:scale-[0.98] sm:right-6 sm:top-6 md:right-8 md:top-8"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    العودة
                </Link>

                <div className="w-full max-w-md">
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-8 shadow-xl shadow-slate-200/50">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark shadow-lg shadow-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">تسجيل الدخول</h2>
                            <p className="text-sm text-slate-500 mt-2">مرحباً بعودتك! سجّل دخولك للمتابعة</p>
                        </div>

                        {flash?.success && (
                            <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 p-3.5 text-right flex items-center gap-2.5 text-green-800 text-xs font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{flash.success}</span>
                            </div>
                        )}

                        {flash?.error && (
                            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-right flex items-center gap-2.5 text-red-800 text-xs font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{flash.error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 text-right">البريد الإلكتروني</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="example@company.com"
                                        autoComplete="email"
                                        className={`w-full rounded-xl border ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pr-10 pl-4 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all`}
                                        dir="ltr"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                                        <span>{errors.email}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 text-right">كلمة المرور</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="أدخل كلمة المرور"
                                        autoComplete="current-password"
                                        className={`w-full rounded-xl border ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pr-10 pl-12 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M19 19l-4-4m0-7a9.97 9.97 0 00-3.029-1.563" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                                        <span>{errors.password}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm pt-1">
                                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={handleRememberChange}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span>تذكرني</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-primary hover:text-primary-dark hover:underline transition-colors text-right"
                                >
                                    نسيت كلمة المرور؟
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-primary-dark hover:shadow-xl hover:shadow-blue-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري تسجيل الدخول...
                                    </span>
                                ) : 'تسجيل الدخول'}
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200"></div>
                            <span className="text-xs font-medium text-slate-400">أو</span>
                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>

                        <p className="text-center text-sm text-slate-500">
                            ليس لديك حساب؟{' '}
                            <Link href="/register" className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors">إنشاء حساب جديد</Link>
                        </p>
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        بتسجيل الدخول، أنت توافق على{' '}
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-primary hover:underline font-medium cursor-pointer"
                        >
                            سياسة الاستخدام والخصوصية
                        </button>
                    </p>
                </div>
            </div>

            <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
            <TermsAndPrivacyModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                requireDecision={false}
            />

            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        </>
    );
}

export default Login;