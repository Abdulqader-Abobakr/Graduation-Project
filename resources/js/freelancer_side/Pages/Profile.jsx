import { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  X,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';
import { useForm, router, usePage } from '@inertiajs/react';
import DeleteConfirmationModal from '../../Components/shared/DeleteConfirmationModal';

// URL normalizer for Supabase storage paths
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  return url
    .replace(/\/storage\/v1\/s3\/\.\.\/object\/public\//g, '/storage/v1/object/public/')
    .replace(/\/s3\/\.\.\/object\/public\//g, '/object/public/');
};

const normalizeAvatar = (avatarPath) => {
  if (!avatarPath) return null;
  if (/^(https?:)?\/\//i.test(avatarPath)) return avatarPath;
  if (avatarPath.startsWith('/')) return avatarPath;
  return `/${avatarPath.replace(/^\/+/, '')}`;
};

// Security Regex Patterns
const REGEX_PATTERNS = {
  userName: /^[\u0600-\u06FFa-zA-Z\s\.\-']{2,70}$/,
  jobTitle: /^[\u0600-\u06FFa-zA-Z0-9\s\.\,\-\/\&]{2,100}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phoneNumber: /^\+?[0-9\s\-()]{7,20}$/,
  city: /^[\u0600-\u06FFa-zA-Z\s\-]{2,60}$/,
  tagItem: /^[\u0600-\u06FFa-zA-Z0-9\s\.\,\-\/\&]{2,50}$/,
  portfolioTitle: /^[\u0600-\u06FFa-zA-Z0-9\s\.\,\-\(\)\/\#]{3,120}$/,
  portfolioDomain: /^[\u0600-\u06FFa-zA-Z0-9\s\.\,\-\/\&]{2,60}$/,
};

// Tag Input Component with security & validation
const TagInput = ({ tags = [], setTags, placeholder, error, onTagChange, addButtonText = 'إضافة' }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const addTag = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return;

    if (!REGEX_PATTERNS.tagItem.test(trimmed)) {
      setInputError('يجب أن يتكون العنصر من 2-50 حرفاً وبدون رموز غير مسموح بها.');
      return;
    }

    if (tags.includes(trimmed)) {
      setInputError('هذا العنصر مضاف بالفعل.');
      return;
    }

    const updated = [...tags, trimmed];
    setTags(updated);
    if (onTagChange) onTagChange(updated);
    setInputValue('');
    setInputError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const removeTag = (indexToRemove) => {
    const updated = tags.filter((_, index) => index !== indexToRemove);
    setTags(updated);
    if (onTagChange) onTagChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Explicit input row so user clearly sees where to type */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-colors ${
              inputError || error
                ? 'border-rose-400 focus:border-rose-500'
                : 'border-slate-200 focus:border-primary'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={() => addTag(inputValue)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>{addButtonText}</span>
        </button>
      </div>

      {inputError && <p className="text-rose-500 text-xs font-medium">{inputError}</p>}
      {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}

      {/* Badges container */}
      <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl min-h-[50px] flex flex-wrap items-center gap-2">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs hover:border-slate-300 transition-colors"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="حذف"
              >
                <X size={13} />
              </button>
            </span>
          ))
        ) : (
          <p className="text-xs text-slate-400 font-medium">لم يتم إضافة أي عناصر بعد. اكتب العنصر في الحقل أعلاه واضغط «إضافة» أو Enter.</p>
        )}
      </div>
    </div>
  );
};

// Portfolio Card Component
const PortfolioCard = ({ portfolio, onEdit, onDelete, isDeleting }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = portfolio.images || [];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImgUrl = images[currentImageIndex] ? normalizeImageUrl(images[currentImageIndex]) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col text-start shadow-2xs">
      <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden">
        {currentImgUrl ? (
          <>
            <img
              src={currentImgUrl}
              alt={portfolio.title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-xs cursor-pointer z-10 hover:bg-white"
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={nextImage}
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-xs cursor-pointer z-10 hover:bg-white"
                >
                  <ChevronLeft size={15} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 px-2 py-0.5 rounded-full z-10">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-slate-300 flex flex-col items-center gap-1">
            <ImageIcon size={28} />
            <span className="text-xs text-slate-400">لا توجد صور</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
            {portfolio.marketing_domain || 'عام'}
          </span>
          <h3 className="font-bold text-slate-800 text-sm leading-snug">
            {portfolio.title}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
          <button
            onClick={() => onEdit(portfolio)}
            type="button"
            className="text-slate-600 hover:text-primary font-bold transition-colors cursor-pointer"
          >
            تعديل
          </button>
          <button
            onClick={() => onDelete(portfolio.id)}
            disabled={isDeleting}
            type="button"
            className="text-slate-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'جارٍ الحذف...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Profile({
  pageTitle,
  user: initialUser = {},
  freelancer: initialFreelancer = {},
  portfolios: initialPortfolios = [],
  stats: initialStats = {},
}) {
  const user = initialUser || {};
  const freelancer = initialFreelancer || {};
  const portfolios = Array.isArray(initialPortfolios) ? initialPortfolios : [];
  const stats = initialStats || {};

  const { props } = usePage();
  const flash = props.flash ?? {};
  const avatarUrl = normalizeAvatar(user.avatar_path);

  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);

  // Single-fire Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);
  const shownFlashRef = useRef(new Set());

  const triggerToast = (msg) => {
    if (!msg) return;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
    }, 4000);
  };

  // Only fire once if an initial or redirect flash arrived that was not yet handled
  useEffect(() => {
    if (flash?.success && !shownFlashRef.current.has(flash.success)) {
      shownFlashRef.current.add(flash.success);
      triggerToast(flash.success);
    }
  }, [flash?.success]);

  // Client validation errors
  const [clientErrors, setClientErrors] = useState({});
  const [clientPortErrors, setClientPortErrors] = useState({});

  // Portfolio modal and delete state
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);

  // Main Profile Form
  const {
    data: profileData,
    setData: setProfileData,
    post: postProfile,
    processing: processingProfile,
    errors: profileErrors,
    clearErrors: clearProfileErrors,
  } = useForm({
    _method: 'PUT',
    user_name: user.user_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    city: user.city || '',
    job_title: freelancer.job_title || '',
    bio: freelancer.bio || '',
    marketing_specialties: freelancer.marketing_specialties || [],
    experienced_sectors: freelancer.experienced_sectors || [],
    avatar: null,
  });

  // Portfolio Form
  const {
    data: portData,
    setData: setPortData,
    post: postPort,
    processing: processingPort,
    errors: errorsPort,
    reset: resetPort,
    clearErrors: clearPortErrors,
  } = useForm({
    title: '',
    marketing_domain: '',
    images: [],
  });

  // Comprehensive Client Validation for Profile
  const validateProfileForm = () => {
    const errs = {};

    // 1. Full Name
    const trimmedName = (profileData.user_name || '').trim();
    if (!trimmedName) {
      errs.user_name = 'حقل الاسم الكامل مطلوب ولا يمكن تركه فارغاً.';
    } else if (trimmedName.length < 2) {
      errs.user_name = 'يجب ألا يقل الاسم عن حرفين.';
    } else if (!REGEX_PATTERNS.userName.test(trimmedName)) {
      errs.user_name = 'الاسم يجب أن يحتوي على حروف فقط وبدون رموز خاصة أو أرقام.';
    }

    // 2. Job Title
    const trimmedTitle = (profileData.job_title || '').trim();
    if (!trimmedTitle) {
      errs.job_title = 'حقل المسمى الوظيفي مطلوب ولا يمكن تركه فارغاً.';
    } else if (trimmedTitle.length < 2) {
      errs.job_title = 'يجب ألا يقل المسمى الوظيفي عن حرفين.';
    } else if (!REGEX_PATTERNS.jobTitle.test(trimmedTitle)) {
      errs.job_title = 'المسمى الوظيفي يحتوي على رموز غير مسموح بها.';
    }

    // 3. Email
    const trimmedEmail = (profileData.email || '').trim();
    if (!trimmedEmail) {
      errs.email = 'حقل البريد الإلكتروني مطلوب ولا يمكن تركه فارغاً.';
    } else if (!REGEX_PATTERNS.email.test(trimmedEmail)) {
      errs.email = 'يرجى إدخال بريد إلكتروني صالح.';
    }

    // 4. Phone Number
    const trimmedPhone = (profileData.phone_number || '').trim();
    if (!trimmedPhone) {
      errs.phone_number = 'حقل رقم الهاتف مطلوب ولا يمكن تركه فارغاً.';
    } else if (!REGEX_PATTERNS.phoneNumber.test(trimmedPhone)) {
      errs.phone_number = 'يرجى إدخال رقم هاتف صحيح بالأرقام فقط (7 أرقام على الأقل).';
    }

    // 5. City
    const trimmedCity = (profileData.city || '').trim();
    if (!trimmedCity) {
      errs.city = 'حقل المدينة مطلوب ولا يمكن تركه فارغاً.';
    } else if (!REGEX_PATTERNS.city.test(trimmedCity)) {
      errs.city = 'اسم المدينة يجب أن يحتوي على حروف صالحة فقط.';
    }

    // 6. Bio (Optional, but length checked)
    if (profileData.bio && profileData.bio.length > 1000) {
      errs.bio = 'النبذة التعريفية يجب ألا تتجاوز 1000 حرف.';
    }

    // 7. Specialties
    if (!profileData.marketing_specialties || profileData.marketing_specialties.length === 0) {
      errs.marketing_specialties = 'يرجى إضافة مهارة أو خدمة واحدة على الأقل قبل الحفظ.';
    }

    // 8. Sectors
    if (!profileData.experienced_sectors || profileData.experienced_sectors.length === 0) {
      errs.experienced_sectors = 'يرجى إضافة قطاع أو مجال خبرة واحد على الأقل قبل الحفظ.';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    postProfile('/freelancer/profile', {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        setClientErrors({});
        triggerToast('تم حفظ وتحديث الملف الشخصي بنجاح.');
      },
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size and type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        setClientErrors((prev) => ({
          ...prev,
          avatar: 'صيغ الصور المسموح بها هي jpeg, png, jpg, webp.',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setClientErrors((prev) => ({
          ...prev,
          avatar: 'الحد الأقصى لحجم الصورة هو 5 ميجابايت.',
        }));
        return;
      }

      setClientErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });

      setProfileData('avatar', file);
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

  const openAddPortfolioModal = () => {
    setEditingPortfolio(null);
    setPortData({
      title: '',
      marketing_domain: '',
      images: [],
    });
    setClientPortErrors({});
    clearPortErrors();
    setIsPortfolioModalOpen(true);
  };

  const openEditPortfolioModal = (portfolio) => {
    setEditingPortfolio(portfolio);
    setPortData({
      title: portfolio.title,
      marketing_domain: portfolio.marketing_domain,
      images: [],
    });
    setClientPortErrors({});
    clearPortErrors();
    setIsPortfolioModalOpen(true);
  };

  // Comprehensive Client Validation for Portfolio
  const validatePortfolioForm = () => {
    const errs = {};

    const trimmedTitle = (portData.title || '').trim();
    if (!trimmedTitle) {
      errs.title = 'حقل اسم العمل مطلوب ولا يمكن تركه فارغاً.';
    } else if (trimmedTitle.length < 3) {
      errs.title = 'يجب ألا يقل اسم العمل عن 3 أحرف.';
    } else if (!REGEX_PATTERNS.portfolioTitle.test(trimmedTitle)) {
      errs.title = 'اسم العمل يحتوي على رموز غير مسموح بها.';
    }

    const trimmedDomain = (portData.marketing_domain || '').trim();
    if (!trimmedDomain) {
      errs.marketing_domain = 'حقل تصنيف العمل مطلوب ولا يمكن تركه فارغاً.';
    } else if (trimmedDomain.length < 2) {
      errs.marketing_domain = 'يجب ألا يقل تصنيف العمل عن حرفين.';
    } else if (!REGEX_PATTERNS.portfolioDomain.test(trimmedDomain)) {
      errs.marketing_domain = 'تصنيف العمل يحتوي على رموز غير مسموح بها.';
    }

    if (!editingPortfolio && (!portData.images || portData.images.length === 0)) {
      errs.images = 'يرجى إرفاق صورة واحدة على الأقل لنموذج العمل.';
    }

    if (portData.images && portData.images.length > 0) {
      const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      for (const file of portData.images) {
        if (!validMimes.includes(file.type)) {
          errs.images = 'صيغة الصورة غير مدعومة (فقط JPG, PNG, WEBP).';
          break;
        }
        if (file.size > 5 * 1024 * 1024) {
          errs.images = 'حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).';
          break;
        }
      }
    }

    setClientPortErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePortfolioSubmit = (e) => {
    e.preventDefault();

    if (!validatePortfolioForm()) {
      return;
    }

    const targetRoute = editingPortfolio
      ? `/freelancer/portfolio/${editingPortfolio.id}`
      : '/freelancer/portfolio';

    postPort(targetRoute, {
      preserveScroll: true,
      onSuccess: () => {
        setIsPortfolioModalOpen(false);
        resetPort();
        setClientPortErrors({});
        triggerToast(editingPortfolio ? 'تم تحديث العمل بنجاح.' : 'تم إضافة العمل لمعرض أعمالك بنجاح.');
      },
    });
  };

  const handleDeletePortfolio = (portfolioId) => {
    setPortfolioToDelete(portfolioId);
  };

  const confirmDeletePortfolio = () => {
    if (portfolioToDelete === null) return;
    const portfolioId = portfolioToDelete;
    setPortfolioToDelete(null);
    setDeletingId(portfolioId);
    router.delete(`/freelancer/portfolio/${portfolioId}`, {
      preserveScroll: true,
      onSuccess: () => {
        triggerToast('تم حذف العمل من معرض أعمالك بنجاح.');
      },
      onFinish: () => setDeletingId(null),
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setPortData('images', files);
    if (clientPortErrors.images) {
      setClientPortErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    }
  };

  // Helper to get active error (client-side priority, then server)
  const getProfileError = (field) => clientErrors[field] || profileErrors[field];
  const getPortError = (field) => clientPortErrors[field] || errorsPort[field];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 overflow-y-auto h-full text-start" dir="rtl">
      {/* Toast Notification (Fired strictly once upon actual success) */}
      <div
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out ${showToast && toastMessage
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
          }`}
      >
        {toastMessage && (
          <div className="bg-white border border-emerald-200 shadow-xl rounded-2xl p-4 pr-5 pl-12 flex items-center gap-3 relative min-w-[300px]">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div className="text-start">
              <p className="text-xs font-bold text-slate-800">عملية ناجحة</p>
              <p className="text-xs text-slate-500 font-medium">{toastMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowToast(false);
                setToastMessage('');
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Page Header */}
      <header className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold text-slate-800">إدارة الملف المهني والشخصي</h1>
        <p className="text-xs text-slate-500 mt-1">
          إدارة المعلومات الشخصية، التخصصات والخدمات، ومعرض الأعمال.
        </p>
      </header>

      {/* ============================================================ */}
      {/* SECTION 1: PERSONAL INFO, SPECIALTIES & SECTORS              */}
      {/* ============================================================ */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-7">
        <form onSubmit={handleProfileSubmit} className="space-y-8">
          {/* Part 1: Personal & Professional Info */}
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <User size={18} className="text-slate-700" />
              <h2 className="text-base font-bold text-slate-800">المعلومات الشخصية والمهنية</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative group cursor-pointer flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <Camera size={18} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  تغيير الصورة
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                />
                {getProfileError('avatar') && (
                  <p className="text-rose-500 text-xs text-center">{getProfileError('avatar')}</p>
                )}
              </div>

              {/* Inputs Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.user_name}
                    onChange={(e) => {
                      setProfileData('user_name', e.target.value);
                      if (clientErrors.user_name) {
                        setClientErrors((prev) => ({ ...prev, user_name: '' }));
                      }
                    }}
                    placeholder="أدخل اسمك الكامل"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-colors ${getProfileError('user_name')
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-primary'
                      }`}
                    required
                  />
                  {getProfileError('user_name') && (
                    <p className="text-rose-500 text-xs font-medium">{getProfileError('user_name')}</p>
                  )}
                </div>

                {/* Job Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    المسمى الوظيفي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.job_title}
                    onChange={(e) => {
                      setProfileData('job_title', e.target.value);
                      if (clientErrors.job_title) {
                        setClientErrors((prev) => ({ ...prev, job_title: '' }));
                      }
                    }}
                    placeholder="مثال: مصمم واجهات مستخدم، مطور تطبيقات"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-colors ${getProfileError('job_title')
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-primary'
                      }`}
                    required
                  />
                  {getProfileError('job_title') && (
                    <p className="text-rose-500 text-xs font-medium">{getProfileError('job_title')}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>البريد الإلكتروني <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData('email', e.target.value);
                      if (clientErrors.email) {
                        setClientErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="name@example.com"
                    dir="ltr"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium text-end transition-colors ${getProfileError('email')
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-primary'
                      }`}
                    required
                  />
                  {getProfileError('email') && (
                    <p className="text-rose-500 text-xs font-medium">{getProfileError('email')}</p>
                  )}
                </div>

                {/* Phone & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>رقم الهاتف <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={profileData.phone_number}
                      onChange={(e) => {
                        setProfileData('phone_number', e.target.value);
                        if (clientErrors.phone_number) {
                          setClientErrors((prev) => ({ ...prev, phone_number: '' }));
                        }
                      }}
                      placeholder="7xxxxxxxx"
                      dir="ltr"
                      className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium text-end transition-colors ${getProfileError('phone_number')
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 focus:border-primary'
                        }`}
                      required
                    />
                    {getProfileError('phone_number') && (
                      <p className="text-rose-500 text-xs font-medium">{getProfileError('phone_number')}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>المدينة <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => {
                        setProfileData('city', e.target.value);
                        if (clientErrors.city) {
                          setClientErrors((prev) => ({ ...prev, city: '' }));
                        }
                      }}
                      placeholder="صنعاء، عدن..."
                      className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-colors ${getProfileError('city')
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 focus:border-primary'
                        }`}
                      required
                    />
                    {getProfileError('city') && (
                      <p className="text-rose-500 text-xs font-medium">{getProfileError('city')}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">نبذة تعريفية</label>
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => {
                      setProfileData('bio', e.target.value);
                      if (clientErrors.bio) {
                        setClientErrors((prev) => ({ ...prev, bio: '' }));
                      }
                    }}
                    placeholder="نبذة موجزة عن خبراتك المهنية والخدمات التي تقدمها..."
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium resize-none transition-colors ${getProfileError('bio')
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-primary'
                      }`}
                  />
                  {getProfileError('bio') && (
                    <p className="text-rose-500 text-xs font-medium">{getProfileError('bio')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Part 2: Specialties & Sectors */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <Briefcase size={18} className="text-slate-700" />
              <h2 className="text-base font-bold text-slate-800">المهارات والخدمات والقطاعات</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills and Services */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  المهارات والخدمات <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">التخصصات والخدمات التي تقدمها لعملائك</p>
                <TagInput
                  tags={profileData.marketing_specialties}
                  setTags={(val) => setProfileData('marketing_specialties', val)}
                  onTagChange={() => {
                    if (clientErrors.marketing_specialties) {
                      setClientErrors((prev) => ({ ...prev, marketing_specialties: '' }));
                    }
                  }}
                  placeholder="أدخل مهارة أو خدمة جديدة..."
                  addButtonText="إضافة"
                  error={getProfileError('marketing_specialties')}
                />
              </div>

              {/* Experienced Sectors */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  مجالات وقطاعات ريادة الأعمال <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">القطاعات والأنشطة التي تمتلك خبرة سابقة في خدمتها</p>
                <TagInput
                  tags={profileData.experienced_sectors}
                  setTags={(val) => setProfileData('experienced_sectors', val)}
                  onTagChange={() => {
                    if (clientErrors.experienced_sectors) {
                      setClientErrors((prev) => ({ ...prev, experienced_sectors: '' }));
                    }
                  }}
                  placeholder="أدخل مجالاً أو قطاع خبرة جديد..."
                  addButtonText="إضافة"
                  error={getProfileError('experienced_sectors')}
                />
              </div>
            </div>
          </div>

          {/* Single Save Button */}
          <div className="flex justify-end pt-5 border-t border-slate-100">
            <button
              type="submit"
              disabled={processingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#1f6fd4] text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <Save size={16} />
              <span>{processingProfile ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: PORTFOLIO SHOWCASE (TOP ADD BUTTON ONLY)         */}
      {/* ============================================================ */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-7">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-slate-700" />
            <h2 className="text-base font-bold text-slate-800">
              معرض الأعمال
              <span className="text-xs text-slate-400 font-normal ms-2">({portfolios.length})</span>
            </h2>
          </div>

          {/* Only Add Button at the top */}
          <button
            type="button"
            onClick={openAddPortfolioModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-[#1f6fd4] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Plus size={15} />
            <span>إضافة عمل جديد</span>
          </button>
        </div>

        {/* Portfolio items */}
        {portfolios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                onEdit={openEditPortfolioModal}
                onDelete={handleDeletePortfolio}
                isDeleting={deletingId === portfolio.id}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            لا توجد أعمال مضافة في المعرض حتى الآن.
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT PORTFOLIO                                 */}
      {/* ============================================================ */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-h-[calc(100dvh-2rem)] bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto text-start">
            <header className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {editingPortfolio ? 'تعديل العمل' : 'إضافة عمل جديد إلى المعرض'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPortfolioModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handlePortfolioSubmit} className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  اسم العمل أو المشروع <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={portData.title}
                  onChange={(e) => {
                    setPortData('title', e.target.value);
                    if (clientPortErrors.title) {
                      setClientPortErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="أدخل عنوان العمل (3 أحرف على الأقل)"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-colors ${getPortError('title')
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-primary'
                    }`}
                  required
                />
                {getPortError('title') && (
                  <p className="text-rose-500 text-xs font-medium">{getPortError('title')}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  تصنيف العمل / المجال <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={portData.marketing_domain}
                  onChange={(e) => {
                    setPortData('marketing_domain', e.target.value);
                    if (clientPortErrors.marketing_domain) {
                      setClientPortErrors((prev) => ({ ...prev, marketing_domain: '' }));
                    }
                  }}
                  placeholder="مثال: تصميم هوية، برمجة متجر، تسويق رقمي"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-colors ${getPortError('marketing_domain')
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-primary'
                    }`}
                  required
                />
                {getPortError('marketing_domain') && (
                  <p className="text-rose-500 text-xs font-medium">{getPortError('marketing_domain')}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  الصور {!editingPortfolio ? <span className="text-rose-500">*</span> : '(اختياري عند التعديل)'}
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-500 file:me-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {portData.images && portData.images.length > 0 && (
                  <p className="text-xs text-primary font-bold mt-1">
                    تم تحديد {portData.images.length} صورة
                  </p>
                )}
                {getPortError('images') && (
                  <p className="text-rose-500 text-xs font-medium">{getPortError('images')}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={processingPort}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-[#1f6fd4] text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {processingPort ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={portfolioToDelete !== null}
        title="حذف العمل؟"
        description="سيتم حذف هذا العمل من معرض أعمالك نهائياً. هل تريد المتابعة؟"
        isProcessing={deletingId === portfolioToDelete}
        onCancel={() => setPortfolioToDelete(null)}
        onConfirm={confirmDeletePortfolio}
      />
    </div>
  );
}
