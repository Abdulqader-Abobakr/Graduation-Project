import { useState } from 'react';
import {
  ExternalLink,
  Plus,
  Edit2,
  Briefcase,
  AlertCircle,
  X,
  Upload,
  CheckCircle2, // Added CheckCircle2 for toast
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

// Helper component for managing tags
const TagInput = ({ tags, setTags, placeholder, error }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setInputValue('');
      }
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50 focus-within:ring-2 focus-within:ring-[#2a7de1]/15 focus-within:bg-white transition-all min-h-[56px] items-center">
        {tags.map((tag, index) => (
          <span key={index} className="flex items-center gap-1.5 bg-[#2a7de1]/10 text-[#2a7de1] px-3 py-1.5 rounded-lg text-sm font-bold border border-[#2a7de1]/20">
            {tag}
            <button type="button" onClick={() => removeTag(index)} className="hover:text-red-500 transition-colors bg-white/50 rounded-full p-0.5">
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'إضافة المزيد...'}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 min-w-[150px] text-sm font-medium py-1"
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <p className="text-xs text-slate-400 font-bold">اضغط <kbd className="font-sans bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> لإضافة العنصر</p>
    </div>
  );
};

const Services = ({ pageTitle, specialties = [], sectors = [], portfolios = [] }) => {
  const { props } = usePage();
  const flash = props.flash ?? {};
  
  const [availability, setAvailability] = useState('متاح');
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null); // Tracks which portfolio is being edited
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Show floating toast when flash.success arrives
  useEffect(() => {
    if (flash.success) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [flash.success, props]);

  // Form for adding new portfolio
  const { data: portData, setData: setPortData, post: postPort, processing: processingPort, errors: errorsPort, reset: resetPort } = useForm({
    title: '',
    marketing_domain: '',
    images: []
  });

  // Form for editing specialties and sectors
  const { data: specData, setData: setSpecData, post: postSpec, processing: processingSpec, errors: errorsSpec } = useForm({
    marketing_specialties: specialties || [],
    experienced_sectors: sectors || []
  });

  const openAddPortfolioModal = () => {
    setEditingPortfolio(null);
    setPortData({
      title: '',
      marketing_domain: '',
      images: []
    });
    setIsPortfolioModalOpen(true);
  };

  const openEditPortfolioModal = (portfolio) => {
    setEditingPortfolio(portfolio);
    setPortData({
      title: portfolio.title,
      marketing_domain: portfolio.marketing_domain,
      images: [] // Empty by default, user can upload new ones to replace
    });
    setIsPortfolioModalOpen(true);
  };

  const handlePortfolioSubmit = (e) => {
    e.preventDefault();
    const targetRoute = editingPortfolio 
      ? `/freelancer/services/portfolio/${editingPortfolio.id}`
      : '/freelancer/services/portfolio';

    postPort(targetRoute, {
      preserveScroll: true,
      onSuccess: () => {
        setIsPortfolioModalOpen(false);
        resetPort();
      }
    });
  };

  const handleSpecSubmit = (e) => {
    e.preventDefault();
    postSpec('/freelancer/services/specialties', {
      preserveScroll: true,
      onSuccess: () => setIsSpecModalOpen(false)
    });
  };

  const handleImageChange = (e) => {
    setPortData('images', Array.from(e.target.files));
  };

  const openSpecModal = () => {
    setSpecData({
      marketing_specialties: specialties || [],
      experienced_sectors: sectors || []
    });
    setIsSpecModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8" dir="rtl">
      {/* SECTION 1: Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{pageTitle || 'خدماتي'}</h1>
          <p className="text-slate-500">قم بإدارة التخصصات، القطاعات التي تملك خبرة فيها، ومعرض أعمالك وحالة تواجدك.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all shrink-0">
          <ExternalLink size={18} />
          معاينة الملف الشخصي
        </button>
      </div>

      {/* Floating Success Toast */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${
          showToast && flash.success 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
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
            <button 
              onClick={() => setShowToast(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Services and Portfolio (2/3 in RTL) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 4: Marketing Specialties and Sectors */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></div>
                <h2 className="text-2xl font-bold">التخصصات والقطاعات</h2>
              </div>
              <button 
                onClick={openSpecModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
              >
                <Edit2 size={16} />
                تعديل التخصصات
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-8">
              
              {/* Marketing Specialties */}
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">التخصصات التسويقية</h3>
                {specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty, index) => (
                      <span key={index} className="px-4 py-2 bg-[#2a7de1]/10 text-[#2a7de1] font-bold text-sm rounded-xl border border-[#2a7de1]/20">
                        {specialty}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm font-medium">لم تقم بإضافة أي تخصصات تسويقية بعد.</p>
                )}
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              {/* Experienced Sectors */}
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">القطاعات ذات الخبرة</h3>
                {sectors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sectors.map((sector, index) => (
                      <span key={index} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl border border-slate-200">
                        {sector}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm font-medium">لم تقم بإضافة أي قطاعات بعد.</p>
                )}
              </div>

            </div>
          </section>

          {/* SECTION 5: Portfolio */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></div>
                <h2 className="text-2xl font-bold">معرض الأعمال</h2>
              </div>
              <button 
                onClick={openAddPortfolioModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
              >
                <Plus size={18} />
                إضافة عمل جديد
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {portfolios.map(portfolio => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  onEdit={openEditPortfolioModal}
                />
              ))}
              
              {portfolios.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 bg-white/50 group hover:border-[#2a7de1] transition-all cursor-pointer" onClick={openAddPortfolioModal}>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-slate-700 shadow-sm mb-4">
                    <Plus size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 group-hover:text-slate-600">إضافة عمل جديد</p>
                  <p className="text-xs text-slate-300 mt-1">قم بإثراء معرض أعمالك</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Availability */}
        <div className="space-y-8">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <AlertCircle size={20} className="text-slate-700" />
              <h2 className="text-xl font-bold">التواجد</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">حالة التواجد</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/15 font-bold appearance-none cursor-pointer"
                >
                  <option value="متاح">متاح للعمل</option>
                  <option value="مشغول">مشغول حالياً</option>
                  <option value="غير متاح">إجازة / غير متاح</option>
                </select>
              </div>

              {/* Status Hint */}
              <div className="flex items-start gap-2 p-3 bg-[#2a7de1]/10 border border-[#2a7de1]/20 rounded-xl">
                <AlertCircle size={16} className="text-slate-700 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-relaxed">سيظهر هذا للعملاء عند تصفح ملفك الشخصي.</p>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* --- MODALS --- */}

      {/* Edit Specialties Modal */}
      {isSpecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-start">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">تعديل التخصصات والقطاعات</h3>
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSpecSubmit} className="p-6 space-y-6">
              
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">التخصصات التسويقية</label>
                <p className="text-xs text-slate-500 mb-2 font-medium">أضف مجالات التسويق التي تبرع فيها مثل: التسويق الرقمي، كتابة المحتوى...</p>
                <TagInput 
                  tags={specData.marketing_specialties}
                  setTags={(newTags) => setSpecData('marketing_specialties', newTags)}
                  placeholder="اكتب التخصص واضغط Enter..."
                  error={errorsSpec.marketing_specialties}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">القطاعات ذات الخبرة</label>
                <p className="text-xs text-slate-500 mb-2 font-medium">أضف القطاعات والمجالات التي تملك خبرة بالعمل فيها مثل: التجارة الإلكترونية، العقارات...</p>
                <TagInput 
                  tags={specData.experienced_sectors}
                  setTags={(newTags) => setSpecData('experienced_sectors', newTags)}
                  placeholder="اكتب القطاع واضغط Enter..."
                  error={errorsSpec.experienced_sectors}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSpecModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={processingSpec}
                  className="flex-1 py-3 bg-[#2a7de1] text-white rounded-xl font-bold hover:bg-[#1f6fd4] transition-colors shadow-md disabled:opacity-70"
                >
                  {processingSpec ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Portfolio Modal */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-start">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingPortfolio ? 'تعديل بيانات العمل' : 'إضافة عمل جديد لمعرض الأعمال'}
              </h3>
              <button
                onClick={() => setIsPortfolioModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handlePortfolioSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">عنوان العمل</label>
                <input
                  type="text"
                  value={portData.title}
                  onChange={e => setPortData('title', e.target.value)}
                  placeholder="مثال: إدارة حملات التسويق لمتجر فلان"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/15 font-medium"
                />
                {errorsPort.title && <p className="text-red-500 text-xs mt-1">{errorsPort.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">مجال التسويق</label>
                <input
                  type="text"
                  value={portData.marketing_domain}
                  onChange={e => setPortData('marketing_domain', e.target.value)}
                  placeholder="مثال: التسويق الرقمي، تحسين محركات البحث..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a7de1]/15 font-medium"
                />
                {errorsPort.marketing_domain && <p className="text-red-500 text-xs mt-1">{errorsPort.marketing_domain}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">الصور المرفقة</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center hover:border-[#2a7de1] transition-colors relative cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-600 mb-1">اسحب وأفلت الصور هنا</p>
                  <p className="text-xs text-slate-400">أو انقر للاختيار من جهازك</p>
                  {portData.images.length > 0 && (
                    <p className="mt-3 text-xs font-bold text-[#2a7de1] bg-[#2a7de1]/10 px-3 py-1 rounded-full">
                      تم اختيار {portData.images.length} صور جديدة
                    </p>
                  )}
                  {editingPortfolio && portData.images.length === 0 && (
                    <p className="mt-3 text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      سيتم الاحتفاظ بالصور الحالية إذا لم تختر صوراً جديدة.
                    </p>
                  )}
                </div>
                {errorsPort.images && <p className="text-red-500 text-xs mt-1">{errorsPort.images}</p>}
                {Object.keys(errorsPort).filter(key => key.startsWith('images.')).map((key) => (
                  <p key={key} className="text-red-500 text-xs mt-1">{errorsPort[key]}</p>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={processingPort}
                  className="flex-1 py-3 bg-[#2a7de1] text-white rounded-xl font-bold hover:bg-[#1f6fd4] transition-colors shadow-md disabled:opacity-70"
                >
                  {processingPort ? 'جاري الحفظ...' : (editingPortfolio ? 'حفظ التعديلات' : 'حفظ العمل')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper Component: Portfolio Card with Carousel
const PortfolioCard = ({ portfolio, onEdit }) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="h-48 bg-slate-50 border-b border-slate-100 relative flex items-center justify-center overflow-hidden">
        {images.length > 0 ? (
          <>
            <img src={images[currentImageIndex]} alt={portfolio.title} className="w-full h-full object-cover" />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <ChevronRight size={18} />
                </button>
                <button 
                  onClick={nextImage} 
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
                  {images.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <Briefcase className="text-slate-300" size={48} />
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-slate-800 mb-2">{portfolio.title}</h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">{portfolio.marketing_domain}</p>
        <button 
          onClick={() => onEdit(portfolio)} 
          type="button"
          className="mt-auto text-slate-700 text-xs font-bold hover:underline flex items-center gap-1 w-fit"
        >
          <Edit2 size={12} />
          تعديل
        </button>
      </div>
    </div>
  );
};

export default Services;
