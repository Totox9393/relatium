import { ArrowRight, BarChart3, Bell, BookOpen, Heart, Lightbulb, Search, Send, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import landingBackground from '../../ressources/fond_landing.png';
import logoV1 from '../../ressources/logo_v1.png';
import notebookImage from '../../ressources/repertoire2_icon.png';
import type { BlogCategory } from './articles/ArticleTypes';
import { blogArticles } from './articles/registry';

interface BlogPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onAboutClick: () => void;
  onPricingClick: () => void;
  onContactClick: () => void;
  onOpenArticle: (articleSlug: string) => void;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const categoryStats: Array<{ label: BlogCategory; displayLabel: string; icon: typeof Lightbulb; badgeClassName: string; countClassName: string }> = [
  {
    label: 'Conseils',
    displayLabel: 'Conseils',
    icon: Lightbulb,
    badgeClassName: 'bg-[#EEE8FF] text-[#8660FF]',
    countClassName: 'bg-[#F3EEFF] text-[#9A72FF]',
  },
  {
    label: 'Statistiques',
    displayLabel: 'Statistiques',
    icon: BarChart3,
    badgeClassName: 'bg-[#E2F8EC] text-[#37B56A]',
    countClassName: 'bg-[#ECFFF3] text-[#45BD74]',
  },
  {
    label: 'Relations',
    displayLabel: 'Relations',
    icon: Heart,
    badgeClassName: 'bg-[#FFE8F4] text-[#F468B0]',
    countClassName: 'bg-[#FFF0F8] text-[#EB6AAE]',
  },
  {
    label: 'Productivite',
    displayLabel: 'Productivité',
    icon: Sparkles,
    badgeClassName: 'bg-[#FFF2D9] text-[#F0A321]',
    countClassName: 'bg-[#FFF8E8] text-[#E49A21]',
  },
  {
    label: 'Actualites',
    displayLabel: 'Actualités',
    icon: Bell,
    badgeClassName: 'bg-[#FFF0E5] text-[#F59A57]',
    countClassName: 'bg-[#FFF6EF] text-[#E88E4D]',
  },
  {
    label: 'Guides',
    displayLabel: 'Guides',
    icon: BookOpen,
    badgeClassName: 'bg-[#ECECFF] text-[#7A7CFA]',
    countClassName: 'bg-[#F2F2FF] text-[#7679E8]',
  },
];

const authorBadgeByCategory: Record<BlogCategory, string> = {
  Conseils: 'bg-[#F5D8F0] text-[#C25CA6]',
  Statistiques: 'bg-[#DEE7FF] text-[#5F7FE6]',
  Relations: 'bg-[#DCF7E8] text-[#3A9E66]',
  Productivite: 'bg-[#FFEFCF] text-[#C28A20]',
  Actualites: 'bg-[#FFF0E5] text-[#F59A57]',
  Guides: 'bg-[#ECECFF] text-[#7A7CFA]',
};

const categoryDisplayLabel: Record<BlogCategory, string> = {
  Conseils: 'Conseils',
  Statistiques: 'Statistiques',
  Relations: 'Relations',
  Productivite: 'Productivité',
  Actualites: 'Actualités',
  Guides: 'Guides',
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function BlogPage({ onLoginClick, onSignupClick, onHomeClick, onFeaturesClick, onAboutClick, onPricingClick, onContactClick, onOpenArticle }: BlogPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<BlogCategory | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'activated' | 'already_active' | 'not_found' | 'error'>('idle');
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNewsletterSubmit = async () => {
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterStatus('loading');
    try {
      const { data, error } = await supabase.rpc('relatium_subscribe_newsletter', { p_email: email });
      if (error) throw error;
      setNewsletterStatus(data as typeof newsletterStatus);
      if (data === 'activated' || data === 'already_active') setNewsletterEmail('');
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setNewsletterStatus('idle'), 4000);
    } catch {
      setNewsletterStatus('error');
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setNewsletterStatus('idle'), 4000);
    }
  };

  const normalizedSearch = normalize(searchTerm.trim());
  const articleCountByCategory = useMemo(
    () =>
      blogArticles.reduce((accumulator, article) => {
        accumulator[article.category] += 1;
        return accumulator;
      }, {
        Conseils: 0,
        Statistiques: 0,
        Relations: 0,
        Productivite: 0,
        Actualites: 0,
        Guides: 0,
      } as Record<BlogCategory, number>),
    [],
  );

  const filteredArticles = useMemo(() => {
    return blogArticles.filter(article => {
      const matchesCategory = activeCategory ? article.category === activeCategory : true;
      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = normalize([
        article.title,
        article.excerpt,
        article.category,
        article.author,
      ].join(' '));

      return searchableText.includes(normalizedSearch);
    });
  }, [activeCategory, normalizedSearch]);

  const featuredArticle = filteredArticles.find(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat pb-8"
      style={{
        backgroundImage: `url(${landingBackground})`,
      }}
    >
      <div className="relative mx-auto max-w-[1376px] px-6 pb-7 pt-5 md:px-10">
        <span className="pointer-events-none absolute left-[2.5%] top-[95px] h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute left-[4.6%] top-[142px] h-1.5 w-1.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute right-[12%] top-[118px] h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute right-[7.5%] top-[206px] h-1.5 w-1.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />

        <header className="relative z-10 mx-auto flex max-w-[1376px] items-center justify-between pb-6">
          <button
            type="button"
            onClick={onHomeClick}
            className="inline-flex items-center gap-4"
          >
            <span className="relative h-8 w-8 overflow-visible">
              <img src={logoV1} alt="Relatium" className="h-full w-full origin-center scale-[1.75] object-contain" />
            </span>
            <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-[31px] font-extrabold tracking-[-0.02em] text-transparent">
              Relatium
            </span>
          </button>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-slate-600 lg:flex">
            {navItems.map(item => {
              const isActive = item === 'Blog';

              return (
                <button
                  key={item}
                  type="button"
                  onClick={
                    item === 'Fonctionnalités'
                      ? onFeaturesClick
                      : item === 'À propos'
                        ? onAboutClick
                        : item === 'Tarifs'
                          ? onPricingClick
                        : item === 'Contact'
                          ? onContactClick
                        : undefined
                  }
                  className={`relative pb-2 transition ${isActive ? 'text-violet-600' : 'hover:text-violet-600'}`}
                >
                  {item}
                  {isActive ? <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-violet-500" /> : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-xl border border-violet-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={onSignupClick}
              className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Créer un compte
            </button>
          </div>
        </header>

        <main className="relative z-10">
          <section className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="pt-2">
              <h1 className="text-[59px] font-extrabold leading-[1.03] tracking-tight text-[#0C2151]">
                Le blog Relatium
              </h1>
              <p className="mt-4 max-w-[560px] text-[16px] leading-[1.55] text-[#5B6884]">
                Conseils, guides, actualités et bonnes pratiques pour mieux comprendre
                <br />
                vos relations et tirer le meilleur de votre réseau.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <img
                src={notebookImage}
                alt="Illustration carnet"
                className="h-auto w-full max-w-[260px] object-contain -rotate-[12deg] lg:-translate-x-7"
              />

              <label className="group flex h-[47px] w-full max-w-[324px] items-center gap-3 rounded-xl border border-[#ECEAF4] bg-white px-4 shadow-[0_6px_20px_rgba(30,40,70,0.04)] focus-within:border-violet-300">
                <Search className="h-4 w-4 text-violet-500" />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  type="search"
                  placeholder="Rechercher un article..."
                  className="h-full w-full border-none bg-transparent text-[14px] text-[#344160] outline-none placeholder:text-[#9CA7BF]"
                />
              </label>
            </div>
          </section>

          <section className="mt-8 grid gap-4 xl:grid-cols-[1fr_288px]">
            <div className="space-y-4">
              {featuredArticle ? (
                <article className="grid gap-0 overflow-hidden rounded-2xl border border-[#EAE6F3] bg-white p-3 shadow-[0_14px_28px_rgba(26,40,79,0.05)] sm:grid-cols-[44%_56%]">
                  <div className="relative overflow-hidden rounded-xl bg-[#F5EFFF]">
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-violet-500 px-3 py-1 text-[12px] font-semibold text-white">
                      À la une
                    </span>
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.imageAlt}
                      className="h-full min-h-[206px] w-full object-cover"
                    />
                  </div>

                  <div className="flex min-h-[206px] flex-col justify-between px-5 py-4">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-violet-500">{categoryDisplayLabel[featuredArticle.category]}</p>
                      <h2 className="mt-3 whitespace-pre-line text-[30px] font-extrabold leading-[1.15] text-[#10224A]">
                        <button
                          type="button"
                          onClick={() => onOpenArticle(featuredArticle.slug)}
                          className="text-left transition hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          {featuredArticle.title}
                        </button>
                      </h2>
                      <p className="mt-3 text-[14px] leading-[1.6] text-[#5E6B86]">{featuredArticle.excerpt}</p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[13px] text-[#72819D]">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${authorBadgeByCategory[featuredArticle.category]}`}>
                          {featuredArticle.authorInitials}
                        </span>
                        <span className="font-semibold text-[#3A4866]">{featuredArticle.author}</span>
                        <span>•</span>
                        <span>{featuredArticle.date}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenArticle(featuredArticle.slug)}
                        className="inline-flex items-center gap-2 text-[13px] font-semibold text-violet-500 transition hover:text-violet-600"
                      >
                        Lire l&apos;article
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ) : null}

              {regularArticles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {regularArticles.map(article => (
                    <article
                      key={article.slug}
                      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#ECE7F4] bg-white p-3 shadow-[0_12px_24px_rgba(26,40,79,0.045)]"
                    >
                      <div className="overflow-hidden rounded-xl bg-[#F5F2FC]">
                        <img
                          src={article.image}
                          alt={article.imageAlt}
                          className="h-[155px] w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-violet-500">{categoryDisplayLabel[article.category]}</p>
                        <h3 className="mt-2 whitespace-pre-line text-[22px] font-bold leading-[1.28] text-[#132A58]">
                          <button
                            type="button"
                            onClick={() => onOpenArticle(article.slug)}
                            className="text-left transition hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            {article.title}
                          </button>
                        </h3>
                        <p className="mt-2 text-[14px] leading-[1.65] text-[#5D6B87]">{article.excerpt}</p>

                        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[12px] text-[#75839D]">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${authorBadgeByCategory[article.category]}`}>
                              {article.authorInitials}
                            </span>
                            <span>{article.author}</span>
                            <span>•</span>
                            <span>{article.date}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenArticle(article.slug)}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet-500 transition hover:text-violet-600"
                          >
                            Lire l&apos;article
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {filteredArticles.length === 0 ? (
                <div className="rounded-2xl border border-[#EAE6F3] bg-white px-6 py-8 text-center text-[15px] text-[#64728F]">
                  Aucun article ne correspond à votre recherche.
                </div>
              ) : null}
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-[#ECE7F4] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(33,46,82,0.05)]">
                <h2 className="text-[32px] font-bold text-[#10224A]">Catégories</h2>
                <ul className="mt-4 space-y-3">
                  {categoryStats.map(category => {
                    const Icon = category.icon;
                    const isActive = activeCategory === category.label;

                    return (
                      <li key={category.label}>
                        <button
                          type="button"
                          onClick={() => setActiveCategory(previous => (previous === category.label ? null : category.label))}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition ${
                            isActive ? 'bg-[#F4EFFF]' : 'hover:bg-[#F8F5FF]'
                          }`}
                          aria-pressed={isActive}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${category.badgeClassName}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className={`text-[15px] font-medium ${isActive ? 'text-violet-600' : 'text-[#334264]'}`}>
                              {category.displayLabel}
                            </span>
                          </div>
                          <span className={`inline-flex min-w-[34px] items-center justify-center rounded-full px-2 py-0.5 text-[13px] font-semibold ${category.countClassName}`}>
                            {articleCountByCategory[category.label]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-2xl border border-[#ECE7F4] bg-white/72 px-6 py-5 shadow-[0_10px_24px_rgba(33,46,82,0.05)] backdrop-blur-[1px]">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[32px] font-bold text-[#10224A]">Restez informé</h2>
                  <Send className="h-5 w-5 text-violet-300" />
                </div>

                <p className="text-[15px] leading-[1.6] text-[#5F6D88]">
                  Recevez nos derniers articles directement
                  <br />
                  dans votre boîte mail.
                </p>

                <div className="mt-4 flex h-12 overflow-hidden rounded-xl border border-[#EAE6F3] bg-white/88">
                  <input
                    type="email"
                    placeholder="Votre adresse e-mail"
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleNewsletterSubmit(); }}
                    disabled={newsletterStatus === 'loading'}
                    className="w-full border-none px-4 text-[14px] text-[#3A4764] outline-none placeholder:text-[#9CA8BF] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => void handleNewsletterSubmit()}
                    disabled={newsletterStatus === 'loading' || !newsletterEmail.trim()}
                    className="flex w-12 items-center justify-center bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-50"
                    aria-label="S'abonner"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <p className={`mt-3 text-[12px] transition-colors ${
                  newsletterStatus === 'activated'     ? 'text-emerald-600' :
                  newsletterStatus === 'already_active'? 'text-violet-500'  :
                  newsletterStatus === 'not_found'     ? 'text-amber-600'   :
                  newsletterStatus === 'error'         ? 'text-rose-500'    :
                  newsletterStatus === 'loading'       ? 'text-[#8B95AD]'   :
                                                        'text-[#8B95AD]'
                }`}>
                  {newsletterStatus === 'activated'      && '✓ Newsletter activée sur votre compte Relatium !'}
                  {newsletterStatus === 'already_active' && 'Vous êtes déjà abonné à la newsletter.'}
                  {newsletterStatus === 'not_found'      && 'Aucun compte Relatium associé à cet e-mail.'}
                  {newsletterStatus === 'error'          && 'Une erreur est survenue, réessayez.'}
                  {newsletterStatus === 'loading'        && 'Vérification en cours...'}
                  {newsletterStatus === 'idle'           && 'Pas de spam, désinscription à tout moment.'}
                </p>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
