import { useState, useEffect } from 'react';
import ProposalDetailsModal from '../Components/ProposalDetailsModal';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
  MessageSquare,
  Clock,
  ChevronLeft,
  User,
  Pencil,
  Trash2
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

export default function Proposals({
  directOrders,
  sentProposals
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

    pollProposals();
    const interval = setInterval(pollProposals, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const safeDirectOrders = ordersList;
  const safeSentProposals = proposalsList;

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
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalActionId, setProposalActionId] = useState(null);

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
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    setProposalActionId(proposalId);
    setProposalsList((prev) => prev.filter((item) => String(item.id) !== String(proposalId)));
    router.delete(`/freelancer/proposals/${proposalId}`, {
      preserveScroll: true,
      onFinish: () => setProposalActionId(null),
    });
  };

  return (
    <div className="p-8 space-y-8" dir="rtl">
      {/* SECTION 1: Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">العروض والطلبات</h1>
        <p className="text-slate-500 max-w-2xl">
          أدر طلبات العملاء، تفاوض على المشاريع، وتابع عروض الأسعار المرسلة.
        </p>
      </header>

      {/* SECTION 2: Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-8 gap-8 overflow-x-auto whitespace-nowrap">
        <TabButton
          label={`الطلبات (${safeDirectOrders.length})`}
          active={activeTab === 'direct'}
          onClick={() => switchTab('direct')}
        />
        <TabButton
          label={`العروض المرسلة (${safeSentProposals.length})`}
          active={activeTab === 'sent'}
          onClick={() => switchTab('sent')}
        />
      </div>

      {/* SECTION 3: Tab Content Area */}
      <div>
        {/* A. Content for "الطلبات" (Orders) */}
        {activeTab === 'direct' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></span>
                الطلبات
              </h2>
              <span className="bg-blue-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                جديد
              </span>
            </div>
            {safeDirectOrders.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {safeDirectOrders.map((order) => (
                  <DirectOrderCard
                    key={order.id}
                    {...order}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onReject={() => handleRejectOrder(order.id)}
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
        {activeTab === 'sent' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></span>
                العروض المرسلة مؤخراً
              </h2>
            </div>
            {safeSentProposals.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {safeSentProposals.map((prop) => (
                  <SentProposalRow
                    key={prop.id}
                    {...prop}
                    onViewDetails={() => setSelectedProposal(prop.rawProposal || prop)}
                    onEdit={() => router.visit(`/freelancer/proposals/${prop.id}/edit`)}
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
    </div>
  );
}

// --- Helper Components ---

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${active ? 'text-slate-700 border-[#2a7de1]' : 'text-slate-400 border-transparent hover:text-slate-600'
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
          <h3 className="font-bold text-slate-800">{client}</h3>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${statusColor || 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20'}`}>
            {status}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-700 mb-2">{service}</p>
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
        prefetch="hover"
        preserveScroll
        className="px-5 py-2.5 bg-white border border-gray-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center gap-2"
      >
        <MessageSquare size={16} />
        فتح المحادثة
      </Link>
    </div>
  </div>
);

const DirectOrderCard = ({ id, isBrief, client, service, category, description, price, delivery, onAccept, onReject, processing }) => (
  <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-lg font-bold text-slate-800">{service}</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          العميل: <span className="font-bold text-slate-700">{client}</span>
        </p>
      </div>
      {isBrief ? (
        category && (
          <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-slate-700">
            {categoryLabels[category] || category}
          </span>
        )
      ) : (
        <div className="shrink-0 text-end">
          <p className="text-2xl font-black leading-none text-slate-700">
            {price} <span className="text-xs font-bold text-slate-400">ر.ي</span>
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">الميزانية المقترحة</p>
        </div>
      )}
    </div>

    {isBrief && description && (
      <div className="my-4 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <p className="mb-1.5 text-xs font-bold text-slate-400">تفاصيل الطلب</p>
        <p className="line-clamp-3 break-words text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      </div>
    )}

    <div className="mt-auto space-y-4 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-400">
          {isBrief ? 'تاريخ إرسال الطلب' : 'تاريخ التسليم المطلوب'}
        </span>
        <span className="font-bold text-slate-700">{delivery}</span>
      </div>

      <div className="flex items-center gap-3">
        {isBrief ? (
          <Link
            href={`/freelancer/proposals/create-for-brief/${id}`}
            className="flex-1 rounded-xl bg-[#2a7de1] py-2.5 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1f6fd4]"
          >
            إرسال عرض سعر
          </Link>
        ) : (
          <button
            onClick={onAccept}
            disabled={processing}
            className="flex-1 rounded-xl bg-[#2a7de1] py-2.5 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1f6fd4] disabled:opacity-50"
          >
            قبول وبدء العمل
          </button>
        )}
        <button
          onClick={onReject}
          disabled={processing}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          رفض
        </button>
      </div>
    </div>
  </div>
);

const SentProposalRow = ({ client, title, amount, date, status, statusType, onViewDetails, onEdit, onDelete, actionProcessing }) => {
  const statusStyles = {
    pending: 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20',
    accepted: 'bg-green-50 text-green-600 border-green-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors group">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-slate-700 transition-colors truncate">{title}</h3>
          <p className="text-sm text-slate-500">العميل: {client}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="text-sm text-slate-600 font-bold mb-1">{date}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">تاريخ الإرسال</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-800">{amount} <span className="text-xs font-bold text-slate-400">ر.ي</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">القيمة الإجمالية</p>
          </div>
          <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${statusStyles[statusType] || statusStyles.pending}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails();
          }}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-700 transition-colors"
        >
          عرض التفاصيل
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        </button>

        <div className="flex items-center gap-2">
          {statusType === 'pending' && (
            <>
              <button
                type="button"
                onClick={onEdit}
                disabled={actionProcessing}
                title="تعديل العرض"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-50"
              >
                <Pencil size={15} />
                تعديل
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={actionProcessing}
                title="حذف العرض"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {actionProcessing ? 'جاري الحذف...' : 'حذف'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
