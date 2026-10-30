import React, { useState, useRef, useEffect } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { ChevronDown, Search, Check } from 'lucide-react';
import TermsAndPrivacyModal from '../../Components/shared/TermsAndPrivacyModal';

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

// 16 Enum values of project_category used as quick suggestions for freelancer specialties
const PROJECT_CATEGORIES = [
    'تطوير المتاجر الإلكترونية',
    'تطوير المواقع التعريفية وصفحات الهبوط',
    'تطوير تطبيقات الويب والأنظمة المخصصة',
    'ربط البرمجيات وأتمتة الأعمال',
    'تحسين أداء المواقع والأمان والصيانة التقنية',
    'تصميم الهوية البصرية والشعارات',
    'تصميم واجهات وتجربة المستخدم',
    'تصميم التغليف وملصقات المنتجات',
    'تصميم العروض الاستثمارية والملفات التعريفية',
    'إدارة الحملات الإعلانية الممولة',
    'إعداد الخطط والاستراتيجيات التسويقية',
    'تحسين محركات البحث والظهور المحلي',
    'كتابة المحتوى الإعلاني والبيعي',
    'إدارة حسابات التواصل الاجتماعي وجدولة المحتوى',
    'تصميم منشورات وإعلانات التواصل الاجتماعي',
    'مونتاج الفيديوهات القصيرة والرسوم المتحركة'
];

// Popular sector suggestions for freelancer experienced_sectors
const SECTOR_SUGGESTIONS = [
    'التجارة الإلكترونية والتجزئة',
    'التقنية والبرمجيات',
    'الخدمات المالية والمصرفية',
    'التعليم والتدريب',
    'الرعاية الصحية والأدوية',
    'المطاعم والمقاهي والأغذية',
    'العقارات والإنشاءات',
    'السياحة والضيافة والترفيه',
    'الخدمات اللوجستية والشحن',
    'الإعلام وصناعة المحتوى',
    'المنظمات غير الربحية',
    'الصناعة والإنتاج'
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
                    errors.companyName = 'اسم رائد الأعمال / المشروع أو الشركة مطلوب';
                } else if (companyName.length < 2) {
                    errors.companyName = 'الاسم يجب أن يتكون من حرفين على الأقل';
                } else if (!/^[\u0600-\u06FF0-9\s]+$/.test(companyName)) {
                    errors.companyName = 'الاسم يجب أن يحتوي على أحرف عربية وأرقام فقط';
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
            } else if (!/^(77|71|73)\d{7}$/.test(cleanPhone)) {
                errors.phone = 'رقم الهاتف يجب أن يبدأ بـ 77 أو 71 أو 73 ويتكون من 9 أرقام';
            }

            if (!formData.idDocument) {
                errors.idDocument = accountType === 'freelancer' ? 'صورة الهوية الوطنية / جواز السفر مطلوبة' : 'صورة السجل التجاري أو البطاقة الشخصية مطلوبة';
            } else if (formData.idDocument.size && formData.idDocument.size > 10 * 1024 * 1024) {
                errors.idDocument = 'حجم الملف يجب ألا يتجاوز 10 ميجابايت';
            }
            break;

        case 2:
            if (accountType === 'freelancer') {
                const jobTitle = (formData.job_title || '').trim();
                if (!jobTitle) {
                    errors.job_title = 'المسمى الوظيفي مطلوب';
                } else if (jobTitle.length < 2) {
                    errors.job_title = 'المسمى الوظيفي يجب أن يتكون من حرفين على الأقل';
                } else if (!/^[\u0600-\u06FFa-zA-Z0-9\s\.\,\-\/\&]+$/.test(jobTitle)) {
                    errors.job_title = 'المسمى الوظيفي يحتوي على رموز غير مسموح بها';
                }

                const city = (formData.city || '').trim();
                if (!city) {
                    errors.city = 'يرجى اختيار المدينة من القائمة';
                }

                const bio = (formData.bio || '').trim();
                if (bio && bio.length > 1000) {
                    errors.bio = 'النبذة التعريفية يجب ألا تتجاوز 1000 حرف';
                }
            } else {
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
            }
            break;

        case 3:
            if (accountType === 'freelancer') {
                if (!formData.marketing_specialties || formData.marketing_specialties.length === 0) {
                    errors.marketing_specialties = 'يرجى اختيار أو إضافة مهارة/خدمة واحدة على الأقل';
                }
                if (!formData.experienced_sectors || formData.experienced_sectors.length === 0) {
                    errors.experienced_sectors = 'يرجى اختيار أو إضافة مجال أو قطاع خبرة واحد على الأقل';
                }
            } else {
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
            }
            break;

        case 4:
            if (accountType === 'freelancer') {
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
            }
            break;
    }

    return errors;
};

