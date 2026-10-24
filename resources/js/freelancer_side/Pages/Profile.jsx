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
  Save
} from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';

// Tag Input Component
const TagInput = ({ tags, setTags, placeholder, error, buttonText = "أضف" }) => {
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
      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-12 items-center focus-within:border-primary transition-all">
        {tags.map((tag, index) => (
          <span key={index} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm">
            {tag}
            <X size={12} className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors" onClick={() => removeTag(index)} />
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'أضف المزيد... (اضغط Enter)'}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 min-w-37.5 text-xs font-medium"
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

const normalizeAvatar = (avatarPath) => {
  if (!avatarPath) return null;

  if (/^(https?:)?\/\//i.test(avatarPath)) {
    return avatarPath;
  }

  if (avatarPath.startsWith('/')) {
    return avatarPath;
  }

  return `/${avatarPath.replace(/^\/+/, '')}`;
};

const Profile = ({ pageTitle, user = {}, freelancer = {} }) => {
  const { props } = usePage();
  const flash = props.flash ?? {};
  const avatarUrl = normalizeAvatar(user.avatar_path);

  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
  const [showToast, setShowToast] = useState(false);

  // Show floating toast when flash.success arrives
  useEffect(() => {
    if (flash.success) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [flash.success, props]);

  const { data, setData, post, processing, errors } = useForm({
    _method: 'PUT',
    user_name: user.user_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    city: user.city || '',
    job_title: freelancer.job_title || '',
    bio: freelancer.bio || '',
    marketing_specialties: freelancer.marketing_specialties || [],
    experienced_sectors: freelancer.experienced_sectors || [],
    avatar: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/freelancer/profile', {
      preserveScroll: true,
      forceFormData: true,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData('avatar', file);
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview !== avatarUrl && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, avatarUrl]);

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8" dir="rtl">
      {/* SECTION 1: Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{pageTitle || 'ملفي'}</h1>
          <p className="text-slate-500">قم بإدارة بياناتك المهنية وهويتك العامة.</p>
        </div>
        <Link href="/freelancer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
          <ArrowRight size={18} />
          العودة إلى لوحة التحكم
        </Link>
      </div>

      {/* Floating Success Toast */}
      <div
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-100 transition-all duration-500 ease-out ${showToast && flash.success
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
              type="button"
              onClick={() => setShowToast(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto">

        {/* SECTION 2: Personal Info Card */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-8 border-b border-slate-50 pb-4">
            <User size={20} className="text-slate-700" />
            <h2 className="text-xl font-bold">المعلومات الشخصية والمهنية</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-slate-50 overflow-hidden flex items-center justify-center relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-slate-300" />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <button type="button" className="absolute bottom-0 inset-e-0 p-2 bg-primary text-white rounded-full border-2 border-white shadow-lg hover:bg-[#1f6fd4] transition-colors">
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center max-w-30">يفضل صورة احترافية بخلفية سادة (حجم أقصى 5MB)</p>
              {errors.avatar && <p className="text-red-500 text-xs text-center">{errors.avatar}</p>}
            </div>

            {/* Form Section */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
                <input
                  type="text"
                  value={data.user_name}
                  onChange={e => setData('user_name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                />
                {errors.user_name && <p className="text-red-500 text-xs">{errors.user_name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">المسمى الوظيفي</label>
                <input
                  type="text"
                  value={data.job_title}
                  onChange={e => setData('job_title', e.target.value)}
                  placeholder="مثال: مطور واجهات أمامية"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                />
                {errors.job_title && <p className="text-red-500 text-xs">{errors.job_title}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Mail size={14} className="text-slate-400" /> البريد الإلكتروني</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Phone size={14} className="text-slate-400" /> رقم الهاتف</label>
                  <input
                    type="text"
                    value={data.phone_number}
                    onChange={e => setData('phone_number', e.target.value)}
                    dir="ltr"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium text-end"
                  />
                  {errors.phone_number && <p className="text-red-500 text-xs">{errors.phone_number}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> المدينة</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={e => setData('city', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all font-medium"
                  />
                  {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">نبذة تعريفية</label>
                <textarea
                  rows={4}
                  value={data.bio}
                  onChange={e => setData('bio', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all resize-none font-medium leading-relaxed"
                  placeholder="اكتب نبذة عن نفسك وخبراتك..."
                />
                {errors.bio && <p className="text-red-500 text-xs">{errors.bio}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">المهارات والخدمات</label>
                <TagInput
                  tags={data.marketing_specialties}
                  setTags={(val) => setData('marketing_specialties', val)}
                  placeholder="مثال: تطوير المواقع، أبحاث السوق..."
                  error={errors.marketing_specialties}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">مجالات ريادة الأعمال التي تخدمها</label>
                <TagInput
                  tags={data.experienced_sectors}
                  setTags={(val) => setData('experienced_sectors', val)}
                  placeholder="مثال: التجارة الإلكترونية، التعليم..."
                  error={errors.experienced_sectors}
                />
              </div>

            </div>
          </div>

          <div className="mt-10 flex justify-end pt-6 border-t border-slate-50">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center justify-center px-8 py-3 bg-primary hover:bg-[#1f6fd4] text-white font-bold rounded-2xl shadow-sm transition-all disabled:opacity-70"
            >
              <Save size={18} />
              {processing ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </section>

      </div>
    </form>
  );
};

export default Profile;
