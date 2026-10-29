import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import Sidebar from '../Components/company/NavItem';
import Header from '../Components/company/Header';
import ExplorePage from './pages/ExplorePage';
import MyRequestsPage from './pages/MyRequestsPage';
import MyProjectsPage from './pages/MyProjectsPage';
import ChatPage from './pages/ChatPage';
import ProjectWorkspace from './pages/ProjectWorkspace';
import { router, usePage } from '@inertiajs/react';
import SilaAssistant from '../Components/shared/SilaAssistant';

// 👇 official list — same as the old code
const defaultIndustries = [
    'خدمات التسويق',
    'التصميم الجرافيكي والهوية البصرية',
    'تطوير المواقع وتطبيقات الجوال',
    'إدارة وسائل التواصل الاجتماعي',
    'الاستشارات التجارية',
    'أبحاث السوق',
    'إعداد خطط الأعمال',
    'العلامة التجارية',
];

const EMPTY_ARRAY = [];

export default function App({
    requests,
    freelancers = EMPTY_ARRAY,
    exploreFreelancers = EMPTY_ARRAY,
    projects = EMPTY_ARRAY,
    conversation = null,
    conversations = EMPTY_ARRAY,
    workspaceProject = null,
}) {
    const { url, props: pageProps } = usePage();
    const flash = pageProps?.flash ?? {};
    const [showToast, setShowToast] = useState(false);
    const lastFlashRef = useRef(null);

    const activePage = useMemo(() => {
        if (workspaceProject) return 'workspace';
        try {
            const urlObj = new URL(url, 'http://localhost');
            const tab = urlObj.searchParams.get('tab');
            if (tab && ['explore', 'requests', 'projects', 'chat', 'workspace'].includes(tab)) {
                return tab;
            }
        } catch {
            // fallback to explore
        }
        if (conversation) return 'chat';
        return 'explore';
    }, [url, workspaceProject, conversation]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [requestsList, setRequestsList] = useState(() => (Array.isArray(requests) ? requests : []));
    const pendingMutationsRef = useRef(0);
    const mainContentRef = useRef(null);

    // Show floating toast when flash.success arrives - only once per unique message
    useEffect(() => {
        if (flash?.success && flash.success !== lastFlashRef.current) {
            lastFlashRef.current = flash.success;
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    // Reset filter & search when switching pages/tabs
    useEffect(() => {
        setActiveFilter('all');
        setSearch('');
    }, [activePage]);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }, [activePage, url]);

    useEffect(() => {
        if (Array.isArray(requests) && pendingMutationsRef.current === 0) {
            setRequestsList(requests);
        }
    }, [requests]);

    useEffect(() => {
        if (activePage !== 'requests') return;

        let active = true;
        const pollRequests = async () => {
            if (document.hidden || pendingMutationsRef.current > 0) return;
            try {
                const res = await fetch('/company/requests-poll', {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok || !active || pendingMutationsRef.current > 0) return;
                const data = await res.json();
                if (active && Array.isArray(data.requests) && pendingMutationsRef.current === 0) {
                    setRequestsList(data.requests);
                }
            } catch {
                // ignore network error during poll
            }
        };

        const interval = setInterval(pollRequests, 12000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [activePage]);

    useEffect(() => router.on('start', () => setIsNavigating(true)), []);
    useEffect(() => router.on('finish', () => setIsNavigating(false)), []);

    useEffect(() => {
        if (activePage !== 'workspace') {
            setActiveFilter('all');
            setSearch('');
        }
    }, [activePage]);

    const pagePlaceholders = {
        explore: 'ابحث عن خبير أو تخصص أو مهارة...',
        requests: 'ابحث في الطلبات أو الوصف أو الفئة...',
        projects: 'ابحث في المشاريع أو العملاء...',
        chat: 'ابحث في الرسائل أو المرسل...',
        workspace: '',
    };

    const searchPlaceholder = pagePlaceholders[activePage] || pagePlaceholders.explore;

    const pageTitle = activePage === 'requests' ? 'الطلبات والعروض'
        : activePage === 'projects' ? 'مشاريعي'
            : activePage === 'chat' ? 'المحادثات'
                : activePage === 'workspace' ? `مساحة العمل: ${workspaceProject?.title || ''}`
                    : 'استكشف الخبراء';

    // 👇 same logic as the old ExplorePage filter
    const industryOptions = useMemo(() => [
        { value: 'all', label: 'الكل' },
        ...defaultIndustries.map((industry) => ({
            value: industry,
            label: industry,
        })),
    ], []);

    const pageFilters = {
        explore: {
            label: 'المجال',
            options: industryOptions,
        },
        requests: {
            label: 'الحالة',
            options: [
                { value: 'all', label: 'الكل' },
                { value: 'with_proposals', label: 'لديه عروض' },
                { value: 'no_proposals', label: 'بدون عروض' },
            ],
        },
        projects: {
            label: 'الحالة',
            options: [
                { value: 'all', label: 'الكل' },
                { value: 'pending_payment', label: 'بانتظار الدفع' },
                { value: 'active', label: 'نشط' },
                { value: 'completed', label: 'مكتمل' },
            ],
        },
        chat: {
            label: 'الترتيب',
            options: [
                { value: 'all', label: 'الأحدث' },
                { value: 'unread', label: 'غير مقروءة' },
            ],
        },
        workspace: {
            label: '',
            options: [],
        },
    };

    const currentFilter = pageFilters[activePage] || pageFilters.explore;

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(search.trim());
    };

    const submitRequest = (request, requestId, onSuccess) => {
        const resolvedProviderType = request.providerType === 'specific' ? 'specific' : 'public';
        const payload = {
            title: request.title,
            category: request.category,
            provider_type: resolvedProviderType,
            targeted_freelancer_id: request.targetedFreelancerId,
            description: request.description,
        };

        // Close modal immediately for instant perceived send speed
        if (onSuccess) {
            onSuccess();
        }

        if (requestId) {
            setRequestsList((prev) =>
                prev.map((item) =>
                    String(item.id) === String(requestId)
                        ? {
                              ...item,
                              title: request.title,
                              category: request.category,
                              providerType: resolvedProviderType,
                              targetedFreelancer: request.targetedFreelancer || item.targetedFreelancer,
                              targetedFreelancerId: request.targetedFreelancerId,
                              description: request.description,
                          }
                        : item
                )
            );
            pendingMutationsRef.current += 1;
            router.put(`/company/briefs/${requestId}`, payload, {
                preserveScroll: true,
                onFinish: () => {
                    pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
                },
            });
        } else {
            const tempId = `temp-${Date.now()}`;
            const optimisticItem = {
                id: tempId,
                title: request.title,
                category: request.category,
                providerType: resolvedProviderType,
                description: request.description,
                status: 'open',
                proposalsCount: 0,
                targetedFreelancer: request.targetedFreelancer || null,
                targetedFreelancerId: request.targetedFreelancerId || null,
                createdAt: new Date().toISOString(),
                proposals: [],
            };
            setRequestsList((prev) => [optimisticItem, ...prev]);
            pendingMutationsRef.current += 1;
            router.post('/company/briefs', payload, {
                preserveScroll: true,
                onError: () => {
                    setRequestsList((prev) => prev.filter((item) => item.id !== tempId));
                },
                onFinish: () => {
                    pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
                },
            });
        }
    };

    const handleDeleteRequest = (requestId) => {
        setRequestsList((prev) => prev.filter((item) => String(item.id) !== String(requestId)));
        pendingMutationsRef.current += 1;
        router.delete(`/company/briefs/${requestId}`, {
            preserveScroll: true,
            onFinish: () => {
                pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
            },
        });
    };

    // Handler for navigating back from workspace to projects list
    const handleBackFromWorkspace = () => {
        router.visit('/company?tab=projects');
    };

    return (
        <div dir="rtl" className="flex h-screen bg-gray-50 font-sans">
            {isNavigating && <div className="fixed inset-x-0 top-0 z-100 h-0.5 bg-[#ffb548] animate-pulse" />}
            <Sidebar activePage={activePage === 'workspace' ? 'projects' : activePage} isSidebarOpen={isSidebarOpen} />

            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <Header
                    pageTitle={pageTitle}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    search={search}
                    setSearch={setSearch}
                    searchPlaceholder={searchPlaceholder}
                    onSearchSubmit={handleSearch}
                    filterLabel={currentFilter.label}
                    filterOptions={currentFilter.options}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />

                <div ref={mainContentRef} className={`flex-1 ${activePage === 'chat' && conversation ? 'flex flex-col min-h-0 overflow-hidden p-3 sm:p-5 w-full h-full' : 'overflow-y-auto p-8 max-w-7xl mx-auto w-full'}`}>
                    {activePage === 'requests' && (
                        <MyRequestsPage
                            requests={requestsList}
                            freelancers={freelancers}
                            onSubmit={submitRequest}
                            onDelete={handleDeleteRequest}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                    {activePage === 'projects' && (
                        <MyProjectsPage
                            projects={projects}
                            search={search}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                    )}
                    {activePage === 'chat' && (
                        <ChatPage
                            conversation={conversation}
                            conversations={conversations}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                    {activePage === 'explore' && (
                        <ExplorePage
                            freelancers={exploreFreelancers}
                            onSubmit={submitRequest}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                    {activePage === 'workspace' && workspaceProject && (
                        <ProjectWorkspace
                            project={workspaceProject}
                            onBack={handleBackFromWorkspace}
                        />
                    )}
                </div>
            </main>

            {/* Floating Toast Notification */}
            <div
                className={`fixed bottom-8 start-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out ${
                    showToast && flash.success
                        ? 'translate-y-0 opacity-100 scale-100'
                        : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
                }`}
            >
                {flash.success && (
                    <div className="bg-white border border-emerald-200 shadow-xl shadow-emerald-900/10 rounded-2xl p-4 pe-12 flex items-center gap-3 relative min-w-[320px]">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800">تم بنجاح</p>
                            <p className="text-xs text-slate-500 font-medium">{flash.success}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowToast(false)}
                            className="absolute inset-e-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            <SilaAssistant />
        </div>
    );
}