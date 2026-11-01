import React, { useEffect, useState } from 'react';
import {
    X,
    MapPin,
    CheckCircle2,
    Calendar,
    Send,
    FolderOpen,
    Eye,
    Briefcase,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    let normalized = url.replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/');
    normalized = normalized.replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
    return normalized;
};

const PortfolioCardItem = ({ item, onOpenImage }) => {
    const images = Array.isArray(item.images)
        ? item.images.map(normalizeImageUrl).filter(Boolean)
        : [];
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <article className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group">
            {/* Image Preview Container */}
            <div
                className="h-48 bg-slate-50 relative flex items-center justify-center overflow-hidden cursor-pointer border-b border-slate-100"
                onClick={() => images.length > 0 && onOpenImage(images, currentIndex)}
            >
                {images.length > 0 ? (
                    <>
                        <img
                            src={images[currentIndex]}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />

                        {/* Hover Overlay with Eye icon */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs pointer-events-none">
                            <Eye size={18} />
                            <span>معاينة وتكبير</span>
                        </div>

                        {/* Slider controls if multiple images */}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={prevImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10 cursor-pointer"
                                    title="الصورة السابقة"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10 cursor-pointer"
                                    title="الصورة التالية"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
                                    {images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 gap-1 p-4">
                        <Briefcase size={36} />
                        <span className="text-[11px] font-semibold text-slate-400">لا توجد صور مرفقة</span>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                    <h4 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2">
                        {item.title}
                    </h4>
                    {item.marketing_domain && (
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                            {item.marketing_domain}
                        </span>
                    )}
                </div>

                {images.length > 1 && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenImage(images, idx);
                                }}
                                className={`w-9 h-9 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ${
                                    idx === currentIndex ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'
                                }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
};

export default function FreelancerProfileModal({
    isOpen,
    freelancer,
    onClose,
    onRequestService,
    onProfileLoaded,
}) {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lightbox, setLightbox] = useState(null); // { images: [], index: 0 }

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (lightbox) {
                    setLightbox(null);
                } else {
                    onClose?.();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, lightbox, onClose]);

    // Load and sync profile data
    useEffect(() => {
        if (!isOpen || !freelancer) {
            setProfile(null);
            setIsLoading(false);
            setError(null);
            setLightbox(null);
            return;
        }

        const freelancerId = typeof freelancer === 'object'
            ? (freelancer.id || freelancer.freelancer_id || freelancer.userId)
            : freelancer;

        const isObject = typeof freelancer === 'object' && freelancer !== null;

        // If freelancer is passed as an object, populate immediately to prevent layout shifts/flicker
        if (isObject) {
            setProfile(freelancer);
        }

        // Always fetch fresh profile data from server so new portfolios or updates appear immediately without manual page refresh
        if (freelancerId) {
            fetchFreelancerData(freelancerId, !isObject);
        }
    }, [isOpen, freelancer]);

    const fetchFreelancerData = async (freelancerId, showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/company/freelancers/${freelancerId}?_t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) {
                throw new Error('تعذر تحميل بيانات الخبير');
            }
            const data = await res.json();
            setProfile(data);
            if (onProfileLoaded) {
                onProfileLoaded(data);
            }
        } catch (err) {
            if (showSpinner) {
                setError(err.message || 'حدث خطأ أثناء تحميل الملف الشخصي');
            }
        } finally {
            if (showSpinner) setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const avatarUrl = normalizeImageUrl(profile?.avatar);
    const name = profile?.name || 'خبير';
    const jobTitle = profile?.jobTitle || 'خبير محترف';
    const bio = profile?.bio;
    const city = profile?.city;
    const completedCount = profile?.completedProjectsCount ?? 0;
    const joinedAt = profile?.joinedAt;
    const marketingSpecialties = profile?.marketing_specialties || [];
    const experiencedSectors = profile?.experienced_sectors || [];
    const portfolios = profile?.portfolios || [];

    const handleOpenImage = (images, index) => {
        setLightbox({ images, index });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
            dir="rtl"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden text-start animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header Bar */}
                <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">الملف المهني للخبير</h3>
                        <p className="text-xs text-slate-400">استعرض الخبرات، النبذة التعريفية، ومعرض الأعمال</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="إغلاق"
                        className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </header>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/60">
                    {isLoading && (
                        <div className="py-20 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                            <p className="mt-3 text-sm font-bold text-slate-500">جاري تحميل بيانات الملف الشخصي...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && (
                        <>
                            {/* SECTION 1: Freelancer Hero Card */}
                            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-3xl">
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h2 className="text-2xl font-black text-slate-800 truncate">{name}</h2>
                                        {jobTitle && (
                                            <p className="text-sm font-bold text-primary mt-0.5 truncate">{jobTitle}</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs font-semibold text-slate-600">
                                            {city && (
                                                <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                                                    <MapPin size={13} className="text-primary" />
                                                    <span>{city}</span>
                                                </span>
                                            )}
                                            {joinedAt && (
                                                <span className="inline-flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={13} />
                                                    <span>انضم {joinedAt}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: About / Bio */}
                            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                    <div className="w-1.5 h-5 bg-primary rounded-full" />
                                    <h3 className="text-base font-bold text-slate-800">النبذة التعريفية</h3>
                                </div>
                                {bio ? (
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                                        {bio}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                                        لم يقم الخبير بإضافة نبذة تعريفية بعد.
                                    </p>
                                )}
                            </section>

                            {/* SECTION 3: Specialties & Sectors */}
                            {(marketingSpecialties.length > 0 || experiencedSectors.length > 0) && (
                                <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                        <div className="w-1.5 h-5 bg-primary rounded-full" />
                                        <h3 className="text-base font-bold text-slate-800">التخصصات ومجالات الخبرة</h3>
                                    </div>

                                    {marketingSpecialties.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-500 block">التخصصات التسويقية:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {marketingSpecialties.map((spec, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3.5 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-xl border border-primary/20"
                                                    >
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {experiencedSectors.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-500 block">القطاعات ذات الخبرة:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {experiencedSectors.map((sector, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
                                                    >
                                                        {sector}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* SECTION 4: Portfolio Gallery */}
                            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-1.5 h-5 bg-primary rounded-full" />
                                        <h3 className="text-base font-bold text-slate-800">معرض الأعمال</h3>
                                    </div>
                                    {portfolios.length > 0 && (
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                            {portfolios.length} {portfolios.length === 1 ? 'مشروع' : 'مشاريع'}
                                        </span>
                                    )}
                                </div>

                                {portfolios.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                        {portfolios.map((item) => (
                                            <PortfolioCardItem
                                                key={item.id}
                                                item={item}
                                                onOpenImage={handleOpenImage}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                                        <FolderOpen size={36} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-sm font-bold text-slate-600">لا توجد أعمال مضافة إلى المعرض حالياً</p>
                                        <p className="text-xs text-slate-400 mt-1">لم يقم الخبير برفع نماذج أعمال إلى المعرض حتى الآن.</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {/* Footer Bar */}
                {onRequestService && profile && (
                    <footer className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                onClose?.();
                                onRequestService(profile);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-[#1b62c4] transition-colors shadow-sm cursor-pointer"
                        >
                            <Send size={15} />
                            <span>طلب خدمة من الخبير</span>
                        </button>
                    </footer>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightbox && lightbox.images.length > 0 && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightbox(null)}
                        className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                        title="إغلاق"
                    >
                        <X size={20} />
                    </button>

                    {lightbox.images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightbox((prev) => ({
                                        ...prev,
                                        index: (prev.index - 1 + prev.images.length) % prev.images.length,
                                    }));
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer z-10"
                                title="الصورة السابقة"
                            >
                                <ChevronRight size={24} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightbox((prev) => ({
                                        ...prev,
                                        index: (prev.index + 1) % prev.images.length,
                                    }));
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer z-10"
                                title="الصورة التالية"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        </>
                    )}

                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightbox.images[lightbox.index]}
                            alt="معاينة العمل"
                            className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl"
                        />
                        {lightbox.images.length > 1 && (
                            <div className="mt-3 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold tracking-wider">
                                {lightbox.index + 1} / {lightbox.images.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
