import React, { useMemo, useState } from 'react';
import { Bell, ChevronDown, ClipboardList, Edit3, Plus, Trash2, Send, FileText, Eye } from 'lucide-react';
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
    const [processingProposal, setProcessingProposal] = useState(false);

    // Track opened proposals in localStorage to persistent read status
    const [openedProposalIds, setOpenedProposalIds] = useState(() => {
        try {
            const saved = localStorage.getItem('company_opened_proposals');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    const markProposalAsOpened = (proposalId) => {
        setOpenedProposalIds((prev) => {
            const next = new Set(prev);
            next.add(String(proposalId));
            try {
                localStorage.setItem('company_opened_proposals', JSON.stringify([...next]));
            } catch {
                // ignore storage error
            }
            return next;
        });
    };

    const handleViewProposal = (proposal) => {
        markProposalAsOpened(proposal.id);
        setSelectedProposal(proposal);
    };

    // Calculate summary statistics
    const stats = useMemo(() => {
        const totalRequests = requests.length;
        let totalProposals = 0;
        let totalNewProposals = 0;

        for (const req of requests) {
            const pList = req.proposals || [];
            totalProposals += (req.proposalsCount || pList.length || 0);
            for (const p of pList) {
                if (!openedProposalIds.has(String(p.id))) {
                    totalNewProposals += 1;
                }
            }
        }

        return {
            totalRequests,
            totalProposals,
            totalNewProposals,
        };
    }, [requests, openedProposalIds]);

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#28251d]">الطلبات والعروض</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        إدارة طلباتك المنشورة ومتابعة العروض الواردة من المستقلين
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-[#1b62c4] transition-colors shadow-sm cursor-pointer"
                >
                    <Plus size={18} />
                    إنشاء طلب جديد
                </button>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* 1. Sent Requests */}
                <div className="bg-white rounded-2xl border border-[#e6e4de] p-5 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2a7de1] flex items-center justify-center shrink-0">
                        <Send size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">عدد الطلبات المرسلة</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.totalRequests}</p>
                        <p className="text-[11px] text-slate-400 font-medium">إجمالي الطلبات المنشورة</p>
                    </div>
                </div>

                {/* 2. Received Proposals */}
                <div className="bg-white rounded-2xl border border-[#e6e4de] p-5 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#ffb548] flex items-center justify-center shrink-0">
                        <FileText size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">عدد العروض المتلقاة</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.totalProposals}</p>
                        <p className="text-[11px] text-slate-400 font-medium">عروض مقدمة من المستقلين</p>
                    </div>
                </div>

                {/* 3. New Proposals Notification Card */}
                <div className={`rounded-2xl border p-5 shadow-xs flex items-center gap-4 transition-all ${
                    stats.totalNewProposals > 0
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-white border-[#e6e4de] text-slate-800'
                }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        stats.totalNewProposals > 0
                            ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        <Bell size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-500">عروض جديدة بانتظارك</p>
                            {stats.totalNewProposals > 0 && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            )}
                        </div>
                        <p className={`text-2xl font-black mt-0.5 ${stats.totalNewProposals > 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {stats.totalNewProposals}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                            {stats.totalNewProposals > 0 ? 'عروض واردة لم يتم فتحها بعد' : 'تم الاطلاع على جميع العروض'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Requests list */}
            {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredRequests.map((request) => {
                        const pList = request.proposals || [];
                        const newProposalsCount = pList.filter((p) => !openedProposalIds.has(String(p.id))).length;
                        const hasNewProposals = newProposalsCount > 0;

                        return (
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
                                            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-all text-xs font-bold cursor-pointer ${
                                                hasNewProposals
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                                            }`}
                                        >
                                            {hasNewProposals ? (
                                                <Bell size={14} className="text-emerald-600 animate-bounce" />
                                            ) : (
                                                <FileText size={14} className="text-slate-500" />
                                            )}
                                            <span>
                                                {expandedRequests.has(request.id)
                                                    ? 'إخفاء العروض'
                                                    : `عرض العروض (${request.proposalsCount})`}
                                            </span>
                                            {hasNewProposals && (
                                                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                                    +{newProposalsCount} جديد
                                                </span>
                                            )}
                                            <ChevronDown
                                                size={14}
                                                className={`transition-transform duration-200 ${expandedRequests.has(request.id) ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    ) : (
                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60">
                                            ⏳ لا يوجد عروض بعد
                                        </span>
                                    )}
                                </div>
                                {expandedRequests.has(request.id) && request.proposals?.length > 0 && (
                                    <div className="mt-5 space-y-3 border-t border-[#f0eee9] pt-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-[#28251d]">العروض المستلمة ({request.proposals.length})</h3>
                                            {hasNewProposals && (
                                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span>{newProposalsCount} عروض جديدة لم تفتح بعد</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2.5">
                                            {request.proposals.map((proposal, idx) => {
                                                const isNew = !openedProposalIds.has(String(proposal.id));
                                                const proposalNumber = idx + 1;

                                                return (
                                                    <div
                                                        key={proposal.id}
                                                        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-all ${
                                                            isNew
                                                                ? 'border-emerald-300 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-200/60'
                                                                : 'border-[#e6e4de] bg-[#faf9f6]'
                                                        }`}
                                                    >
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                                                    العرض #{proposalNumber}
                                                                </span>
                                                                {isNew && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[11px] font-bold shadow-2xs">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                                        <span>جديد #{proposalNumber}</span>
                                                                    </span>
                                                                )}
                                                                <p className="text-sm font-bold text-[#28251d]">{proposal.title}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-[#7a7974] flex-wrap">
                                                                <span>المستقل:</span>
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
                                                                <span className="font-bold text-slate-800">{Number(proposal.price || 0).toLocaleString('ar-YE')} ر.ي</span>
                                                                {proposal.timeline && (
                                                                    <>
                                                                        <span>·</span>
                                                                        <span>المدة: {proposal.timeline}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewProposal(proposal)}
                                                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer ${
                                                                isNew
                                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                    : 'bg-primary text-white hover:bg-[#1b62c4]'
                                                            }`}
                                                        >
                                                            <Eye size={14} />
                                                            <span>عرض العرض</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
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
                        );
                    })}
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