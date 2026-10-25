import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { LayoutDashboard, ClipboardList, FolderOpen, MessageSquare, Settings, LogOut } from 'lucide-react';

function NavItem({ icon, label, active = false, badge = null, isSidebarOpen = true, href }) {
    const base = `flex min-h-10 items-center ${isSidebarOpen ? 'gap-2 px-3 py-2.5' : 'justify-center mx-1'} rounded-xl text-base transition-all group relative`;
    const style = active
        ? 'bg-white border-s-4 border-[#ffb548] text-primary font-bold shadow-sm'
        : 'border-s-4 border-transparent text-white hover:bg-white/15 hover:text-white';

    return (
        <Link
            href={href}
            preserveScroll
            className={`${base} w-full text-right ${style}`}
            title={!isSidebarOpen ? label : ''}
        >
            <span className={`shrink-0 ${active ? 'text-primary' : 'text-white'}`}>{icon}</span>
            {isSidebarOpen && (
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
}

export default function Sidebar({ activePage, onPageChange, isSidebarOpen }) {
    const { url, props } = usePage();
    const currentPath = typeof window !== 'undefined' ? new URL(url, window.location.origin).pathname : '';
    const authUser = props.auth?.user;
    const avatar = authUser?.avatar_path || '';
    const chatBadge = props.unreadChatCount > 0 ? props.unreadChatCount : null;

    return (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-primary text-white border-none flex flex-col transition-all duration-300 relative z-50 shrink-0`}>
            <div className="p-4 mb-4 flex items-center justify-center transition-all duration-300">
                <div className={`rounded-2xl bg-white flex items-center justify-center shadow-sm transition-all duration-300 ${isSidebarOpen ? 'w-24 h-24 p-4' : 'w-10 h-10 p-1.5'}`}>
                    <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain transition-all duration-300" />
                </div>
            </div>

            <div className={`h-px bg-white/20 mb-4 ${isSidebarOpen ? 'mx-6' : 'mx-4'}`} />

            <nav className="flex-1 px-3 space-y-1 overflow-hidden">
                <NavItem icon={<LayoutDashboard size={20} />} label="استكشف" href="/company?tab=explore" active={activePage === 'explore'} isSidebarOpen={isSidebarOpen} />
                <NavItem icon={<ClipboardList size={20} />} label="الطلبات والعروض" href="/company?tab=requests" active={activePage === 'requests'} isSidebarOpen={isSidebarOpen} />
                <NavItem icon={<FolderOpen size={20} />} label="مشاريعي" href="/company?tab=projects" active={activePage === 'projects'} isSidebarOpen={isSidebarOpen} />
                <NavItem icon={<MessageSquare size={20} />} label="المحادثات" href="/company?tab=chat" badge={chatBadge} active={activePage === 'chat'} isSidebarOpen={isSidebarOpen} />
            </nav>

            <div className="border-t border-white/20 px-3 py-3 space-y-1">
                <NavItem
                    icon={avatar ? (
                        <img src={avatar} alt="Profile" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/70" />
                    ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                            {authUser?.user_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                    )}
                    label="ملفي الشخصي"
                    href="/company/profile"
                    active={activePage === 'profile' || currentPath.startsWith('/company/profile')}
                    isSidebarOpen={isSidebarOpen}
                />
                <NavItem
                    icon={<Settings size={20} />}
                    label="الإعدادات"
                    href="/company/settings"
                    active={activePage === 'settings' || currentPath.startsWith('/company/settings')}
                    isSidebarOpen={isSidebarOpen}
                />
                <Link href="/logout" method="post" as="button" replace className={`flex min-h-10 w-full items-center ${isSidebarOpen ? 'gap-2 px-3 py-2.5' : 'justify-center'} rounded-xl border-s-4 border-transparent text-white transition-all hover:bg-red-500 hover:text-white cursor-pointer`}>
                    <LogOut size={20} />
                    {isSidebarOpen && <span className="font-bold">تسجيل الخروج</span>}
                </Link>
            </div>
        </aside>
    );
}

