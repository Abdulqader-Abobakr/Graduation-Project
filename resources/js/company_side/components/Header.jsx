import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, X, SlidersHorizontal } from 'lucide-react';

export default function Header({
    onMenuToggle,
    search,
    setSearch,
    searchPlaceholder,
    onSearchSubmit,
    filterLabel = 'تصفية',
    filterOptions = [],
    activeFilter = 'all',
    onFilterChange = () => { },
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isFiltering = activeFilter !== 'all';

    return (
        <header className="relative border-b border-slate-200 bg-white shrink-0 z-40" dir="rtl">
            <div className="relative flex h-16 items-center justify-center px-8">
                {/* Menu toggle */}
                <div className="absolute inset-s-8 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onMenuToggle}
                        aria-label="تبديل القائمة الجانبية"
                        className="p-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <div className="hidden w-full max-w-3xl items-center gap-2 md:flex">
                    {/* Search Form */}
                    <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 flex-row-reverse">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="min-w-0 flex-1 rounded-e-full border border-s-0 border-slate-200 bg-slate-50 py-2 pe-4 ps-5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <button
                            type="submit"
                            aria-label="بحث"
                            className="flex w-12 shrink-0 items-center justify-center rounded-s-full border border-primary bg-primary text-white transition hover:bg-primary-dark"
                        >
                            <Search size={18} />
                        </button>
                    </form>

                    {/* Filter toggle button — same style as old "تصفية" button */}
                    {filterOptions.length > 0 && (
                        <div className="relative shrink-0" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsOpen((v) => !v)}
                                aria-expanded={isOpen}
                                className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-bold transition-colors ${isOpen || isFiltering
                                    ? 'border-primary text-primary'
                                    : 'border-[#d4d1ca] text-[#7a7974] hover:bg-[#f7f6f2]'
                                    }`}
                            >
                                <SlidersHorizontal size={18} />
                                <span>تصفية</span>
                            </button>

                            {isOpen && (
                                <div className="absolute top-full mt-2 end-0 z-50 w-80 rounded-2xl border border-[#e6e4de] bg-white p-4 shadow-lg">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-sm font-bold text-[#28251d]">{filterLabel}</p>
                                        {isFiltering && (
                                            <button
                                                type="button"
                                                onClick={() => onFilterChange('all')}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7a7974] hover:text-primary"
                                            >
                                                <X size={14} />
                                                مسح التصفية
                                            </button>
                                        )}
                                    </div>

                                    {/* Pill-style options — same as old filter panel */}
                                    <div className="flex flex-wrap gap-2">
                                        {filterOptions.map((opt) => (
                                            <button
                                                type="button"
                                                key={opt.value}
                                                onClick={() => {
                                                    onFilterChange(opt.value);
                                                    setIsOpen(false);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeFilter === opt.value
                                                    ? 'bg-primary text-white'
                                                    : 'bg-[#f7f6f2] text-[#7a7974] border border-[#d4d1ca] hover:bg-white hover:text-primary'
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
            </div>
        </header>
    );
}