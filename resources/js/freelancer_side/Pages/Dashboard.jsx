import React, { useEffect, useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import ProposalFormModal from '../../Components/freelancer/ProposalFormModal';
import CompanyProfileModal from '../../Components/freelancer/CompanyProfileModal';
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
} from 'lucide-react';

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let normalized = url.replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/');
  normalized = normalized.replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
  return normalized;
};

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

const categoryGroupMap = {
  tech: ['tech', 'dev', 'web_mobile_development', 'it', 'software', 'programming'],
  design: ['design', 'graphic_design_branding', 'branding', 'ui_ux', 'creative'],
  marketing: ['marketing', 'marketing_services', 'digital_marketing', 'social_media_management', 'seo'],
  writing: ['writing', 'content', 'translation', 'copywriting'],
  business: ['business', 'business_consulting', 'business_plan_preparation', 'market_research', 'analytics', 'consulting'],
};

export default function Dashboard({
  auth,
  statsData = {},
  openBriefs,
  activeFilter = 'all',
  search = '',
}) {
  const [briefsList, setBriefsList] = useState(() => (Array.isArray(openBriefs) ? openBriefs : []));
  const [selectedBriefForProposal, setSelectedBriefForProposal] = useState(null);
  const [selectedCompanyForProfile, setSelectedCompanyForProfile] = useState(null);

  const filteredBriefs = useMemo(() => {
    const q = (search || '').trim().toLowerCase();

    return briefsList.filter((brief) => {
      // 1. Search Query matching
      if (q) {
        const title = (brief.title || '').toLowerCase();
        const desc = (brief.description || '').toLowerCase();
        const client = (brief.client || brief.clientName || brief.companyName || '').toLowerCase();
        const catLabel = (categoryLabels[brief.category] || '').toLowerCase();
        const matches = title.includes(q) || desc.includes(q) || client.includes(q) || catLabel.includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter matching
      if (!activeFilter || activeFilter === 'all') return true;
      const cat = (brief.category || '').toLowerCase();
      if (cat === activeFilter.toLowerCase()) return true;
      const group = categoryGroupMap[activeFilter];
      if (group && (group.includes(cat) || group.some((k) => cat.includes(k)))) {
        return true;
      }
      return cat.includes(activeFilter.toLowerCase());
    });
  }, [briefsList, activeFilter, search]);

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

    const interval = setInterval(pollBriefs, 15000);
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
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">فرص متاحة لك</h2>
          <span className="text-sm font-medium text-slate-500">{filteredBriefs.length} طلب</span>
        </div>
        {filteredBriefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBriefs.map((brief) => {
              const avatarUrl = normalizeImageUrl(brief.avatar);
              const displayName = brief.companyName || brief.client || 'شركة';

              return (
                <article
                  key={brief.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-blue-200 group"
                >
                  <div>
                    {/* Top Header: Company Identity */}
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
                      {/* Company Branding: Logo + Name only */}
                      <button
                        type="button"
                        onClick={() => setSelectedCompanyForProfile(brief)}
                        className="flex items-center gap-2.5 text-start group/company cursor-pointer transition-transform hover:-translate-y-0.5"
                        title="انقر لعرض الملف التعريفي للشركة"
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
                        </div>
                      </button>
                    </div>

                    {/* Request Title & Request Field Row */}
                    <div className="mb-2.5 flex flex-wrap items-start gap-x-6 sm:gap-x-8 gap-y-2">
                      {/* Title on the right (اليمين) مع قابلية التمدد */}
                      <div className="min-w-0 max-w-[65%] sm:max-w-[70%]">
                        <span className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-0.5">عنوان الطلب:</span>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
                          {brief.title}
                        </h3>
                      </div>

                      {/* Request Field closer to the right (أقرب لليمين وليس في أقصى اليسار) */}
                      {brief.category && (
                        <div className="shrink-0 text-start">
                          <span className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-0.5">مجال الطلب:</span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
                            {categoryLabels[brief.category] || brief.category}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Details / Brief Description */}
                    {brief.description && (
                      <div className="my-2 rounded-xl border border-slate-200/80 bg-slate-50/90 p-2.5 sm:p-3">
                        <span className="mb-1 text-[11px] sm:text-xs font-medium text-slate-500 block">تفاصيل الطلب:</span>
                        <p className="line-clamp-2 break-words text-xs sm:text-[13px] leading-relaxed text-slate-700">
                          {brief.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Clock size={13} />
                      {brief.createdAt}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedBriefForProposal(brief)}
                      className="rounded-lg bg-[#2a7de1] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#1f6fd4] cursor-pointer"
                    >
                      تقديم عرض
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 font-medium">
            {search && activeFilter !== 'all'
              ? 'لا توجد طلبات مطابقة للبحث ضمن هذا التخصص'
              : search
                ? 'لا توجد طلبات مطابقة للبحث'
                : activeFilter !== 'all'
                  ? 'لا توجد طلبات متاحة في هذا التخصص حالياً'
                  : 'لا توجد طلبات متاحة حالياً'}
          </div>
        )}
      </section>

      {/* Proposal Modal */}
      {selectedBriefForProposal && (
        <ProposalFormModal
          isOpen={true}
          onClose={() => setSelectedBriefForProposal(null)}
          briefId={selectedBriefForProposal.id}
          clientName={selectedBriefForProposal.companyName || selectedBriefForProposal.client || selectedBriefForProposal.clientName}
          clientAvatar={selectedBriefForProposal.avatar}
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

      {/* Company Profile Modal */}
      <CompanyProfileModal
        isOpen={Boolean(selectedCompanyForProfile)}
        company={selectedCompanyForProfile}
        companyId={selectedCompanyForProfile?.clientId}
        onClose={() => setSelectedCompanyForProfile(null)}
      />

    </div>
  );
}
