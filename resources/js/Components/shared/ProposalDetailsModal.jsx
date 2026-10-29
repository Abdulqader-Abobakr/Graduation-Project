import React, { useEffect } from 'react';
import {
  FileText,
  X,
  DollarSign,
  Clock,
  RotateCcw,
  Calendar,
  Info
} from 'lucide-react';

export default function ProposalDetailsModal({ proposal, onClose, onAccept, onChat, onDeny, onViewFreelancer, processing = false }) {
  useEffect(() => {
    if (!proposal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [proposal, onClose]);

  if (!proposal) return null;

  // Exact Eloquent DB attributes + Fallback mappings
  const title = proposal.title || proposal.project?.title || proposal.brief?.title || proposal.subject || 'عرض مالي بدون عنوان';
  const totalPrice = proposal.price ?? proposal.total_price ?? proposal.totalPrice ?? proposal.amount ?? 0;
  const timeline = proposal.timeline || proposal.duration || (proposal.delivery_days ? `${proposal.delivery_days} أيام` : 'حسب الاتفاق');
  const revisions = proposal.revision_limit ?? proposal.revisions ?? proposal.revisions_count ?? 'غير محدد';
  const validity = proposal.validity || (proposal.valid_until ? `حتى ${proposal.valid_until}` : '7 أيام');
  const additionalTerms = proposal.additional_terms || proposal.additionalTerms || proposal.notes || null;
  const milestones = proposal.milestones || proposal.deliverables || [];
  const isPending = !proposal.status || proposal.status === 'pending';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-start">
        {/* Header */}
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 rounded-t-3xl">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="text-[#2a7de1]" />
            تفاصيل العرض المالي
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-10 flex-1">
          {/* Part 1: Basic Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
              <FileText size={18} className="text-[#2a7de1]" />
              <h2 className="text-sm font-bold uppercase tracking-wider">تفاصيل العرض والمراحل</h2>
            </div>

            {proposal.freelancerName && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">مقدم العرض:</span>
                  {onViewFreelancer ? (
                    <button
                      type="button"
                      onClick={() => onViewFreelancer(proposal.freelancerId || proposal.freelancer_id || proposal.freelancer?.id)}
                      className="text-sm font-bold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
                      title="عرض الملف الشخصي للخبير"
                    >
                      <span>{proposal.freelancerName}</span>
                      <span className="text-xs text-slate-400 font-normal">(عرض الملف الشخصي)</span>
                    </button>
                  ) : (
                    <span className="text-sm font-bold text-slate-800">{proposal.freelancerName}</span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">عنوان العرض</label>
              <p className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
                {title}
              </p>
            </div>

            {/* Milestones */}
            <div className="space-y-4 pt-4">
              <label className="text-sm font-bold text-slate-700 block mb-4">مراحل العمل والتسليمات</label>

              {milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id || index} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-slate-800 bg-[#2a7de1]/10 px-3 py-1.5 rounded-lg border border-[#2a7de1]/20">
                          المرحلة {index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">
                          {milestone.title || milestone.name}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {milestone.description || milestone.details || 'لا يوجد وصف للمرحلة'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center text-slate-400 text-sm">
                  لم يتم تحديد مراحل عمل منفصلة لهذا العرض.
                </div>
              )}
            </div>
          </div>

          {/* Part 2: Cost & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <DollarSign size={18} className="text-[#2a7de1]" />
                <h2 className="text-sm font-bold uppercase tracking-wider">التكلفة والمدة الإجمالية</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">السعر الإجمالي</label>
                  <p className="font-black text-xl text-slate-700">{totalPrice} ر.ي</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">مدة التسليم الكلية</label>
                  <p className="font-bold text-slate-700 flex items-center gap-2 mt-1">
                    <Clock size={16} className="text-slate-400" />
                    {timeline}
                  </p>
                </div>
              </div>
            </div>

            {/* Part 3: Conditions */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <Info size={18} className="text-[#2a7de1]" />
                <h2 className="text-sm font-bold uppercase tracking-wider">الشروط والصلاحية</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">عدد التعديلات المسموحة (للمشروع كامل)</label>
                  <p className="font-bold text-slate-700 flex items-center gap-2 mt-1">
                    <RotateCcw size={16} className="text-slate-400" />
                    {revisions}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">صلاحية العرض</label>
                  <p className="font-bold text-slate-700 flex items-center gap-2 mt-1">
                    <Calendar size={16} className="text-slate-400" />
                    {validity}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Part 4: Additional Terms */}
          {additionalTerms && (
            <div className="space-y-4 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider">الشروط الإضافية</h2>
              </div>
              <p className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700">
                {additionalTerms}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-slate-100 bg-slate-50 text-end shrink-0 rounded-b-3xl">
          {(onAccept || onChat || onDeny) && (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-start">
              {onAccept && (
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={processing || !isPending}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  قبول العرض
                </button>
              )}
              {onChat && (
                <button
                  type="button"
                  onClick={onChat}
                  disabled={processing}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f6fd4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  مناقشة العرض
                </button>
              )}
              {onDeny && (
                <button
                  type="button"
                  onClick={onDeny}
                  disabled={processing || !isPending}
                  className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  رفض العرض
                </button>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
