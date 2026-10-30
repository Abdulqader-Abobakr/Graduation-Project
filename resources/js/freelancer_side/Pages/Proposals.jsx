import { useState, useEffect, useMemo } from 'react';
import ProposalDetailsModal from '../../Components/shared/ProposalDetailsModal';
import DeleteConfirmationModal from '../../Components/shared/DeleteConfirmationModal';
import ProposalFormModal from '../../Components/freelancer/ProposalFormModal';
import CompanyProfileModal from '../../Components/freelancer/CompanyProfileModal';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
  MessageSquare,
  Clock,
  ChevronLeft,
  User,
  Pencil,
  Trash2,
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

export default function Proposals({
  directOrders,
  sentProposals,
  activeFilter = 'all',
  onFilterChange,
  search = '',
}) {
  const [ordersList, setOrdersList] = useState(() => (Array.isArray(directOrders) ? directOrders : []));
  const [proposalsList, setProposalsList] = useState(() => (Array.isArray(sentProposals) ? sentProposals : []));

  useEffect(() => {
    if (Array.isArray(directOrders)) {
      setOrdersList(directOrders);
    }
  }, [directOrders]);

  useEffect(() => {
    if (Array.isArray(sentProposals)) {
      setProposalsList(sentProposals);
    }
  }, [sentProposals]);

  useEffect(() => {
    let active = true;
    const pollProposals = async () => {
      if (document.hidden) return;
      try {
        const searchParam = typeof window !== 'undefined' ? window.location.search : '';
        const res = await fetch(`/freelancer/proposals-poll${searchParam}`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        if (active) {
          if (Array.isArray(data.directOrders)) {
            setOrdersList(data.directOrders);
          }
          if (Array.isArray(data.sentProposals)) {
            setProposalsList(data.sentProposals);
          }
        }
      } catch {
        // ignore network error during poll
      }
    };

    const interval = setInterval(pollProposals, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const { url } = usePage();
  const resolveTab = (searchUrl) => {
    try {
      const t = new URL(searchUrl || '', window.location.origin).searchParams.get('tab');
      return t === 'sent' ? 'sent' : 'direct';
    } catch {
      return 'direct';
    }
  };
  const initialTab = typeof window !== 'undefined' ? resolveTab(url) : 'direct';

  const [activeTab, setActiveTab] = useState(initialTab);

  const effectiveTab = useMemo(() => {
    if (activeFilter === 'direct') return 'direct';
    if (activeFilter === 'sent' || activeFilter === 'pending' || activeFilter === 'accepted' || activeFilter === 'rejected') {
      return 'sent';
    }
    return activeTab;
  }, [activeFilter, activeTab]);

  const safeDirectOrders = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return ordersList.filter((order) => {
      if (!q) return true;
      const title = (order.service || order.title || '').toLowerCase();
      const client = (order.client || order.companyName || order.clientName || '').toLowerCase();
      const desc = (order.description || '').toLowerCase();
      return title.includes(q) || client.includes(q) || desc.includes(q);
    });
  }, [ordersList, search]);

  const safeSentProposals = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return proposalsList.filter((p) => {
      // 1. Text Search matching
      if (q) {
        const title = (p.title || '').toLowerCase();
        const client = (p.client || '').toLowerCase();
        const price = String(p.price || '').toLowerCase();
        if (!title.includes(q) && !client.includes(q) && !price.includes(q)) {
          return false;
        }
      }

      // 2. Filter matching
      if (activeFilter === 'pending' || activeFilter === 'accepted' || activeFilter === 'rejected') {
        return p.statusType === activeFilter;
      }
      return true;
    });
  }, [proposalsList, activeFilter, search]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalActionId, setProposalActionId] = useState(null);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [activeProposalModal, setActiveProposalModal] = useState(null);
  const [selectedCompanyForProfile, setSelectedCompanyForProfile] = useState(null);

  const handleOpenCreateProposal = (order) => {
    setActiveProposalModal({
      mode: 'create',
      briefId: order.id,
      clientName: order.companyName || order.client,
      clientAvatar: order.avatar,
      clientRequest: order.service,
      initialData: {
        title: order.service || '',
        price: '',
        timeline: 'أسبوعين',
        revision_limit: '2',
        validity: '7 أيام',
        additional_terms: '',
        milestones: [{ id: Date.now(), title: '', description: '' }],
      },
    });
  };

  const handleOpenEditProposal = (prop) => {
    const raw = prop.rawProposal || {};
    setActiveProposalModal({
      mode: 'edit',
      proposalId: prop.id,
      clientName: prop.client,
      clientAvatar: prop.avatar || raw.avatar || raw.clientAvatar,
      clientRequest: prop.title,
      initialData: {
        title: raw.title || prop.title || '',
        price: raw.price || String(prop.amount || '').replace(/,/g, ''),
        timeline: raw.timeline || 'أسبوعين',
        revision_limit: String(raw.revision_limit ?? '2'),
        validity: raw.validity || '7 أيام',
        additional_terms: raw.additional_terms || raw.additionalTerms || '',
        milestones:
          raw.milestones && raw.milestones.length > 0
            ? raw.milestones
            : [{ id: Date.now(), title: '', description: '' }],
      },
    });
  };

  // Sync tab if URL changes (e.g. back/forward navigation)
  useEffect(() => {
    try {
      const tabFromUrl = new URL(url || '', window.location.origin).searchParams.get('tab');
      if (tabFromUrl && (tabFromUrl === 'direct' || tabFromUrl === 'sent') && tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    } catch {
      // safe fallback
    }
  }, [url]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (activeFilter !== 'all') {
      onFilterChange?.(tab);
    }
    if (typeof window !== 'undefined') {
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', tab);
        window.history.replaceState({}, '', newUrl.toString());
      } catch {
        // safe fallback
      }
    }
  };

  // Form handling for Accepting / Rejecting direct orders using Inertia useForm
  const { post, processing } = useForm({});

  const handleAcceptOrder = (orderId) => {
    post(`/freelancer/orders/${orderId}/accept`, { preserveScroll: true });
  };

  const handleRejectOrder = (orderId) => {
    setOrdersList((prev) => prev.filter((item) => String(item.id) !== String(orderId)));
    post(`/freelancer/orders/${orderId}/reject`, { preserveScroll: true });
  };

  const deleteProposal = (proposalId) => {
    setProposalToDelete(proposalId);
  };

  const confirmDeleteProposal = () => {
    if (proposalToDelete === null) return;
    const proposalId = proposalToDelete;
    setProposalToDelete(null);
    setProposalActionId(proposalId);
    setProposalsList((prev) => prev.filter((item) => String(item.id) !== String(proposalId)));
    router.delete(`/freelancer/proposals/${proposalId}`, {
      preserveScroll: true,
      onFinish: () => setProposalActionId(null),
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8" dir="rtl">
      {/* SECTION 1: Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">العروض والطلبات المباشرة</h1>
        <p className="text-slate-500 max-w-2xl">
          أدر طلبات العملاء، تفاوض على المشاريع، وتابع عروض الأسعار المرسلة.
        </p>
      </header>

      {/* SECTION 2: Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-8 gap-8 overflow-x-auto whitespace-nowrap">
        <TabButton
          label={`الطلبات المباشرة (${safeDirectOrders.length})`}
          active={effectiveTab === 'direct'}
          onClick={() => switchTab('direct')}
        />
        <TabButton
          label={`العروض المرسلة (${safeSentProposals.length})`}
          active={effectiveTab === 'sent'}
          onClick={() => switchTab('sent')}
        />
      </div>

      {/* SECTION 3: Tab Content Area */}
      <div>
        {/* A. Content for "الطلبات" (Orders) */}
        {effectiveTab === 'direct' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {safeDirectOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeDirectOrders.map((order) => (
                  <DirectOrderCard
                    key={order.id}
                    {...order}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onReject={() => handleRejectOrder(order.id)}
                    onCreateProposal={() => handleOpenCreateProposal(order)}
                    onViewCompany={() => setSelectedCompanyForProfile(order)}
                    processing={processing}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 font-bold">
                لا توجد طلبات حالياً.
              </div>
            )}
          </section>
        )}

        {/* C. Content for "العروض المرسلة" (Sent Proposals) */}
        {effectiveTab === 'sent' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {safeSentProposals.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {safeSentProposals.map((prop) => (
                  <SentProposalRow
                    key={prop.id}
                    {...prop}
                    onViewDetails={() => setSelectedProposal(prop.rawProposal || prop)}
                    onEdit={() => handleOpenEditProposal(prop)}
                    onDelete={() => deleteProposal(prop.id)}
                    actionProcessing={proposalActionId === prop.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 font-bold">
                لم تقم بإرسال عروض حتى الآن.
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal display for selected proposal details */}
      {selectedProposal && (
        <ProposalDetailsModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}

      {/* Modal display for creating or editing a proposal */}
      {activeProposalModal && (
        <ProposalFormModal
          isOpen={true}
          onClose={() => setActiveProposalModal(null)}
          proposalId={activeProposalModal.proposalId}
          briefId={activeProposalModal.briefId}
          chatId={activeProposalModal.chatId}
          clientName={activeProposalModal.clientName}
          clientAvatar={activeProposalModal.clientAvatar}
          clientRequest={activeProposalModal.clientRequest}
          initialData={activeProposalModal.initialData}
        />
      )}

      {/* Modal display for company profile */}
      <CompanyProfileModal
        isOpen={Boolean(selectedCompanyForProfile)}
        company={selectedCompanyForProfile}
        companyId={selectedCompanyForProfile?.clientId}
        onClose={() => setSelectedCompanyForProfile(null)}
      />

      <DeleteConfirmationModal
        isOpen={proposalToDelete !== null}
        title="حذف العرض؟"
        description="سيتم حذف العرض الذي أرسلته نهائياً. هل تريد المتابعة؟"
        isProcessing={proposalActionId === proposalToDelete}
        onCancel={() => setProposalToDelete(null)}
        onConfirm={confirmDeleteProposal}
      />
    </div>
  );
}

// --- Helper Components ---

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-4 px-2 text-sm font-semibold transition-all border-b-2 ${active ? 'text-slate-700 border-[#2a7de1]' : 'text-slate-400 border-transparent hover:text-slate-600'
      }`}
  >
    {label}
  </button>
);

const NegotiationCard = ({ id, client, service, lastMsg, time, status, statusColor, chatId }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
    <div className="flex gap-4 items-start">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        <User size={24} />
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-slate-800">{client}</h3>
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${statusColor || 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20'}`}>
            {status}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-700 mb-2">{service}</p>
        <p className="text-sm text-slate-500 line-clamp-1">"{lastMsg}"</p>
      </div>
    </div>

    <div className="flex flex-col md:items-end gap-3 shrink-0">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Clock size={14} />
        {time}
      </div>
      <Link
        href={`/freelancer/chat/${chatId || id}`}
        className="px-5 py-2.5 bg-white border border-gray-200 text-slate-600 rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center gap-2"
      >
        <MessageSquare size={16} />
        فتح المحادثة
      </Link>
    </div>
  </div>
);

const DirectOrderCard = ({
  id,
  isBrief,
  clientId,
  client,
  clientName,
  companyName,
  avatar,
  city,
  industry,
  service,
  category,
  description,
  price,
  delivery,
  onAccept,
  onReject,
  onCreateProposal,
  onViewCompany,
  processing,
}) => {
  const avatarUrl = normalizeImageUrl(avatar);
  const displayName = companyName || client || 'شركة';

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-blue-200 group">
      <div>
        {/* Top Header: Company Identity & Budget (if project inquiry) */}
        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
          {/* Company Branding: Logo + Name only */}
          <button
            type="button"
            onClick={onViewCompany}
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

          {/* Proposed Budget for Inquiry Orders */}
          {!isBrief && (
            <div className="shrink-0 text-end">
              <p className="text-base sm:text-lg font-semibold leading-none text-slate-800">
                {price} <span className="text-[11px] font-medium text-slate-400">ر.ي</span>
              </p>
              <p className="mt-0.5 text-[9px] font-medium uppercase text-slate-400">الميزانية المقترحة</p>
            </div>
          )}
        </div>

        {/* Request Title & Request Field Row */}
        <div className="mb-2.5 flex flex-wrap items-start gap-x-6 sm:gap-x-8 gap-y-2">
          {/* Title on the right (اليمين) مع قابلية التمدد */}
          <div className="min-w-0 max-w-[65%] sm:max-w-[70%]">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-0.5">عنوان الطلب:</span>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
              {service}
            </h3>
          </div>

          {/* Request Field closer to the right (أقرب لليمين وليس في أقصى اليسار) */}
          {category && (
            <div className="shrink-0 text-start">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-0.5">مجال الطلب:</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
                {categoryLabels[category] || category}
              </p>
            </div>
          )}
        </div>

        {/* Request Details */}
        {description && (
          <div className="my-2 rounded-xl border border-slate-200/80 bg-slate-50/90 p-2.5 sm:p-3">
            <span className="mb-1 text-[11px] sm:text-xs font-medium text-slate-500 block">تفاصيل الطلب:</span>
            <p className="line-clamp-2 break-words text-xs sm:text-[13px] leading-relaxed text-slate-700">
              {description}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Timeline & Action Buttons */}
      <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-500">
            <Clock size={13} />
            {isBrief ? 'تاريخ إرسال الطلب:' : 'تاريخ التسليم المطلوب:'}
          </span>
          <span className="font-semibold text-slate-700">{delivery}</span>
        </div>

        <div className="flex items-center gap-2">
          {isBrief ? (
            <button
              type="button"
              onClick={onCreateProposal}
              className="flex-1 rounded-lg bg-[#2a7de1] py-2 text-center text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#1f6fd4] cursor-pointer"
            >
              تقديم عرض سعر
            </button>
          ) : (
            <button
              type="button"
              onClick={onAccept}
              disabled={processing}
              className="flex-1 rounded-lg bg-[#2a7de1] py-2 text-center text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#1f6fd4] disabled:opacity-50 cursor-pointer"
            >
              قبول وبدء العمل
            </button>
          )}
          <button
            type="button"
            onClick={onReject}
            disabled={processing}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
          >
            رفض
          </button>
        </div>
      </div>
    </div>
  );
};

const SentProposalRow = ({ client, title, amount, date, status, statusType, onViewDetails, onEdit, onDelete, actionProcessing }) => {
  const statusStyles = {
    pending: 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20',
    accepted: 'bg-green-50 text-green-600 border-green-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };

  return (
    <div className="p-4 sm:p-5 hover:bg-slate-50 transition-colors group">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1 group-hover:text-[#2a7de1] transition-colors truncate">{title}</h3>
          <p className="text-xs text-slate-500">العميل: {client}</p>
        </div>

        <div className="flex flex-wrap items-center gap-5 shrink-0">
          <div className="text-center">
            <p className="text-xs text-slate-600 font-semibold mb-0.5">{date}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">تاريخ الإرسال</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-800">{amount} <span className="text-[11px] font-medium text-slate-400">ر.ي</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">القيمة الإجمالية</p>
          </div>
          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${statusStyles[statusType] || statusStyles.pending}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#2a7de1] transition-colors"
        >
          عرض التفاصيل
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        </button>

        <div className="flex items-center gap-2">
          {statusType === 'pending' && (
            <>
              <button
                type="button"
                onClick={onEdit}
                disabled={actionProcessing}
                title="تعديل العرض"
                className="inline-flex items-center gap-1 rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-50"
              >
                <Pencil size={13} />
                تعديل
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={actionProcessing}
                title="حذف العرض"
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {actionProcessing ? 'جاري الحذف...' : 'حذف'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