// Account type options
const ACCOUNT_TYPES = {
    freelancer: {
        id: 'freelancer',
        label: 'خبير في خدمات ريادة الأعمال',
        description: 'أنشئ حساب خبير لتقديم خدماتك الاستشارية والتقنية والتسويقية لرواد الأعمال',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
        ),
        color: 'bg-[#ff7a45]'
    },
    company: {
        id: 'company',
        label: 'رائد أعمال / صاحب مشروع',
        description: 'أنشئ حساب رائد أعمال لطرح مشاريعك والبحث عن نخبة الخبراء لتنفيذها',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
            </svg>
        ),
        color: 'bg-[#6b46ff]'
    }
};

// Form field configurations
const FORM_FIELDS = {
    company: {
        1: [
            { name: 'companyName', label: 'اسم رائد الأعمال / المشروع أو الشركة', type: 'text', placeholder: 'أدخل اسمك أو اسم مشروعك/شركتك (باللغة العربية)', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@email.com', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', placeholder: 'أدخل رقم الهاتف', required: true },
            { name: 'idDocument', label: 'صورة السجل التجاري أو البطاقة الشخصية', type: 'file', required: true }
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
            { name: 'name', label: 'اكتب اسمك كامل', type: 'text', placeholder: 'أدخل اسمك الثلاثي (باللغة العربية)', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@email.com', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', placeholder: 'أدخل رقم الهاتف', required: true },
            { name: 'idDocument', label: 'صورة الهوية الوطنية / جواز السفر', type: 'file', required: true }
        ],
        2: [
            { name: 'job_title', label: 'المسمى الوظيفي', type: 'text', placeholder: 'مثال: مصمم واجهات، مطور برمجيات، مسوق رقمي', required: true },
            {
                name: 'city',
                label: 'المدينة',
                type: 'select',
                placeholder: 'اختر المدينة',
                required: true,
                options: YEMEN_CITIES
            },
            { name: 'bio', label: 'نبذة تعريفية موجزة', type: 'textarea', placeholder: 'نبذة موجزة عن خبراتك المهنية والخدمات التي تقدمها...', required: false, colSpan: 2 }
        ],
        // Step 3 is rendered specifically with the 2-column TagSelector for Specialties and Sectors
        4: [
            { name: 'password', label: 'كلمة المرور', type: 'password', placeholder: 'أدخل كلمة مرور قوية', required: true },
            { name: 'password_confirmation', label: 'تأكيد كلمة المرور', type: 'password', placeholder: 'أعد إدخال كلمة المرور', required: true }
        ]
    }
};

