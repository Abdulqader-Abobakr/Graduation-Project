import React, { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    BotMessageSquare,
    Send,
    X,
    RotateCcw,
    GripVertical
} from 'lucide-react';

export default function SilaAssistant() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isCompany = user?.role === 'client_company' || user?.role === 'company';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'assistant',
            text: user?.user_name
                ? `أهلاً بك يا ${user.user_name}! 👋\nأنا مرشد منصة صِلة. كيف يمكنني مساعدتك اليوم بشأن استخدام الواجهات، إدارة المشاريع، أو العمليات المالية؟`
                : 'أهلاً بك في منصة صِلة! 👋\nأنا مرشد المنصة. كيف يمكنني مساعدتك اليوم في التعرف على خدمات المنصة وطريقة الاستخدام؟'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // ── نظام السحب والإفلات الحر (Draggable Button) ─────────────────────
    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('sila_assistant_pos');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
                        return parsed;
                    }
                }
            } catch (e) {}
        }
        return null;
    });

    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!position && typeof window !== 'undefined') {
            setPosition({
                x: 24,
                y: Math.max(24, window.innerHeight - 76),
            });
        }
    }, [position]);

    // مراعاة تغيير حجم الشاشة للحفاظ على بقاء الزر داخل الإطار
    useEffect(() => {
        const handleResize = () => {
            setPosition((prev) => {
                if (!prev) return prev;
                const maxX = Math.max(12, window.innerWidth - 170);
                const maxY = Math.max(12, window.innerHeight - 60);
                return {
                    x: Math.min(Math.max(12, prev.x), maxX),
                    y: Math.min(Math.max(12, prev.y), maxY),
                };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const dragRef = useRef({
        active: false,
        hasMoved: false,
        startX: 0,
        startY: 0,
        initX: 0,
        initY: 0,
    });

    const handlePointerDown = (e) => {
        // الاستجابة للنقر الأيسر بالماوس أو اللمس فقط
        if (e.button !== undefined && e.button !== 0) return;

        const currentX = position ? position.x : 24;
        const currentY = position ? position.y : window.innerHeight - 76;

        dragRef.current = {
            active: true,
            hasMoved: false,
            startX: e.clientX,
            startY: e.clientY,
            initX: currentX,
            initY: currentY,
        };

        const handlePointerMove = (moveEvent) => {
            if (!dragRef.current.active) return;
            const deltaX = moveEvent.clientX - dragRef.current.startX;
            const deltaY = moveEvent.clientY - dragRef.current.startY;

            // تحديد عتبة التحريك للتفريق بين النقر والتحريك
            if (Math.hypot(deltaX, deltaY) > 5) {
                if (!dragRef.current.hasMoved) {
                    dragRef.current.hasMoved = true;
                    setIsDragging(true);
                }
            }

            if (dragRef.current.hasMoved) {
                const btnWidth = 160;
                const btnHeight = 48;
                const minX = 12;
                const maxX = Math.max(12, window.innerWidth - btnWidth - 12);
                const minY = 12;
                const maxY = Math.max(12, window.innerHeight - btnHeight - 12);

                const newX = Math.min(Math.max(minX, dragRef.current.initX + deltaX), maxX);
                const newY = Math.min(Math.max(minY, dragRef.current.initY + deltaY), maxY);

                setPosition({ x: newX, y: newY });
            }
        };

        const handlePointerUp = () => {
            if (!dragRef.current.active) return;
            const moved = dragRef.current.hasMoved;
            dragRef.current.active = false;
            setIsDragging(false);

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            if (!moved) {
                // نقرة عادية: فتح أو إغلاق النافذة
                setIsOpen((prev) => !prev);
            } else {
                // حفظ الموضع الجديد
                setPosition((currentPos) => {
                    if (currentPos) {
                        try {
                            localStorage.setItem('sila_assistant_pos', JSON.stringify(currentPos));
                        } catch (e) {}
                    }
                    return currentPos;
                });
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // مقترحات أسئلة سريعة مبنية على دور المستخدم الحالي
    const quickPrompts = isCompany
        ? [
            'كيف أطرح طلب مشروع جديد؟',
            'كيف يتم حجز الضمان وتحرير المبلغ؟',
            'أين أتابع تسليمات الخبير؟'
        ]
        : user
        ? [
            'كيف أتابع مراحل العمل؟',
            'متى يتحول الرصيد المعلق إلى متاح للسحب؟',
            'كيف أطلب سحب أرباحي؟'
        ]
        : [
            'كيف أطرح طلب مشروع جديد؟',
            'كيف أبدأ كخبير مستقل؟',
            'كيف يتم حجز الضمان المالي؟'
        ];

    const sendMessage = async (textToSend) => {
        const query = textToSend || input;
        if (!query.trim() || loading) return;

        const userMsg = { sender: 'user', text: query };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            const xsrfToken = match ? decodeURIComponent(match[1]) : '';

            const res = await fetch('/assistant/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                },
                body: JSON.stringify({
                    message: query,
                    history: messages.slice(-4),
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessages((prev) => [...prev, { sender: 'assistant', text: data.reply }]);
            } else {
                setMessages((prev) => [...prev, { sender: 'assistant', text: data.reply || data.message || 'حدث خطأ في جلب الإجابة، يرجى المحاولة لاحقاً.' }]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { sender: 'assistant', text: 'تعذر الاتصال بالخادم حالياً. يرجى التأكد من اتصالك بالإنترنت.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const handleResetChat = () => {
        setMessages([
            {
                sender: 'assistant',
                text: user?.user_name
                    ? `أهلاً بك مجدداً يا ${user.user_name} 👋\nتفضل بطرح أي استفسار وسأرشدك خطوة بخطوة.`
                    : 'مرحباً بك مجدداً 👋\nتفضل بطرح أي استفسار وسأرشدك خطوة بخطوة.'
            }
        ]);
    };

    const posX = position ? position.x : 24;
    const posY = position ? position.y : (typeof window !== 'undefined' ? window.innerHeight - 76 : 600);

    // حساب موضع نافذة المحادثة بذكاء نسبةً لموضع الزر على الشاشة
    const chatWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 380) : 380;
    const chatHeight = typeof window !== 'undefined' ? Math.min(window.innerHeight - 100, 520) : 520;

    let chatTop = 24;
    if (typeof window !== 'undefined') {
        if (posY > 300) {
            // الزر كان في النصف السفلي من الشاشة: تفتح النافذة بحيث ينتهي قاعها عند مكان الزر تماماً
            chatTop = Math.max(16, posY - chatHeight + 48);
        } else {
            // الزر في النصف العلوي: تفتح النافذة بدءاً من موضع الزر
            chatTop = Math.min(window.innerHeight - chatHeight - 16, posY);
        }
    }

    const chatLeft = typeof window !== 'undefined'
        ? Math.max(16, Math.min(posX, window.innerWidth - chatWidth - 16))
        : 24;

    return (
        <div className="font-sans" dir="rtl">
            {/* نافذة المحادثة المتموضعة بذكاء بجوار الزر */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: `${chatTop}px`,
                        left: `${chatLeft}px`,
                        width: `${chatWidth}px`,
                        height: `${chatHeight}px`,
                    }}
                    className="z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                    {/* الرأس Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center shadow-xs select-none">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                                <BotMessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">مرشد منصة صِلة</h3>
                                <p className="text-[11px] text-white/80 mt-0.5">
                                    {isCompany
                                        ? 'إرشاد أصحاب المشاريع والشركات'
                                        : user
                                        ? 'إرشاد المستقلين والخبراء'
                                        : 'الدعم والإرشاد المباشر'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleResetChat}
                                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                                title="محادثة جديدة"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                                aria-label="إغلاق"
                                title="إغلاق"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* منطقة الرسائل */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-sm">
                        {messages.map((msg, index) => {
                            const isUser = msg.sender === 'user';
                            return (
                                <div
                                    key={index}
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                                            isUser
                                                ? 'bg-primary text-white rounded-bl-none shadow-xs'
                                                : 'bg-white text-slate-800 border border-slate-200 rounded-br-none shadow-xs'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-500 shadow-xs flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.3s]"></span>
                                    <span className="text-[11px] text-slate-500 ms-1">جاري تحضير الرد...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* أزرار الأسئلة السريعة المخصصة للدور */}
                    <div className="p-2 bg-slate-100/70 border-t border-slate-200 flex gap-1.5 overflow-x-auto text-xs no-scrollbar">
                        {quickPrompts.map((promptText, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => sendMessage(promptText)}
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 whitespace-nowrap hover:bg-primary-light/40 hover:border-primary/40 hover:text-primary text-slate-700 transition cursor-pointer text-xs"
                            >
                                {promptText}
                            </button>
                        ))}
                    </div>

                    {/* حقل الإدخال */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="اطرح استفسارك عن استخدام المنصة..."
                            className="flex-1 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none px-3.5 py-2.5 bg-slate-50 text-slate-800 placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-primary hover:bg-primary-dark disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer shadow-xs flex items-center justify-center"
                        >
                            <Send size={16} className="rtl:-rotate-90" />
                        </button>
                    </form>
                </div>
            )}

            {/* الزر العائم القابل للسحب الحر بالماوس واللمس - يختفي عند فتح البوت */}
            {!isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${posX}px`,
                        top: `${posY}px`,
                        zIndex: 50,
                        touchAction: 'none',
                    }}
                >
                    <div
                        onPointerDown={handlePointerDown}
                        className={`flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl shadow-primary/25 transition-shadow select-none border border-white/20 ${
                            isDragging ? 'cursor-grabbing scale-105 opacity-90 shadow-2xl' : 'cursor-grab'
                        }`}
                        title="انقر للفتح، أو اسحب لتغيير الموضع على الشاشة"
                    >
                        <GripVertical size={14} className="text-white/60 -ms-1 shrink-0" />
                        <BotMessageSquare size={19} className="shrink-0" />
                        <span className="text-sm font-bold whitespace-nowrap">
                            مرشد صِلة
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
