import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import ProposalFormModal from '../Components/ProposalFormModal';
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

const categoryLabels = {
  marketing_services: 'خدمات التسويق',
  graphic_design_branding: 'التصميم الجرافيكي والهوية البصرية',
  web_mobile_development: 'تطوير المواقع وتطبيقات الجوال',
  social_media_management: 'إدارة وسائل التواصل الاجتماعي',
  business_consulting: 'الاستشارات التجارية',
  market_research: 'أبحاث السوق',
  business_plan_preparation: 'إعداد خطط الأعمال',
  digital_marketing: 'تسويق رقمي',
  branding: 'تصميم وهويات بصرية',
  dev: 'تطوير مواقع وتطبيقات',
  analytics: 'تحليلات ولوحات بيانات',
  content: 'كتابة وإعداد محتوى',
};

export default function Dashboard({
  auth,
  statsData = {},
  openBriefs
}) {
  const [briefsList, setBriefsList] = useState(() => (Array.isArray(openBriefs) ? openBriefs : []));
  const [selectedBriefForProposal, setSelectedBriefForProposal] = useState(null);

  useEffect(() => {
    if (Array.isArray(openBriefs)) {
      setBriefsList(openBriefs);
    }
  }, [openBriefs]);

  useEffect(() => {
    let active = true;
    const pollBriefs = async () => {
      if (document.hidden) return;
      try {
        const searchParam = typeof window !== 'undefined' ? window.location.search : '';
        const res = await fetch(`/freelancer/briefs-poll${searchParam}`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        if (active && Array.isArray(data.openBriefs)) {
          setBriefsList(data.openBriefs);
        }
      } catch {
        // ignore network error during poll
      }
    };

    const interval = setInterval(pollBriefs, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
  // Dynamic statistics mapping with YER currency
  const stats = [
    {
      label: 'المشاريع النشطة',
      value: statsData.activeProjects ?? '0',
      icon: <Clock className="text-slate-700" size={24} />,
      change: 'حالي'
    },
    {
      label: 'الأرباح هذا الشهر',
      value: `${statsData.monthlyEarnings ?? '0'} ر.ي`,
      icon: <TrendingUp className="text-slate-700" size={24} />,
      change: statsData.earningsChange ?? '↑ 0%',
      highlight: true
    },
    {
      label: 'التقييم العام',
      value: statsData.rating ?? '5.0',
      icon: <Award className="text-slate-700" size={24} />,
      change: 'من 5.0'
    },
    {
      label: 'نسبة الإنجاز',
      value: `${statsData.completionRate ?? '100'}%`,
      icon: <CheckCircle2 className="text-slate-700" size={24} />,
      change: 'ممتاز'
    },
  ];

  const userName = auth?.user?.user_name || 'المستقل';

  return (
    <div className="p-8 space-y-8" dir="rtl">

      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-primary via-primary/80 to-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً {userName}، إليك ملخص نشاطك اليوم.</h1>
            <p className="text-white/80">
              لديك {statsData.unreadMessagesCount ?? 0} رسائل جديدة ومشروع واحد يتطلب تسليماً قريباً.
            </p>
          </div>
          <Link
            href="/freelancer/projects"
            prefetch="hover"
            cacheFor="1m"
            preserveScroll
            className="bg-white text-slate-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-2"
          >
            عرض المهام العاجلة ←
          </Link>
        </div>
        {/* Abstract Background Elements */}
        <div className="absolute top-0 inset-s-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <TrendingUp className="absolute bottom-4 inset-s-8 text-white/10 w-32 h-32 -scale-x-100 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.highlight ? 'bg-primary/10 text-slate-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-black bg-linear-to-r from-primary to-primary bg-clip-text text-transparent mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">فرص متاحة لك</h2>
          <span className="text-sm font-medium text-slate-500">{briefsList.length} طلب</span>
        </div>
        {briefsList.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {briefsList.map((brief) => (
              <article
                key={brief.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-base font-bold text-slate-800">
                      {brief.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      العميل: <span className="font-bold text-slate-700">{brief.client}</span>
                    </p>
                  </div>
                  {brief.category && (
                    <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-slate-700">
                      {categoryLabels[brief.category] || brief.category}
                    </span>
                  )}
                </div>

                <div className="my-4 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="mb-1.5 text-xs font-bold text-slate-400">تفاصيل الطلب</p>
                  <p className="line-clamp-3 break-words text-sm leading-relaxed text-slate-600">
                    {brief.description}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-slate-400">{brief.createdAt}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedBriefForProposal(brief)}
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1f6fd4] cursor-pointer"
                  >
                    إرسال عرض
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            لا توجد طلبات متاحة حالياً
          </div>
        )}
      </section>

      {/* Proposal Modal */}
      {selectedBriefForProposal && (
        <ProposalFormModal
          isOpen={true}
          onClose={() => setSelectedBriefForProposal(null)}
          briefId={selectedBriefForProposal.id}
          clientName={selectedBriefForProposal.clientName}
          clientRequest={selectedBriefForProposal.title}
          initialData={{
            title: selectedBriefForProposal.title || '',
            price: '',
            timeline: 'أسبوعين',
            revision_limit: '2',
            validity: '7 أيام',
            additional_terms: '',
            milestones: [{ id: Date.now(), title: '', description: '' }],
          }}
        />
      )}

    </div>
  );
}
