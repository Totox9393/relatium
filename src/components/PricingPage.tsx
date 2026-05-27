import { ArrowRight, CheckCircle2, PlusCircle } from 'lucide-react';
import landingBackground from '../../ressources/fond_landing.png';
import logoV1 from '../../ressources/logo_v1.png';

interface PricingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onAboutClick: () => void;
  onBlogClick: () => void;
  onContactClick: () => void;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const freeFeatures = [
  'Une base Relatium incluse',
  'Carte relationnelle interactive',
  'Répertoire, groupes et types de relations',
  'Statistiques et analyse de votre réseau',
  'Accès gratuit sans paiement requis',
];

const futureFeatures = [
  'Créer plusieurs bases sur le même compte',
  'Séparer facilement vie personnelle, professionnelle ou projets',
  'Tarification par base supplémentaire, à définir plus tard',
];

export function PricingPage({
  onLoginClick,
  onSignupClick,
  onHomeClick,
  onFeaturesClick,
  onAboutClick,
  onBlogClick,
  onContactClick,
}: PricingPageProps) {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-fixed bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${landingBackground})`,
      }}
    >
      <div className="relative mx-auto flex min-h-screen max-w-[1376px] flex-col px-6 py-5 md:px-10">
        <span className="pointer-events-none absolute left-[2.5%] top-[96px] h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute right-[10%] top-[132px] h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute left-[7%] top-[352px] h-1.5 w-1.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute right-[6%] top-[430px] h-1.5 w-1.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1376px] items-center justify-between">
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
              const isActive = item === 'Tarifs';

              return (
                <button
                  key={item}
                  type="button"
                  onClick={
                    item === 'Fonctionnalités'
                      ? onFeaturesClick
                      : item === 'À propos'
                        ? onAboutClick
                        : item === 'Blog'
                          ? onBlogClick
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

        <main className="relative z-10 flex flex-1 items-center py-4">
          <section className="w-full">
            <div className="mx-auto max-w-[760px] text-center">
              <h1 className="mt-5 text-[50px] font-extrabold leading-[1.05] tracking-tight text-[#0B1C4B] md:text-[64px]">
                Relatium est
                <br />
                <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-transparent">
                  gratuit.
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-[650px] text-[17px] leading-[1.6] text-[#5B6884]">
                Vous pouvez créer votre compte et utiliser votre base Relatium sans abonnement. Plus tard, une option payante pourra permettre d’ajouter plusieurs bases sur un même compte.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-[1120px] gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[28px] border border-[#DCEFE4] bg-white/95 p-6 shadow-[0_24px_64px_rgba(26,40,79,0.11)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mt-5 text-[28px] font-black text-[#10234D]">Base incluse</h2>
                    <p className="mt-2 max-w-[480px] text-[15px] leading-[1.6] text-[#5D6C88]">
                      L’expérience principale de Relatium reste gratuite pour démarrer et organiser votre réseau.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F0FBF4] px-4 py-3 text-right">
                    <p className="text-[34px] font-black leading-none text-[#229C55]">0€</p>
                    <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#57A976]">Aujourd’hui</p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3">
                  {freeFeatures.map(feature => (
                    <div key={feature} className="flex items-center gap-3 rounded-2xl bg-[#F8FBFF] px-4 py-3 text-[14px] font-semibold text-[#334467]">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2FB463]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onSignupClick}
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-violet-700"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>

              <article className="rounded-[28px] border border-[#E7EAF5] bg-white/90 p-6 shadow-[0_24px_64px_rgba(26,40,79,0.08)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mt-5 text-[28px] font-black text-[#10234D]">Bases supplémentaires</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] text-[#5D6C88]">
                      Une option pensée pour les personnes qui voudront gérer plusieurs espaces Relatium séparés.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-[#FFF6E6] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-[#C9851F]">
                    À venir
                  </span>
                </div>

                <div className="mt-7 rounded-2xl border border-dashed border-[#CDD7EC] bg-[#F9FAFF] px-5 py-5">
                  <div className="flex items-center gap-3">
                    <PlusCircle className="h-6 w-6 text-[#4285F4]" />
                    <p className="text-[18px] font-black text-[#172A55]">Prix par base à définir</p>
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.6] text-[#61708C]">
                    Cette fonctionnalité n’est pas encore disponible. Elle pourra voir le jour plus tard si elle devient utile pour les utilisateurs de Relatium.
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  {futureFeatures.map(feature => (
                    <div key={feature} className="flex items-start gap-3 text-[14px] font-semibold leading-[1.45] text-[#435371]">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4285F4]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onContactClick}
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D8DDF1] bg-white px-5 py-3 text-[14px] font-bold text-[#334467] transition hover:bg-[#F6F8FF]"
                >
                  Donner votre avis
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
