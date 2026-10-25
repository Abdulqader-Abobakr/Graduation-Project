import React, { useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  RotateCcw,
  Calendar,
  Send,
  User,
  Info,
  Trash2,
  Plus,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useForm } from '@inertiajs/react';

export default function ProposalFormModal({
  isOpen = true,
  onClose,
  proposalId = null,
  briefId = null,
  chatId = null,
  clientName = '',
  clientRequest = '',
  initialData = null,
  onSuccess,
}) {
  const isEditing = Boolean(proposalId);
  const resolvedTitle = initialData?.title || clientRequest || 'عرض سعر تنفيذ المشروع';

  const { data, setData, post, put, processing, errors, reset } = useForm({
    title: resolvedTitle,
    price: initialData?.price || '',
    timeline: initialData?.timeline || 'أسبوعين',
    revision_limit: String(initialData?.revision_limit ?? '2'),
    validity: initialData?.validity || '7 أيام',
    additional_terms: initialData?.additional_terms || '',
    milestones:
      initialData?.milestones && initialData.milestones.length > 0
        ? initialData.milestones
        : [{ id: Date.now(), title: '', description: '' }],
  });

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addMilestone = () => {
    setData('milestones', [
      ...data.milestones,
      { id: Date.now(), title: '', description: '' },
    ]);
  };

  const removeMilestone = (milestoneId) => {
    if (data.milestones.length > 1) {
      setData(
        'milestones',
        data.milestones.filter((m) => m.id !== milestoneId)
      );
    }
  };

  const updateMilestone = (milestoneId, field, value) => {
    setData(
      'milestones',
      data.milestones.map((m) =>
        m.id === milestoneId ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submit = isEditing ? put : post;
    let url = '';
    if (isEditing) {
      url = `/freelancer/proposals/${proposalId}`;
    } else if (briefId) {
      url = `/freelancer/proposals/brief/${briefId}`;
    } else if (chatId) {
      url = `/freelancer/proposals/create/${chatId}`;
    } else {
      url = '/freelancer/proposals';
    }

    submit(url, {
      preserveScroll: true,
      onSuccess: () => {
        onClose?.();
        onSuccess?.();
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200 text-start overflow-hidden my-auto"
      >
        {/* Header */}
        <header className="px-6 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#2a7de1]/10 text-[#2a7de1] flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? 'تعديل عرض السعر' : 'إنشاء عرض سعر جديد'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {isEditing
                  ? 'عدّل تفاصيل ومراحل العرض قبل أن يقبله العميل'
                  : 'حدد مراحل العمل، التكلفة، والمدة لتقديم عرض احترافي'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X size={20} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 md:p-8 overflow-y-auto space-y-7 flex-1">
            {/* Context Card: Harmonious Client & Request details */}
            {(clientName || clientRequest) && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client item */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-[#2a7de1] flex items-center justify-center font-bold shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-400 block mb-0.5">العميل</span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                      {clientName || 'عميل منصة صلة'}
                    </h4>
                  </div>
                </div>

                {/* Request item */}
                {clientRequest && (
                  <div className="flex items-center gap-3 sm:border-r sm:border-slate-200/80 sm:pr-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-[#2a7de1] flex items-center justify-center font-bold shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-400 block mb-0.5">طلب المشروع</span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={clientRequest}>
                        {clientRequest}
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 1: Milestones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5 text-slate-800">
                  <Layers size={18} className="text-[#2a7de1]" />
                  <h3 className="text-sm sm:text-base font-bold">
                    مراحل العمل والتسليمات
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {data.milestones.length} مراحل
                </span>
              </div>

              <p className="text-sm text-slate-500 font-medium">
                قسّم مشروعك إلى مراحل واضحة ليسهل على العميل متابعة الإنجاز والاعتماد.
              </p>

              <div className="space-y-3.5">
                {data.milestones.map((milestone, index) => {
                  const sharePercentage = Math.round(100 / data.milestones.length);
                  return (
                    <div
                      key={milestone.id || index}
                      className="p-4 sm:p-5 border border-slate-200 rounded-2xl bg-white space-y-3.5 relative group hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm font-bold text-[#2a7de1] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                            المرحلة {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            (تمثل تقريباً {sharePercentage}% من قيمة المشروع)
                          </span>
                        </div>
                        {data.milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذه المرحلة"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <input
                          type="text"
                          required
                          placeholder="عنوان المرحلة (مثال: تسليم النماذج الأولية والتصاميم)"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-sm font-bold text-slate-800 placeholder-slate-400"
                        />
                        {errors[`milestones.${index}.title`] && (
                          <p className="text-red-500 text-xs font-medium">
                            {errors[`milestones.${index}.title`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          required
                          placeholder="تفاصيل ما سيتم تنفيذه وتسليمه في هذه المرحلة..."
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-sm font-medium text-slate-700 resize-none leading-relaxed placeholder-slate-400"
                        />
                        {errors[`milestones.${index}.description`] && (
                          <p className="text-red-500 text-xs font-medium">
                            {errors[`milestones.${index}.description`]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addMilestone}
                className="w-full py-3.5 border border-dashed border-slate-300 rounded-xl text-slate-700 font-bold text-sm hover:border-[#2a7de1] hover:text-[#2a7de1] hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                <span>إضافة مرحلة تسليم جديدة</span>
              </button>
              {errors.milestones && <p className="text-red-500 text-xs font-medium">{errors.milestones}</p>}
            </div>

            {/* Section 2: Cost & Timeline (2-col grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
              {/* Cost */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 block">
                  السعر الإجمالي (ر.ي) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                    ر.ي
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={data.price}
                    onChange={(e) => setData('price', e.target.value)}
                    placeholder="0.00"
                    className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all font-bold text-slate-900 text-base"
                  />
                </div>
                {errors.price && <p className="text-red-500 text-xs font-medium">{errors.price}</p>}
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 block">
                  مدة التنفيذ والتسليم <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={data.timeline}
                    onChange={(e) => setData('timeline', e.target.value)}
                    className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-sm font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="">اختر مدة التنفيذ</option>
                    <option value="3 أيام">3 أيام</option>
                    <option value="أسبوع واحد">أسبوع واحد</option>
                    <option value="أسبوعين">أسبوعين</option>
                    <option value="شهر واحد">شهر واحد</option>
                    <option value="أكثر من شهر">أكثر من شهر</option>
                  </select>
                  <Clock size={18} className="absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.timeline && <p className="text-red-500 text-xs font-medium">{errors.timeline}</p>}
              </div>

              {/* Revision Limit */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 block">
                  عدد التعديلات المسموحة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={data.revision_limit}
                    onChange={(e) => setData('revision_limit', e.target.value)}
                    placeholder="0"
                    className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all font-bold text-slate-900 text-base"
                  />
                  <RotateCcw size={18} className="absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.revision_limit && <p className="text-red-500 text-xs font-medium">{errors.revision_limit}</p>}
              </div>

              {/* Validity */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 block">
                  صلاحية العرض <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={data.validity}
                    onChange={(e) => setData('validity', e.target.value)}
                    className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-sm font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="3 أيام">3 أيام</option>
                    <option value="7 أيام">7 أيام</option>
                    <option value="14 يوم">14 يوم</option>
                    <option value="30 يوم">30 يوم</option>
                  </select>
                  <Calendar size={18} className="absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.validity && <p className="text-red-500 text-xs font-medium">{errors.validity}</p>}
              </div>
            </div>

            {/* Section 3: Additional Terms */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-800 block">
                الشروط الإضافية والملاحظات <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
              </label>
              <textarea
                rows={2}
                value={data.additional_terms}
                onChange={(e) => setData('additional_terms', e.target.value)}
                placeholder="أضف أي ملاحظات أو شروط تتعلق بتسليم الملفات، الدفعات، أو سياسات العمل..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-sm font-medium text-slate-700 resize-none leading-relaxed placeholder-slate-400"
              />
              {errors.additional_terms && <p className="text-red-500 text-xs font-medium">{errors.additional_terms}</p>}
            </div>

            {/* Tip banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
              <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
                <strong>ملاحظة هامة:</strong> بمجرد موافقة العميل على هذا العرض، ستتحول المراحل تلقائياً إلى مهام عمل تنفيذية في مساحة المشروع المشتركة.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="px-6 md:px-8 py-4 border-t border-slate-100 bg-slate-50/90 backdrop-blur-sm flex items-center justify-end shrink-0">
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-8 py-3 bg-[#2a7de1] hover:bg-[#1f6fd4] text-white rounded-xl text-sm sm:text-base font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-center"
            >
              {processing ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إرسال العرض للعميل'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
