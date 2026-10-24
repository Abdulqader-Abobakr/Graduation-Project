import React, { useMemo } from 'react';
import { Plus, FolderOpen, Clock, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function MyProjectsPage({
    projects = [],
    onCreateRequest,
    search = '',
    activeFilter = 'all',
}) {
    const filteredProjects = useMemo(() => {
        const q = search.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesSearch =
                !q ||
                project.title?.toLowerCase().includes(q) ||
                project.client?.toLowerCase().includes(q);

            const matchesFilter =
                activeFilter === 'all' ||
                (activeFilter === 'active' && project.status === 'active') ||
                (activeFilter === 'completed' && project.status === 'completed') ||
                (activeFilter === 'pending_payment' && project.status === 'pending_payment');

            return matchesSearch && matchesFilter;
        });
    }, [projects, search, activeFilter]);

    const isFiltering = search.trim() !== '' || activeFilter !== 'all';
    const hasAnyProjects = projects.length > 0;

    const pendingPaymentCount = projects.filter((p) => p.status === 'pending_payment').length;
    const activeCount = projects.filter((p) => p.status === 'active').length;
    const completedCount = projects.filter((p) => p.status === 'completed').length;

    const statusConfig = {
        pending_payment: {
            label: 'بانتظار الدفع',
            pillClass: 'bg-amber-50 text-amber-700',
        },
        active: {
            label: 'نشط',
            pillClass: 'bg-primary/10 text-primary',
        },
        completed: {
            label: 'مكتمل',
            pillClass: 'bg-emerald-50 text-emerald-700',
        },
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#28251d]">مشاريعي</h1>
                {onCreateRequest && (
                    <button
                        onClick={onCreateRequest}
                        className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-[#1b62c4] transition-colors shadow-sm cursor-pointer"
                    >
                        <Plus size={18} />
                        مشروع جديد
                    </button>
                )}
            </div>

            {!isFiltering && hasAnyProjects && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {pendingPaymentCount > 0 && (
                        <StatusPill
                            icon={<AlertCircle size={18} />}
                            label="بانتظار الدفع"
                            count={pendingPaymentCount}
                            color="bg-amber-50 text-amber-700"
                        />
                    )}
                    <StatusPill
                        icon={<Clock size={18} />}
                        label="مشاريع نشطة"
                        count={activeCount}
                        color="bg-primary/10 text-primary"
                    />
                    <StatusPill
                        icon={<CheckCircle2 size={18} />}
                        label="مشاريع مكتملة"
                        count={completedCount}
                        color="bg-emerald-50 text-emerald-700"
                    />
                </div>
            )}

            {filteredProjects.length > 0 ? (
                <div className="space-y-4">
                    {filteredProjects.map((project) => {
                        const config = statusConfig[project.status] || statusConfig.active;
                        const isPendingPayment = project.status === 'pending_payment';

                        return (
                            <article
                                key={project.id}
                                className={`rounded-2xl border bg-white p-5 shadow-sm ${isPendingPayment ? 'border-amber-200 ring-1 ring-amber-100' : 'border-[#e6e4de]'}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#28251d]">{project.title}</h2>
                                        <p className="mt-1 text-sm text-[#7a7974]">
                                            العميل: {project.client}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${config.pillClass}`}>
                                        {config.label}
                                    </span>
                                </div>

                                {isPendingPayment && (
                                    <div className="mt-4 flex items-center justify-between gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-3 text-amber-800">
                                            <CreditCard size={20} />
                                            <p className="text-sm font-bold">يرجى إتمام الدفع لتفعيل المشروع</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.visit(`/company/projects/${project.id}/pay`)}
                                            className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm"
                                        >
                                            <CreditCard size={16} />
                                            إتمام الدفع
                                        </button>
                                    </div>
                                )}
                                {!isPendingPayment && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => router.visit(`/company/projects/${project.id}`)}
                                            className="flex items-center gap-2 bg-[#28251d] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1a1813] transition-colors shadow-sm"
                                        >
                                            <FolderOpen size={16} />
                                            دخول مساحة العمل
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-[#7a7974]">
                    <FolderOpen size={64} className="mb-4 opacity-30" />
                    {hasAnyProjects && isFiltering ? (
                        <>
                            <p className="text-lg">لا توجد مشاريع مطابقة للتصفية</p>
                            <p className="text-sm mt-1">جرّب تغيير البحث أو التصفية.</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg">لا توجد مشاريع حالياً</p>
                            <p className="text-sm mt-1">
                                ستظهر هنا المشاريع التي يتم الاتفاق عليها مع المستقلين.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

const StatusPill = ({ icon, label, count, color }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e6e4de] bg-white p-4 shadow-sm">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-[#7a7974]">{label}</p>
            <p className="text-lg font-black text-[#28251d]">{count}</p>
        </div>
    </div>
);