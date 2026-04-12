const { useEffect, useState, useDeferredValue, startTransition } = React;

const CAR_MODEL_URL =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/ToyCar/glTF-Binary/ToyCar.glb";

const copy = {
  en: {
    brand: {
      name: "VIP Motors Atelier",
      note: "By appointment only",
    },
    nav: [
      { id: "top", label: "Home" },
      { id: "collection", label: "Collection" },
      { id: "concierge", label: "Concierge" },
      { id: "contact", label: "Contact" },
    ],
    languageLabel: "AR",
    mobileMenu: "Open navigation",
    hero: {
      badge: "Private showroom",
      badgeAlt: "Arabic + English concierge",
      title: "A darker kind of luxury.",
      description:
        "VIP Motors curates grand tourers, executive SUVs, and discreet off-market acquisitions with white-glove sourcing, protected logistics, and after-delivery concierge.",
      primaryCta: "Reserve a private viewing",
      secondaryCta: "Explore the collection",
      stats: [
        { value: "87", label: "annual arrivals" },
        { value: "24/7", label: "acquisition desk" },
        { value: "11", label: "private suites" },
      ],
      tags: [
        "Invite-only sourcing",
        "Worldwide enclosed delivery",
        "Collectors and family offices",
      ],
      modelTitle: "Hero model",
      modelNote: "Placeholder GLB loaded live in the hero.",
      modelTag: "GLB placeholder",
      modelAlt: "3D placeholder car model for VIP Motors",
      viewerFallback: "3D preview is unavailable in this browser.",
      highlights: [
        {
          title: "Bespoke commissioning",
          body: "Exterior, trim, stitching, and handover details are tailored before delivery.",
        },
        {
          title: "Discrete sourcing",
          body: "Collector networks, closed allocations, and NDA-first handling keep the process private.",
        },
      ],
    },
    collection: {
      eyebrow: "Private collection",
      title: "Inventory selected for presence, not volume.",
      description:
        "Every arrival is chosen for silhouette, provenance, and cabin finish so the showroom feels edited like a gallery rather than stacked like a lot.",
      cards: [
        {
          series: "V12 Grand Coupe",
          name: "Midnight Sovereign",
          description: "Low-mileage flagship with obsidian paint, hand-finished walnut, and rear lounge specification.",
          power: "715 hp",
          delivery: "48-hour preview",
          price: "Pricing by request",
          note: "Featured allocation",
          chips: ["Obsidian black", "Bespoke trim", "Rear suite"],
        },
        {
          series: "Hybrid GT",
          name: "Emerald Voltage",
          description: "Long-distance performance commission pairing silent city mode with a dramatic grand touring profile.",
          power: "812 hp",
          delivery: "Factory commission",
          price: "Pricing by request",
          note: "Build slot open",
          chips: ["Satin green", "Carbon package", "Private spec"],
        },
        {
          series: "Executive SUV",
          name: "Obsidian Atlas",
          description: "Family office transport tuned for chauffeur comfort, secure travel, and custom cabin privacy.",
          power: "850 Nm",
          delivery: "Immediate handover",
          price: "Pricing by request",
          note: "Ready now",
          chips: ["Quiet cabin", "Privacy glass", "Long-wheelbase"],
        },
      ],
    },
    concierge: {
      eyebrow: "Ownership concierge",
      title: "The dealership disappears. The service remains.",
      description:
        "A single bilingual team handles acquisition, valuation, logistics, and post-delivery details so ownership feels calm from first inquiry to final handover.",
      cards: [
        {
          title: "Private acquisition desk",
          body: "We source from collectors, embassies, and closed dealer networks before vehicles reach public inventory feeds.",
        },
        {
          title: "Signature trade-ins",
          body: "Inspection, valuation, and exchange are structured discreetly for executives, founders, and family offices.",
        },
        {
          title: "Travel and delivery",
          body: "Airport pickup, enclosed shipping, armored transfer, and document handling are coordinated end to end.",
        },
      ],
      lounge: {
        title: "Members lounge",
        quote:
          "We do not compete on volume. We curate time, certainty, and access.",
        points: [
          "Arabic and English advisors in one thread",
          "Digital signing for remote approvals",
          "Presentation-grade detailing before handover",
        ],
      },
    },
    contact: {
      eyebrow: "Reserve a viewing",
      title: "Start with a confidential brief.",
      description:
        "Tell us what you drive now, what you want next, and how soon you want the first keys on the table.",
      name: "Full name",
      email: "Email address",
      interest: "Vehicle interest",
      timeline: "Purchase timing",
      notes: "What should we source for you?",
      namePlaceholder: "Your name",
      emailPlaceholder: "name@example.com",
      notesPlaceholder: "Preferred body style, budget range, or delivery city.",
      interestOptions: [
        "Grand coupe",
        "Executive SUV",
        "Hybrid GT",
        "Bespoke sourcing",
      ],
      timelineOptions: ["Within 30 days", "This quarter", "Exploring options"],
      submit: "Request concierge call",
      sidebarTitle: "Client protocol",
      sidebarBody:
        "Every inquiry is handled as a private brief, then routed to one advisor who stays with the purchase through delivery.",
      bullets: [
        "Appointment-only showroom access",
        "Worldwide enclosed delivery",
        "Arabic and English buyer support",
      ],
    },
    footer: {
      line: "Reserved for the few.",
      subline: "VIP Motors Atelier",
    },
    floatingCta: "Book appointment",
  },
  ar: {
    brand: {
      name: "VIP Motors Atelier",
      note: "بالموعد فقط",
    },
    nav: [
      { id: "top", label: "الرئيسية" },
      { id: "collection", label: "المجموعة" },
      { id: "concierge", label: "الخدمات" },
      { id: "contact", label: "التواصل" },
    ],
    languageLabel: "EN",
    mobileMenu: "فتح التنقل",
    hero: {
      badge: "صالة خاصة",
      badgeAlt: "خدمة بالعربية والإنجليزية",
      title: "فخامة داكنة بطابع مختلف.",
      description:
        "تنسق VIP Motors سيارات الجراند تورر وSUV التنفيذية والفرص الحصرية خارج السوق مع توريد راق وخدمات لوجستية مؤمنة ومرافقة بعد التسليم.",
      primaryCta: "احجز معاينة خاصة",
      secondaryCta: "استعرض المجموعة",
      stats: [
        { value: "87", label: "وصول سنوي" },
        { value: "24/7", label: "مكتب التوريد" },
        { value: "11", label: "أجنحة خاصة" },
      ],
      tags: [
        "توريد حصري",
        "تسليم مغلق حول العالم",
        "للجامعين والمكاتب العائلية",
      ],
      modelTitle: "نموذج الواجهة",
      modelNote: "نموذج GLB تجريبي مباشر داخل الواجهة.",
      modelTag: "GLB تجريبي",
      modelAlt: "نموذج سيارة ثلاثي الأبعاد تجريبي لواجهة VIP Motors",
      viewerFallback: "المعاينة ثلاثية الأبعاد غير متاحة في هذا المتصفح.",
      highlights: [
        {
          title: "تفصيل حسب الطلب",
          body: "يتم تنسيق الطلاء والتطعيمات والخياطة وطريقة التسليم قبل الاستلام النهائي.",
        },
        {
          title: "توريد بسرية",
          body: "شبكات جامعين وحصص مغلقة وتعامل يبدأ بالسرية لضمان الخصوصية الكاملة.",
        },
      ],
    },
    collection: {
      eyebrow: "المجموعة الخاصة",
      title: "مخزون مختار للحضور لا للكثرة.",
      description:
        "كل سيارة يتم اختيارها بسبب الخط الخارجي والسجل والمقصورة، ليبدو المعرض كأنه مساحة منسقة لا ساحة ممتلئة.",
      cards: [
        {
          series: "كوبيه جراند V12",
          name: "Midnight Sovereign",
          description: "فئة رئيسية قليلة الاستخدام بطلاء أوبسيديان وخشب جوز يدوي وتجهيز صالة خلفية.",
          power: "715 حصان",
          delivery: "معاينة خلال 48 ساعة",
          price: "السعر عند الطلب",
          note: "حصة مميزة",
          chips: ["أسود أوبسيديان", "تفصيل خاص", "جناح خلفي"],
        },
        {
          series: "Hybrid GT",
          name: "Emerald Voltage",
          description: "نسخة أداء للمسافات الطويلة تجمع هدوء المدينة مع حضور حاد لسيارة جراند تورر.",
          power: "812 حصان",
          delivery: "طلب مصنع خاص",
          price: "السعر عند الطلب",
          note: "فتحة تصنيع متاحة",
          chips: ["أخضر ساتان", "حزمة كربون", "مواصفات خاصة"],
        },
        {
          series: "SUV تنفيذية",
          name: "Obsidian Atlas",
          description: "سيارة تنقل تنفيذية معدلة لراحة السائق والركاب والخصوصية الكاملة أثناء السفر.",
          power: "850 نيوتن متر",
          delivery: "تسليم فوري",
          price: "السعر عند الطلب",
          note: "جاهزة الآن",
          chips: ["مقصورة هادئة", "زجاج خصوصية", "قاعدة عجلات طويلة"],
        },
      ],
    },
    concierge: {
      eyebrow: "خدمات التملك",
      title: "المعرض يختفي، والخدمة تبقى.",
      description:
        "فريق ثنائي اللغة يدير الشراء والتقييم واللوجستيات وما بعد التسليم لكي تبدو التجربة هادئة من أول رسالة حتى الاستلام النهائي.",
      cards: [
        {
          title: "مكتب اقتناء خاص",
          body: "نحصل على السيارات من جامعين وسفارات وشبكات وكلاء مغلقة قبل ظهورها في القوائم العامة.",
        },
        {
          title: "استبدال بتوقيع خاص",
          body: "الفحص والتقييم والاستبدال يتم تنظيمها بسرية للمؤسسين والتنفيذيين والمكاتب العائلية.",
        },
        {
          title: "السفر والتسليم",
          body: "استقبال المطار والشحن المغلق والنقل المؤمن وإنهاء المستندات يتم تنسيقه كاملا من طرف واحد.",
        },
      ],
      lounge: {
        title: "صالة الأعضاء",
        quote: "نحن لا ننافس بالكثرة، بل ننظم الوقت واليقين والوصول.",
        points: [
          "مستشارون بالعربية والإنجليزية ضمن مسار واحد",
          "توقيع رقمي للاعتمادات عن بعد",
          "تجهيز تفصيلي نهائي قبل التسليم",
        ],
      },
    },
    contact: {
      eyebrow: "احجز معاينة",
      title: "ابدأ بطلب سري ومختصر.",
      description:
        "أخبرنا بما تقوده الآن وما تبحث عنه لاحقا ومتى تريد أن تصل المفاتيح الأولى إلى الطاولة.",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      interest: "نوع السيارة",
      timeline: "توقيت الشراء",
      notes: "ماذا تريد منا أن نوفر لك؟",
      namePlaceholder: "اسمك",
      emailPlaceholder: "name@example.com",
      notesPlaceholder: "نوع الهيكل أو الميزانية أو مدينة التسليم.",
      interestOptions: [
        "كوبيه فاخرة",
        "SUV تنفيذية",
        "Hybrid GT",
        "توريد حسب الطلب",
      ],
      timelineOptions: ["خلال 30 يوما", "خلال هذا الربع", "أستكشف الخيارات"],
      submit: "اطلب اتصالا من المستشار",
      sidebarTitle: "بروتوكول العميل",
      sidebarBody:
        "كل استفسار يعامل كطلب خاص ثم يوجه إلى مستشار واحد يرافق عملية الشراء حتى التسليم.",
      bullets: [
        "الوصول إلى المعرض بالمواعيد فقط",
        "تسليم مغلق حول العالم",
        "دعم شراء بالعربية والإنجليزية",
      ],
    },
    footer: {
      line: "للقلة فقط.",
      subline: "VIP Motors Atelier",
    },
    floatingCta: "احجز موعدا",
  },
};

function ArrowIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHeader({ eyebrow, eyebrowAlt, title, description }) {
  return (
    <div className="reveal max-w-3xl">
      <div className="mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.45em] text-[#c9a66b]">
        <span>{eyebrow}</span>
        <span className="h-px w-8 bg-[#c9a66b]/50" />
        <span className="text-white/[0.38]">{eyebrowAlt}</span>
      </div>
      <h2 className="font-display text-4xl leading-none text-white sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-white/[0.68] sm:text-base">
        {description}
      </p>
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const deferredLanguage = useDeferredValue(language);
  const content = copy[deferredLanguage];
  const alternate = copy[deferredLanguage === "en" ? "ar" : "en"];

  useEffect(() => {
    document.documentElement.lang = deferredLanguage;
    document.documentElement.dir = deferredLanguage === "ar" ? "rtl" : "ltr";
    document.body.dataset.locale = deferredLanguage;
  }, [deferredLanguage]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = document.querySelectorAll(".reveal");

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.18 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [deferredLanguage]);

  const switchLanguage = (nextLanguage) => {
    startTransition(() => {
      setLanguage(nextLanguage);
      setMenuOpen(false);
    });
  };

  return (
    <div className="page-shell min-h-screen overflow-x-hidden bg-[#050507] text-[#f6f0e7]">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-4">
            <div className="h-11 w-11 rounded-full border border-white/10 bg-white/5" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold uppercase tracking-[0.32em] text-white">
                {content.brand.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.38em] text-white/[0.45]">
                {content.brand.note}
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {content.nav.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-xs uppercase tracking-[0.32em] text-white/60 transition hover:text-white"
              >
                {item.label}
                <span className="ml-2 text-white/25">{alternate.nav[index].label}</span>
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
              {["en", "ar"].map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => switchLanguage(locale)}
                  className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.28em] transition ${
                    deferredLanguage === locale
                      ? "bg-[#c9a66b] text-[#121214]"
                      : "text-white/[0.58] hover:text-white"
                  }`}
                  aria-pressed={deferredLanguage === locale}
                >
                  {locale}
                </button>
              ))}
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/40 bg-[#c9a66b] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#121214] transition hover:bg-[#d6b57d]"
            >
              {content.floatingCta}
              <ArrowIcon className="h-4 w-4 rtl-flip" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
            aria-label={content.mobileMenu}
            aria-expanded={menuOpen}
          >
            <div className="space-y-1.5">
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="glass-panel mx-auto mt-3 max-w-7xl rounded-[1.75rem] px-5 py-5 lg:hidden">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.32em] text-white/[0.58]">
                {content.hero.badge}
              </div>
              <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                {["en", "ar"].map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    onClick={() => switchLanguage(locale)}
                    className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.28em] ${
                      deferredLanguage === locale
                        ? "bg-[#c9a66b] text-[#121214]"
                        : "text-white/[0.58]"
                    }`}
                  >
                    {locale}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {content.nav.map((item, index) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 text-sm uppercase tracking-[0.24em] text-white/80"
                >
                  <div>{item.label}</div>
                  <div className="mt-1 text-[11px] tracking-[0.3em] text-white/[0.35]">
                    {alternate.nav[index].label}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="relative pb-32">
        <section id="top" className="relative px-5 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pt-40">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="reveal">
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#c9a66b]/25 bg-[#c9a66b]/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-[#d4b482]">
                  {content.hero.badge}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/[0.48]">
                  {content.hero.badgeAlt}
                </span>
              </div>

              <h1 className="font-display max-w-3xl text-6xl leading-[0.92] text-white sm:text-7xl lg:text-[5.7rem]">
                {content.hero.title}
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                {content.hero.description}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-[#c9a66b]/40 bg-[#c9a66b] px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#111114] transition hover:bg-[#d6b57d]"
                >
                  {content.hero.primaryCta}
                  <ArrowIcon className="h-4 w-4 rtl-flip" />
                </a>
                <a
                  href="#collection"
                  className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-white/[0.72] transition hover:border-white/20 hover:text-white"
                >
                  {content.hero.secondaryCta}
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {content.hero.stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`glass-panel rounded-[1.6rem] px-5 py-5 reveal reveal-delay-${index + 1}`}
                  >
                    <div className="font-display text-4xl text-white">{stat.value}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.28em] text-white/[0.46]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {content.hero.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/[0.52]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="reveal reveal-delay-2">
              <div className="hero-frame glass-panel gold-outline px-5 py-5 sm:px-7 sm:py-7">
                <div className="hero-orbit" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.35em] text-white/[0.38]">
                      {content.hero.modelTitle}
                    </div>
                    <div className="mt-2 text-sm text-white/[0.64]">{content.hero.modelNote}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#d4b482]">
                    {content.hero.modelTag}
                  </div>
                </div>

                <div className="relative z-10 mt-6">
                  <model-viewer
                    className="car-viewer"
                    src={CAR_MODEL_URL}
                    alt={content.hero.modelAlt}
                    camera-controls
                    auto-rotate
                    auto-rotate-delay="0"
                    rotation-per-second="18deg"
                    shadow-intensity="1"
                    exposure="1.15"
                    interaction-prompt="none"
                    touch-action="pan-y"
                  />
                </div>

                <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-2">
                  {content.hero.highlights.map((item, index) => (
                    <div
                      key={item.title}
                      className={`soft-panel rounded-[1.4rem] px-5 py-5 reveal reveal-delay-${index + 1}`}
                    >
                      <div className="text-[11px] uppercase tracking-[0.34em] text-[#d4b482]">
                        {item.title}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/[0.64]">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="collection" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow={content.collection.eyebrow}
              eyebrowAlt={alternate.collection.eyebrow}
              title={content.collection.title}
              description={content.collection.description}
            />

            <div className="showroom-scroll mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-5">
              {content.collection.cards.map((car, index) => (
                <article
                  key={car.name}
                  className={`garage-card showroom-tone-${index} glass-panel reveal min-w-[18.75rem] flex-shrink-0 snap-start rounded-[2rem] p-6 sm:min-w-[22rem] sm:p-7`}
                >
                  <div className="garage-art" />
                  <div className="mt-6 text-[11px] uppercase tracking-[0.34em] text-[#d4b482]">
                    {car.series}
                  </div>
                  <h3 className="mt-3 font-display text-3xl text-white">{car.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/[0.64]">{car.description}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {car.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/50"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.28em] text-white/[0.42]">
                    <span>{car.power}</span>
                    <span>{car.delivery}</span>
                  </div>

                  <div className="thin-divider my-6" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/[0.64]">{car.price}</span>
                    <span className="rounded-full border border-[#c9a66b]/[0.22] bg-[#c9a66b]/10 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-[#d4b482]">
                      {car.note}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="concierge" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow={content.concierge.eyebrow}
              eyebrowAlt={alternate.concierge.eyebrow}
              title={content.concierge.title}
              description={content.concierge.description}
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-6 sm:grid-cols-2">
                {content.concierge.cards.map((card, index) => (
                  <article
                    key={card.title}
                    className={`service-card soft-panel reveal rounded-[2rem] p-6 sm:p-7 ${
                      index === 2 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.35em] text-[#d4b482]">
                      0{index + 1}
                    </div>
                    <h3 className="mt-4 font-display text-3xl text-white">{card.title}</h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/[0.64]">{card.body}</p>
                  </article>
                ))}
              </div>

              <aside className="soft-panel reveal rounded-[2rem] p-7 sm:p-8">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-[#d4b482]">
                  {content.concierge.lounge.title}
                </div>
                <blockquote className="mt-8 font-display text-4xl leading-tight text-white sm:text-5xl">
                  "{content.concierge.lounge.quote}"
                </blockquote>
                <div className="thin-divider my-8" />
                <div className="space-y-4">
                  {content.concierge.lounge.points.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#c9a66b]" />
                      <p className="text-sm leading-7 text-white/[0.64]">{point}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="contact" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow={content.contact.eyebrow}
              eyebrowAlt={alternate.contact.eyebrow}
              title={content.contact.title}
              description={content.contact.description}
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <form
                name="vip-consultation"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
                action="/"
                className="soft-panel reveal rounded-[2rem] p-6 sm:p-8"
              >
                <input type="hidden" name="form-name" value="vip-consultation" />
                <input type="hidden" name="bot-field" />

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-3 block text-[11px] uppercase tracking-[0.34em] text-white/[0.48]">
                      {content.contact.name}
                    </span>
                    <input
                      className="field-shell"
                      type="text"
                      name="name"
                      required
                      placeholder={content.contact.namePlaceholder}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-[11px] uppercase tracking-[0.34em] text-white/[0.48]">
                      {content.contact.email}
                    </span>
                    <input
                      className="field-shell"
                      type="email"
                      name="email"
                      required
                      placeholder={content.contact.emailPlaceholder}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-[11px] uppercase tracking-[0.34em] text-white/[0.48]">
                      {content.contact.interest}
                    </span>
                    <select className="field-shell" name="interest" defaultValue="">
                      <option value="" disabled>
                        {content.contact.interest}
                      </option>
                      {content.contact.interestOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-[11px] uppercase tracking-[0.34em] text-white/[0.48]">
                      {content.contact.timeline}
                    </span>
                    <select className="field-shell" name="timeline" defaultValue="">
                      <option value="" disabled>
                        {content.contact.timeline}
                      </option>
                      {content.contact.timelineOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="mb-3 block text-[11px] uppercase tracking-[0.34em] text-white/[0.48]">
                    {content.contact.notes}
                  </span>
                  <textarea
                    className="field-shell min-h-[160px] resize-y"
                    name="notes"
                    placeholder={content.contact.notesPlaceholder}
                  />
                </label>

                <button
                  type="submit"
                  className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#c9a66b]/40 bg-[#c9a66b] px-6 py-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#111114] transition hover:bg-[#d6b57d]"
                >
                  {content.contact.submit}
                  <ArrowIcon className="h-4 w-4 rtl-flip" />
                </button>
              </form>

              <aside className="glass-panel gold-outline reveal rounded-[2rem] p-6 sm:p-8">
                <div className="text-[11px] uppercase tracking-[0.35em] text-[#d4b482]">
                  {content.contact.sidebarTitle}
                </div>
                <h3 className="mt-5 font-display text-4xl leading-tight text-white sm:text-5xl">
                  {content.hero.badgeAlt}
                </h3>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/[0.64]">
                  {content.contact.sidebarBody}
                </p>

                <div className="thin-divider my-8" />

                <div className="space-y-4">
                  {content.contact.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#c9a66b]" />
                      <p className="text-sm leading-7 text-white/[0.64]">{bullet}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-3xl text-white">{content.footer.line}</div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.38em] text-white/[0.42]">
              {content.footer.subline}
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.38em] text-white/[0.36]">
            {alternate.footer.line}
          </div>
        </div>
      </footer>

      <a
        href="#contact"
        className="sticky-cta fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#c9a66b]/[0.35] bg-[#121216]/[0.82] px-5 py-3 text-[11px] uppercase tracking-[0.34em] text-[#f6f0e7] transition hover:border-[#c9a66b]/[0.55] hover:bg-[#17171d]"
      >
        {content.floatingCta}
        <ArrowIcon className="h-4 w-4 rtl-flip text-[#c9a66b]" />
      </a>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
