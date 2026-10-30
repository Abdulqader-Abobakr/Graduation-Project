import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
  Wallet,
  ChevronLeft,
  Search,
  MessageSquare,
  Menu,
  Settings,
  LogOut,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import logo from '../assets/logo.png';
import SilaAssistant from '../../Components/shared/SilaAssistant';

export const FreelancerLayoutContext = createContext({
  activeFilter: 'all',
  setActiveFilter: () => {},
  search: '',
  setSearch: () => {},
});

export const useFreelancerFilter = () => useContext(FreelancerLayoutContext);

const pageFilters = {
  dashboard: {
    label: 'مجال الطلب',
    options: [
      { value: 'all', label: 'الكل' },
      { value: 'tech', label: 'برمجة وتطوير' },
      { value: 'design', label: 'تصميم وإبداع' },
      { value: 'marketing', label: 'تسويق ومبيعات' },
      { value: 'writing', label: 'كتابة وترجمة' },
      { value: 'business', label: 'أعمال واستشارات' },
    ],
  },
  projects: {
    label: 'حالة المشروع',
    options: [
      { value: 'all', label: 'الكل' },
      { value: 'active', label: 'قيد التنفيذ' },
      { value: 'revision', label: 'مطلوب تعديل' },
      { value: 'awaiting', label: 'بانتظار المراجعة' },
      { value: 'completed', label: 'مكتمل' },
    ],
  },
  proposals: {
    label: 'التصنيف والحالة',
    options: [
      { value: 'all', label: 'الكل' },
      { value: 'direct', label: 'طلبات مباشرة' },
      { value: 'sent', label: 'العروض المرسلة' },
      { value: 'pending', label: 'عروض قيد المراجعة' },
      { value: 'accepted', label: 'عروض مقبولة' },
      { value: 'rejected', label: 'عروض مرفوضة' },
    ],
  },
  earnings: {
    label: 'الفترة الزمنية',
    options: [
      { value: 'all', label: 'جميع الفترات' },
      { value: 'today', label: 'اليوم' },
      { value: 'week', label: 'آخر 7 أيام' },
      { value: 'month', label: 'هذا الشهر' },
      { value: 'last_month', label: 'الشهر الماضي' },
      { value: 'year', label: 'هذا العام' },
    ],
  },
  chat: {
    label: 'المحادثات',
    options: [
      { value: 'all', label: 'جميع المحادثات' },
      { value: 'unread', label: 'غير مقروءة' },
    ],
  },
};

const resolvePageKey = (path, isChatWithConversation) => {
  if (path === '/freelancer' || path === '/freelancer/') return 'dashboard';
  if (path.startsWith('/freelancer/projects/') && path !== '/freelancer/projects') return 'workspace';
  if (path.startsWith('/freelancer/projects')) return 'projects';
  if (path.startsWith('/freelancer/proposals')) return 'proposals';
  if (path.startsWith('/freelancer/earnings')) return 'earnings';
  if (path.startsWith('/freelancer/chat')) {
    if (isChatWithConversation) return 'chat_open';
    return 'chat';
  }
  return null;
};

const getNavItems = (chatBadge) => [
  { icon: <LayoutDashboard size={20} />, label: 'الرئيسية', href: '/freelancer' },
  { icon: <ClipboardList size={20} />, label: 'العروض والطلبات', href: '/freelancer/proposals' },
  { icon: <FolderOpen size={20} />, label: 'مشاريعي', href: '/freelancer/projects' },
  { icon: <MessageSquare size={20} />, label: 'المحادثات', href: '/freelancer/chat', badge: chatBadge },
  { icon: <Wallet size={20} />, label: 'الأرباح', href: '/freelancer/earnings' },
];

