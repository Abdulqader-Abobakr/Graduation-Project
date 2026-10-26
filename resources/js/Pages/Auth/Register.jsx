import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import TermsAndPrivacyModal from '../../Components/TermsAndPrivacyModal';

// The 21 major Yemeni cities and governorates
const YEMEN_CITIES = [
    'صنعاء',
    'عدن',
    'تعز',
    'الحديدة',
    'حضرموت',
    'إب',
    'حجة',
    'ذمار',
    'عمران',
    'صعدة',
    'لحج',
    'أبين',
    'شبوة',
    'المهرة',
    'البيضاء',
    'الجوف',
    'مأرب',
    'الضالع',
    'ريمة',
    'المحويت',
    'سقطرى'
];

// Step validation logic
const validateStep = (step, formData, accountType) => {
    const errors = {};

    switch (step) {
        case 1:
            if (accountType === 'freelancer') {
                const name = (formData.name || '').trim();
                if (!name) {
                    errors.name = 'الاسم مطلوب';
                } else if (name.length < 2) {
                    errors.name = 'الاسم يجب أن يتكون من حرفين على الأقل';
                } else if (!/^[\u0600-\u06FF\s]+$/.test(name)) {
                    errors.name = 'الاسم يجب أن يحتوي على أحرف عربية فقط';
                }
            } else {
                const companyName = (formData.companyName || '').trim();
                if (!companyName) {
                    errors.companyName = 'اسم الشركة مطلوب';
                } else if (companyName.length < 2) {
                    errors.companyName = 'اسم الشركة يجب أن يتكون من حرفين على الأقل';
                } else if (!/^[\u0600-\u06FF0-9\s]+$/.test(companyName)) {
                    errors.companyName = 'اسم الشركة يجب أن يحتوي على أحرف عربية وأرقام فقط';
                }
            }

            const email = (formData.email || '').trim();
            if (!email) {
                errors.email = 'البريد الإلكتروني مطلوب';
            } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
                errors.email = 'صيغة البريد الإلكتروني غير صحيحة';
            }

            const rawPhone = (formData.phone || '').toString().trim();
            const cleanPhone = rawPhone.replace(/[\s\-\(\)\+]/g, '').replace(/^00967|^967/, '');
            if (!rawPhone) {
                errors.phone = 'رقم الهاتف مطلوب';
            } else if (!/^7\d{8}$/.test(cleanPhone)) {
                errors.phone = 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام (مثال: 771234567)';
            }

            if (!formData.idDocument) {
                errors.idDocument = accountType === 'freelancer' ? 'صورة الهوية / جواز السفر مطلوبة' : 'صورة السجل التجاري مطلوبة';
            } else if (formData.idDocument.size && formData.idDocument.size > 10 * 1024 * 1024) {
                errors.idDocument = 'حجم الملف يجب ألا يتجاوز 10 ميجابايت';
            }
            break;

        case 2:
            if (!formData.sector) {
                errors.sector = 'يرجى اختيار المجال / القطاع';
            } else if (formData.sector === 'custom' || formData.sector === 'اكتب يدويًا') {
                const custom = (formData.customSector || '').trim();
                if (!custom) {
                    errors.customSector = 'يرجى إدخال المجال يدوياً';
                } else if (custom.length < 2) {
                    errors.customSector = 'المجال يجب أن يتكون من حرفين على الأقل';
                } else if (!/^[\u0600-\u06FF0-9\s\-–]+$/.test(custom)) {
                    errors.customSector = 'المجال يجب أن يحتوي على أحرف عربية فقط';
                }
            }

            const city = (formData.city || '').trim();
            if (!city) {
                errors.city = 'يرجى اختيار المدينة من القائمة';
            }
            break;

        case 3:
            const password = formData.password || '';
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
            if (!password) {
                errors.password = 'كلمة المرور مطلوبة';
            } else if (password.length < 8) {
                errors.password = 'كلمة المرور يجب أن تكون 8 خانات على الأقل';
            } else if (!passwordRegex.test(password)) {
                errors.password = 'كلمة المرور يجب أن تتضمن حرفاً كبيراً، وحرفاً صغيراً، ورقماً، ورمزاً خاصاً (!@#$...)';
            }

            if (!formData.password_confirmation) {
                errors.password_confirmation = 'يرجى تأكيد كلمة المرور';
            } else if (password !== formData.password_confirmation) {
                errors.password_confirmation = 'كلمتا المرور غير متطابقتين';
            }
            break;
    }

    return errors;
};

