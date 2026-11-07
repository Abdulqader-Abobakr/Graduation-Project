import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import {
    ChevronRight,
    ChevronDown,
    CreditCard,
    Upload,
    CheckCircle,
    Building2,
    Phone,
    User,
    FileImage,
    AlertCircle,
} from 'lucide-react';

const PAYMENT_METHODS = [
    { value: 'التحويل عبر شبكة صرافة محلية', label: 'التحويل عبر شبكة صرافة محلية' },
    { value: 'محفظة إلكترونية', label: 'محفظة إلكترونية (فلوسك، جيب، كاش، إلخ)' },
    { value: 'بنك الكريمي', label: 'بنك الكريمي' },
];

export default function PaymentPage({ project }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        receipt: null,
        payment_method: '',
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = (file) => {
        if (!file) return;
        setData('receipt', file);
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/company/projects/${project.id}/pay`, {
            forceFormData: true,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50" dir="rtl">
            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Back Link */}
                <Link
                    href="/company/projects"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-8 group"
                >
                    <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                    <span className="text-sm font-bold">العودة لمشاريعي</span>
                </Link>

                {/* Page Header */}
                <div className="text-center mb-10">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-lg shadow-amber-100/50">
                        <CreditCard size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">إتمام الدفع</h1>
                    <p className="mt-2 text-slate-500 text-sm">
                        لتفعيل المشروع <span className="font-bold text-slate-700">"{project.title}"</span>
                    </p>
                </div>

                {/* Price Summary Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">المبلغ المطلوب</span>
                        <span className="text-2xl font-black text-slate-800">
                            {Number(project.price || 0).toLocaleString('ar-YE')} <span className="text-base font-bold text-slate-500">ر.ي</span>
                        </span>
                    </div>
                </div>

                {/* Transfer Instructions Card */}
                <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                            <Building2 size={20} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800">تعليمات التحويل</h2>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                        للبدء في المشروع، يرجى تحويل مبلغ المشروع عبر بنك الكريمي أو شبكات الصرافة المحلية أو المحافظ الإلكترونية إلى البيانات التالية:
                    </p>

                    <div className="space-y-4 bg-amber-50/70 rounded-xl p-5 border border-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm shrink-0">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-700/70">المسؤول المالي</p>
                                <p className="text-sm font-black text-slate-800">اسامة حلمي علي الدبعي</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm shrink-0">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-700/70">رقم الهاتف / الحساب</p>
                                <p className="text-lg font-black text-slate-800 tracking-wider" dir="ltr">775663444</p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-5 text-sm text-slate-600 leading-relaxed">
                        بعد إتمام التحويل، قم بإرفاق صورة السند أو الإيصال أدناه.
                    </p>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">

                    {/* Payment Method Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">طريقة الدفع</label>
                        <div className="relative">
                            <select
                                value={data.payment_method}
                                onChange={(e) => setData('payment_method', e.target.value)}
                                required
                                className={`w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm appearance-none cursor-pointer pl-10 ${
                                    !data.payment_method ? 'text-slate-400 font-medium' : 'text-slate-800 font-bold'
                                }`}
                            >
                                <option value="" disabled hidden>
                                    اختر طريقة الدفع
                                </option>
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method.value} value={method.value} className="text-slate-800 font-bold">
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-slate-400">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                        {errors.payment_method && <p className="text-red-500 text-xs">{errors.payment_method}</p>}
                    </div>

                    {/* Receipt Upload Area */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">صورة السند / الإيصال</label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleFileChange(file);
                            }}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer text-center transition-all ${
                                dragOver
                                    ? 'border-amber-500 bg-amber-50'
                                    : data.receipt
                                        ? 'border-green-300 bg-green-50/30'
                                        : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/30'
                            }`}
                            onClick={() => document.getElementById('receipt-input').click()}
                        >
                            {data.receipt ? (
                                <div className="flex flex-col items-center gap-3">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="معاينة الإيصال" className="max-h-40 rounded-xl shadow-md" />
                                    ) : (
                                        <FileImage size={48} className="text-green-500" />
                                    )}
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-bold">{data.receipt.name}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">انقر لاختيار ملف آخر</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Upload size={40} className="text-slate-300" />
                                    <p className="text-sm font-bold text-slate-500">اسحب الصورة هنا أو انقر للاختيار</p>
                                    <p className="text-xs text-slate-400">JPG, PNG, PDF — حتى 50 ميجابايت</p>
                                </div>
                            )}
                        </div>
                        <input
                            id="receipt-input"
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0])}
                        />
                        {errors.receipt && <p className="text-red-500 text-xs">{errors.receipt}</p>}
                    </div>

                    {/* Upload Progress */}
                    {progress && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>جاري الرفع...</span>
                                <span>{progress.percentage}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Important Note */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>ملاحظة:</strong> بمجرد رفع الإيصال، سيتم تفعيل المشروع تلقائياً وسيتمكن الخبير من البدء في العمل.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing || !data.receipt || !data.payment_method}
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-amber-200/50"
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                جاري التأكيد...
                            </span>
                        ) : (
                            <>
                                <CheckCircle size={22} />
                                تأكيد الدفع وتفعيل المشروع
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
