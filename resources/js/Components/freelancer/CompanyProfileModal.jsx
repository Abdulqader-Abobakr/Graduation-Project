import React, { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let normalized = url.replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/');
  normalized = normalized.replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
  return normalized;
};

export default function CompanyProfileModal({
  isOpen = false,
  company = null,
  companyId = null,
  onClose,
}) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      setImgError(false);
      return;
    }
    setImgError(false);

    const resolvedId = companyId || (company && (company.clientId || company.id || company.user_id));

    if (company && typeof company === 'object') {
      setProfile({
        id: resolvedId,
        name: company.companyName || company.client || company.name || 'شركة',
        avatar: company.avatar || company.avatar_path,
        city: company.city || 'اليمن',
        description: company.companyDescription || company.description || 'لا يوجد وصف متاح للشركة حالياً.',
      });
    }

    if (resolvedId) {
      fetchCompanyData(resolvedId, !company);
    }
  }, [isOpen, company, companyId]);

  const fetchCompanyData = async (id, showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/freelancer/companies/${id}`, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!res.ok) throw new Error('تعذر تحميل بيانات الشركة');
      const data = await res.json();
      setProfile((prev) => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      if (showSpinner) setError(err.message || 'حدث خطأ أثناء تحميل الملف');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const avatarUrl = normalizeImageUrl(profile?.avatar);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200 text-start overflow-hidden my-auto"
      >
        {/* Modal Top Header with single Close Button */}
        <header className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">
            الملف التعريفي للشركة
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </header>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-[#2a7de1] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-500">جاري تحميل بيانات الشركة...</p>
            </div>
          ) : error ? (
            <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-medium">
              {error}
            </div>
          ) : profile ? (
            <>
              {/* Company Branding: Photo + Name + Headquarters */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-slate-50/90 rounded-2xl border border-slate-200/90">
                {/* Photo / Logo (Larger and clearer) */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  {avatarUrl && !imgError ? (
                    <img
                      src={avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2a7de1] to-[#1f6fd4] text-white flex items-center justify-center font-semibold text-2xl sm:text-3xl">
                      {profile.name?.charAt(0) || 'ش'}
                    </div>
                  )}
                </div>

                {/* Name & Headquarters */}
                <div className="flex-1 min-w-0 space-y-3 text-center sm:text-start">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block mb-1">اسم الشركة:</span>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
                      {profile.name}
                    </h3>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                    <MapPin size={16} className="text-[#2a7de1] shrink-0" />
                    <span>المقر: {profile.city || 'اليمن'}</span>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                  نبذة عن الشركة:
                </h4>
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
                  {profile.description || 'لا يوجد وصف تعريفي متاح حالياً للشركة.'}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