// Account type options
const ACCOUNT_TYPES = {
    freelancer: {
        id: 'freelancer',
        label: 'مستقل في خدمات ريادة الأعمال',
        description: 'أنشئ حساباً مستقلاً لتقديم خدمات ريادة الأعمال للشركات',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
        ),
        color: 'bg-[#ff7a45]'
    },
    company: {
        id: 'company',
        label: 'شركة / مؤسسة',
        description: 'أنشئ حساب شركة للبحث عن المستقلين لتنفيذ مشاريعك',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
            </svg>
        ),
        color: 'bg-[#6b46ff]'
    }
};

// Form field configurations without country
const FORM_FIELDS = {
    company: {
        1: [
            { name: 'companyName', label: 'اسم الشركة', type: 'text', placeholder: 'أدخل اسم شركتك (باللغة العربية)', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@company.com', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', placeholder: '7xxxxxxxx', required: true },
            { name: 'idDocument', label: 'صورة السجل التجاري', type: 'file', required: true }
        ],
        2: [
            {
                name: 'sector',
                label: 'القطاع / المجال',
                type: 'select',
                placeholder: 'اختر المجال',
                required: true,
                options: [
                    'التقنية والبرمجيات',
                    'التجارة الإلكترونية والتجزئة',
                    'الخدمات المالية والمصرفية',
                    'التسويق والإعلام',
                    'التعليم والتدريب',
                    'الرعاية الصحية والأدوية',
                    'الصناعة والإنتاج',
                    'العقارات والإنشاءات',
                    'السياحة والضيافة',
                    'اكتب يدويًا'
                ]
            },
            {
                name: 'city',
                label: 'المدينة',
                type: 'select',
                placeholder: 'اختر المدينة',
                required: true,
                options: YEMEN_CITIES
            }
        ],
        3: [
            { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: 'أدخل كلمة مرور قوية', required: true },
            { name: 'password_confirmation', label: 'تأكيد كلمة المرور', type: 'password', placeholder: 'أعد إدخال كلمة المرور', required: true }
        ]
    },
    freelancer: {
        1: [
            { name: 'name', label: 'الاسم الكامل', type: 'text', placeholder: 'أدخل اسمك الثلاثي (باللغة العربية)', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@company.com', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', placeholder: '7xxxxxxxx', required: true },
            { name: 'idDocument', label: 'صورة الهوية / جواز السفر', type: 'file', required: true }
        ],
        2: [
            {
                name: 'sector',
                label: 'مجال ريادة الأعمال الذي تقدّم فيه الخدمة',
                type: 'select',
                placeholder: 'اختر المجال',
                required: true,
                options: [
                    'خدمات التسويق الرقمي',
                    'التصميم الجرافيكي والهوية البصرية',
                    'تطوير المواقع وتطبيقات الجوال',
                    'إدارة الحملات ووسائل التواصل الاجتماعي',
                    'الاستشارات التجارية ودراسات الجدوى',
                    'أبحاث السوق وتحليل المنافسين',
                    'صناعة المحتوى والترجمة',
                    'اكتب يدويًا'
                ]
            },
            {
                name: 'city',
                label: 'المدينة',
                type: 'select',
                placeholder: 'اختر المدينة',
                required: true,
                options: YEMEN_CITIES
            }
        ],
        3: [
            { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: 'أدخل كلمة مرور قوية', required: true },
            { name: 'password_confirmation', label: 'تأكيد كلمة المرور', type: 'password', placeholder: 'أعد إدخال كلمة المرور', required: true }
        ]
    }
};

