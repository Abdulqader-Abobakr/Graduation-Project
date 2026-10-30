import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function CreateRequestModal({ isOpen, onClose, onSubmit, freelancers = [], request = null, fixedFreelancer = null }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('تطوير المتاجر الإلكترونية');

    const [providerType, setProviderType] = useState('general');
    const [specificPerson, setSpecificPerson] = useState('');
    const [targetedFreelancerId, setTargetedFreelancerId] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState({});

    const categoryLabels = {
        digital_marketing: 'إدارة الحملات الإعلانية الممولة',
        branding: 'تصميم الهوية البصرية والشعارات',
        dev: 'تطوير تطبيقات الويب والأنظمة',
        analytics: 'ربط البرمجيات وأتمتة الأعمال',
        content: 'كتابة المحتوى الإعلاني والبيعي',
        'تسويق رقمي': 'إدارة الحملات الإعلانية الممولة',
        'تصميم وهويات بصرية': 'تصميم الهوية البصرية والشعارات',
        'تطوير مواقع وتطبيقات': 'تطوير تطبيقات الويب والأنظمة',
        'تحليلات ولوحات بيانات': 'ربط البرمجيات وأتمتة الأعمال',
        'كتابة وإعداد محتوى': 'كتابة المحتوى الإعلاني والبيعي',
    };

    const categoriesList = [
        'تطوير المتاجر الإلكترونية',
        'تطوير المواقع وصفحات الهبوط',
        'تطوير تطبيقات الويب والأنظمة',
        'ربط البرمجيات وأتمتة الأعمال',
        'تحسين الأداء والأمان والصيانة',
        'تصميم الهوية البصرية والشعارات',
        'تصميم واجهات وتجربة المستخدم',
        'تصميم التغليف وملصقات المنتجات',
        'تصميم العروض والملفات التعريفية',
        'إدارة الحملات الإعلانية الممولة',
        'الخطط والاستراتيجيات التسويقية',
        'تحسين محركات البحث والظهور المحلي',
        'كتابة المحتوى الإعلاني والبيعي',
        'إدارة التواصل الاجتماعي والمحتوى',
        'تصميم منشورات التواصل الاجتماعي',
        'مونتاج الفيديوهات والرسوم',
    ];

    useEffect(() => {
        if (!isOpen) return;

        setTitle(request?.title || '');
        setCategory(categoryLabels[request?.category] || request?.category || 'تطوير المتاجر الإلكترونية');
        setProviderType(fixedFreelancer || request?.providerType === 'specific' ? 'specific' : 'general');
        setTargetedFreelancerId(fixedFreelancer?.id || request?.targetedFreelancerId || '');
        setSpecificPerson(fixedFreelancer?.name || request?.targetedFreelancer || '');
        setDescription(request?.description || '');
        setErrors({});
    }, [isOpen, request, fixedFreelancer]);

    if (!isOpen) return null;

    const normalizedName = specificPerson.trim().toLocaleLowerCase('ar');

    const matchingFreelancers = normalizedName
        ? freelancers.filter((freelancer) => (freelancer.user_name || '').toLocaleLowerCase('ar').includes(normalizedName))
        : freelancers;
    const exactMatchedFreelancer = normalizedName
        ? freelancers.find((freelancer) => (freelancer.user_name || '').toLocaleLowerCase('ar') === normalizedName)
        : null;
    const hasExactMatch = Boolean(exactMatchedFreelancer);

    const handleFormSubmit = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        // Validation
        const newErrors = {};
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            newErrors.title = 'حقل العنوان مطلوب';
        }

        if (!description.trim()) newErrors.description = 'حقل تفاصيل الطلب مطلوب';

        const resolvedFreelancerId = targetedFreelancerId || exactMatchedFreelancer?.id || '';

        if (providerType === 'specific') {
            const trimmedPerson = specificPerson.trim();
            if (!fixedFreelancer && !trimmedPerson) {
                newErrors.specificPerson = 'يرجى كتابة أو اختيار اسم الخبير';
            } else if (!resolvedFreelancerId) {
                newErrors.specificPerson = 'يرجى اختيار الخبير من القائمة';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit({
            title: trimmedTitle,
            category,
            providerType,
            targetedFreelancerId: providerType === 'specific' ? resolvedFreelancerId : null,
            targetedFreelancer: providerType === 'specific' ? (fixedFreelancer?.name || exactMatchedFreelancer?.user_name || specificPerson.trim()) : null,
            description: description.trim(),
        });
    };

    return (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-100 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[28px] border border-[#e6e4de] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-start px-6 py-5 border-b border-[#e5e2da] bg-[#fcfbf9]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-[#f7f6f2] rounded-full text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-[#28251d] mb-2">عنوان الطلب <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTitle(val);
                                if (errors.title) {
                                    setErrors((prev) => ({ ...prev, title: null }));
                                }
                            }}
                            placeholder="مثال: تصميم شعار جديد، إدارة حملة إعلانية..."
                            className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-500 bg-red-50/10' : 'border-[#d4d1ca]'} focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all text-sm`}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1 font-bold">{errors.title}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-bold text-[#28251d] mb-2">المجال / نوع الخدمة</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-[#d4d1ca] focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all text-sm bg-white font-medium"
                        >
                            {categoriesList.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>



                    {/* Preferred Provider Type */}
                    {!fixedFreelancer && <div>
                        <label className="block text-sm font-bold text-[#28251d] mb-2">نوع المزود المفضل</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'general', label: 'عام' },
                                { key: 'specific', label: 'محدد' },
                            ].map((prov) => (
                                <button
                                    key={prov.key}
                                    type="button"
                                    onClick={() => {
                                        setProviderType(prov.key);
                                        if (prov.key === 'general') {
                                            setSpecificPerson('');
                                            setTargetedFreelancerId('');
                                        }
                                    }}
                                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${providerType === prov.key
                                        ? 'border-primary bg-[#2a7de105] text-primary shadow-sm'
                                        : 'border-[#d4d1ca] bg-white text-[#7a7974] hover:border-[#7a7974] hover:text-[#28251d]'
                                        }`}
                                >
                                    {prov.label}
                                </button>
                            ))}
                        </div>
                        {providerType === 'specific' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={specificPerson}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSpecificPerson(val);
                                        setTargetedFreelancerId('');
                                        if (errors.specificPerson) {
                                            setErrors((prev) => ({ ...prev, specificPerson: null }));
                                        }
                                    }}
                                    placeholder="اكتب اسم الخبير أو اختر من القائمة"
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.specificPerson ? 'border-red-500' : 'border-primary'} focus:ring-2 focus:ring-primary/15 outline-none transition-all text-sm bg-[#f4f8fd]`}
                                />
                                {normalizedName && !hasExactMatch && matchingFreelancers.length === 0 && (
                                    <p className="mt-2 text-sm font-bold text-red-500">❌ لا يوجد خبير بهذا الاسم</p>
                                )}
                                {matchingFreelancers.length > 0 && !targetedFreelancerId && (
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-[#d4d1ca] bg-white shadow-sm">
                                        {matchingFreelancers.map((freelancer) => (
                                            <button
                                                key={freelancer.id}
                                                type="button"
                                                onClick={() => {
                                                    setSpecificPerson(freelancer.user_name);
                                                    setTargetedFreelancerId(freelancer.id);
                                                    setErrors({ ...errors, specificPerson: null });
                                                }}
                                                className="block w-full px-4 py-3 text-right text-sm font-semibold text-[#28251d] hover:bg-[#f7f6f2] cursor-pointer"
                                            >
                                                {freelancer.user_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.specificPerson && (
                                    <p className="text-xs text-red-500 mt-1 font-bold">{errors.specificPerson}</p>
                                )}
                            </div>
                        )}
                    </div>}
                    {fixedFreelancer && (
                        <div className="rounded-xl border border-primary/30 bg-[#f4f8fd] px-4 py-3">
                            <p className="text-xs font-bold text-[#7a7974]">مزود الخدمة</p>
                            <p className="mt-1 text-sm font-bold text-primary">{fixedFreelancer.name}</p>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-[#28251d] mb-2">تفاصيل الطلب والمهام المطلوبة <span className="text-red-500">*</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: null }); }}
                            placeholder="صف بالتفصيل ما ترغب في إنجازه، المخرجات المطلوبة، والشروط الخاصة..."
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-500 bg-red-50/10' : 'border-[#d4d1ca]'} focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all text-sm resize-none`}
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1 font-bold">{errors.description}</p>}
                    </div>


                </form>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#fcfbf9] border-t border-[#e5e2da] shrink-0">
                    <button
                        type="button"
                        onClick={handleFormSubmit}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-[#1b62c4] transition-colors shadow-sm cursor-pointer"
                    >
                        إرسال الطلب
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-[#d4d1ca] text-[#7a7974] rounded-xl font-bold hover:bg-[#f7f6f2] hover:text-[#28251d] transition-colors cursor-pointer"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
}


