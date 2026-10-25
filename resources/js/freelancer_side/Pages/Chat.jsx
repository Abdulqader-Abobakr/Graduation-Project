import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import ProposalFormModal from '../Components/ProposalFormModal';
import {
    ArrowRight,
    Clock,
    FileText,
    MessageSquare,
    Send,
    Trash2,
} from 'lucide-react';

export default function Chat({ conversation, conversations = [], search = '' }) {
    const { auth } = usePage().props;
    const [messages, setMessages] = useState(conversation?.messages || []);
    const [conversationsList, setConversationsList] = useState(conversations || []);
    const [body, setBody] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const prevCountRef = useRef((conversation?.messages || []).length);

    // Sync conversations prop when Inertia updates
    useEffect(() => {
        setConversationsList(conversations || []);
    }, [conversations]);

    // Sync messages when active conversation changes
    useEffect(() => {
        const initial = conversation?.messages || [];
        setMessages(initial);
        prevCountRef.current = initial.length;
    }, [conversation?.id]);

    // Auto-scroll when a new message is added or conversation opens
    useEffect(() => {
        if (!conversation?.id) return;
        if (messages.length >= prevCountRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevCountRef.current = messages.length;
    }, [messages.length, conversation?.id]);

    // Fast polling for open conversation (1000ms interval, backed by local cache on server)
    useEffect(() => {
        if (!conversation?.id) return;

        let timeoutId;
        let isMounted = true;

        const pollMessages = async () => {
            if (!isMounted || document.hidden) {
                if (isMounted) timeoutId = setTimeout(pollMessages, 1000);
                return;
            }
            try {
                const res = await fetch(`/freelancer/chat/${conversation.id}/messages`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    cache: 'no-store',
                });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (Array.isArray(data.messages)) {
                        setMessages((prev) => {
                            const pendingTemps = prev.filter((m) => String(m.id).startsWith('temp-'));
                            const nextList = [...data.messages, ...pendingTemps];
                            if (
                                nextList.length === prev.length &&
                                nextList.every((m, idx) => String(m.id) === String(prev[idx]?.id))
                            ) {
                                return prev;
                            }
                            return nextList;
                        });
                    }
                }
            } catch (_) {
                // Retry on next cycle
            }
            if (isMounted) timeoutId = setTimeout(pollMessages, 1000);
        };

        timeoutId = setTimeout(pollMessages, 1000);

        const onVisibility = () => {
            if (!document.hidden && isMounted) {
                clearTimeout(timeoutId);
                pollMessages();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [conversation?.id]);

    // Auto-refresh conversations overview list when on the overview screen
    useEffect(() => {
        if (conversation?.id) return;

        let timeoutId;
        let isMounted = true;

        const pollConversations = async () => {
            if (!isMounted || document.hidden) {
                if (isMounted) timeoutId = setTimeout(pollConversations, 2500);
                return;
            }
            try {
                const res = await fetch('/freelancer/chat-list', {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    cache: 'no-store',
                });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (Array.isArray(data.conversations)) {
                        setConversationsList(data.conversations);
                    }
                }
            } catch (_) {
                // Retry on next cycle
            }
            if (isMounted) timeoutId = setTimeout(pollConversations, 2500);
        };

        timeoutId = setTimeout(pollConversations, 2500);

        const onVisibility = () => {
            if (!document.hidden && isMounted) {
                clearTimeout(timeoutId);
                pollConversations();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [conversation?.id]);

    // Optimistic instant send message
    const sendMessage = useCallback(
        async (e) => {
            e.preventDefault();
            const trimmed = body.trim();
            if (!trimmed || !conversation?.id) return;

            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const now = new Date();
            const optimisticMsg = {
                id: tempId,
                conversation_id: conversation.id,
                sender_id: auth?.user?.id,
                body: trimmed,
                mine: true,
                created_at: now.toISOString(),
                time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                sender: {
                    id: auth?.user?.id,
                    user_name: auth?.user?.user_name || 'أنت',
                    avatar: auth?.user?.avatar_path,
                },
            };

            setBody('');
            setMessages((prev) => [...prev, optimisticMsg]);
            inputRef.current?.focus();

            try {
                const res = await fetch(`/freelancer/chat/${conversation.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    },
                    body: JSON.stringify({ body: trimmed }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data?.message) {
                        setMessages((prev) => {
                            const alreadyHasReal = prev.some((m) => String(m.id) === String(data.message.id));
                            if (alreadyHasReal) {
                                return prev.filter((m) => m.id !== tempId);
                            }
                            return prev.map((m) => (m.id === tempId ? data.message : m));
                        });
                    }
                } else {
                    setMessages((prev) => prev.filter((m) => m.id !== tempId));
                    setBody(trimmed);
                }
            } catch (_) {
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                setBody(trimmed);
            }
        },
        [body, conversation?.id, auth?.user]
    );

    // Delete conversation
    const handleDeleteChat = (chatId) => {
        const idToDelete = chatId || conversation?.id;
        if (!idToDelete) return;
        if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟ سيتم مسح الرسائل المرتبطة بها.')) {
            return;
        }

        setDeletingId(idToDelete);
        router.delete(`/freelancer/chat/${idToDelete}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    // Return to all chats (Back button)
    const handleBackToChats = () => {
        router.visit('/freelancer/chat', {
            preserveScroll: true,
            preserveState: false,
        });
    };

    // Open a specific chat
    const handleSelectChat = (chatId) => {
        router.visit(`/freelancer/chat?conversation=${chatId}`, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    // Filter conversations using header search prop
    const filteredConversations = useMemo(() => {
        const q = (search || '').toLowerCase().trim();
        const list = conversation?.id
            ? conversationsList.map((c) => (String(c.id) === String(conversation.id) ? { ...c, hasNewClientMessage: false } : c))
            : conversationsList;
        if (!q) return list;
        return list.filter((c) => {
            const name = (c.client?.name || '').toLowerCase();
            const title = (c.requestTitle || c.subject || '').toLowerCase();
            const lastMsg = (c.lastMessage || '').toLowerCase();
            return name.includes(q) || title.includes(q) || lastMsg.includes(q);
        });
    }, [conversationsList, conversation?.id, search]);

    // Active conversation details
    const clientName = typeof conversation?.client === 'object'
        ? conversation.client?.name || conversation.client?.user_name || 'العميل'
        : conversation?.client || 'العميل';
    const clientAvatar = typeof conversation?.client === 'object'
        ? conversation.client?.avatar || conversation.client?.avatar_path
        : null;
    const requestTitle = conversation?.requestTitle || conversation?.subject || '';

    // ==========================================
    // VIEW 1: OPEN CHAT CONVERSATION
    // ==========================================
    if (conversation) {
        return (
            <div className="w-full flex-1 min-h-0 h-full rounded-2xl border border-[#e6e4de] bg-white shadow-sm overflow-hidden flex flex-col font-sans" dir="rtl">
                {/* Chat Top Header */}
                <header className="px-6 py-4 bg-[#fcfbf9] border-b border-[#e6e4de] flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Back Button to see all chats */}
                        <button
                            type="button"
                            onClick={handleBackToChats}
                            className="p-2 rounded-xl text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                            title="العودة إلى جميع المحادثات"
                            aria-label="العودة إلى جميع المحادثات"
                        >
                            <ArrowRight size={20} />
                        </button>

                        <div className="h-6 w-px bg-[#e6e4de] shrink-0" />

                        {/* Client Avatar */}
                        {clientAvatar ? (
                            <img
                                src={clientAvatar}
                                alt={clientName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-primary/20 shrink-0">
                                {clientName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Client Name & Request Title */}
                        <div className="min-w-0">
                            <h1 className="text-base font-bold text-[#28251d] truncate">
                                {clientName}
                            </h1>

                            {requestTitle && (
                                <p className="text-xs text-[#7a7974] font-medium truncate mt-0.5 flex items-center gap-1">
                                    <FileText size={12} className="text-primary shrink-0" />
                                    <span>الطلب: {requestTitle}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsProposalModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                            <FileText size={14} />
                            <span>تقديم عرض سعر</span>
                        </button>
                    </div>
                </header>

                {/* Messages Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#fbfbfa]">
                    {messages.length > 0 ? (
                        messages.map((message) => {
                            const isMine = message.mine ?? String(message.sender_id) === String(auth?.user?.id);
                            const timeString = message.time || (message.created_at ? new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '');

                            return (
                                <div
                                    key={message.id}
                                    className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                                >
                                    <span className="text-[10px] font-semibold text-[#7a7974] px-2 mb-1">
                                        {isMine ? 'أنت' : (message.sender?.user_name || clientName)}
                                    </span>
                                    <div
                                        className={`max-w-[75%] px-4 py-3 text-sm shadow-2xs break-words leading-relaxed ${
                                            isMine
                                                ? 'bg-primary text-white rounded-2xl rounded-tr-xs'
                                                : 'bg-white text-[#28251d] border border-[#e6e4de] rounded-2xl rounded-tl-xs'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{message.body}</p>
                                        {timeString && (
                                            <div className={`mt-1.5 text-[10px] text-left ${isMine ? 'text-white/75' : 'text-[#7a7974]'}`}>
                                                {timeString}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16 text-[#7a7974]">
                            <MessageSquare size={36} className="text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-[#28251d]">لا توجد رسائل بعد</p>
                            <p className="text-xs text-[#7a7974] mt-1 max-w-xs">
                                ابدأ بكتابة رسالتك لمناقشة تفاصيل الطلب والاتفاق مع العميل.
                            </p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input Footer */}
                <form
                    onSubmit={sendMessage}
                    className="p-3.5 md:p-4 bg-white border-t border-[#e6e4de] flex items-center gap-3 shrink-0"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="اكتب رسالتك للعميل..."
                        className="min-w-0 flex-1 rounded-xl border border-[#d4d1ca] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all bg-[#faf9f6] text-[#28251d]"
                    />

                    <button
                        type="submit"
                        disabled={!body.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1b62c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 cursor-pointer"
                        title="إرسال"
                    >
                        <Send size={16} />
                        <span>إرسال</span>
                    </button>
                </form>
            </div>
        );
    }

    // ==========================================
    // VIEW 2: ALL CHATS LIST (Overview Screen)
    // ==========================================
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 font-sans" dir="rtl">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#28251d]">المحادثات</h1>
                    <p className="text-sm text-[#7a7974] mt-1">تواصل مباشرة مع العملاء لمناقشة الطلبات والعروض والمشاريع.</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        {conversationsList.length} {conversationsList.length === 1 ? 'محادثة' : 'محادثات'}
                    </span>
                </div>
            </div>

            {/* Conversations List */}
            {filteredConversations.length > 0 ? (
                <div className="space-y-3">
                    {filteredConversations.map((conv) => {
                        const convName = conv.client?.name || 'عميل';
                        const convAvatar = conv.client?.avatar;
                        const convTitle = conv.requestTitle || conv.subject || '';

                        return (
                            <div
                                key={conv.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectChat(conv.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSelectChat(conv.id);
                                    }
                                }}
                                className="w-full text-right bg-white rounded-2xl border border-[#e6e4de] p-5 shadow-2xs hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-4 group"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Client Avatar */}
                                    {convAvatar ? (
                                        <img
                                            src={convAvatar}
                                            alt={convName}
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                                            {convName.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="min-w-0 text-right">
                                        <h2 className="text-base font-bold text-[#28251d] group-hover:text-primary transition-colors truncate">
                                            {convName}
                                        </h2>

                                        {convTitle && (
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#7a7974] truncate">
                                                <FileText size={12} className="text-primary shrink-0" />
                                                <span className="font-semibold text-slate-700 truncate">
                                                    الطلب: {convTitle}
                                                </span>
                                            </div>
                                        )}

                                        {conv.lastMessage && (
                                            <p className="text-xs text-[#7a7974] truncate mt-1.5 max-w-lg">
                                                {conv.lastMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {conv.updatedAt && (
                                            <span className="text-xs text-[#7a7974] flex items-center gap-1">
                                                <Clock size={12} />
                                                {conv.updatedAt}
                                            </span>
                                        )}
                                        {conv.hasNewClientMessage && (
                                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                رسالة جديدة
                                            </span>
                                        )}
                                    </div>

                                    {/* Delete Button on Card */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChat(conv.id);
                                        }}
                                        disabled={deletingId === conv.id}
                                        title="حذف المحادثة"
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={18} className={deletingId === conv.id ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#e6e4de] p-8 shadow-sm">
                    <MessageSquare size={48} className="text-slate-300 mb-3" />
                    <h2 className="text-lg font-bold text-[#28251d]">
                        {search ? 'لا توجد محادثات مطابقة للبحث' : 'لا توجد محادثات حالياً'}
                    </h2>
                    <p className="text-sm text-[#7a7974] mt-1 max-w-md">
                        {search
                            ? 'جرب البحث بكلمات مختلفة أو اسم العميل.'
                            : 'عندما يبدأ أحد العملاء مناقشة عرضك أو يتواصل معك، ستظهر المحادثة المباشرة هنا.'}
                    </p>
                </div>
            )}

            {/* Proposal Form Modal */}
            {isProposalModalOpen && conversation && (
                <ProposalFormModal
                    isOpen={true}
                    onClose={() => setIsProposalModalOpen(false)}
                    chatId={conversation.id}
                    clientName={clientName}
                    clientRequest={requestTitle}
                    initialData={{
                        title: requestTitle || '',
                        price: '',
                        timeline: 'أسبوعين',
                        revision_limit: '2',
                        validity: '7 أيام',
                        additional_terms: '',
                        milestones: [{ id: Date.now(), title: '', description: '' }],
                    }}
                />
            )}
        </div>
    );
}
