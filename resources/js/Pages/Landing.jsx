import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import TermsAndPrivacyModal from '../Components/shared/TermsAndPrivacyModal';

function Landing() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#signup') {
      window.location.href = '/register';
    }
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="صلة" className="h-10 w-auto" />
            </div>

            {/* Navigation */}
            <nav className="hidden items-center gap-8 text-base text-slate-600 md:flex">
              <a href="#why-us" className="hover:text-primary font-medium">لماذا نحن</a>
              <a href="#how-it-works" className="hover:text-primary font-medium">كيف يعمل</a>
              <a href="#companies" className="hover:text-primary font-medium">لرواد الأعمال</a>
              <a href="#freelancers" className="hover:text-primary font-medium">للخبراء</a>
              <a href="#contact" className="hover:text-primary font-medium">تواصل معنا</a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden items-center justify-end gap-3 md:flex">
              <Link
                href="/login"
                className="px-2 py-1 text-base font-semibold text-slate-700 hover:text-slate-900"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-6 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-primary-dark"
              >
                ابدأ مجانا
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="landing-mobile-menu"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
            >
              {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <nav
              id="landing-mobile-menu"
              aria-label="القائمة الرئيسية"
              className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 md:hidden"
            >
              {[
                ['#why-us', 'لماذا نحن'],
                ['#how-it-works', 'كيف يعمل'],
                ['#companies', 'لرواد الأعمال'],
                ['#freelancers', 'للخبراء'],
                ['#contact', 'تواصل معنا'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-primary"
                >
                  {label}
                </a>
              ))}

              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                >
                  ابدأ مجانا
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-10 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h1 className="text-[2rem] sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              ابحث عن خبير يساعدك على
              <span className="block text-primary mt-1">تنمية مشروعك</span>
            </h1>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-lg">
              منصة ربط رواد الأعمال وأصحاب المشاريع بنخبة من الخبراء المتخصصين في خدمات ريادة الأعمال.
              <br />
              تواصل مباشر بدون وسطاء، بدون عمولات.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/register"
                className="bg-primary text-white px-5 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary-dark transition shadow-md"
              >
                ابحث عن خبير
              </Link>
              <Link
                href="/register"
                className="border-2 border-primary text-primary px-5 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary/10 transition bg-white"
              >
                سجل كخبير
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-100 rounded-3xl p-2 shadow-xl">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/images/hero.jpg"
                  alt="Entrepreneurship services expert"
                  width="800"
                  height="500"
                  fetchPriority="high"
                  className="w-full h-55 sm:h-70 lg:h-87.5 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Why Us Section */}
      <section id="why-us" className="py-10 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              لماذا <span className="text-primary">تختارنا؟</span>
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              منصة مصممة لتجمع رواد الأعمال بنخبة خبراء ريادة الأعمال بأسهل وأسرع طريقة
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 hover:shadow-xl transition text-center group">
              <div className="w-20 h-20 bg-[#ffb548]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-extrabold text-primary">0%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">بدون عمولات</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                لا توجد أي عمولات على التعاقدات. ما تدفعه يذهب بالكامل للخبير الذي تختاره لإنجاز وتنمية مشروعك.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 hover:shadow-xl transition text-center group">
              <div className="w-20 h-20 bg-[#ffb548]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">تواصل مباشر</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                تواصل مباشر بين رواد الأعمال والخبراء بدون وسطاء. أنت تتحكم في عملية الاختيار بالكامل.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 hover:shadow-xl transition text-center group">
              <div className="w-20 h-20 bg-[#ffb548]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">١٠٠٪ مجاني</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                التسجيل مجاناً بدون أي رسوم. وجّه ميزانيتك لما هو أهم: نمو مشروعك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-10 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              كيف <span className="text-primary">يعمل؟</span>
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              ثلاث خطوات بسيطة لبدء رحلة نجاحك
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                ١
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">سجل مجاناً</h3>
              <p className="text-sm sm:text-base text-slate-600">أنشئ حسابك مجاناً سواءً كنت رائد أعمال تبحث عن خبير أو خبيراً يقدم خدماته</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                ٢
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ابحث عن خبير</h3>
              <p className="text-sm sm:text-base text-slate-600">ابحث في قاعدة بيانات الخبراء المتخصصين واختر الأنسب لطموحات مشروعك</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                ٣
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">تواصل مباشر</h3>
              <p className="text-sm sm:text-base text-slate-600">تواصل مباشر بين الخبير ورائد الأعمال وابدأ تنفيذ مشروعك بدون وسطاء أو عمولات</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Entrepreneurs Section */}
      <section id="companies" className="py-10 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
                تبحث عن خبير لنمو مشروعك؟
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 mb-6">
                سجل كرائد أعمال مجاناً، واطرح مشروعك لتستلم عروضاً احترافية من نخبة الخبراء في مجالك.
              </p>

              <div className="space-y-4">
                {['ابحث عن خبراء متخصصين وموثوقين', 'تواصل مباشر مع الخبير بدون وسيط', 'قارن بين عروض الأسعار والمراحل واختر الأفضل'].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-slate-700">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-block mt-8 bg-primary text-white px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-primary-dark transition shadow-md"
              >
                سجل كرائد أعمال
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/images/company-meeting.jpg"
                  alt="Business meeting"
                  width="800"
                  height="500"
                  loading="lazy"
                  className="w-full h-75 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Experts Section */}
      <section id="freelancers" className="py-10 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/images/freelancer-team.jpg"
                  alt="Entrepreneurship services team"
                  width="800"
                  height="500"
                  loading="lazy"
                  className="w-full h-75 object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
                قدّم خبرتك لرواد الأعمال
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 mb-6">
                سجل كخبير مجاناً وتواصل مباشرة مع رواد أعمال ومشاريع يبحثون عن خدمات ريادة الأعمال
              </p>

              <div className="space-y-4">
                {[
                  'تصفح المشاريع المتاحة، وتواصل مع رواد الأعمال الذين يحتاجون خبراتك',
                  'استقبال طلبات مشاريع من رواد أعمال وشركات ناشئة',
                  'إبراز وتطوير معرض أعمالك وتوسيع قاعدة عملائك',
                  'استلام إشعارات فورية عن مشاريع جديدة في تخصصك',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-slate-700">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-block mt-8 bg-primary text-white px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-primary-dark transition shadow-md"
              >
                سجل كخبير
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="bg-[#ffb548]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-16 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
              جاهز للإبداع والنمو؟
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              سجل مجاناً اليوم، سواءً كنت رائد أعمال تبحث عن خبير، أو خبيراً يبحث عن مشاريع نوعية.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-primary px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-slate-50 transition shadow-md"
              >
                سجل كرائد أعمال
              </Link>
              <Link
                href="/register"
                className="border-2 border-white text-white px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-white hover:text-primary transition"
              >
                سجل كخبير
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/images/logo.png" alt="صلة" className="h-9 w-auto" />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  منصة ربط رواد الأعمال وأصحاب المشاريع بنخبة من الخبراء المتخصصين في خدمات ريادة الأعمال.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">المنصة</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#why-us" className="hover:text-primary transition">لماذا نحن</a></li>
                  <li><a href="#how-it-works" className="hover:text-primary transition">كيف يعمل</a></li>
                  <li><a href="#companies" className="hover:text-primary transition">لرواد الأعمال</a></li>
                  <li><a href="#freelancers" className="hover:text-primary transition">للخبراء</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">الدعم</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>
                    <a
                      href="mailto:sila.platform.2026@gmail.com"
                      className="hover:text-primary transition"
                    >
                      ايميل
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">القوانين</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="hover:text-primary transition cursor-pointer text-right"
                    >
                      سياسة الاستخدام والخصوصية
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
              جميع الحقوق محفوظة لدى منصة صلة 2026 ©
            </div>
          </div>
        </div>
      </footer>

      <TermsAndPrivacyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        requireDecision={false}
      />
    </div>
  );
}

export default Landing;