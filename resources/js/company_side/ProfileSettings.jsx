import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, Sparkles, UserCog, X } from 'lucide-react';
import { useForm, usePage, router } from '@inertiajs/react';
import Sidebar from '../Components/company/NavItem';
import Header from '../Components/company/Header';
import SilaAssistant from '../Components/shared/SilaAssistant';

export default function ProfileSettings({ pageTitle, user = {} }) {
    const { flash = {} } = usePage().props;
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isAltEmailOpen, setIsAltEmailOpen] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        data: passwordData,
        setData: setPasswordData,
        put: putPassword,
        processing: passwordProcessing,
        errors: passwordErrors,
        setError: setPasswordError,
        clearErrors: clearPasswordErrors,
        reset: resetPassword,
        recentlySuccessful: passwordSuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [clientPasswordErrors, setClientPasswordErrors] = useState({});

    // Alternative email form
    const {
        data: altEmailData,
        setData: setAltEmailData,
        put: putAltEmail,
        processing: altEmailProcessing,
        errors: altEmailErrors,
        clearErrors: clearAltEmailErrors,
        reset: resetAltEmail,
        recentlySuccessful: altEmailSuccessful,
    } = useForm({
        alternative_email: user?.alternative_email || '',
    });

    const [clientAltEmailError, setClientAltEmailError] = useState('');

    useEffect(() => {
        setAltEmailData('alternative_email', user?.alternative_email || '');
    }, [user?.alternative_email]);

    // Standard strong password regex: at least 8 chars, lowercase, uppercase, number, special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    // Live validation whenever password fields change
    const validatePasswords = (current, next, confirm) => {
        const errs = {};

        if (next) {
            if (current && next === current) {
                errs.password = 'لا يمكن أن تكون كلمة المرور الجديدة مطابقة لكلمة المرور الحالية.';
            } else if (next.length < 8) {
                errs.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
            } else if (!passwordRegex.test(next)) {
                errs.password = 'كلمة المرور يجب أن تحتوي على حروف صغيرة وكبيرة وأرقام ورموز خاصة.';
            }
        }

        if (confirm && next && confirm !== next) {
            errs.password_confirmation = 'كلمتا المرور غير متطابقتين.';
        }

        setClientPasswordErrors(errs);
        return errs;
    };

    const handleCurrentPasswordChange = (val) => {
        setPasswordData('current_password', val);
        clearPasswordErrors('current_password');
        validatePasswords(val, passwordData.password, passwordData.password_confirmation);
    };

    const handleNewPasswordChange = (val) => {
        setPasswordData('password', val);
        clearPasswordErrors('password');
        validatePasswords(passwordData.current_password, val, passwordData.password_confirmation);
    };

    const handleConfirmPasswordChange = (val) => {
        setPasswordData('password_confirmation', val);
        clearPasswordErrors('password_confirmation');
        validatePasswords(passwordData.current_password, passwordData.password, val);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();

        const errs = validatePasswords(passwordData.current_password, passwordData.password, passwordData.password_confirmation);
        if (Object.keys(errs).length > 0) {
            return;
        }

        putPassword('/company/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                resetPassword();
                setClientPasswordErrors({});
                setIsPasswordOpen(false);
            },
        });
    };

    // Alternative email validation & submission
    const handleAltEmailChange = (val) => {
        setAltEmailData('alternative_email', val);
        clearAltEmailErrors('alternative_email');
        if (!val.trim()) {
            setClientAltEmailError('');
            return;
        }
        if (user?.email && val.trim().toLowerCase() === user.email.toLowerCase()) {
            setClientAltEmailError('لا يمكن أن يكون البريد البديل مطابقاً للبريد الأساسي.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val.trim())) {
            setClientAltEmailError('يرجى إدخال بريد إلكتروني صالح.');
            return;
        }
        setClientAltEmailError('');
    };

    const handleAltEmailSubmit = (e) => {
        e.preventDefault();
        const val = altEmailData.alternative_email.trim();
        if (val) {
            if (user?.email && val.toLowerCase() === user.email.toLowerCase()) {
                setClientAltEmailError('لا يمكن أن يكون البريد البديل مطابقاً للبريد الأساسي.');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
                setClientAltEmailError('يرجى إدخال بريد إلكتروني صالح.');
                return;
            }
        }

        putAltEmail('/company/settings/alternative-email', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAltEmailOpen(false);
                setClientAltEmailError('');
            },
        });
    };

    // Email notifications for new offers
    const [notifications, setNotifications] = useState(user?.email_notifications ?? true);
    const [notificationsProcessing, setNotificationsProcessing] = useState(false);

    useEffect(() => {
        if (user?.email_notifications !== undefined) {
            setNotifications(Boolean(user.email_notifications));
        }
    }, [user?.email_notifications]);

    const toggleNotifications = () => {
        const nextVal = !notifications;
        setNotifications(nextVal);
        setNotificationsProcessing(true);
        router.put(
            '/company/settings/notifications',
            { email_notifications: nextVal },
            {
                preserveScroll: true,
                onFinish: () => setNotificationsProcessing(false),
            }
        );
    };

    // Floating toast notification above the page
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const msg = flash?.success || (passwordSuccessful ? 'تم تغيير كلمة المرور بنجاح.' : '') || (altEmailSuccessful ? 'تم حفظ البريد الإلكتروني البديل بنجاح.' : '');
        if (msg) {
            setToastMessage(msg);
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, passwordSuccessful, altEmailSuccessful]);

    const handleHeaderSearch = (e) => {
        e.preventDefault();
        const q = search.trim();
        router.visit(q ? `/company?tab=explore&search=${encodeURIComponent(q)}` : '/company?tab=explore');
    };

    return (
        <div dir="rtl" className="flex h-screen bg-gray-50 font-sans">
            <Sidebar activePage="settings" isSidebarOpen={isSidebarOpen} />

            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <Header
                    pageTitle={pageTitle || 'الإعدادات'}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    search={search}
                    setSearch={setSearch}
                    searchPlaceholder="ابحث عن خبير أو تخصص أو خبرة..."
                    onSearchSubmit={handleHeaderSearch}
                />

                <div className="flex-1 overflow-y-auto p-8 space-y-8 relative" dir="rtl">
                    {/* Floating Toast Notification Above the Page */}
                    <div
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${
                            showToast && toastMessage
                                ? 'translate-y-0 opacity-100 scale-100'
                                : '-translate-y-12 opacity-0 scale-95 pointer-events-none'
                        }`}
                    >
                        {toastMessage && (
                            <div className="w-[calc(100vw-2rem)] max-w-md bg-white border border-emerald-200 shadow-2xl shadow-emerald-900/15 rounded-2xl p-4 pr-5 pl-12 flex items-center gap-4 relative">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={24} className="text-emerald-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-800">عملية ناجحة</p>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">{toastMessage}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowToast(false)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold mb-2">{pageTitle || 'الإعدادات'}</h1>
                        <p className="text-slate-500">إدارة إعدادات الحساب والخصوصية.</p>
                    </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-5">
                        <UserCog size={20} className="text-slate-700" />
                        <h2 className="text-xl font-bold">إعدادات الحساب</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Notifications card: send new offers to company email when out of website */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                            notifications ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'
                                        }`}
                                    >
                                        <Mail size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm">إشعارات البريد الإلكتروني</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            إرسال رسائل وتنبيهات العروض الجديدة إلى بريد الشركة في حال عدم تواجدك على الموقع.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={notifications}
                                    aria-label="تبديل إشعارات العروض بالبريد"
                                    onClick={toggleNotifications}
                                    disabled={notificationsProcessing}
                                    dir="ltr"
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                        notifications ? 'bg-primary' : 'bg-slate-300'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out transform ${
                                            notifications ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 2. Alternative email card: in case main email is lost */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm">البريد الإلكتروني البديل</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            إضافة بريد إلكتروني بديل لاسترداد الحساب أو في حال فقدان الوصول للبريد الأساسي.
                                        </p>
                                        {user?.alternative_email && !isAltEmailOpen && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium" dir="ltr">
                                                <span>{user.alternative_email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAltEmailOpen(!isAltEmailOpen);
                                        if (altEmailErrors.alternative_email) clearAltEmailErrors();
                                    }}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
                                >
                                    {isAltEmailOpen ? 'إلغاء' : (user?.alternative_email ? 'تعديل' : 'إضافة')}
                                </button>
                            </div>

                            {isAltEmailOpen && (
                                <form onSubmit={handleAltEmailSubmit} className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            البريد الإلكتروني البديل (الاحتياطي)
                                        </label>
                                        <input
                                            type="email"
                                            value={altEmailData.alternative_email}
                                            onChange={(e) => handleAltEmailChange(e.target.value)}
                                            placeholder="example.backup@domain.com"
                                            dir="ltr"
                                            className={`w-full px-4 py-2.5 rounded-xl border ${
                                                (altEmailErrors.alternative_email || clientAltEmailError)
                                                    ? 'border-red-500 bg-red-50/10'
                                                    : 'border-slate-200'
                                            } bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-left`}
                                        />
                                        {(clientAltEmailError || altEmailErrors.alternative_email) && (
                                            <p className="text-xs text-red-500 mt-1 font-semibold text-right" dir="rtl">
                                                {clientAltEmailError || altEmailErrors.alternative_email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={altEmailProcessing}
                                            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#1b62c4] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                                        >
                                            {altEmailProcessing ? 'جاري الحفظ...' : 'حفظ البريد البديل'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-5">
                        <Lock size={20} className="text-slate-700" />
                        <h2 className="text-xl font-bold">الأمان</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <KeyRound size={20} className="text-primary" />
                                    <div>
                                        <p className="font-bold text-slate-800">تغيير كلمة المرور</p>
                                        <p className="text-xs text-slate-500">قم بتحديث كلمة المرور بانتظام للحفاظ على أمان حسابك.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPasswordOpen(!isPasswordOpen);
                                        if (isPasswordOpen) resetPassword();
                                    }}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer"
                                >
                                    {isPasswordOpen ? 'إلغاء' : 'تعديل'}
                                </button>
                            </div>

                            {isPasswordOpen && (
                                <form onSubmit={handlePasswordSubmit} className="mt-5 pt-5 border-t border-slate-200 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الحالية</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.current_password}
                                                onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                                                placeholder="أدخل كلمة المرور الحالية"
                                                className={`w-full px-4 py-2.5 pl-10 rounded-xl border ${passwordErrors.current_password ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {passwordErrors.current_password && (
                                            <p className="text-xs text-red-500 mt-1 font-semibold">{passwordErrors.current_password}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordData.password}
                                                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                                                    placeholder="8 أحرف على الأقل (أرقام، رموز، أحرف كبيرة وصغيرة)"
                                                    className={`w-full px-4 py-2.5 pl-10 rounded-xl border ${(clientPasswordErrors.password || passwordErrors.password) ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {(clientPasswordErrors.password || passwordErrors.password) && (
                                                <p className="text-xs text-red-500 mt-1 font-semibold">
                                                    {clientPasswordErrors.password || passwordErrors.password}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordData.password_confirmation}
                                                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                                    placeholder="أعد إدخال كلمة المرور"
                                                    className={`w-full px-4 py-2.5 pl-10 rounded-xl border ${(clientPasswordErrors.password_confirmation || passwordErrors.password_confirmation) ? 'border-red-500 bg-red-50/10' : 'border-slate-200'} bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {(clientPasswordErrors.password_confirmation || passwordErrors.password_confirmation) && (
                                                <p className="text-xs text-red-500 mt-1 font-semibold">
                                                    {clientPasswordErrors.password_confirmation || passwordErrors.password_confirmation}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={passwordProcessing}
                                            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-[#1b62c4] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                        >
                                            {passwordProcessing ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-linear-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/10 p-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={20} className="text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">نصيحة</h2>
                    </div>
                    <p className="text-sm text-slate-600">يمكنك تحديث بيانات الشركة بانتظام لعرض هوية احترافية واضحة للملاءمة والمشاريع.</p>
                </section>
            </div>
                </div>
            </main>
            <SilaAssistant />
        </div>
    );
}
