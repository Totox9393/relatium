import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import logoV1 from '../../../ressources/logo_v1.png';
import type { BlogArticle } from './ArticleTypes';
import { blogArticles } from './registry';

interface ArticleReaderPageProps {
  article: BlogArticle;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onAboutClick: () => void;
  onPricingClick: () => void;
  onContactClick: () => void;
  onBackToBlog: () => void;
  onOpenArticle: (articleSlug: string) => void;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const categoryDisplayLabel: Record<BlogArticle['category'], string> = {
  Conseils: 'Conseils',
  Statistiques: 'Statistiques',
  Relations: 'Relations',
  Productivite: 'Productivité',
  Actualites: 'Actualités',
  Guides: 'Guides',
};

const getArticleUrl = (articleSlug: string) => {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const articlePath = `${basePath}/blog/${articleSlug}`;

  if (typeof window === 'undefined') {
    return articlePath;
  }

  return new URL(articlePath, window.location.origin).toString();
};

const normalizeShareText = (text: string) => text.replace(/\s+/g, ' ').trim();

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

export function ArticleReaderPage({
  article,
  onLoginClick,
  onSignupClick,
  onHomeClick,
  onFeaturesClick,
  onAboutClick,
  onPricingClick,
  onContactClick,
  onBackToBlog,
  onOpenArticle,
}: ArticleReaderPageProps) {
  const [shareFeedback, setShareFeedback] = useState('');
  const summaryItems = [...article.sections.map(section => ({ id: section.id, label: section.title })), { id: 'conclusion', label: 'Conclusion' }];
  const articleUrl = getArticleUrl(article.slug);
  const shareTitle = normalizeShareText(article.title);
  const shareText = `${shareTitle} - ${article.excerpt}`;
  const canUseNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const similarArticles = useMemo(() => {
    const sameCategoryArticles = blogArticles.filter(candidate => candidate.category === article.category && candidate.slug !== article.slug);
    const shuffled = [...sameCategoryArticles];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, 3);
  }, [article.category, article.slug]);

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=720,height=640');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: article.excerpt,
        url: articleUrl,
      });
      setShareFeedback('Partage prêt.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setShareFeedback('Partage indisponible.');
    }
  };

  const handleSocialShare = (network: 'linkedin' | 'x' | 'facebook') => {
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedText = encodeURIComponent(shareText);
    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };

    openShareWindow(shareUrls[network]);
    setShareFeedback('Publication ouverte dans un nouvel onglet.');
  };

  const handleCopyLink = async () => {
    try {
      await copyTextToClipboard(articleUrl);
      setShareFeedback('Lien copié.');
    } catch {
      setShareFeedback('Copie indisponible.');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="mx-auto max-w-[1376px] px-6 pb-7 pt-5 md:px-10">
        <header className="mx-auto flex max-w-[1376px] items-center justify-between pb-6">
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
                        : item === 'Blog'
                          ? onBackToBlog
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

        <main className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_292px]">
          <article className="min-w-0">
            <button
              type="button"
              onClick={onBackToBlog}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-violet-500 transition hover:text-violet-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au blog
            </button>

            <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-start">
              <div>
                <div className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-violet-600">
                  <span className="rounded-md bg-violet-100 px-2 py-1">{categoryDisplayLabel[article.category]}</span>
                  <span className="text-[#6E7A96] normal-case tracking-normal">{article.readTime}</span>
                </div>

                <h1 className="mt-4 whitespace-pre-line text-[52px] font-extrabold leading-[1.06] tracking-tight text-[#10224A]">
                  {article.title}
                </h1>

                <p className="mt-4 max-w-[640px] text-[17px] leading-[1.6] text-[#566480]">{article.excerpt}</p>

                <div className="mt-6 flex items-center gap-3 text-[13px] text-[#6B7894]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#DFF5E8] text-[12px] font-bold text-[#3AA36A]">
                    {article.authorInitials}
                  </span>
                  <div>
                    <p className="font-semibold text-[#2E3F65]">Écrit par {article.author}</p>
                    <p>{article.date}</p>
                  </div>
                </div>
              </div>

              <div className="relative isolate overflow-hidden rounded-[42%_58%_50%_50%/34%_40%_60%_66%] bg-[#F2ECFF]">
                <div
                  className="absolute inset-0 scale-110 bg-cover bg-center blur-[28px] opacity-75"
                  style={{ backgroundImage: `url(${article.image})` }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.38)_0%,rgba(246,240,255,0.16)_52%,rgba(238,230,255,0.24)_100%)]" />
                <img
                  src={article.image}
                  alt={article.imageAlt}
                  className="relative z-10 h-auto w-full object-cover"
                  style={{
                    WebkitMaskImage: 'radial-gradient(120% 90% at 50% 50%, black 64%, transparent 100%)',
                    maskImage: 'radial-gradient(120% 90% at 50% 50%, black 64%, transparent 100%)',
                  }}
                />
              </div>
            </section>

            <section className="mt-8 border-l-4 border-violet-200 pl-5">
              <h2 className="text-[31px] font-bold text-[#142B59]">{article.summaryLeadTitle}</h2>
              <p className="mt-2 max-w-[820px] text-[15px] leading-[1.65] text-[#596884]">{article.summaryLeadText}</p>
            </section>

            <div className="mt-8 space-y-9">
              {article.sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-20 border-t border-[#ECE8F4] pt-8 first:border-t-0 first:pt-0">
                  <h3 className="text-[34px] font-bold leading-[1.18] text-[#122A58]">
                    {index + 1}. {section.title}
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.65] text-[#596884]">{section.intro}</p>

                  <div className="mt-5 border-l-2 border-violet-200 pl-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.09em] text-[#7A6A96]">Bonnes pratiques</p>
                    <ul className="mt-2 space-y-2 text-[14px] leading-[1.6] text-[#445676]">
                      {section.tips.map(tip => (
                        <li key={tip} className="flex items-start gap-2">
                          <span className="mt-[0.42rem] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ))}
            </div>

            <section id="conclusion" className="scroll-mt-20 mt-8 border-t border-[#ECE8F4] pt-8">
              <h3 className="text-[33px] font-bold text-[#122A58]">Conclusion</h3>
              <p className="mt-2 max-w-[820px] text-[16px] leading-[1.65] text-[#596884]">{article.conclusion}</p>
            </section>
          </article>

          <aside className="space-y-8 xl:sticky xl:top-5 xl:self-start">
            <section className="border-b border-[#ECE7F4] pb-6">
              <h2 className="text-[26px] font-bold text-[#132A57]">Sommaire</h2>
              <ol className="mt-3 space-y-2 text-[14px] leading-[1.55] text-[#495A7D]">
                {summaryItems.map((item, index) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`transition hover:text-violet-600 ${index === 0 ? 'text-violet-600' : ''}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {index + 1}. {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <section className="border-b border-[#ECE7F4] pb-6">
              <h2 className="text-[26px] font-bold text-[#132A57]">Partagez cet article</h2>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold">
                {canUseNativeShare ? (
                  <button type="button" onClick={handleNativeShare} className="text-violet-600 transition hover:underline">Partager</button>
                ) : null}
                <button type="button" onClick={() => handleSocialShare('linkedin')} className="text-[#2A66BC] transition hover:underline">LinkedIn</button>
                <button type="button" onClick={() => handleSocialShare('x')} className="text-[#1D9BF0] transition hover:underline">X</button>
                <button type="button" onClick={() => handleSocialShare('facebook')} className="text-[#1F74F2] transition hover:underline">Facebook</button>
                <button type="button" onClick={handleCopyLink} className="text-violet-600 transition hover:underline">Copier le lien</button>
              </div>
              {shareFeedback ? <p className="mt-3 text-[12px] font-semibold text-[#6A7894]">{shareFeedback}</p> : null}
            </section>

            <section>
              <h2 className="text-[26px] font-bold text-[#132A57]">Articles similaires</h2>
              <div className="mt-4 space-y-3">
                {similarArticles.length > 0 ? (
                  similarArticles.map(similarArticle => (
                    <button
                      key={similarArticle.slug}
                      type="button"
                      onClick={() => onOpenArticle(similarArticle.slug)}
                      className="text-left text-[14px] leading-[1.5] text-[#22365E] transition hover:text-violet-600"
                    >
                      {similarArticle.title.replace('\n', ' ')}
                    </button>
                  ))
                ) : (
                  <p className="text-[14px] leading-[1.5] text-[#6A7894]">Pas encore d&apos;autres articles dans cette catégorie.</p>
                )}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