// Custom Smooth Combobox Component (Smart up/down position, accessible, searchable, effortless click)
const CustomCombobox = ({ field, value, onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const options = field.options || [];

    // Calculate whether dropdown should open upwards or downwards based on viewport space
    const checkPosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 280px below, and there is space above, open upward
            const shouldOpenUp = spaceBelow < 280 && rect.top > 200;
            setOpenUpward(shouldOpenUp);
        }
    };

    const toggleOpen = () => {
        checkPosition();
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        if (isOpen) {
            checkPosition();
            const handleScroll = () => checkPosition();
            window.addEventListener('resize', handleScroll);
            window.addEventListener('scroll', handleScroll, true);
            return () => {
                window.removeEventListener('resize', handleScroll);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }
    }, [isOpen]);

    // Filter options based on search query
    const filteredOptions = options.filter((opt) =>
        opt.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && options.length > 7 && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, options.length]);

    const handleSelect = (option) => {
        const finalVal = option === 'اكتب يدويًا' ? 'custom' : option;
        onChange({
            target: {
                name: field.name,
                value: finalVal,
            },
        });
        setIsOpen(false);
        setSearchQuery('');
    };

    // Determine display label
    let displayLabel = field.placeholder || 'اختر من القائمة';
    if (value) {
        if (value === 'custom') {
            displayLabel = 'اكتب يدويًا';
        } else {
            displayLabel = value;
        }
    }

    const hasValue = Boolean(value);

    return (
        <div ref={containerRef} className={`relative ${isOpen ? 'z-40' : 'z-10'}`}>
            <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>

            {/* Trigger Button - clicking anywhere opens immediately */}
            <div
                role="button"
                tabIndex={0}
                onClick={toggleOpen}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleOpen();
                    }
                }}
                className={`w-full rounded-xl border ${
                    error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'
                } px-4 py-3 text-right text-sm text-slate-900 shadow-sm outline-none transition-all flex items-center justify-between cursor-pointer select-none ${
                    isOpen ? 'border-primary ring-2 ring-primary-light bg-white' : 'hover:border-slate-300'
                }`}
            >
                <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                />
                <span className={`truncate text-right flex-1 ${hasValue ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'}`}>
                    {displayLabel}
                </span>
            </div>

            {/* Dropdown Menu (Smart Up/Down Positioning) */}
            {isOpen && (
                <div
                    className={`absolute z-[80] w-full rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden py-1.5 transition-all duration-150 ${
                        openUpward ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
                    }`}
                >
                    {/* Search Bar for long lists (e.g. cities) */}
                    {options.length > 7 && (
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="بحث سريع في الخيارات..."
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-7 py-1.5 text-xs text-right text-slate-900 outline-none focus:border-primary focus:bg-white transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchQuery('');
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Options List with High Contrast and Clear Padding */}
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const optVal = opt === 'اكتب يدويًا' ? 'custom' : opt;
                                const isSelected = value === optVal || (value === 'custom' && opt === 'اكتب يدويًا');

                                return (
                                    <div
                                        key={opt}
                                        onClick={() => handleSelect(opt)}
                                        className={`w-full px-3.5 py-2.5 text-right text-xs sm:text-sm rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-primary text-white font-bold shadow-2xs'
                                                : 'text-slate-800 hover:bg-slate-100 font-medium'
                                        }`}
                                    >
                                        {isSelected ? (
                                            <Check className="h-4 w-4 text-white shrink-0 stroke-[2.5]" />
                                        ) : (
                                            <span className="w-4 h-4 shrink-0" />
                                        )}
                                        <span className="flex-1 truncate">{opt}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                لا توجد نتائج مطابقة
                            </div>
                        )}
                    </div>
                </div>
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
        return <CustomCombobox field={field} value={value} onChange={onChange} error={error} />;
    }

    if (field.type === 'textarea') {
        return (
            <div className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-medium text-slate-700 mb-1 text-right">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <textarea
                    name={field.name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    className={`w-full rounded-xl border ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-right text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors resize-none`}
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
                        key={value ? 'has-file' : 'no-file'}
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
                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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

    const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
    const [customSectorInput, setCustomSectorInput] = useState('');

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
        job_title: '',
        bio: '',
        marketing_specialties: [],
        experienced_sectors: [],
        password: '',
        password_confirmation: '',
        role: '',
    });

    const [errors, setErrors] = useState({});

    // Reset all form inputs and errors completely when switching account type
    const resetForm = (newRole = '') => {
        setData({
            companyName: '',
            name: '',
            email: '',
            phone: '',
            sector: '',
            customSector: '',
            idDocument: null,
            city: '',
            job_title: '',
            bio: '',
            marketing_specialties: [],
            experienced_sectors: [],
            password: '',
            password_confirmation: '',
            role: newRole,
        });
        setErrors({});
        clearErrors();
        setCustomSpecialtyInput('');
        setCustomSectorInput('');
    };

    const handleChangeAccountType = () => {
        resetForm('');
        setAccountType('');
        setStep(0);
    };

    const handleSelectAccountType = (typeId) => {
        if (!hasAgreedToTerms) {
            setRequireDecision(true);
            setShowTermsModal(true);
            return;
        }
        resetForm(typeId);
        setAccountType(typeId);
        setStep(1);
    };

    const maxSteps = accountType === 'freelancer' ? 4 : 3;

    const stepData = accountType === 'freelancer'
        ? [
            { label: 'الحساب', description: 'أدخل بياناتك الأساسية' },
            { label: 'المعلومات', description: 'أضف المسمى الوظيفي والموقع' },
            { label: 'المهارات والخدمات', description: 'حدد مجالات خبرتك وتخصصاتك' },
            { label: 'كلمة المرور', description: 'أنشئ كلمة مرور قوية' },
        ]
        : [
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

    const handleToggleSpecialty = (item) => {
        const current = data.marketing_specialties || [];
        const next = current.includes(item)
            ? current.filter((s) => s !== item)
            : [...current, item];
        setData('marketing_specialties', next);
        clearErrors('marketing_specialties');
        if (errors.marketing_specialties) {
            setErrors((prev) => ({ ...prev, marketing_specialties: '' }));
        }
    };

    const handleAddCustomSpecialty = (val) => {
        const trimmed = (val || '').trim();
        if (!trimmed) return;
        const current = data.marketing_specialties || [];
        if (!current.includes(trimmed)) {
            setData('marketing_specialties', [...current, trimmed]);
            clearErrors('marketing_specialties');
            if (errors.marketing_specialties) {
                setErrors((prev) => ({ ...prev, marketing_specialties: '' }));
            }
        }
        setCustomSpecialtyInput('');
    };

    const handleRemoveSpecialty = (item) => {
        const current = data.marketing_specialties || [];
        setData('marketing_specialties', current.filter((s) => s !== item));
    };

    const handleToggleSector = (item) => {
        const current = data.experienced_sectors || [];
        const next = current.includes(item)
            ? current.filter((s) => s !== item)
            : [...current, item];
        setData('experienced_sectors', next);
        clearErrors('experienced_sectors');
        if (errors.experienced_sectors) {
            setErrors((prev) => ({ ...prev, experienced_sectors: '' }));
        }
    };

    const handleAddCustomSector = (val) => {
        const trimmed = (val || '').trim();
        if (!trimmed) return;
        const current = data.experienced_sectors || [];
        if (!current.includes(trimmed)) {
            setData('experienced_sectors', [...current, trimmed]);
            clearErrors('experienced_sectors');
            if (errors.experienced_sectors) {
                setErrors((prev) => ({ ...prev, experienced_sectors: '' }));
            }
        }
        setCustomSectorInput('');
    };

    const handleRemoveSector = (item) => {
        const current = data.experienced_sectors || [];
        setData('experienced_sectors', current.filter((s) => s !== item));
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

        if (step < maxSteps) {
            setStep(step + 1);
            return;
        }

        post('/register', {
            forceFormData: true,
            transform: (currentData) => {
                const isFreelancer = accountType === 'freelancer';
                const sectorVal = isFreelancer
                    ? (currentData.marketing_specialties?.[0] || currentData.job_title || 'خدمات ريادة الأعمال')
                    : ((currentData.sector === 'custom' || currentData.sector === 'اكتب يدويًا')
                        ? (currentData.customSector || '').trim()
                        : currentData.sector);

                return {
                    ...currentData,
                    phone: (currentData.phone || '').toString().trim().replace(/[\s\-\(\)\+]/g, '').replace(/^00967|^967/, ''),
                    sector: sectorVal,
                    marketing_specialties: currentData.marketing_specialties || [],
                    experienced_sectors: currentData.experienced_sectors || [],
                };
            },
            onError: (formErrors) => {
                setErrors(formErrors);

                const fieldNames = Object.keys(formErrors);
                if (fieldNames.some((field) => ['name', 'companyName', 'email', 'phone', 'idDocument'].includes(field))) {
                    setStep(1);
                } else if (fieldNames.some((field) => ['job_title', 'bio', 'sector', 'customSector', 'city'].includes(field))) {
                    setStep(2);
                } else if (fieldNames.some((field) => ['marketing_specialties', 'experienced_sectors'].includes(field))) {
                    setStep(3);
                } else {
                    setStep(maxSteps);
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
                                        onClick={() => handleSelectAccountType(type.id)}
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
                            {accountType === 'freelancer' ? 'خبير في خدمات ريادة الأعمال' : 'رائد أعمال / صاحب مشروع'}
                        </p>
                        <h1 className="mt-3 text-2xl font-bold text-slate-900">{stepData[step - 1].label}</h1>
                        <p className="mt-2 text-base text-slate-500">{stepData[step - 1].description}</p>
                    </div>

                    <div className="mb-5">
                        <StepIndicator step={step} stepData={stepData} />
                    </div>

                    <form onSubmit={handleNext} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* If Freelancer Step 3: Render Specialties and Sectors side-by-side */}
                        {accountType === 'freelancer' && step === 3 ? (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Column 1: Specialties with 16 enum values */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                    <div className="text-right">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-semibold text-slate-800">
                                                المهارات والخدمات المقدمة <span className="text-red-500">*</span>
                                            </label>
                                            {data.marketing_specialties?.length > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    محدد ({data.marketing_specialties.length})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">اختر تخصصاتك من القائمة أو أضف تخصصك يدوياً:</p>
                                    </div>

                                    {/* Suggestion Chips */}
                                    <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-0.5">
                                        {PROJECT_CATEGORIES.map((item) => {
                                            const isSelected = data.marketing_specialties?.includes(item);
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => handleToggleSpecialty(item)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-primary text-white shadow-sm font-semibold'
                                                            : 'bg-white text-slate-700 border border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                                                    }`}
                                                >
                                                    {isSelected ? '✓ ' : '+ '}
                                                    {item}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Input */}
                                    <div className="pt-2 border-t border-slate-200/80">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleAddCustomSpecialty(customSpecialtyInput)}
                                                className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer shrink-0"
                                            >
                                                + إضافة
                                            </button>
                                            <input
                                                type="text"
                                                value={customSpecialtyInput}
                                                onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddCustomSpecialty(customSpecialtyInput);
                                                    }
                                                }}
                                                placeholder="اكتب خدمة أو مهارة مخصصة واضغط Enter..."
                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right text-xs text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors"
                                            />
                                        </div>
                                        {/* Custom tags list */}
                                        {data.marketing_specialties?.filter((s) => !PROJECT_CATEGORIES.includes(s)).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {data.marketing_specialties
                                                    ?.filter((s) => !PROJECT_CATEGORIES.includes(s))
                                                    .map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                                                        >
                                                            <span>{tag}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSpecialty(tag)}
                                                                className="text-primary hover:text-red-500 transition-colors cursor-pointer"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                        {(errors.marketing_specialties || serverErrors.marketing_specialties) && (
                                            <p className="mt-1 text-xs text-red-500 text-right">
                                                {errors.marketing_specialties || serverErrors.marketing_specialties}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Sectors */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                    <div className="text-right">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-semibold text-slate-800">
                                                مجالات وقطاعات ريادة الأعمال <span className="text-red-500">*</span>
                                            </label>
                                            {data.experienced_sectors?.length > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    محدد ({data.experienced_sectors.length})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">القطاعات التي تمتلك خبرة سابقة في خدمتها:</p>
                                    </div>

                                    {/* Sector Suggestion Chips */}
                                    <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-0.5">
                                        {SECTOR_SUGGESTIONS.map((item) => {
                                            const isSelected = data.experienced_sectors?.includes(item);
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => handleToggleSector(item)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-primary text-white shadow-sm font-semibold'
                                                            : 'bg-white text-slate-700 border border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                                                    }`}
                                                >
                                                    {isSelected ? '✓ ' : '+ '}
                                                    {item}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Input */}
                                    <div className="pt-2 border-t border-slate-200/80">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleAddCustomSector(customSectorInput)}
                                                className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer shrink-0"
                                            >
                                                + إضافة
                                            </button>
                                            <input
                                                type="text"
                                                value={customSectorInput}
                                                onChange={(e) => setCustomSectorInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddCustomSector(customSectorInput);
                                                    }
                                                }}
                                                placeholder="اكتب قطاعاً مخصصاً واضغط Enter..."
                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right text-xs text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors"
                                            />
                                        </div>
                                        {/* Custom tags list */}
                                        {data.experienced_sectors?.filter((s) => !SECTOR_SUGGESTIONS.includes(s)).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {data.experienced_sectors
                                                    ?.filter((s) => !SECTOR_SUGGESTIONS.includes(s))
                                                    .map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                                                        >
                                                            <span>{tag}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSector(tag)}
                                                                className="text-primary hover:text-red-500 transition-colors cursor-pointer"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                        {(errors.experienced_sectors || serverErrors.experienced_sectors) && (
                                            <p className="mt-1 text-xs text-red-500 text-right">
                                                {errors.experienced_sectors || serverErrors.experienced_sectors}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            currentFields.map((field) => {
                                return (
                                    <div key={field.name} className={field.colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1'}>
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
                            })
                        )}

                        <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:scale-[1.02] cursor-pointer"
                                >
                                    رجوع
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleChangeAccountType}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:scale-[1.02] cursor-pointer"
                                >
                                    تغيير نوع الحساب
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
                                    step < maxSteps ? 'التالي' : 'إنشاء الحساب'
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
