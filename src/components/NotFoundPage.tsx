import React from 'react';
import landingBackground from '../../ressources/fond_landing.png';
import logoV1 from '../../ressources/logo_v1.png';

type NotFoundPageProps = {
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onAboutClick: () => void;
  onPricingClick: () => void;
  onBlogClick: () => void;
  onContactClick: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
};

export function NotFoundPage({
  onHomeClick,
  onFeaturesClick,
  onAboutClick,
  onPricingClick,
  onBlogClick,
  onContactClick,
  onLoginClick,
  onSignupClick,
}: NotFoundPageProps) {
  const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

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
            {navItems.map((item) => (
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
                        ? onBlogClick
                        : item === 'Contact'
                          ? onContactClick
                        : undefined
                }
                className="transition hover:text-violet-600"
              >
                {item}
              </button>
            ))}
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

        <main className="relative z-10 pt-24">
          <section className="mx-auto w-full max-w-[1060px] rounded-[28px] border border-[#E6EAF6] bg-white/95 p-8 shadow-[0_28px_72px_rgba(26,40,79,0.14)] sm:p-12">
            <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-violet-600">Erreur 404</p>
            <h1 className="mt-4 text-[38px] font-black leading-[1.08] text-[#10234D] sm:text-[52px]">
              Cette page n&apos;existe pas
            </h1>
            <p className="mt-5 max-w-[700px] text-[16px] leading-[1.65] text-[#586785]">
              Le lien est peut-être incorrect, ou la page a été déplacée. Vous pouvez revenir à l&apos;accueil,
              explorer les fonctionnalités, ou ouvrir le blog.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onHomeClick}
                className="rounded-xl bg-violet-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-violet-700"
              >
                Retour a l&apos;accueil
              </button>
              <button
                type="button"
                onClick={onFeaturesClick}
                className="rounded-xl border border-[#D8DDF1] bg-white px-5 py-3 text-[14px] font-semibold text-[#334467] transition hover:bg-[#F6F8FF]"
              >
                Voir les fonctionnalités
              </button>
              <button
                type="button"
                onClick={onBlogClick}
                className="rounded-xl border border-[#D8DDF1] bg-white px-5 py-3 text-[14px] font-semibold text-[#334467] transition hover:bg-[#F6F8FF]"
              >
                Aller au blog
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
