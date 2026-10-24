import React, { useEffect, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ email = '' }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: email || '',
        password: '',
        password_confirmation: '',
        access_token: '',
    });

    const [clientErrors, setClientErrors] = useState({});

    // Parse access_token from URL hash (standard Supabase redirect format: #access_token=...&type=recovery)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            if (token) {
                setData('access_token', token);
            }
            const queryParams = new URLSearchParams(window.location.search);
            const emailParam = queryParams.get('email');
            if (emailParam && !data.email) {
                setData('email', emailParam);
            }
        }
    }, []);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    const validate = () => {
        const errs = {};
        if (!data.email.trim()) {
            errs.email = 'البريد الإلكتروني مطلوب.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
            errs.email = 'صيغة البريد الإلكتروني غير صحيحة.';
        }

        if (data.password.length < 8) {
            errs.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
        } else if (!passwordRegex.test(data.password)) {
            errs.password = 'كلمة المرور يجب أن تحتوي على حروف صغيرة وكبيرة وأرقام ورموز خاصة.';
        }

        if (data.password !== data.password_confirmation) {
            errs.password_confirmation = 'كلمتا المرور غير متطابقتين.';
        }

        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        post('/reset-password');
    };

    return (
        <div className="relative min-h-screen bg-linear-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center px-4 py-8" dir="rtl">
            <Link
                href="/login"
                className="hidden sm:flex absolute right-6 top-6 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-primary-dark hover:scale-[1.02]"
            >
                <span className="text-base">←</span>
                تسجيل الدخول
            </Link>

            <div className="w-full max-w-md">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark shadow-lg shadow-blue-200 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">تعيين كلمة المرور الجديدة</h2>
                        <p className="text-sm text-slate-500 mt-1.5">أدخل كلمة المرور الجديدة لحسابك للمتابعة.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 text-right">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="example@company.com"
                                dir="ltr"
                                className={`w-full rounded-xl border ${errors.email || clientErrors.email ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-left text-sm text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all`}
                            />
                            {(errors.email || clientErrors.email) && (
                                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email || clientErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 text-right">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => {
                                        setData('password', e.target.value);
                                        if (clientErrors.password) setClientErrors(prev => ({ ...prev, password: '' }));
                                    }}
                                    placeholder="8 أحرف على الأقل (أرقام ورموز وحروف كبيرة وصغيرة)"
                                    className={`w-full rounded-xl border ${errors.password || clientErrors.password ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-slate-50'} pr-4 pl-11 py-3 text-right text-sm text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-600 transition-colors"
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
                            {(errors.password || clientErrors.password) && (
                                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password || clientErrors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 text-right">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => {
                                        setData('password_confirmation', e.target.value);
                                        if (clientErrors.password_confirmation) setClientErrors(prev => ({ ...prev, password_confirmation: '' }));
                                    }}
                                    placeholder="أعد إدخال كلمة المرور"
                                    className={`w-full rounded-xl border ${errors.password_confirmation || clientErrors.password_confirmation ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-slate-50'} pr-4 pl-11 py-3 text-right text-sm text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary-light transition-all`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? (
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
                            {(errors.password_confirmation || clientErrors.password_confirmation) && (
                                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password_confirmation || clientErrors.password_confirmation}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-primary-dark hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