// Form input component
const FormInput = ({ field, value, onChange, error }) => {
    const [showPassword, setShowPassword] = useState(false);



    const commonProps = {
        name: field.name,
        value: value || '',
        onChange,
        placeholder: field.placeholder,
        required: field.required,
        className: `w-full rounded-xl border ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors`
    };

    if (field.type === 'select') {
        const options = field.options || [];
        return (
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <select
                    {...commonProps}
                    className={`w-full rounded-xl border ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors cursor-pointer`}
                >
                    <option value="">{field.placeholder || 'اختر من القائمة'}</option>
                    {options.map((option) => (
                        <option key={option} value={option === 'اكتب يدويًا' ? 'custom' : option}>
                            {option}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-1 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                        <span>{error}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </p>
                )}
            </div>
        );
    }

    if (field.type === 'file') {
        return (
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <div className="relative">
                    <input
                        name={field.name}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={onChange}
                        className={`w-full rounded-xl border ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'} px-4 py-2.5 text-right text-xs text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer`}
                    />
                </div>
                {value && value.name && (
                    <p className="mt-1 text-xs text-slate-600 text-right flex items-center justify-end gap-1 font-mono">
                        <span className="truncate max-w-xs">{value.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </p>
                )}
                {error && (
                    <p className="mt-1 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                        <span>{error}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </p>
                )}
            </div>
        );
    }

    if (field.type === 'password') {
        return (
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        {...commonProps}
                        className={`w-full rounded-xl border ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'} pr-4 pl-11 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors`}
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
                {field.name === 'password' && !error && (
                    <p className="mt-1 text-[11px] text-slate-500 text-right">
                        8 خانات على الأقل (حرف كبير، حرف صغير، رقم، ورمز خاص @#$...)
                    </p>
                )}
                {error && (
                    <p className="mt-1 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                        <span>{error}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </p>
                )}
            </div>
        );
    }

    return (
        <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <input
                type={field.type}
                dir={field.type === 'email' || field.type === 'tel' ? 'ltr' : 'rtl'}
                {...commonProps}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                    <span>{error}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </p>
            )}
        </div>
    );
};

// Step indicator component
const StepIndicator = ({ step, stepData }) => {
    return (
        <div className="flex justify-between gap-2 text-center">
            {stepData.map((item, index) => {
                const currentStep = index + 1;
                const isActive = currentStep === step;
                const isDone = currentStep < step;

                return (
                    <div key={item.label} className="flex-1">
                        <div
                            className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${isActive
                                ? 'border-primary bg-primary text-white shadow-sm'
                                : isDone
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-slate-300 bg-white text-slate-400'
                                }`}
                        >
                            {isDone ? '✓' : currentStep}
                        </div>
                        <div className={`text-[10px] font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                            {item.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function Register() {
    const [step, setStep] = useState(0);
    const [accountType, setAccountType] = useState('');
    const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(true);
    const [requireDecision, setRequireDecision] = useState(true);

    const handleAcceptTerms = () => {
        setHasAgreedToTerms(true);
        setShowTermsModal(false);
    };

    const handleDeclineTerms = () => {
        router.visit('/');
    };

    const { data, setData, post, processing, errors: serverErrors, clearErrors } = useForm({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        sector: '',
        customSector: '',
        idDocument: null,
        city: '',
        password: '',
        password_confirmation: '',
        role: '',
    });

    const [errors, setErrors] = useState({});

    const stepData = [
        { label: 'الحساب', description: 'أدخل بياناتك الأساسية' },
        { label: 'المعلومات', description: 'أضف معلومات النشاط والموقع' },
        { label: 'كلمة المرور', description: 'أنشئ كلمة مرور قوية' },
    ];

    const handleChange = (e) => {
        const { name, type, value, files } = e.target;
        const newValue = type === 'file' ? (files && files[0]) : value;
        setData(name, newValue);
        clearErrors(name);
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleNext = (e) => {
        e.preventDefault();

        if (!hasAgreedToTerms) {
            setRequireDecision(true);
            setShowTermsModal(true);
            return;
        }

        const newErrors = validateStep(step, data, accountType);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const firstErrorField = document.querySelector(`[name="${Object.keys(newErrors)[0]}"]`);
            if (firstErrorField) firstErrorField.focus();
            return;
        }

        if (step < 3) {
            setStep(step + 1);
            return;
        }

        post('/register', {
            forceFormData: true,
            transform: (currentData) => ({
                ...currentData,
                phone: (currentData.phone || '').toString().trim().replace(/[\s\-\(\)\+]/g, '').replace(/^00967|^967/, ''),
                sector: (currentData.sector === 'custom' || currentData.sector === 'اكتب يدويًا') ? (currentData.customSector || '').trim() : currentData.sector,
            }),
            onError: (formErrors) => {
                setErrors(formErrors);

                const fieldNames = Object.keys(formErrors);
                if (fieldNames.some((field) => ['name', 'companyName', 'email', 'phone', 'idDocument'].includes(field))) {
                    setStep(1);
                } else if (fieldNames.some((field) => ['sector', 'customSector', 'city'].includes(field))) {
                    setStep(2);
                } else {
                    setStep(3);
                }
            },
        });
    };

    const handleBack = () => {
        if (step <= 0) {
            return;
        }
        setStep(step - 1);
    };

    const renderStepContent = () => {
        if (step === 0) {
            return (
                <div className="flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-8 border border-slate-100 min-h-100">
                        <div className="flex flex-col items-center gap-2">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.642 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900">إنشاء حساب جديد</h2>
                            <p className="mt-1 text-sm text-slate-500">اختر نوع الحساب المناسب لك</p>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {Object.values(ACCOUNT_TYPES).map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => {
                                            if (!hasAgreedToTerms) {
                                                setRequireDecision(true);
                                                setShowTermsModal(true);
                                                return;
                                            }
                                            setAccountType(type.id);
                                            setData('role', type.id);
                                            setStep(1);
                                        }}
                                        className="flex flex-col items-start gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-right shadow hover:shadow-lg transition-all hover:scale-[1.02] hover:border-primary group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            <div className={`h-12 w-12 rounded-lg ${type.color} flex items-center justify-center text-white shadow transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                                {type.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-base text-slate-900">{type.label}</div>
                                                <div className="text-sm text-slate-500 leading-relaxed">{type.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 text-center text-xs text-slate-500">
                                لديك حساب بالفعل؟{' '}
                                <Link href="/login" className="text-primary font-semibold hover:underline transition">
                                    تسجيل الدخول
                                </Link>
                            </div>

                            <p className="mt-4 text-center text-xs text-slate-400">
                                بالتسجيل، أنت توافق على{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequireDecision(!hasAgreedToTerms);
                                        setShowTermsModal(true);
                                    }}
                                    className="text-primary hover:underline font-medium cursor-pointer"
                                >
                                    سياسة الاستخدام والخصوصية
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        const currentFields = (FORM_FIELDS[accountType] || FORM_FIELDS.company)[step] || [];
        const showCustomSectorInput = step === 2 && (data.sector === 'custom' || data.sector === 'اكتب يدويًا');

        return (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-5xl mx-auto min-h-100">
                <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
                    <div className="text-center mb-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                            {accountType === 'freelancer' ? 'مستقل في خدمات ريادة الأعمال' : 'شركة / مؤسسة'}
                        </p>
                        <h1 className="mt-3 text-2xl font-bold text-slate-900">{stepData[step - 1].label}</h1>
                        <p className="mt-2 text-base text-slate-500">{stepData[step - 1].description}</p>
                    </div>

                    <div className="mb-5">
                        <StepIndicator step={step} stepData={stepData} />
                    </div>

                    <form onSubmit={handleNext} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentFields.map((field) => {
                            return (
                                <div key={field.name} className="md:col-span-1">
                                    <FormInput
                                        field={field}
                                        value={data[field.name]}
                                        onChange={handleChange}
                                        error={errors[field.name] || serverErrors[field.name]}
                                    />

                                    {showCustomSectorInput && field.name === 'sector' && (
                                        <div className="mt-2.5">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                                                أدخل المجال يدوياً
                                                <span className="text-red-500 mr-1">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="customSector"
                                                value={data.customSector || ''}
                                                onChange={handleChange}
                                                placeholder="اكتب المجال باللغة العربية"
                                                className={`w-full rounded-xl border ${errors.customSector || serverErrors.customSector ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors`}
                                            />
                                            {(errors.customSector || serverErrors.customSector) && (
                                                <p className="mt-1 text-xs text-red-500 text-right flex items-center justify-end gap-1">
                                                    <span>{errors.customSector || serverErrors.customSector}</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:scale-[1.02] cursor-pointer"
                                >
                                    رجوع
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-primary-dark hover:shadow-lg hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mr-auto"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري المعالجة...
                                    </span>
                                ) : (
                                    step < 3 ? 'التالي' : 'إنشاء الحساب'
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-center text-xs text-slate-500">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-primary hover:underline font-semibold transition">
                            تسجيل الدخول
                        </Link>
                    </p>

                    <p className="mt-3 text-center text-xs text-slate-400">
                        بالتسجيل، أنت توافق على{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setRequireDecision(!hasAgreedToTerms);
                                setShowTermsModal(true);
                            }}
                            className="text-primary hover:underline font-medium cursor-pointer"
                        >
                            سياسة الاستخدام والخصوصية
                        </button>
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 flex items-center justify-center" dir="rtl">
            <div className="w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-8">
                <div className="mb-4 flex justify-start">
                    <Link
                        href="/"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all bg-primary text-white shadow-md hover:bg-primary-dark hover:shadow-lg hover:scale-[1.02]"
                    >
                        <span className="text-base">←</span>
                        العودة للرئيسية
                    </Link>
                </div>

                {renderStepContent()}
            </div>

            <TermsAndPrivacyModal
                isOpen={showTermsModal}
                onAccept={handleAcceptTerms}
                onDecline={handleDeclineTerms}
                onClose={() => {
                    if (!requireDecision) {
                        setShowTermsModal(false);
                    }
                }}
                requireDecision={requireDecision}
                hasAgreed={hasAgreedToTerms}
            />
        </div>
    );
}

export default Register;
