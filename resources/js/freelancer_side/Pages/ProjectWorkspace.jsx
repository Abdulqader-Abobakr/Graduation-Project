import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  RefreshCcw,
  Calendar,
  Info,
  Briefcase,
  ChevronRight,
  Lock,
  X,
  Paperclip,
  AlertCircle,
  Clock, // Added Clock
} from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';
import ProposalDetailsModal from '../Components/ProposalDetailsModal';

const ProjectWorkspace = ({ pageTitle, project }) => {
  const { props } = usePage();
  const flash = props.flash ?? {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef(null);

  if (!project) return null;

  const activeTask = project.tasks?.find(t => t.status === 'active') ?? null;
  const activeTaskIndex = project.tasks?.findIndex(t => t.status === 'active') ?? -1;

  // ── Inertia useForm — forceFormData handles multipart file uploads ──────
  const { data, setData, post, processing, errors, progress, reset } = useForm({
    task_id: activeTask?.id ?? '',
    file: null,
    external_link: '',
    notes: '',
  });

  // Sync task_id when the activeTask changes (e.g. after redirect back)
  useEffect(() => {
    if (activeTask?.id && data.task_id !== activeTask.id) {
      setData('task_id', activeTask.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTask?.id]);

  // Show floating toast when flash.success arrives
  useEffect(() => {
    if (flash.success) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [flash.success, props]); // Added props to dependency array to trigger on new Inertia visits even if string is identical

  const handleFileSelect = (file) => {
    if (file) setData('file', file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = () => {
    if (!activeTask) return;
    // Ensure task_id is always current before submit
    post(`/freelancer/projects/${project.id}/deliverables`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset('file', 'external_link', 'notes');
      },
    });
  };

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full bg-[#fcfcfd]" dir="rtl">
      <div className="max-w-6xl mx-auto text-start">

        {/* Back Button */}
        <Link
          href="/freelancer/projects"
          prefetch="hover"
          preserveScroll
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 group w-fit"
        >
          <ChevronRight size={20} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-bold">العودة للمشاريع</span>
        </Link>

        {/* Flash Error Message (Static) */}
        {flash.error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm font-bold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{flash.error}</span>
          </div>
        )}

        {/* Floating Success Toast */}
        <div
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${showToast && flash.success
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
            }`}
        >
          {flash.success && (
            <div className="bg-white border border-green-200 shadow-2xl shadow-green-900/10 rounded-2xl p-4 pr-5 pl-12 flex items-center gap-4 relative min-w-[320px]">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">عملية ناجحة</p>
                <p className="text-xs font-bold text-slate-500 mt-0.5">{flash.success}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-[#2a7de1] to-[#2a7de1] bg-clip-text text-transparent flex items-center gap-3">
            <span className="w-2 h-8 bg-gradient-to-br from-[#2a7de1] to-[#2a7de1] rounded-full"></span>
            مساحة عمل المشروع: {project.title}
          </h2>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowRight size={24} className="rotate-180" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-10 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            {project.tasks?.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isAwaiting = task.status === 'awaiting_review';
              const isActive = task.status === 'active';
              return (
                <div key={task.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isCompleted ? 'bg-green-100 text-green-600' :
                        isAwaiting ? 'bg-[#ffb548]/20 text-[#d98b20]' :
                          isActive ? 'bg-[#2a7de1] text-white shadow-lg shadow-[#2a7de1]/20' :
                            'bg-slate-100 text-slate-400'
                      }`}>
                      {isCompleted ? <CheckCircle2 size={20} /> : isAwaiting ? <Clock size={18} /> : isActive ? (idx + 1) : <Lock size={16} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isActive || isAwaiting ? 'text-slate-800' : 'text-slate-500'}`}>{task.title}</p>
                      <p className={`text-[11px] font-medium ${isAwaiting ? 'text-[#d98b20]' : 'text-slate-400'}`}>
                        {isCompleted ? 'مكتمل' : isAwaiting ? 'بانتظار المراجعة' : isActive ? 'جاري العمل' : 'مغلق'}
                      </p>
                    </div>
                  </div>
                  {idx < project.tasks.length - 1 && (
                    <div className={`w-12 h-0.5 rounded-full ${isCompleted || isAwaiting ? 'bg-green-200' : 'bg-slate-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Escrow Banner */}
        <div className="bg-gradient-to-br from-[#2a7de1] via-[#2a7de1]/80 to-[#2a7de1] rounded-2xl p-5 mb-10 flex items-start sm:items-center gap-3 shadow-lg shadow-[#2a7de1]/20">
          <CheckCircle2 size={20} className="text-teal-300 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-white font-bold text-sm leading-relaxed">
            تم تأمين المبلغ ({project.projectValue} ر.ي) في حساب الضمان (Escrow). يمكنك البدء بالعمل بأمان.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left (2/3): Deliverables Form ───────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-8">
              <h3 className="text-xl font-bold border-b border-slate-50 pb-4">
                التسليمات والمرفقات
                {activeTask && (
                  <span className="text-slate-700 block mt-2 text-sm font-bold bg-[#2a7de1]/5 w-fit px-3 py-1 rounded-md">
                    رفع تسليمات المهمة: {activeTask.title}
                  </span>
                )}
              </h3>

              {/* ── Drag & Drop Area ── */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer text-center transition-all ${dragOver
                    ? 'border-[#2a7de1] bg-[#2a7de1]/5'
                    : 'border-slate-200 bg-slate-50/50 hover:border-[#2a7de1]'
                  }`}
              >
                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.zip,.fig,.sketch,.png,.jpg,.jpeg,.webp,.mp4,.mov"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />

                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-700 shadow-md group-hover:scale-110 transition-transform mb-4">
                  <Upload size={32} />
                </div>

                {data.file ? (
                  <div className="flex items-center gap-2 text-[#2a7de1] font-bold text-sm">
                    <Paperclip size={16} />
                    <span>{data.file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setData('file', null); }}
                      className="ml-1 text-red-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-700 mb-1">اسحب وأفلت الملفات هنا</p>
                    <p className="text-xs text-slate-400">أو انقر لاختيار ملفات من جهازك (PDF, ZIP, FIG, Max 50MB)</p>
                  </>
                )}

                {/* Upload progress bar */}
                {progress && (
                  <div className="w-full mt-4 bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-[#2a7de1] h-1.5 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                )}
              </div>
              {errors.file && <p className="text-red-500 text-xs -mt-4">{errors.file}</p>}

              {/* ── External Link ── */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <LinkIcon size={16} className="text-slate-400" />
                  رابط خارجي (Figma, Notion, Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={data.external_link}
                  onChange={e => setData('external_link', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/15 focus:border-[#2a7de1] transition-all text-sm font-medium"
                />
                {errors.external_link && <p className="text-red-500 text-xs">{errors.external_link}</p>}
              </div>

              {/* ── Delivery Notes ── */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">ملاحظات التسليم</label>
                <textarea
                  rows={6}
                  placeholder="اكتب ملاحظاتك للعميل حول هذا التسليم..."
                  value={data.notes}
                  onChange={e => setData('notes', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/15 focus:border-[#2a7de1] transition-all text-sm resize-none"
                />
                {errors.notes && <p className="text-red-500 text-xs">{errors.notes}</p>}
              </div>

              {/* ── Submit Button ── */}
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!activeTask || processing}
                  className={`w-full py-5 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${activeTask && !processing
                      ? 'bg-gradient-to-r from-[#2a7de1] to-[#1f6fd4] shadow-md shadow-[#2a7de1]/20 hover:from-[#2a7de1] hover:to-[#2a7de1] active:scale-[0.98]'
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                    }`}
                >
                  {processing
                    ? (progress ? `جاري الرفع... ${progress.percentage}%` : 'جاري الإرسال...')
                    : activeTask
                      ? 'إرسال التسليم للعميل'
                      : 'المشروع مكتمل'
                  }
                  <ArrowRight size={22} className="rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Right (1/3): Proposal Summary Sidebar ──────────────── */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-50 pb-4">تفاصيل العرض المعتمد</h3>

              {project.originalProposal && (
                <div className="space-y-5">
                  <SummaryItem
                    icon={<Briefcase size={18} className="text-slate-400" />}
                    label="نطاق العمل المتفق عليه"
                    value={project.originalProposal.title}
                  />
                  <SummaryItem
                    icon={<RefreshCcw size={18} className="text-slate-400" />}
                    label="المراجعات المتفق عليها"
                    value={project.originalProposal.revisions}
                  />
                  <SummaryItem
                    icon={<Calendar size={18} className="text-slate-400" />}
                    label="المدة الزمنية للتسليم"
                    value={project.originalProposal.timeline}
                  />
                </div>
              )}

              <div className="h-[1px] bg-slate-50 my-6" />

              {/* ── Open ProposalDetailsModal ── */}
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!project.rawProposal && !project.originalProposal}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-700 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText size={18} />
                عرض العرض المالي الأصلي
              </button>
            </div>

            {/* Help Tip */}
            <div className="p-5 bg-[#ffb548]/10 border border-[#ffb548]/20 rounded-2xl flex items-start gap-3">
              <Info size={18} className="text-slate-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                تأكد من مراجعة كافة المرفقات قبل الإرسال. بمجرد إرسال التسليم، سيتم إشعار العميل للمراجعة والاعتماد.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ProposalDetailsModal — receives rawProposal (raw DB fields) ── */}
      {isModalOpen && (project.rawProposal || project.originalProposal) && (
        <ProposalDetailsModal
          proposal={project.rawProposal ?? project.originalProposal}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const SummaryItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-slate-400 font-bold mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default ProjectWorkspace;
