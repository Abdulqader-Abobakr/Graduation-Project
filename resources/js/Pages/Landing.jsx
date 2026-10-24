import React, { useEffect } from 'react';
import { Link } from '@inertiajs/react';

function Landing() {
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
          <div className="flex items-center justify-between gap-3 sm:flex-row">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="صلة" className="h-10 w-auto" />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-base text-slate-600">
              <a href="#why-us" className="hover:text-primary font-medium">لماذا نحن</a>
              <a href="#how-it-works" className="hover:text-primary font-medium">كيف يعمل</a>
              <a href="#companies" className="hover:text-primary font-medium">للشركات</a>
              <a href="#freelancers" className="hover:text-primary font-medium">للمستقلين</a>
              <a href="#contact" className="hover:text-primary font-medium">تواصل معنا</a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-2 sm:gap-3 sm:justify-end">
              <Link
                href="/login"
                className="text-sm sm:text-base font-semibold text-slate-700 hover:text-slate-900 px-2 py-1"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white px-4 sm:px-6 py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary-dark transition shadow-sm"
              >
                ابدأ مجانا
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-10 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <div className="inline-block bg-[#ffb548]/10 border border-[#ffb548]/30 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-4 sm:mb-5">
              منصة ربط الشركات بالمستقلين في خدمات ريادة الأعمال
            </div>

            <h1 className="text-[2rem] sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              ابحث عن خبير يساعدك على
              <span className="block text-primary mt-1">تنمية مشروعك</span>
            </h1>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-lg">
              منصة ربط الشركات الصغيرة والمتوسطة مع المستقلين المتخصصين في خدمات ريادة الأعمال.
              <br />
              تواصل مباشر بدون وسطاء، بدون عمولات.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/register"
                className="bg-primary text-white px-5 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary-dark transition shadow-md"
              >
                ابحث عن مستقل
              </Link>
              <Link
                href="/register"
                className="border-2 border-primary text-primary px-5 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary/10 transition bg-white"
              >
                سجل كمستقل
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-100 rounded-3xl p-2 shadow-xl">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/images/hero.jpg"
                  alt="Entrepreneurship services freelancer"
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
              منصة مصممة لتجعل التواصل مع خبراء ريادة الأعمال أسهل وأسرع
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 hover:shadow-xl transition text-center group">
              <div className="w-20 h-20 bg-[#ffb548]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-extrabold text-primary">0%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">بدون عمولات</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                لا توجد أي عمولات على التعاقدات. ما تدفعه يذهب بالكامل للمستقل الذي تختاره.
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
                تواصل مباشر مع خبراء ريادة الأعمال بدون وسطاء. أنت تتحكم في عملية الاختيار.
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
              <p className="text-sm sm:text-base text-slate-600">أنشئ حسابك مجاناً وابدأ رحلة البحث عن المستقل المناسب</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                ٢
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ابحث عن مستقل</h3>
              <p className="text-sm sm:text-base text-slate-600">ابحث في قاعدة بيانات المستقلين المتخصصين واختر الأنسب</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                ٣
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">تواصل مباشر</h3>
              <p className="text-sm sm:text-base text-slate-600">تواصل مباشر مع المستقل وابدأ مشروعك بدون وسطاء أو عمولات</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section id="companies" className="py-10 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
                تبحث عن خبير لنمو مشروعك؟
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 mb-6">
                سجل مجاناً، واستلم عروضاً من مستقلين متخصصين في مجالك.
              </p>

              <div className="space-y-4">
                {['ابحث عن مستقلين متخصصين', 'تواصل مباشر بدون وسيط', 'قارن بين العروض واختر الأفضل'].map((text) => (
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
                سجل كشركة
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

      {/* For Freelancers Section */}
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
                ابحث عن عملاء جدد
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 mb-6">
                سجل كمستقل مجاناً وتواصل مع شركات تبحث عن خدمات ريادة الأعمال
              </p>

              <div className="space-y-4">
                {[
                  'تصفح المشاريع المتاحة، وتواصل مع الشركات التي تحتاج خدماتها',
                  'استقبال طلبات من شركات تحتاج خدماتك',
                  'توسيع قاعدة عملائك',
                  'استلام إشعارات فورية عن مشاريع جديدة في مجالك',
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
                سجل كمستقل
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
              جاهز للإبداع
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              سجل مجاناً اليوم. إما كشركة تبحث عن مستقل، أو كمستقل تبحث عن عملاء.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-primary px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-slate-50 transition shadow-md"
              >
                سجل كشركة
              </Link>
              <Link
                href="/register"
                className="border-2 border-white text-white px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-white hover:text-primary transition"
              >
                سجل كمستقل
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
                  منصة ربط الشركات الصغيرة والمتوسطة مع المستقلين المتخصصين في خدمات ريادة الأعمال.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">المنصة</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#why-us" className="hover:text-primary transition">لماذا نحن</a></li>
                  <li><a href="#how-it-works" className="hover:text-primary transition">كيف يعمل</a></li>
                  <li><a href="#companies" className="hover:text-primary transition">الشركات</a></li>
                  <li><a href="#freelancers" className="hover:text-primary transition">للمستقلين</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">الدعم</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="hover:text-primary transition">مركز المساعدة</a></li>
                  <li><a href="#" className="hover:text-primary transition">تواصل معنا</a></li>
                  <li><a href="#" className="hover:text-primary transition">الأسئلة الشائعة</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-4">القوانين</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="hover:text-primary transition">سياسة الخصوصية</a></li>
                  <li><a href="#" className="hover:text-primary transition">شروط الاستخدام</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
              جميع الحقوق محفوظة لدى منصة صلة 2026 ©
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;