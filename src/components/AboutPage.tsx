import { Shield, Sparkles, UsersRound } from 'lucide-react';
import landingBackground from '../../ressources/fond_landing.png';
import logoV1 from '../../ressources/logo_v1.png';
import welcomeLogo from '../../ressources/logo_welcome.png';

interface AboutPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onPricingClick: () => void;
  onBlogClick: () => void;
  onContactClick: () => void;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const highlightCards = [
  {
    title: 'Confidentialité avant tout',
    description: 'Vos données sont sécurisées et restent privées. Votre réseau vous appartient.',
    icon: Shield,
  },
  {
    title: 'Simple et intuitif',
    description: 'Une interface claire pour cartographier vos relations en quelques clics.',
    icon: UsersRound,
  },
  {
    title: 'Fait pour tous',
    description: 'Que ce soit pour votre vie personnelle, professionnelle ou associative.',
    icon: Sparkles,
  },
];

export function AboutPage({ onLoginClick, onSignupClick, onHomeClick, onFeaturesClick, onPricingClick, onBlogClick, onContactClick }: AboutPageProps) {
  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat pb-8"
      style={{
        backgroundImage: `url(${landingBackground})`,
      }}
    >
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
              const isActive = item === 'À propos';
              return (
                <button
                  key={item}
                  type="button"
                  onClick={item === 'Fonctionnalités' ? onFeaturesClick : item === 'Tarifs' ? onPricingClick : item === 'Blog' ? onBlogClick : item === 'Contact' ? onContactClick : undefined}
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

        <main className="mx-auto max-w-[1120px] pt-2">
          <section className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <h1 className="text-[72px] font-extrabold leading-[1.02] tracking-[-0.015em] text-[#10224A]">
                À propos
                <br />
                de{' '}
                <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-transparent">
                  Relatium
                </span>
              </h1>

              <div className="mt-5 flex items-center gap-3">
                <span className="h-[4px] w-12 rounded-full bg-violet-500" />
                <Sparkles className="h-4 w-4 text-violet-300" />
              </div>

              <p className="mt-7 max-w-[520px] text-[17px] leading-[1.55] text-[#495B7C]">
                Relatium est un outil de cartographie relationnelle pensé pour vous aider à visualiser, comprendre et valoriser toutes les relations qui comptent dans votre vie.
              </p>
              <p className="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-[#495B7C]">
                Que ce soit pour votre vie personnelle ou professionnelle, Relatium vous offre une vision claire de votre réseau et des liens qui vous entourent.
              </p>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute h-[470px] w-[470px] rounded-full border border-[#EFE9FB]" />
              <span className="absolute left-10 top-28 h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E4DBF8]" />
              <span className="absolute right-20 top-16 h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E4DBF8]" />
              <span className="absolute right-8 bottom-24 h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E4DBF8]" />
              <img
                src={welcomeLogo}
                alt="Illustration Relatium"
                className="relative z-10 h-auto w-full max-w-[560px] object-contain"
              />
            </div>
          </section>

          <section className="mt-12 rounded-[22px] border border-[#ECE7F4] bg-[#F7F4FB]/90 px-8 py-7">
            <div className="grid gap-6 md:grid-cols-3 md:gap-0">
              {highlightCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className={`flex gap-4 ${index < highlightCards.length - 1 ? 'md:border-r md:border-[#E6E2F0] md:pr-6' : ''} ${index > 0 ? 'md:pl-6' : ''}`}
                  >
                    <span className="mt-1 inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EEE8FC] text-violet-500">
                      <Icon className="h-7 w-7" />
                    </span>
                    <div>
                      <h2 className="text-[20px] font-bold text-[#152A55] md:text-[24px]">{card.title}</h2>
                      <p className="mt-2 text-[14px] leading-[1.55] text-[#55698A] md:text-[17px]">{card.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
