import React, { useMemo, useState } from 'react';
import { Bell, ChevronDown, ClipboardList, Edit3, Plus, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import CreateRequestModal from '../components/CreateRequestModal';
import ProposalDetailsModal from '../../freelancer_side/Components/ProposalDetailsModal';
import FreelancerProfileModal from '../components/FreelancerProfileModal';

const categoryLabels = {
    marketing_services: 'خدمات التسويق',
    graphic_design_branding: 'التصميم الجرافيكي والهوية البصرية',
    web_mobile_development: 'تطوير المواقع وتطبيقات الجوال',
    social_media_management: 'إدارة وسائل التواصل الاجتماعي',
    business_consulting: 'الاستشارات التجارية',
    market_research: 'أبحاث السوق',
    business_plan_preparation: 'إعداد خطط الأعمال',
    digital_marketing: 'تسويق رقمي',
    branding: 'تصميم',
    dev: 'تطوير',
    analytics: 'تحليلات',
    content: 'كتابة محتوى',
};

export default function MyRequestsPage({
    requests = [],
    freelancers,
    onSubmit,
    onDelete,
    search = '',
    activeFilter = 'all',
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [viewingFreelancerId, setViewingFreelancerId] = useState(null);
    const [expandedRequests, setExpandedRequests] = useState(new Set());
    const [readProposalNotifications, setReadProposalNotifications] = useState(new Set());
    const [processingProposal, setProcessingProposal] = useState(false);

    const filteredRequests = useMemo(() => {
        const q = search.trim().toLowerCase();

        return requests.filter((request) => {
            const matchesSearch =
                !q ||
                request.title?.toLowerCase().includes(q) ||
                request.description?.toLowerCase().includes(q) ||
                categoryLabels[request.category]?.toLowerCase().includes(q);

            const matchesFilter =
                activeFilter === 'all' ||
                (activeFilter === 'open' && request.status === 'open') ||
                (activeFilter === 'with_proposals' && request.proposalsCount > 0) ||
                (activeFilter === 'no_proposals' && !request.proposalsCount);

            return matchesSearch && matchesFilter;
        });
    }, [requests, search, activeFilter]);

    const formatArabicDate = (value) => {
        if (!value) return '';

        return new Intl.DateTimeFormat('ar-EG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(value));
    };

    const openCreateModal = () => {
        setEditingRequest(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (request) => {
        if (request.proposalsCount > 0) return;
        setEditingRequest(request);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingRequest(null);
    };

    const toggleProposals = (requestId) => {
        setExpandedRequests((current) => {
            const next = new Set(current);

            if (next.has(requestId)) {
                next.delete(requestId);
            } else {
                next.add(requestId);
                setReadProposalNotifications((read) => new Set(read).add(requestId));
            }

            return next;
        });
    };

    const postProposalAction = (path, proposalId, closeAfter = false) => {
        setProcessingProposal(true);
        router.post(path.replace(':id', proposalId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (closeAfter) setSelectedProposal(null);
            },
            onFinish: () => setProcessingProposal(false),
        });
    };

    const hasAnyRequests = requests.length > 0;
    const isFiltering = search.trim() !== '' || activeFilter !== 'all';

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-[#28251d]">طلباتي</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-[#1b62c4] transition-colors shadow-sm cursor-pointer"
                >
                    <Plus size={18} />
                    إنشاء طلب جديد
                </button>
            </div>

            {/* Requests list */}
            {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredRequests.map((request) => (
                        <article key={request.id} className="rounded-2xl border border-[#e6e4de] bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-[#28251d]">{request.title}</h2>
                                    <p className="mt-1 text-sm text-[#7a7974]">{request.description}</p>
                                    <p className="mt-2 text-xs font-semibold text-[#7a7974]">{formatArabicDate(request.createdAt)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#7a7974]">
                                <span className="rounded-full bg-[#f7f6f2] px-3 py-1">{categoryLabels[request.category] || request.category}</span>
                                <span className="rounded-full bg-[#f7f6f2] px-3 py-1">
                                    {request.providerType === 'specific'
                                        ? `محدد: ${request.targetedFreelancer || 'مستقل'}`
                                        : 'متاح لكل المستقلين'}
                                </span>
                                {request.proposalsCount > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleProposals(request.id)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${readProposalNotifications.has(request.id)
                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                    >
                                        {!readProposalNotifications.has(request.id) && <Bell size={14} />}
                                        <span>
                                            {expandedRequests.has(request.id)
                                                ? 'إخفاء العروض'
                                                : readProposalNotifications.has(request.id)
                                                    ? 'عرض العروض'
                                                    : `لديك ${request.proposalsCount} عروض`}
                                        </span>
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform ${expandedRequests.has(request.id) ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                ) : (
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                                        ⏳ لا يوجد عروض
                                    </span>
                                )}
                            </div>
                            {expandedRequests.has(request.id) && request.proposals?.length > 0 && (
                                <div className="mt-5 space-y-3 border-t border-[#f0eee9] pt-4">
                                    <h3 className="text-sm font-bold text-[#28251d]">العروض المستلمة</h3>
                                    <div className="space-y-2">
                                        {request.proposals.map((proposal) => (
                                            <div
                                                key={proposal.id}
                                                className="flex flex-col gap-3 rounded-xl border border-[#e6e4de] bg-[#faf9f6] p-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-[#28251d]">{proposal.title}</p>
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#7a7974] flex-wrap">
                                                        {proposal.freelancerId ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewingFreelancerId(proposal.freelancerId)}
                                                                className="font-bold text-primary hover:underline cursor-pointer"
                                                                title="عرض الملف الشخصي للمستقل"
                                                            >
                                                                {proposal.freelancerName}
                                                            </button>
                                                        ) : (
                                                            <span className="font-semibold text-[#28251d]">{proposal.freelancerName}</span>
                                                        )}
                                                        <span>·</span>
                                                        <span>{Number(proposal.price || 0).toLocaleString('ar-YE')} ر.ي</span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProposal(proposal)}
                                                    className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1b62c4]"
                                                >
                                                    عرض العرض
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#f0eee9] pt-4">
                                <span className="ml-auto text-xs font-bold text-[#7a7974]">الإجراءات</span>
                                <button
                                    type="button"
                                    onClick={() => openEditModal(request)}
                                    disabled={request.proposalsCount > 0}
                                    title={request.proposalsCount > 0 ? 'لا يمكن التعديل بعد تلقي عروض' : 'تعديل الطلب'}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <Edit3 size={15} />
                                    تعديل
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) onDelete(request.id);
                                    }}
                                    title="حذف الطلب"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                >
                                    <Trash2 size={15} />
                                    حذف
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-[#7a7974]">
                    <ClipboardList size={64} className="mb-4 opacity-30" />
                    {hasAnyRequests && isFiltering ? (
                        <>
                            <p className="text-lg">لا توجد طلبات مطابقة للتصفية</p>
                            <p className="text-sm mt-1">جرّب تغيير البحث أو التصفية.</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg">لا توجد طلبات حالياً</p>
                            <p className="text-sm mt-1">اضغط "إنشاء طلب جديد" لبدء أول طلب</p>
                        </>
                    )}
                </div>
            )}

            {/* Modal inside this page */}
            <CreateRequestModal
                isOpen={isCreateModalOpen}
                onClose={closeModal}
                request={editingRequest}
                onSubmit={(requestData) => onSubmit(requestData, editingRequest?.id, closeModal)}
                freelancers={freelancers}
            />

            <ProposalDetailsModal
                proposal={selectedProposal}
                onClose={() => setSelectedProposal(null)}
                processing={processingProposal}
                onAccept={selectedProposal ? () => postProposalAction('/company/proposals/:id/accept', selectedProposal.id, true) : undefined}
                onChat={selectedProposal ? () => postProposalAction('/company/proposals/:id/chat', selectedProposal.id, true) : undefined}
                onDeny={selectedProposal ? () => postProposalAction('/company/proposals/:id/deny', selectedProposal.id, true) : undefined}
                onViewFreelancer={(id) => setViewingFreelancerId(id)}
            />

            <FreelancerProfileModal
                isOpen={Boolean(viewingFreelancerId)}
                freelancer={viewingFreelancerId}
                onClose={() => setViewingFreelancerId(null)}
            />
        </div>
    );
}