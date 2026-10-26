import React, { useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  MessageSquare,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import CompanyProfileModal from '../Components/CompanyProfileModal';

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let normalized = url.replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/');
  normalized = normalized.replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
  return normalized;
};

export default function MyProjects({
  pageTitle,
  projects = [],
  search = '',
  activeFilter = 'all',
  onFilterChange,
}) {
  const [selectedCompany, setSelectedCompany] = React.useState(null);

  // Stats calculation based on actual projects data
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status !== 'completed').length;
    const revision = projects.filter((p) => Boolean(p.hasRevisionRequested)).length;
    const awaiting = projects.filter((p) => Boolean(p.hasAwaitingReview)).length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    return { total, active, revision, awaiting, completed };
  }, [projects]);

  // Filtering projects directly based on data fields present on page
  const filteredProjects = useMemo(() => {
    const q = (search || '').trim().toLowerCase();

    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.companyName?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return p.status !== 'completed';
      if (activeFilter === 'revision') return Boolean(p.hasRevisionRequested);
      if (activeFilter === 'awaiting') return Boolean(p.hasAwaitingReview);
      if (activeFilter === 'completed') return p.status === 'completed';
      return true;
    });
  }, [projects, search, activeFilter]);

  const handleCardFilterClick = (filterKey) => {
    if (onFilterChange) {
      onFilterChange(activeFilter === filterKey ? 'all' : filterKey);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-24 overflow-y-auto h-full bg-[#fcfcfd]" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 text-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 flex items-center gap-3">
              <span className="w-2.5 h-8 bg-[#2a7de1] rounded-full inline-block"></span>
              {pageTitle || 'مشاريعي'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              متابعة وإدارة مراحل مشاريعك الحالية وتسليمات العمل للعملاء بكل فاعلية.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#2a7de1] text-xs font-semibold border border-blue-100 flex items-center gap-1.5 shadow-2xs">
              <FolderKanban size={15} />
              {stats.total} إجمالي المشاريع
            </span>
          </div>
        </header>

        {/* Quick Metrics / Interactive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title="مشاريع نشطة"
            count={stats.active}
            sub="قيد التنفيذ والمتابعة"
            icon={<Layers size={18} className="text-[#2a7de1]" />}
            active={activeFilter === 'active'}
            onClick={() => handleCardFilterClick('active')}
            badgeColor="bg-blue-50 text-[#2a7de1] border-blue-100"
          />

          <KpiCard
            title="مطلوب تعديل"
            count={stats.revision}
            sub="تتطلب استجابة سريعة"
            icon={<AlertCircle size={18} className="text-rose-600" />}
            active={activeFilter === 'revision'}
            onClick={() => handleCardFilterClick('revision')}
            badgeColor="bg-rose-50 text-rose-700 border-rose-200"
            highlight={stats.revision > 0}
          />

          <KpiCard
            title="بانتظار المراجعة"
            count={stats.awaiting}
            sub="تسليمات لدى العميل"
            icon={<Clock size={18} className="text-amber-600" />}
            active={activeFilter === 'awaiting'}
            onClick={() => handleCardFilterClick('awaiting')}
            badgeColor="bg-amber-50 text-amber-700 border-amber-200"
          />

          <KpiCard
            title="مشاريع مكتملة"
            count={stats.completed}
            sub="تم تسليمها واعتمادها"
            icon={<CheckCircle2 size={18} className="text-emerald-600" />}
            active={activeFilter === 'completed'}
            onClick={() => handleCardFilterClick('completed')}
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-start">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewCompany={() => setSelectedCompany(project)}
            />
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200/90 p-8 shadow-2xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#2a7de1] flex items-center justify-center">
                <FolderKanban size={28} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">لا توجد مشاريع مطابقة</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                لم يتم العثور على أي مشاريع وفقاً للتصفية المحددة.
              </p>
              {activeFilter !== 'all' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCardFilterClick('all')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    عرض جميع المشاريع
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Company Profile Modal */}
      <CompanyProfileModal
        isOpen={Boolean(selectedCompany)}
        company={selectedCompany}
        companyId={selectedCompany?.clientId}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}

// --- Helper Components ---

function KpiCard({ title, count, sub, icon, active, onClick, badgeColor, highlight }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border text-start transition-all cursor-pointer bg-white ${
        active
          ? 'border-[#2a7de1] ring-2 ring-[#2a7de1]/15 shadow-sm'
          : highlight
          ? 'border-rose-300 ring-1 ring-rose-200 shadow-2xs'
          : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        <div className={`p-2 rounded-xl border ${badgeColor}`}>{icon}</div>
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-slate-900 leading-tight">{count}</p>
      <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">{sub}</p>
    </button>
  );
}

function ProjectCard({ project, onViewCompany }) {
  const avatarUrl = normalizeImageUrl(project.avatar);
  const displayName = project.companyName || project.clientName || 'شركة';

  const isCompleted = project.status === 'completed';
  const hasRevision = project.hasRevisionRequested;
  const hasAwaiting = project.hasAwaitingReview;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-md hover:border-blue-200 group">
      <div>
        {/* Top Header: Client & Status Badge */}
        <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={onViewCompany}
            className="flex items-center gap-2.5 text-start group/company cursor-pointer transition-transform hover:-translate-y-0.5"
            title="عرض الملف التعريفي للشركة"
          >
            <div className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs group-hover/company:border-[#2a7de1] transition-colors">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.classList.add('bg-blue-50');
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2a7de1] to-[#1f6fd4] text-white flex items-center justify-center font-semibold text-sm">
                  {displayName.charAt(0) || 'ش'}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <span className="font-semibold text-slate-800 text-sm group-hover/company:text-[#2a7de1] transition-colors line-clamp-1">
                {displayName}
              </span>
              <span className="text-[11px] font-medium text-slate-400 block">عميل</span>
            </div>
          </button>

          {/* Project Status Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 border ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : hasRevision
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : hasAwaiting
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-[#2a7de1] border-blue-200'
            }`}
          >
            {isCompleted
              ? 'مكتمل'
              : hasRevision
              ? 'مطلوب تعديل'
              : hasAwaiting
              ? 'بانتظار المراجعة'
              : 'قيد التنفيذ'}
          </span>
        </div>

        {/* Project Title */}
        <h2 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 group-hover:text-[#2a7de1] transition-colors line-clamp-2 leading-snug">
          {project.title}
        </h2>

        {/* Milestones / Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>نسبة إنجاز المشروع</span>
            <span className="font-semibold text-slate-800">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : hasRevision
                  ? 'bg-rose-500'
                  : 'bg-[#2a7de1]'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Meta & Actions */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-semibold text-slate-800">
            {project.projectValue}{' '}
            <span className="text-[11px] font-medium text-slate-400">ر.ي</span>
          </span>
          {project.completionDate && (
            <span className="text-[11px] font-medium text-slate-400">
              {project.completionDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project.chatId && (
            <Link
              href={`/freelancer/chat/${project.chatId}`}
              className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#2a7de1] text-slate-600 transition-colors cursor-pointer"
              title="محادثة العميل"
            >
              <MessageSquare size={16} />
            </Link>
          )}

          <Link
            href={`/freelancer/projects/${project.id}`}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              project.activeWorkspace && !isCompleted
                ? hasRevision
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                  : 'bg-[#2a7de1] hover:bg-[#1f6fd4] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isCompleted ? 'عرض مساحة العمل' : 'دخول مساحة العمل'}
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
