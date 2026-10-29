import { useState, useRef, useEffect } from 'react';
import {
    User,
    Camera,
    X,
    Mail,
    Phone,
    MapPin,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import Sidebar from '../Components/company/NavItem';
import Header from '../Components/company/Header';
import SilaAssistant from '../Components/shared/SilaAssistant';

const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;

    if (/^(https?:)?\/\//i.test(avatarPath)) {
        return avatarPath;
    }

    if (avatarPath.startsWith('/')) {
        return avatarPath;
    }

    return `/${avatarPath.replace(/^\/+/, '')}`;
};

const Profile = ({ pageTitle, user = {}, company = {} }) => {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const avatarUrl = getAvatarUrl(user.avatar_path);

    const fileInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
    const [showToast, setShowToast] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [search, setSearch] = useState('');

    const handleHeaderSearch = (e) => {
        e.preventDefault();
        const q = search.trim();
        router.visit(q ? `/company?tab=explore&search=${encodeURIComponent(q)}` : '/company?tab=explore');
    };

    useEffect(() => {
        if (flash.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash.success, props]);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        user_name: user.user_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        city: user.city || '',
        business_name: company.business_name || '',
        industry: company.industry || '',
        company_description: company.company_description || '',
        avatar: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/company/profile', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
        }
    };

    useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview !== avatarUrl && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview, avatarUrl]);

    return (
        <div dir="rtl" className="flex h-screen bg-gray-50 font-sans">
            <Sidebar activePage="profile" isSidebarOpen={isSidebarOpen} />

            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <Header
                    pageTitle={pageTitle || 'ملفي الشخصي'}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    search={search}
                    setSearch={setSearch}
                    searchPlaceholder="ابحث عن مستقل أو تخصص أو خبرة..."
                    onSearchSubmit={handleHeaderSearch}
                />

                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6" dir="rtl">
            <div
                className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${showToast && flash.success ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}
            >
                {flash.success && (
                    <div className="bg-white border border-green-200 shadow-2xl shadow-green-900/10 rounded-2xl p-4 pr-5 pl-12 flex items-center gap-4 relative min-w-[320px]">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800">عملية ناجحة</p>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">{flash.success}</p>
                        </div>
                        <button type="button" onClick={() => setShowToast(false)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full">
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-8 border-b border-slate-50 pb-4">
                        <User size={20} className="text-slate-700" />
                        <h2 className="text-xl font-bold">معلومات الشركة والمالك</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-10">
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-slate-50 overflow-hidden flex items-center justify-center relative">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={64} className="text-slate-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={24} className="text-white" />
                                    </div>
                                </div>
                                <button type="button" className="absolute bottom-0 inset-e-0 p-2 bg-primary text-white rounded-full border-2 border-white shadow-lg hover:bg-[#1f6fd4] transition-colors">
                                    <Camera size={16} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                            </div>
                            <p className="text-[10px] text-slate-400 text-center max-w-[120px]">يفضل صورة احترافية بخلفية سادة (حجم أقصى 5MB)</p>
                            {errors.avatar && <p className="text-red-500 text-xs text-center">{errors.avatar}</p>}
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">اسم الشركة</label>
                                <input
                                    type="text"
                                    value={data.business_name}
                                    onChange={e => setData('business_name', e.target.value)}
                                    placeholder="أدخل اسم الشركة"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                                />
                                {errors.business_name && <p className="text-red-500 text-xs">{errors.business_name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">القطاع</label>
                                <input
                                    type="text"
                                    value={data.industry}
                                    onChange={e => setData('industry', e.target.value)}
                                    placeholder="مثال: التقنية، التجارة الإلكترونية، التسويق"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                                />
                                {errors.industry && <p className="text-red-500 text-xs">{errors.industry}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">اسم المالك</label>
                                <input
                                    type="text"
                                    value={data.user_name}
                                    onChange={e => setData('user_name', e.target.value)}
                                    placeholder="أدخل اسم المسؤول أو المالك"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                                />
                                {errors.user_name && <p className="text-red-500 text-xs">{errors.user_name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> المدينة</label>
                                <input
                                    type="text"
                                    value={data.city}
                                    onChange={e => setData('city', e.target.value)}
                                    placeholder="أدخل اسم المدينة (مثال: صنعاء)"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                                />
                                {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Mail size={14} className="text-slate-400" /> البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="example@company.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                                />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Phone size={14} className="text-slate-400" /> رقم الهاتف</label>
                                <input
                                    type="text"
                                    value={data.phone_number}
                                    onChange={e => setData('phone_number', e.target.value)}
                                    placeholder="7xxxxxxxx"
                                    dir="ltr"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium text-end"
                                />
                                {errors.phone_number && <p className="text-red-500 text-xs">{errors.phone_number}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-bold text-slate-700">وصف الشركة</label>
                                <textarea
                                    rows={4}
                                    value={data.company_description}
                                    onChange={e => setData('company_description', e.target.value)}
                                    placeholder="اكتب نبذة تعريفية مختصرة عن الشركة وأهدافها ومجال عملها..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all resize-none font-medium leading-relaxed"
                                />
                                {errors.company_description && <p className="text-red-500 text-xs">{errors.company_description}</p>}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-6">
                    <button type="submit" disabled={processing} className="inline-flex items-center justify-center px-8 py-3 bg-primary hover:bg-[#1f6fd4] text-white font-bold rounded-2xl shadow-sm transition-all disabled:opacity-70">
                        {processing ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>
        </form>
                </div>
            </main>
            <SilaAssistant />
        </div>
    );
};

export default Profile;
