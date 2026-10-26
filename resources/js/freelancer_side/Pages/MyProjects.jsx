import React, { useState, useMemo } from 'react';
import {
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronLeft,
  X,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import CompanyProfileModal from '../Components/CompanyProfileModal';

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let normalized = url.replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/');
  normalized = normalized.replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
  return normalized;
};

export default function MyProjects({ pageTitle, projects = [], search: initialSearch = '' }) {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'revision', 'awaiting', 'completed'
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status !== 'completed').length;
    const revision = projects.filter((p) => p.hasRevisionRequested).length;
    const awaiting = projects.filter((p) => p.hasAwaitingReview).length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    return { total, active, revision, awaiting, completed };
  }, [projects]);

  // Filtering projects
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.companyName?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'active') return p.status !== 'completed';
      if (filter === 'revision') return p.hasRevisionRequested;
      if (filter === 'awaiting') return p.hasAwaitingReview;
      if (filter === 'completed') return p.status === 'completed';
      return true;
    });
  }, [projects, search, filter]);

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-24 overflow-y-auto h-full bg-[#fcfcfd]" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* SECTION 1: Page Header */}
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

        {/* SECTION 2: Quick Metrics / KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title="مشاريع نشطة"
            count={stats.active}
            sub="قيد التنفيذ والمتابعة"
            icon={<Layers size={18} className="text-[#2a7de1]" />}
            active={filter === 'active'}
            onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
            badgeColor="bg-blue-50 text-[#2a7de1] border-blue-100"
          />

          <KpiCard
            title="مطلوب تعديل"
            count={stats.revision}
            sub="تتطلب استجابة سريعة"
            icon={<AlertCircle size={18} className="text-rose-600" />}
            active={filter === 'revision'}
            onClick={() => setFilter(filter === 'revision' ? 'all' : 'revision')}
            badgeColor="bg-rose-50 text-rose-700 border-rose-200"
            highlight={stats.revision > 0}
          />

          <KpiCard
            title="بانتظار المراجعة"
            count={stats.awaiting}
            sub="تسليمات لدى العميل"
            icon={<Clock size={18} className="text-amber-600" />}
            active={filter === 'awaiting'}
            onClick={() => setFilter(filter === 'awaiting' ? 'all' : 'awaiting')}
            badgeColor="bg-amber-50 text-amber-700 border-amber-200"
          />

          <KpiCard
            title="مشاريع مكتملة"
            count={stats.completed}
            sub="تم تسليمها واعتمادها"
            icon={<CheckCircle2 size={18} className="text-emerald-600" />}
            active={filter === 'completed'}
            onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
        </div>

        {/* SECTION 3: Search and Filter Tabs Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المشروع أو العميل أو الشركة..."
                className="w-full ps-10 pe-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/20 focus:border-[#2a7de1] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <FilterPill
                label="الكل"
                count={stats.total}
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <FilterPill
                label="قيد العمل"
                count={stats.active}
                active={filter === 'active'}
                onClick={() => setFilter('active')}
              />
              {stats.revision > 0 && (
                <FilterPill
                  label="مطلوب تعديل"
                  count={stats.revision}
                  active={filter === 'revision'}
                  onClick={() => setFilter('revision')}
                  variant="danger"
                />
              )}
              <FilterPill
                label="بانتظار المراجعة"
                count={stats.awaiting}
                active={filter === 'awaiting'}
                onClick={() => setFilter('awaiting')}
              />
              <FilterPill
                label="مكتملة"
                count={stats.completed}
                active={filter === 'completed'}
                onClick={() => setFilter('completed')}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Projects Grid */}
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
                لم يتم العثور على أي مشاريع وفقاً لمعايير البحث أو الفلترة المحددة.
              </p>
              {(search || filter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
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

function FilterPill({ label, count, active, onClick, variant }) {
  const isDanger = variant === 'danger';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
        active
          ? isDanger
            ? 'bg-rose-600 text-white shadow-2xs'
            : 'bg-[#2a7de1] text-white shadow-2xs'
          : isDanger
          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-transparent'
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
          active ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ProjectCard({ project, onViewCompany }) {
  const avatarUrl = normalizeImageUrl(project.avatar);
  const displayName = project.companyName || project.clientName || 'شركة';

  const isCompleted = project.status === 'completed';
  const hasRevision = project.hasRevisionRequested;
  const isAwaiting = project.hasAwaitingReview;

  // Active task calculation
  const totalTasks = project.totalTasks || project.tasks?.length || 0;
  const completedTasks = project.completedTasks || 0;
  const currentTaskIndex =
    project.activeTaskIndex !== undefined && project.activeTaskIndex >= 0
      ? project.activeTaskIndex + 1
      : completedTasks + 1;

  const currentTaskTitle =
    project.activeTaskTitle ||
    project.tasks?.find((t) => t.status === 'active' || t.status === 'revision_requested')?.title;

  return (
    <article
      className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between group ${
        hasRevision
          ? 'border-rose-300 ring-2 ring-rose-500/10'
          : isAwaiting
          ? 'border-amber-200'
          : isCompleted
          ? 'border-slate-200/90'
          : 'border-slate-200/90 hover:border-blue-200'
      }`}
    >
      <div>
        {/* Top Header: Company Identity & Price */}
        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={onViewCompany}
            className="flex items-center gap-2.5 text-start group/company cursor-pointer transition-transform hover:-translate-y-0.5 min-w-0"
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
              <span className="font-semibold text-slate-800 text-xs sm:text-sm group-hover/company:text-[#2a7de1] transition-colors truncate block">
                {displayName}
              </span>
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                {project.city || 'اليمن'}
              </span>
            </div>
          </button>

          <div className="shrink-0 text-end">
            <p className="text-base sm:text-lg font-semibold text-slate-800 leading-none">
              {project.projectValue} <span className="text-[11px] font-medium text-slate-400">ر.ي</span>
            </p>
            <p className="mt-0.5 text-[9px] font-medium uppercase text-slate-400">قيمة المشروع</p>
          </div>
        </div>

        {/* Project Title */}
        <div className="mb-3">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">عنوان المشروع:</span>
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 leading-snug break-words">
            {project.title}
          </h3>
        </div>

        {/* Action alerts if revision requested or awaiting */}
        {hasRevision && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center gap-2 text-rose-700 text-xs font-semibold animate-pulse">
            <AlertCircle size={15} className="shrink-0" />
            <span>طلب العميل تعديلات على التسليم الأخير، يرجى مراجعتها</span>
          </div>
        )}

        {isAwaiting && !hasRevision && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-center gap-2 text-amber-700 text-xs font-semibold">
            <Clock size={15} className="shrink-0" />
            <span>تم تسليم المرحلة وبانتظار مراجعة واعتماد العميل</span>
          </div>
        )}

        {/* Stage & Progress Indicator */}
        <div className="mb-3 bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">
              {isCompleted ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  تم استكمال جميع المراحل ({totalTasks})
                </span>
              ) : currentTaskTitle ? (
                <span>
                  المرحلة {Math.min(currentTaskIndex, totalTasks || 1)} من {totalTasks}:{' '}
                  <strong className="text-slate-800 font-semibold">{currentTaskTitle}</strong>
                </span>
              ) : (
                <span>نسبة الإنجاز الإجمالية</span>
              )}
            </span>
            <span className="font-semibold text-slate-700">{project.progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden text-start rtl:rotate-180">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : hasRevision
                  ? 'bg-rose-500'
                  : isAwaiting
                  ? 'bg-amber-500'
                  : 'bg-[#2a7de1]'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Status Badge & Actions */}
      <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} />
              مكتمل
            </span>
          ) : hasRevision ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <AlertCircle size={12} />
              مطلوب تعديل
            </span>
          ) : isAwaiting ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Clock size={12} />
              بانتظار المراجعة
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-[#2a7de1] border border-blue-100">
              قيد التنفيذ
            </span>
          )}

          {project.completionDate && isCompleted && (
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
