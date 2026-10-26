import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  RefreshCcw,
  Calendar,
  Info,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Lock,
  X,
  Paperclip,
  AlertCircle,
  Clock,
  Download,
  Eye,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
  Layers,
} from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';
import ProposalDetailsModal from '../Components/ProposalDetailsModal';
import CompanyProfileModal from '../Components/CompanyProfileModal';

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let normalized = url.replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/');
  normalized = normalized.replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
  return normalized;
};

export default function ProjectWorkspace({ pageTitle, project }) {
  const { props } = usePage();
  const flash = props.flash ?? {};

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showReuploadForm, setShowReuploadForm] = useState(false);
  const fileInputRef = useRef(null);

  if (!project) return null;

  // Find active or first task to select initially
  const defaultTask =
    project.tasks?.find((t) => t.status === 'revision_requested') ||
    project.tasks?.find((t) => t.status === 'active') ||
    project.tasks?.[0] ||
    null;

  const [selectedTaskId, setSelectedTaskId] = useState(
    project.activeTaskId || defaultTask?.id || ''
  );

  const selectedTask =
    project.tasks?.find((t) => t.id === selectedTaskId) || defaultTask;

  const activeTask =
    project.tasks?.find(
      (t) => t.status === 'active' || t.status === 'revision_requested'
    ) ?? null;

  // Check if selected task is editable
  const isSelectedTaskEditable =
    selectedTask &&
    (selectedTask.status === 'active' ||
      selectedTask.status === 'revision_requested' ||
      (selectedTask.status === 'awaiting_review' && showReuploadForm));

  // ── Inertia useForm — forceFormData handles multipart file uploads ──────
  const { data, setData, post, processing, errors, progress, reset } = useForm({
    task_id: selectedTask?.id ?? '',
    file: null,
    external_link: '',
    notes: '',
  });

  // Sync task_id when selectedTask changes
  useEffect(() => {
    if (selectedTask?.id) {
      setData('task_id', selectedTask.id);
      setShowReuploadForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask?.id]);

  // Show floating toast when flash.success arrives
  useEffect(() => {
    if (flash.success) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash.success, props]);

  const handleFileSelect = (file) => {
    if (file) setData('file', file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!selectedTask) return;

    post(`/freelancer/projects/${project.id}/deliverables`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset('file', 'external_link', 'notes');
        setShowReuploadForm(false);
      },
    });
  };

  const clientAvatar = normalizeImageUrl(project.client?.avatar);
  const clientDisplayName = project.client?.name || 'شركة';

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-24 overflow-y-auto h-full bg-[#fcfcfd]" dir="rtl">
      <div className="max-w-6xl mx-auto text-start space-y-6">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/freelancer/projects"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors w-fit text-xs sm:text-sm font-semibold group cursor-pointer"
          >
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            <span>العودة لقائمة المشاريع</span>
          </Link>

          {/* Quick Chat with Client */}
          {project.chatId && (
            <Link
              href={`/freelancer/chat/${project.chatId}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#2a7de1] hover:border-blue-200 text-xs font-semibold shadow-2xs transition-all w-fit cursor-pointer"
            >
              <MessageSquare size={15} className="text-[#2a7de1]" />
              <span>محادثة العميل مباشرة</span>
            </Link>
          )}
        </div>

        {/* Flash Notifications */}
        {flash.error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-xs sm:text-sm font-semibold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{flash.error}</span>
          </div>
        )}

        {/* Floating Success Toast */}
        <div
          className={`fixed bottom-8 start-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out ${
            showToast && flash.success
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {flash.success && (
            <div className="bg-white border border-green-200 shadow-xl shadow-green-900/10 rounded-2xl p-4 pe-12 flex items-center gap-3 relative min-w-[320px]">
              <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">تم بنجاح</p>
                <p className="text-xs text-slate-500 font-medium">{flash.success}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="absolute inset-e-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Project Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Title & Scope */}
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                مساحة العمل التنفيذية
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold text-slate-800 leading-snug break-words">
                {project.title}
              </h1>
            </div>

            {/* Client Identity Pill (Clickable) */}
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(true)}
              className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer text-start shrink-0 group/client"
              title="عرض الملف التعريفي للشركة"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-2xs group-hover/client:border-[#2a7de1] transition-colors shrink-0">
                {clientAvatar ? (
                  <img
                    src={clientAvatar}
                    alt={clientDisplayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2a7de1] to-[#1f6fd4] text-white flex items-center justify-center font-semibold text-sm">
                    {clientDisplayName.charAt(0) || 'ش'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 group-hover/client:text-[#2a7de1] transition-colors block truncate">
                  {clientDisplayName}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block truncate">
                  {project.client?.city || 'اليمن'} (انقر للملف)
                </span>
              </div>
            </button>
          </div>

          {/* Quick Metrics & Escrow Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Escrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2a7de1] font-semibold">
              <ShieldCheck size={16} />
              <span>المبلغ مؤمن في الضمان ({project.projectValue} ر.ي)</span>
            </div>

            {/* Progress status */}
            <div className="flex items-center gap-3 font-semibold text-slate-600">
              <span>
                المراحل المكتملة: {project.completedTasks} من {project.totalTasks}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[#2a7de1]">{project.progress}% إنجاز</span>
            </div>
          </div>
        </div>

        {/* SECTION: Interactive Milestones Stepper & Selector */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers size={16} className="text-[#2a7de1]" />
              مسار مراحل المشروع (انقر على أي مرحلة لعرض تفاصيلها أو تسليمها):
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {project.tasks?.length} مراحل عمل
            </span>
          </div>

          {/* Steps Horizontal Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {project.tasks?.map((task, idx) => {
              const isSelected = selectedTask?.id === task.id;
              const isApproved = task.status === 'completed';
              const isAwaiting = task.status === 'awaiting_review';
              const isRevision = task.status === 'revision_requested';
              const isActive = task.status === 'active';
              const isLocked = task.status === 'locked';

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-start shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2a7de1] ring-2 ring-[#2a7de1]/15 bg-blue-50/50 shadow-2xs'
                      : isRevision
                      ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50'
                      : isAwaiting
                      ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* Step status circle */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      isApproved
                        ? 'bg-emerald-600 text-white'
                        : isRevision
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isAwaiting
                        ? 'bg-amber-500 text-white'
                        : isActive
                        ? 'bg-[#2a7de1] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 size={15} />
                    ) : isRevision ? (
                      <AlertCircle size={15} />
                    ) : isAwaiting ? (
                      <Clock size={15} />
                    ) : isLocked ? (
                      <Lock size={13} />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="min-w-0 max-w-[170px]">
                    <span className="text-xs font-semibold text-slate-800 truncate block">
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] font-medium block truncate ${
                        isApproved
                          ? 'text-emerald-700'
                          : isRevision
                          ? 'text-rose-700 font-semibold'
                          : isAwaiting
                          ? 'text-amber-700'
                          : isActive
                          ? 'text-[#2a7de1]'
                          : 'text-slate-400'
                      }`}
                    >
                      {isApproved
                        ? 'مكتمل ومعتمد'
                        : isRevision
                        ? 'مطلوب تعديل'
                        : isAwaiting
                        ? 'بانتظار المراجعة'
                        : isActive
                        ? 'المرحلة الحالية'
                        : 'مغلقة'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION: Two Columns (Main Deliverable Space & Proposal Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deliverables & Execution Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
              {/* Selected Milestone Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#2a7de1] text-xs font-semibold border border-blue-100">
                      تفاصيل المرحلة
                    </span>
                    {selectedTask?.status === 'completed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        معتمدة ومقبولة
                      </span>
                    )}
                    {selectedTask?.status === 'revision_requested' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-1">
                        <AlertCircle size={12} />
                        طلب العميل تعديلاً
                      </span>
                    )}
                    {selectedTask?.status === 'awaiting_review' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 flex items-center gap-1">
                        <Clock size={12} />
                        بانتظار المراجعة
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    {selectedTask?.title}
                  </h2>
                </div>

                {/* Switch to active task button if looking at other milestone */}
                {activeTask && selectedTask?.id !== activeTask.id && (
                  <button
                    type="button"
                    onClick={() => setSelectedTaskId(activeTask.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#2a7de1] text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    الانتقال للمرحلة الحالية المفتوحة
                  </button>
                )}
              </div>

              {/* Revision Request Feedback Banner */}
              {selectedTask?.status === 'revision_requested' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle size={16} className="text-rose-600 shrink-0" />
                      ملاحظات وتوجيهات العميل للتعديل المطلوبة:
                    </span>
                    {selectedTask.remainingRevisions !== undefined && (
                      <span className="bg-white/80 px-2.5 py-0.5 rounded-lg border border-rose-200 text-[11px]">
                        المراجعات المتبقية: {selectedTask.remainingRevisions}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed bg-white/60 p-3 rounded-xl border border-rose-100">
                    {selectedTask.clientFeedback || 'لم يقم العميل بكتابة ملاحظات تفصيلية، يرجى التواصل معه لمعرفة التفاصيل.'}
                  </p>
                </div>
              )}

              {/* Previous Submission Box (If any file or link was uploaded for this task) */}
              {(selectedTask?.filePath || selectedTask?.externalLink) && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileText size={15} className="text-[#2a7de1]" />
                      الملف والمرفقات المسلمة لهذه المرحلة:
                    </span>
                    {selectedTask.submittedAt && (
                      <span className="text-[11px] font-medium text-slate-400">
                        تاريخ الرفع: {selectedTask.submittedAt}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Attachment Card */}
                    {selectedTask.filePath && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2a7de1] flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate" dir="ltr">
                              {selectedTask.fileName || 'ملف التسليم'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">مرفق منجز</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {selectedTask.viewUrl && (
                            <a
                              href={selectedTask.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#2a7de1] hover:bg-slate-50 transition-colors"
                              title="معاينة الملف"
                            >
                              <Eye size={15} />
                            </a>
                          )}
                          {selectedTask.downloadUrl && (
                            <a
                              href={selectedTask.downloadUrl}
                              download
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#2a7de1] hover:bg-slate-50 transition-colors"
                              title="تحميل الملف"
                            >
                              <Download size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* External Link Card */}
                    {selectedTask.externalLink && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <LinkIcon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate" dir="ltr">
                              {selectedTask.externalLink}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">رابط خارجي</span>
                          </div>
                        </div>

                        <a
                          href={selectedTask.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors shrink-0"
                          title="فتح الرابط"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Previous Notes */}
                  {selectedTask.notes && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                        ملاحظات التسليم السابقة:
                      </span>
                      <p className="text-xs font-normal text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                        {selectedTask.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Message for Completed / Locked Stages */}
              {selectedTask?.status === 'completed' && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-1">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                  <p className="text-sm font-semibold">تم اعتماد وقبول هذه المرحلة بنجاح</p>
                  <p className="text-xs text-emerald-600 font-medium">
                    تم إنجاز كافة متطلبات هذه المرحلة وتحويل مستحقاتها المالية.
                  </p>
                </div>
              )}

              {selectedTask?.status === 'locked' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-center space-y-1">
                  <Lock size={24} className="mx-auto text-slate-400" />
                  <p className="text-sm font-semibold">هذه المرحلة مغلقة حالياً</p>
                  <p className="text-xs text-slate-400 font-medium">
                    سيتم تفعيل هذه المرحلة تلقائياً بمجرد إنجاز واعتماد المراحل السابقة لها.
                  </p>
                </div>
              )}

              {/* If Awaiting Review & Not Showing Reupload Form */}
              {selectedTask?.status === 'awaiting_review' && !showReuploadForm && (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-center space-y-3">
                  <Clock size={24} className="mx-auto text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold">تم رفع التسليم وهو بانتظار مراجعة العميل</p>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      يقوم العميل حالياً بمراجعة الملفات المرفقة واعتماد التسليم.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReuploadForm(true)}
                    className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-amber-800 hover:bg-amber-100/50 transition-colors cursor-pointer"
                  >
                    تعديل المرفق أو رفع نسخة جديدة
                  </button>
                </div>
              )}

              {/* Submission Form (Shown if Task is Editable) */}
              {isSelectedTaskEditable && (
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Upload size={16} className="text-[#2a7de1]" />
                      <span>
                        {selectedTask?.status === 'revision_requested'
                          ? 'رفع النسخة المعدلة للتسليم'
                          : selectedTask?.status === 'awaiting_review'
                          ? 'تحديث تسليم المرحلة'
                          : 'رفع تسليم المرحلة الحالية'}
                      </span>
                    </h3>

                    {selectedTask?.status === 'awaiting_review' && showReuploadForm && (
                      <button
                        type="button"
                        onClick={() => setShowReuploadForm(false)}
                        className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  {/* Drag and drop upload zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer text-center transition-all ${
                      dragOver
                        ? 'border-[#2a7de1] bg-blue-50/40'
                        : data.file
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-200 bg-slate-50/60 hover:border-[#2a7de1] hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.zip,.rar,.fig,.sketch,.png,.jpg,.jpeg,.webp,.mp4,.mov,.ai,.psd,.docx,.xlsx,.pptx"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />

                    {data.file ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 break-all">
                            {data.file.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {(data.file.size / (1024 * 1024)).toFixed(2)} ميجابايت - جاهز للإرسال
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setData('file', null);
                          }}
                          className="mt-1 px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X size={13} />
                          <span>إلغاء هذا الملف</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#2a7de1] shadow-2xs mb-3 group-hover:scale-105 transition-transform">
                          <Upload size={22} />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                          اسحب وأفلت الملف هنا، أو انقر للتصفح من جهازك
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          يدعم (PDF, ZIP, FIG, PSD, MP4, والصور) بحجم أقصى 50MB
                        </p>
                      </>
                    )}

                    {/* Progress Bar */}
                    {progress && (
                      <div className="w-full mt-4 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#2a7de1] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {errors.file && <p className="text-red-500 text-xs font-medium">{errors.file}</p>}

                  {/* External Link Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <LinkIcon size={14} className="text-slate-400" />
                      <span>رابط خارجي للعمل (اختياري - Figma, Google Drive, Notion, GitHub):</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={data.external_link}
                      onChange={(e) => setData('external_link', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-xs sm:text-sm font-medium placeholder-slate-400"
                      dir="ltr"
                    />
                    {errors.external_link && (
                      <p className="text-red-500 text-xs font-medium">{errors.external_link}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      ملاحظات التسليم والشرح للعميل:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="صف ما قمت بتنفيذه في هذه المرحلة، وأي ملاحظات تود أن ينتبه لها العميل أثناء المراجعة..."
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all text-xs sm:text-sm font-medium placeholder-slate-400 resize-none leading-relaxed"
                    />
                    {errors.notes && (
                      <p className="text-red-500 text-xs font-medium">{errors.notes}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={processing || (!data.file && !data.external_link)}
                      className="w-full py-3 px-5 bg-[#2a7de1] hover:bg-[#1f6fd4] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Send size={16} />
                      <span>
                        {processing
                          ? progress
                            ? `جاري الرفع... ${progress.percentage}%`
                            : 'جاري الإرسال...'
                          : selectedTask?.status === 'revision_requested'
                          ? 'إرسال النسخة المعدلة للعميل'
                          : 'إرسال تسليم المرحلة للعميل'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar: Approved Proposal Summary (1 Col) */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Briefcase size={16} className="text-[#2a7de1]" />
                <span>تفاصيل العقد والاتفاق</span>
              </h3>

              {project.originalProposal && (
                <div className="space-y-4">
                  <SummaryItem
                    icon={<FileText size={16} className="text-slate-400" />}
                    label="نطاق العمل المتفق عليه"
                    value={project.originalProposal.title}
                  />
                  <SummaryItem
                    icon={<RefreshCcw size={16} className="text-slate-400" />}
                    label="سياسة التعديلات المسموحة"
                    value={project.originalProposal.revisions}
                  />
                  <SummaryItem
                    icon={<Calendar size={16} className="text-slate-400" />}
                    label="مدة التسليم المتفق عليها"
                    value={project.originalProposal.timeline}
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(true)}
                  disabled={!project.rawProposal && !project.originalProposal}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-[#2a7de1] text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FileText size={15} />
                  <span>عرض وثيقة العرض المالي الكاملة</span>
                </button>
              </div>
            </div>

            {/* Help / Guidance Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
              <Info size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                تأكد من تسليم كل مرحلة بشكل متكامل ومراجعة الملاحظات بدقة لضمان سرعة اعتماد التسليم وتحويل مستحقاتك المالية.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Proposal Details Modal */}
      {isProposalModalOpen && (project.rawProposal || project.originalProposal) && (
        <ProposalDetailsModal
          proposal={project.rawProposal ?? project.originalProposal}
          onClose={() => setIsProposalModalOpen(false)}
        />
      )}

      {/* Company Profile Modal */}
      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        company={project.client}
        companyId={project.client?.id}
        onClose={() => setIsCompanyModalOpen(false)}
      />
    </div>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <span className="text-[11px] font-medium text-slate-400 block mb-0.5">{label}</span>
        <p className="text-xs font-semibold text-slate-800 leading-snug break-words">{value}</p>
      </div>
    </div>
  );
}
