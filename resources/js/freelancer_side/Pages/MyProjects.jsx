import { useState, useMemo } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

const MyProjects = ({ pageTitle, projects = [] }) => {
  const [activeTab, setActiveTab] = useState('active');

  const activeProjects = useMemo(() => {
    return projects
      .filter(p => p.status !== 'completed')
      .sort((a, b) => {
        const aActiveTask = (a.tasks || []).find(t => t.status === 'active') || { dueDate: 99 };
        const bActiveTask = (b.tasks || []).find(t => t.status === 'active') || { dueDate: 99 };
        return (aActiveTask.dueDate || 99) - (bActiveTask.dueDate || 99);
      });
  }, [projects]);

  const completedProjects = useMemo(() => {
    return projects.filter(p => p.status === 'completed');
  }, [projects]);

  const displayedProjects = activeTab === 'active' ? activeProjects : completedProjects;

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full bg-[#fcfcfd]" dir="rtl">
      {/* SECTION 1: Page Header & Tabs */}
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-[#2a7de1] to-[#2a7de1] bg-clip-text text-transparent mb-3 tracking-tight">{pageTitle || 'مشاريعي'}</h1>
        <p className="text-slate-500 font-medium mb-8">تابع تقدم مشاريعك الحالية وقم برفع التسليمات للعملاء.</p>

        <div className="flex justify-center gap-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'active'
                ? 'border-[#2a7de1] text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            مشاريع نشطة
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'completed'
                ? 'border-[#2a7de1] text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            مشاريع مكتملة
          </button>
        </div>
      </header>

      {/* SECTION 2: Projects Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-start">
        {displayedProjects.map(project => (
          <ProjectCard key={project.id} project={project} isActiveTab={activeTab === 'active'} />
        ))}
        {displayedProjects.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 font-medium">
            لا توجد مشاريع لعرضها في هذا القسم.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---

const ProjectCard = ({ project, isActiveTab }) => {
  const statusLabels = {
    in_progress: 'قيد التنفيذ',
    awaiting_review: 'بانتظار مراجعة العميل',
    pending_payment: 'بانتظار دفع العميل',
    completed: 'مكتمل'
  };

  const statusColors = {
    in_progress: 'bg-[#2a7de1]/10 text-slate-700 border-[#2a7de1]/20',
    awaiting_review: 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20',
    pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-green-50 text-green-600 border-green-100'
  };

  const getTimeLeftText = (days) => {
    if (days === 1) return 'متبقي يوم واحد';
    if (days === 2) return 'متبقي يومين';
    if (days >= 3 && days <= 10) return `متبقي ${days} أيام`;
    return `متبقي ${days} يوم`;
  };

  const activeTask = project.tasks.find(t => t.status === 'active');
  const isUrgent = activeTask && activeTask.dueDate <= 1;
  const timeDisplay = isActiveTab && activeTask
    ? getTimeLeftText(activeTask.dueDate)
    : (project.completionDate ? `تم التسليم في ${project.completionDate}` : '');

  const label = statusLabels[project.status] || project.status || 'قيد التنفيذ';
  const color = statusColors[project.status] || statusColors['in_progress'];

  return (
    <div className={`bg-white rounded-3xl p-8 border ${project.activeWorkspace && isActiveTab ? 'border-[#2a7de1] ring-4 ring-[#2a7de1]/10' : 'border-slate-100'} shadow-xl shadow-slate-200/40 relative group flex flex-col`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs text-slate-400 font-bold mb-1">{project.clientName}</p>
          <h3 className="text-xl font-bold text-slate-800 leading-tight">{project.title}</h3>
        </div>
        <div className="text-end shrink-0">
          <p className="text-2xl font-black bg-gradient-to-r from-[#2a7de1] to-[#2a7de1] bg-clip-text text-transparent leading-none">{project.projectValue} ر.ي</p>
        </div>
      </div>

      <div className="mb-8">
        {/* Dynamic Task Display */}
        {isActiveTab && activeTask && (
          <div className="bg-[#2a7de1]/10 border border-[#2a7de1]/10 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-slate-700 font-bold">المهمة الحالية: {activeTask.title}</p>
          </div>
        )}

        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
          <span>نسبة الإنجاز</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden text-start rtl:rotate-180">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isActiveTab ? 'bg-[#2a7de1]' : 'bg-green-500'}`}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-50 mt-auto">
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 text-[11px] font-black rounded-full border ${color}`}>
            {label}
          </span>
          {timeDisplay && (
            <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isUrgent && isActiveTab ? 'text-red-500' : 'text-slate-400'}`}>
              <Clock size={14} />
              {timeDisplay}
            </span>
          )}
        </div>
        <Link
          href={`/freelancer/projects/${project.id}`}
          prefetch="hover"
          preserveScroll
          className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${project.activeWorkspace && isActiveTab
              ? 'bg-gradient-to-r from-[#2a7de1] to-[#1f6fd4] text-white hover:from-[#2a7de1] hover:to-[#2a7de1] shadow-md shadow-[#2a7de1]/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          {isActiveTab ? 'دخول مساحة العمل' : 'عرض تفاصيل المشروع'}
          <ArrowRight size={16} className="rotate-180" />
        </Link>
      </div>
    </div>
  );
};

export default MyProjects;
