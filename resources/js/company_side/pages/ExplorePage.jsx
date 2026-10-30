import React, { useEffect, useMemo, useState } from 'react';
import { User, Star } from 'lucide-react';
import CreateRequestModal from '../../Components/company/CreateRequestModal';
import FreelancerProfileModal from '../../Components/company/FreelancerProfileModal';

export default function ExplorePage({ freelancers = [], onSubmit, search = '', activeFilter = 'all' }) {
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get('freelancer');
            if (targetId) {
                const existing = freelancers.find(
                    (f) => String(f.id) === String(targetId) || String(f.userId) === String(targetId)
                );
                setViewingProfile(existing || targetId);
            }
        } catch (_) {
            // ignore
        }
    }, [freelancers]);

    const filteredFreelancers = useMemo(() => {
        const q = search.trim().toLowerCase();

        return freelancers.filter((f) => {
            const industries = f.industries || [];

            const matchesIndustry =
                activeFilter === 'all' || industries.includes(activeFilter);

            const matchesSearch =
                !q ||
                f.name?.toLowerCase().includes(q) ||
                f.jobTitle?.toLowerCase().includes(q) ||
                f.bio?.toLowerCase().includes(q);

            return matchesIndustry && matchesSearch;
        });
    }, [freelancers, activeFilter, search]);

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#28251d]">استكشف الخبراء</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        تصفح نخبة من الكفاءات والخبراء المحترفين لاختيار الأنسب لتنفيذ مشاريعك وإنجاز أعمالك
                    </p>
                </div>
            </div>

            {filteredFreelancers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFreelancers.map((freelancer) => (
                        <article
                            key={freelancer.id}
                            className="rounded-2xl border border-[#e6e4de] bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setViewingProfile(freelancer)}
                                    className="w-12 h-12 rounded-full bg-[#e9f2ff] overflow-hidden flex items-center justify-center text-primary font-bold transition-transform hover:scale-105 cursor-pointer shrink-0"
                                    title="عرض الملف التعريفي"
                                >
                                    {freelancer.avatar ? (
                                        <img
                                            src={freelancer.avatar}
                                            alt={freelancer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </button>
                                <div className="min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setViewingProfile(freelancer)}
                                        className="font-bold text-[#28251d] truncate hover:text-primary transition-colors text-right cursor-pointer block w-full text-base"
                                        title="عرض الملف التعريفي"
                                    >
                                        {freelancer.name}
                                    </button>
                                    <p className="text-xs text-[#7a7974] truncate mt-0.5">
                                        {freelancer.jobTitle || 'خبير محترف'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {freelancer.ratings_count > 0 ? (
                                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs">
                                                <Star size={11} className="fill-amber-500 text-amber-500" />
                                                <span>{freelancer.rating_average}</span>
                                                <span className="text-[10px] text-amber-600/80 font-normal">({freelancer.ratings_count})</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                جديد
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-[#7a7974] line-clamp-3 min-h-18">
                                {freelancer.bio || 'متخصص في تقديم حلول احترافية للمشاريع الريادية.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {(freelancer.industries || []).slice(0, 3).map((industry) => (
                                    <span
                                        key={industry}
                                        className="rounded-full bg-[#f7f6f2] px-2.5 py-1 text-[11px] font-bold text-[#7a7974]"
                                    >
                                        {industry}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFreelancer(freelancer)}
                                className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1b62c4] cursor-pointer"
                            >
                                طلب خدمة مباشرة
                            </button>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-[#d4d1ca] bg-white py-16 text-center text-[#7a7974]">
                    <p className="font-bold">لا توجد نتائج مطابقة</p>
                    <p className="mt-1 text-sm">جرّب مجالاً آخر أو امسح التصفية.</p>
                </div>
            )}

            <CreateRequestModal
                isOpen={Boolean(selectedFreelancer)}
                onClose={() => setSelectedFreelancer(null)}
                onSubmit={(request) => onSubmit(request, null, () => setSelectedFreelancer(null))}
                fixedFreelancer={selectedFreelancer}
            />

            <FreelancerProfileModal
                isOpen={Boolean(viewingProfile)}
                freelancer={viewingProfile}
                onClose={() => setViewingProfile(null)}
                onRequestService={(fl) => {
                    setViewingProfile(null);
                    setSelectedFreelancer(fl);
                }}
            />
        </div>
    );
}