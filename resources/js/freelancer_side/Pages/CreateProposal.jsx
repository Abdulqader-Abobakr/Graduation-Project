import { useState, useEffect } from 'react';
import {
  ChevronRight,
  FileText,
  DollarSign,
  Clock,
  RotateCcw,
  Calendar,
  Send,
  User,
  Info,
  Trash2,
  Plus
} from 'lucide-react';
import { useForm, Link } from '@inertiajs/react';

const CreateProposal = ({ chatId, clientName, clientRequest, proposalId, initialData }) => {
  const isEditing = Boolean(proposalId);
  const { data, setData, post, put, processing, errors } = useForm(initialData || {
    title: '',
    price: '',
    timeline: '',
    revision_limit: '2',
    validity: '7 أيام',
    additional_terms: '',
    milestones: [{ id: Date.now(), title: '', description: '' }]
  });

  const addMilestone = () => {
    setData('milestones', [...data.milestones, { id: Date.now(), title: '', description: '' }]);
  };

  const removeMilestone = (milestoneId) => {
    if (data.milestones.length > 1) {
      setData('milestones', data.milestones.filter(m => m.id !== milestoneId));
    }
  };

  const updateMilestone = (milestoneId, field, value) => {
    setData('milestones', data.milestones.map(m => m.id === milestoneId ? { ...m, [field]: value } : m));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submit = isEditing ? put : post;
    const url = isEditing
      ? `/freelancer/proposals/${proposalId}`
      : `/freelancer/proposals/create/${chatId}`;

    submit(url, {
      preserveScroll: true,
    });
  };

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full bg-gray-50" dir="rtl">
      {/* SECTION 1: Header & Context */}
      <header className="max-w-4xl mx-auto mb-8 text-start">
        <Link
          href="/freelancer/proposals"
          prefetch="hover"
          preserveScroll
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 group"
        >
          <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
          <span className="text-sm font-bold">العودة للمحادثة</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{isEditing ? 'تعديل عرض السعر' : 'إنشاء عرض سعر'}</h1>
            <p className="text-slate-500 text-sm">{isEditing ? 'عدّل العرض قبل أن يراجعه العميل.' : 'أرسل عرضاً نهائياً بناءً على ما تم الاتفاق عليه في المحادثة.'}</p>
          </div>

          {/* Client Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[320px]">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
              <User size={24} />
            </div>
            <div className="min-w-0 text-start">
              <h3 className="font-bold text-slate-800 truncate">{clientName}</h3>
              <p className="text-[11px] text-slate-500 font-medium">بناءً على طلب: <span className="text-slate-700">{clientRequest}</span></p>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 2: The Proposal Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden text-start">

          <div className="p-8 space-y-10">

            {/* Part 1: Basic Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <FileText size={18} className="text-slate-700" />
                <h2 className="text-sm font-bold uppercase tracking-wider">تفاصيل العرض والمراحل</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">عنوان العرض</label>
                <input
                  type="text"
                  required
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="مثال: تصميم هوية بصرية كاملة مع بوسترات السوشيال ميديا"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm font-medium"
                />
                {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
              </div>

              {/* Dynamic Milestone Builder */}
              <div className="space-y-4 pt-4">
                <label className="text-sm font-bold text-slate-700 block">مراحل العمل والتسليمات (Milestones)</label>
                <p className="text-xs text-slate-500 mb-4">قسّم مشروعك إلى مراحل واضحة. ستتحول هذه المراحل تلقائياً إلى مهام في مساحة عمل المشروع.</p>

                <div className="space-y-4">
                  {data.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 relative group shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700 bg-primary/10 px-3 py-1.5 rounded-lg">
                            المرحلة {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            (تمثل {Math.round(100 / data.milestones.length)}% من قيمة المشروع)
                          </span>
                        </div>
                        {data.milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="عنوان المرحلة (مثال: تصميم الواجهات المبدئية)"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm font-bold"
                        />
                        {errors[`milestones.${index}.title`] && <p className="text-red-500 text-xs">{errors[`milestones.${index}.title`]}</p>}
                      </div>

                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          required
                          placeholder="وصف تفصيلي لما سيتم إنجازه وتسليمه في هذه المرحلة للعميل..."
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm resize-none leading-relaxed"
                        />
                        {errors[`milestones.${index}.description`] && <p className="text-red-500 text-xs">{errors[`milestones.${index}.description`]}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMilestone}
                  className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold text-sm hover:border-primary hover:text-slate-700 transition-all flex items-center justify-center gap-2 bg-slate-50 hover:bg-primary/5"
                >
                  <Plus size={18} />
                  إضافة مرحلة تسليم جديدة
                </button>
                {errors.milestones && <p className="text-red-500 text-xs">{errors.milestones}</p>}
              </div>
            </div>

            {/* Part 2: Cost & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                  <DollarSign size={18} className="text-slate-700" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">التكلفة والمدة الإجمالية</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">السعر الإجمالي (ر.ي)</label>
                    <div className="relative">
                      <span className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ر.ي</span>
                      <input
                        type="number"
                        required
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                        placeholder="0.00"
                        className="w-full ps-10 pe-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-bold text-lg"
                      />
                    </div>
                    {errors.price && <p className="text-red-500 text-xs">{errors.price}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">مدة التسليم الكلية</label>
                    <div className="relative">
                      <select
                        required
                        value={data.timeline}
                        onChange={(e) => setData('timeline', e.target.value)}
                        className="w-full ps-12 pe-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="">اختر مدة التنفيذ</option>
                        <option value="3 أيام">3 أيام</option>
                        <option value="أسبوع واحد">أسبوع واحد</option>
                        <option value="أسبوعين">أسبوعين</option>
                        <option value="شهر واحد">شهر واحد</option>
                        <option value="أكثر من شهر">أكثر من شهر</option>
                      </select>
                      <Clock size={18} className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                    {errors.timeline && <p className="text-red-500 text-xs">{errors.timeline}</p>}
                  </div>
                </div>
              </div>

              {/* Part 3: Conditions */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                  <Info size={18} className="text-slate-700" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">الشروط والصلاحية</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">عدد التعديلات المسموحة</label>
                    <div className="relative">
                      <select
                        value={data.revision_limit}
                        onChange={(e) => setData('revision_limit', e.target.value)}
                        className="w-full ps-12 pe-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="0">بدون تعديلات</option>
                        <option value="1">تعديل واحد</option>
                        <option value="2">تعديلين</option>
                        <option value="3">3 تعديلات</option>
                        <option value="-1">تعديلات غير محدودة</option>
                      </select>
                      <RotateCcw size={18} className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                    {errors.revision_limit && <p className="text-red-500 text-xs">{errors.revision_limit}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">صلاحية العرض</label>
                    <div className="relative">
                      <select
                        value={data.validity}
                        onChange={(e) => setData('validity', e.target.value)}
                        className="w-full ps-12 pe-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="3 أيام">3 أيام</option>
                        <option value="7 أيام">7 أيام</option>
                        <option value="14 يوم">14 يوم</option>
                        <option value="30 يوم">30 يوم</option>
                      </select>
                      <Calendar size={18} className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                    {errors.validity && <p className="text-red-500 text-xs">{errors.validity}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Part 4: Additional Terms */}
            <div className="space-y-4 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider">الشروط الإضافية (اختياري)</h2>
              </div>
              <textarea
                rows={3}
                value={data.additional_terms}
                onChange={(e) => setData('additional_terms', e.target.value)}
                placeholder="أضف أي شروط خاصة بالدفعات، حقوق الملكية، أو سياسات الإلغاء..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-sm resize-none"
              />
              {errors.additional_terms && <p className="text-red-500 text-xs">{errors.additional_terms}</p>}
            </div>

          </div>

          {/* SECTION 3: Action Footer */}
          <footer className="bg-slate-50/50 border-t border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link
              href="/freelancer/proposals"
              className="px-10 py-4 text-slate-400 hover:text-red-500 font-bold transition-colors order-2 md:order-1 text-center"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={processing}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-[#1f6fd4] transition-all hover:scale-[1.02] active:scale-[0.98] order-1 md:order-2 group disabled:opacity-70 disabled:pointer-events-none"
            >
              {processing ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إرسال العرض للعميل'}
              <Send size={20} className="rotate-180 transition-transform group-hover:-translate-x-1" />
            </button>
          </footer>

        </div>
      </form>

      {/* Helper Warning Tip */}
      <div className="max-w-4xl mx-auto mt-8 flex items-start gap-3 p-4 bg-[#ffb548]/10 border border-[#ffb548]/20 rounded-2xl">
        <Info size={20} className="text-slate-700 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-700 leading-relaxed text-start">
          <strong>نصيحة:</strong> تأكد من أن مراحل العمل واضحة ومفصلة. بمجرد إرسال العرض وقبوله من العميل، ستتحول هذه المراحل تلقائياً إلى مهام تسليم في مساحة عمل المشروع الخاصة بك.
        </p>
      </div>
    </div>
  );
};

export default CreateProposal;
