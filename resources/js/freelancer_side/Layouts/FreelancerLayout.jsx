import { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
  Wallet,
  ChevronLeft,
  Search,
  Briefcase,
  MessageSquare,
  Menu,
  Settings,
  LogOut
} from 'lucide-react';
import logo from '../assets/logo.png';

const getNavItems = (chatBadge) => [
  { icon: <LayoutDashboard size={20} />, label: 'الرئيسية', href: '/freelancer' },
  { icon: <ClipboardList size={20} />, label: 'العروض والطلبات', href: '/freelancer/proposals' },
  { icon: <FolderOpen size={20} />, label: 'مشاريعي', href: '/freelancer/projects' },
  { icon: <MessageSquare size={20} />, label: 'المحادثات', href: '/freelancer/chat', badge: chatBadge },
  { icon: <Briefcase size={20} />, label: 'خدماتي', href: '/freelancer/services' },
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [search, setSearch] = useState('');
  const mainContentRef = useRef(null);

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
        : currentPath.startsWith('/freelancer/services')
          ? 'ابحث عن خدمة أو تخصص...'
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
    <div dir="rtl" className="flex h-screen bg-gray-50 font-sans">
      {isNavigating && <div className="fixed inset-x-0 top-0 z-100 h-0.5 bg-[#ffb548] animate-pulse" />}
      {/* Sidebar (ON THE RIGHT SIDE IN RTL) */}
      <aside
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-primary text-white border-none flex flex-col transition-all duration-300 relative z-50 shrink-0`}
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
            label="ملفي الشخصي"
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
        <header className="relative flex h-16 items-center justify-center border-b border-slate-200 bg-white px-8 shrink-0 z-40">
          <div className="absolute inset-s-8 flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'فتح القائمة الجانبية' : 'طي القائمة الجانبية'}
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
          <form onSubmit={handleSearch} dir="rtl" className="hidden w-full max-w-2xl flex-row-reverse md:flex">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 rounded-e-full border border-s-0 border-slate-200 bg-slate-50 py-2 pe-4 ps-5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button type="submit" aria-label="بحث" className="flex w-12 shrink-0 items-center justify-center rounded-s-full border border-primary bg-primary text-white transition hover:bg-primary-dark">
              <Search size={18} />
            </button>
          </form>
        </header>

        {/* Scrollable Body / Children Content */}
        <div
          ref={mainContentRef}
          className={`flex-1 ${
            isChatWithConversation
              ? 'flex flex-col min-h-0 overflow-hidden p-3 sm:p-5 w-full h-full'
              : isChatPage
                ? 'overflow-y-auto p-6 w-full h-full'
                : 'overflow-y-auto'
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