const NavItem = ({ icon, label, href, collapsed, badge, active }) => (
  <Link
    href={href}
    title={collapsed ? label : ''}
    className={`flex min-h-10 w-full text-right items-center ${
      collapsed ? 'justify-center mx-1' : 'gap-2 px-3 py-2.5'
    } rounded-xl text-base transition-all group relative ${
      active
        ? 'bg-white border-s-4 border-[#ffb548] text-primary font-bold shadow-sm'
        : 'border-s-4 border-transparent text-white hover:bg-white/15 hover:text-white'
    }`}
  >
    <span className={`shrink-0 ${active ? 'text-primary' : 'text-white'}`}>{icon}</span>
    {!collapsed && (
      <>
        <span className="min-w-0 flex-1 whitespace-nowrap text-start font-medium">{label}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-primary text-white' : 'bg-white/15 text-white'}`}>
            {badge}
          </span>
        )}
      </>
    )}
  </Link>
);

export default function FreelancerLayout({ children }) {
  const { url, props } = usePage();
  const { auth } = props;
  const currentUrlObj = new URL(url, window.location.origin);
  const currentPath = currentUrlObj.pathname;
  const isChatPage = currentPath.startsWith('/freelancer/chat');
  const isChatWithConversation = isChatPage && (Boolean(props.conversation) || Boolean(currentUrlObj.searchParams.get('conversation')) || currentPath !== '/freelancer/chat');
  const chatBadge = !isChatWithConversation && props.unreadChatCount > 0 ? props.unreadChatCount : null;
  const navItems = getNavItems(chatBadge);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => (
    typeof window !== 'undefined' && window.innerWidth < 768
  ));
  const [isNavigating, setIsNavigating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const mainContentRef = useRef(null);

  const activePageKey = resolvePageKey(currentPath, isChatWithConversation);
  const currentFilter = activePageKey ? (pageFilters[activePageKey] || { label: '', options: [] }) : { label: '', options: [] };
  const isFiltering = activeFilter !== 'all';

  useEffect(() => {
    setActiveFilter('all');
    setIsFilterOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (val) => {
    setActiveFilter(val);
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [currentPath]);

  useEffect(() => {
    const currentUrl = new URL(url, window.location.origin);
    setSearch(currentUrl.searchParams.get('search') || '');
  }, [url]);

  const searchPlaceholder = currentPath.startsWith('/freelancer/chat')
    ? 'ابحث في الرسائل أو المرسل...'
    : currentPath.startsWith('/freelancer/projects')
      ? 'ابحث عن مشروع أو عميل...'
      : currentPath.startsWith('/freelancer/proposals')
        ? 'ابحث عن عرض أو طلب أو عميل...'
        : currentPath.startsWith('/freelancer/earnings')
          ? 'ابحث في المعاملات أو الأرباح...'
          : 'ابحث عن طلب متاح أو عميل...';

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();
    const currentPath = url.split('?')[0] || '/freelancer';
    const only = currentPath === '/freelancer'
      ? ['openBriefs']
      : currentPath.startsWith('/freelancer/projects')
        ? ['projects']
        : currentPath.startsWith('/freelancer/proposals')
          ? ['directOrders', 'sentProposals']
          : currentPath.startsWith('/freelancer/chat')
            ? ['conversations', 'search']
            : undefined;

    if (!query) {
      router.get(currentPath, {}, { only, preserveScroll: true });
      return;
    }

    router.get(currentPath, { search: query }, {
      only,
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  useEffect(() => {
    const removeStart = router.on('start', () => setIsNavigating(true));
    const removeFinish = router.on('finish', () => setIsNavigating(false));

    return () => {
      removeStart();
      removeFinish();
    };
  }, []);

  return (
    <div dir="rtl" className="relative flex h-dvh min-h-screen bg-gray-50 font-sans">
      {isNavigating && <div className="fixed inset-x-0 top-0 z-100 h-0.5 bg-[#ffb548] animate-pulse" />}
      {!isSidebarCollapsed && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}
      {/* Sidebar (ON THE RIGHT SIDE IN RTL) */}
      <aside
        className={`${isSidebarCollapsed ? 'w-20 max-md:translate-x-full' : 'w-64 translate-x-0'} max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-64 bg-primary text-white border-none flex flex-col transition-all duration-300 relative z-50 shrink-0`}
      >
        {/* Logo */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-center transition-all duration-300">
          <div
            className={`rounded-2xl bg-white flex items-center justify-center shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'w-10 h-10 p-1.5' : 'w-24 h-24 p-4'
              }`}
          >
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-contain transition-all duration-300"
            />
          </div>
        </div>

        <div className={`h-px bg-white/20 mb-2 ${isSidebarCollapsed ? 'mx-4' : 'mx-6'}`} />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-hidden">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={isSidebarCollapsed}
              active={item.href === '/freelancer' ? currentPath === '/freelancer' : currentPath.startsWith(item.href)}
            />
          ))}
        </nav>

        <div className="border-t border-white/20 px-3 py-3 space-y-1">
          <NavItem
            icon={auth?.user?.avatar_path ? (
              <img src={auth.user.avatar_path} alt="Profile" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/70" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                {auth?.user?.user_name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
            )}
            label={auth?.user?.user_name || auth?.user?.name || 'الملف الشخصي'}
            href="/freelancer/profile"
            collapsed={isSidebarCollapsed}
            active={currentPath.startsWith('/freelancer/profile')}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="الإعدادات"
            href="/freelancer/settings"
            collapsed={isSidebarCollapsed}
            active={currentPath.startsWith('/freelancer/settings')}
          />
          <Link
            href="/logout"
            method="post"
            as="button"
            replace
            className={`flex min-h-10 w-full items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2 px-3 py-2.5'} rounded-xl border-s-4 border-transparent text-white transition-all hover:bg-red-500 hover:text-white cursor-pointer`}
            title={isSidebarCollapsed ? 'تسجيل الخروج' : undefined}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="font-bold">تسجيل الخروج</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Top Header */}
        <header className="relative flex h-16 items-center justify-center border-b border-slate-200 bg-white px-8 shrink-0 z-40" dir="rtl">
          <div className="absolute inset-s-8 flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'فتح القائمة الجانبية' : 'طي القائمة الجانبية'}
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-xl transition-colors cursor-pointer"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex w-full max-w-3xl flex-wrap items-center gap-2">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative flex min-w-0 flex-1 basis-full flex-row-reverse sm:basis-auto">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 rounded-e-full border border-s-0 border-slate-200 bg-slate-50 py-2 pe-4 ps-10 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    const currentPath = url.split('?')[0] || '/freelancer';
                    if (new URL(url, window.location.origin).searchParams.has('search')) {
                      router.get(currentPath, {}, { preserveScroll: true, preserveState: true });
                    }
                  }}
                  className="absolute start-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="مسح حقل البحث"
                  aria-label="مسح حقل البحث"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                aria-label="بحث"
                className="flex w-12 shrink-0 items-center justify-center rounded-s-full border border-primary bg-primary text-white transition hover:bg-primary-dark cursor-pointer"
              >
                <Search size={18} />
              </button>
            </form>

            {/* Filter Toggle Button & Dropdown (Matching Company side) */}
            {currentFilter.options?.length > 0 && (
              <div className="relative shrink-0" ref={filterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((v) => !v)}
                  aria-expanded={isFilterOpen}
                  className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isFilterOpen || isFiltering
                      ? 'border-primary text-primary shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal size={18} />
                  <span>تصفية</span>
                  {isFiltering && (
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  )}
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full mt-2 end-0 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-start">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{currentFilter.label}</p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange('all')}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary cursor-pointer"
                        >
                          <X size={14} />
                          مسح التصفية
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {currentFilter.options.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => {
                            handleFilterChange(opt.value);
                            setIsFilterOpen(false);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            activeFilter === opt.value
                              ? 'bg-primary text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-transparent'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Body / Children Content */}
        <div
          ref={mainContentRef}
          className={`flex-1 ${
            isChatWithConversation
              ? 'flex flex-col min-h-0 overflow-hidden p-3 sm:p-5 w-full h-full'
              : isChatPage
                ? 'overflow-y-auto p-4 sm:p-6 w-full h-full'
                : 'overflow-y-auto'
          }`}
        >
          {React.isValidElement(children)
            ? React.cloneElement(children, {
                activeFilter,
                onFilterChange: handleFilterChange,
                filter: activeFilter,
                setFilter: handleFilterChange,
                search,
                setSearch,
              })
            : children}
        </div>
      </main>
      <SilaAssistant />
    </div>
  );
}
