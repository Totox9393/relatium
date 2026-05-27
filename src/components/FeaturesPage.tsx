import { ArrowRight, Sparkles } from 'lucide-react';
import landingBackground from '../../ressources/fond_landing.png';
import featBackground from '../../ressources/fond_feat.png';
import logoV1 from '../../ressources/logo_v1.png';
import featAnalyseImage from '../../ressources/feat_analyse.png';
import featCarteImage from '../../ressources/feat_carte.png';
import featListImage from '../../ressources/feat_list.png';
import featPodiumImage from '../../ressources/feat_podium.png';
import featRelationsImage from '../../ressources/feat_relations.png';
import featStatsImage from '../../ressources/feat_stats.png';

export type FeatureActionKey = 'relation-map' | 'ranking' | 'relation-types' | 'statistics' | 'directory' | 'analysis';

interface FeaturesPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onHomeClick: () => void;
  onAboutClick: () => void;
  onPricingClick: () => void;
  onBlogClick: () => void;
  onContactClick: () => void;
  onFeatureClick: (target: FeatureActionKey) => void;
}

interface FeatureCard {
  actionKey: FeatureActionKey;
  title: string;
  description: string;
  image: string;
  imageBg: string;
  cta: string;
  ctaClassName: string;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const featureCards: FeatureCard[] = [
  {
    actionKey: 'relation-map',
    title: 'Carte des relations',
    description: 'Visualisez ton réseau sous forme de carte interactive et explore les connexions entre tes proches.',
    image: featCarteImage,
    imageBg: '#F6F2FF',
    cta: 'Ouvrir',
    ctaClassName: 'bg-[#F1EAFF] text-[#7E4EFF] hover:text-[#6E3EF5]',
  },
  {
    actionKey: 'ranking',
    title: 'Classement',
    description: 'Découvrez les personnes les plus sociales de ton réseau grâce à notre classement des connexions.',
    image: featPodiumImage,
    imageBg: '#FFF7EC',
    cta: 'Voir le classement',
    ctaClassName: 'bg-[#FFF0DD] text-[#F39B28] hover:text-[#E88A0D]',
  },
  {
    actionKey: 'relation-types',
    title: 'Types de relation',
    description: 'Personnalisez et gérez les types de relation pour mieux catégoriser tes connexions.',
    image: featRelationsImage,
    imageBg: '#ECFAF1',
    cta: 'Gérer les types',
    ctaClassName: 'bg-[#E7F8EE] text-[#33B966] hover:text-[#289A53]',
  },
  {
    actionKey: 'statistics',
    title: 'Statistiques',
    description: 'Obtiens des insights clairs sur ton réseau : connexions, évolutions et répartition des relations.',
    image: featStatsImage,
    imageBg: '#EEF4FF',
    cta: 'Voir les statistiques',
    ctaClassName: 'bg-[#E8F1FF] text-[#4285F4] hover:text-[#2D6FDB]',
  },
  {
    actionKey: 'directory',
    title: 'Répertoire',
    description: 'Retrouve toutes les personnes de ton réseau, leurs informations et leurs relations en un seul endroit.',
    image: featListImage,
    imageBg: '#FFEEF7',
    cta: 'Accéder au répertoire',
    ctaClassName: 'bg-[#FFEAF4] text-[#F55DA0] hover:text-[#DE3A88]',
  },
  {
    actionKey: 'analysis',
    title: 'Analyse',
    description: 'Compare deux personnes, découvre leurs relations en commun et analyse ton réseau en profondeur.',
    image: featAnalyseImage,
    imageBg: '#F6F1FF',
    cta: 'Lancer une analyse',
    ctaClassName: 'bg-[#F1EAFF] text-[#7E4EFF] hover:text-[#6E3EF5]',
  },
];

export function FeaturesPage({ onLoginClick, onSignupClick, onHomeClick, onAboutClick, onPricingClick, onBlogClick, onContactClick, onFeatureClick }: FeaturesPageProps) {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-fixed bg-cover bg-center bg-no-repeat pb-8"
      style={{
        backgroundImage: `url(${landingBackground})`,
      }}
    >
      <div className="relative mx-auto max-w-[1376px] px-6 pb-7 pt-5 md:px-10">
        <span className="pointer-events-none absolute -left-[260px] top-[130px] h-[520px] w-[520px] rounded-full border border-[#E2DAF4]" />
        <span className="pointer-events-none absolute -right-[280px] top-[120px] h-[560px] w-[560px] rounded-full border border-[#E2DAF4]" />
        <span className="pointer-events-none absolute left-[8%] top-[190px] h-3 w-3 rounded-full bg-[#DDD3F4]" />
        <span className="pointer-events-none absolute right-[17%] top-[210px] h-3 w-3 rounded-full bg-[#DDD3F4]" />

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
              const isActive = item === 'Fonctionnalités';

              return (
                <button
                  key={item}
                  type="button"
                  onClick={item === 'À propos' ? onAboutClick : item === 'Tarifs' ? onPricingClick : item === 'Blog' ? onBlogClick : item === 'Contact' ? onContactClick : undefined}
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
          <section className="text-center">
            <p className="mx-auto inline-flex items-center rounded-full bg-[#EDE7FE] px-5 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[#7E4EFF]">
              FONCTIONNALITÉS
            </p>
            <h1 className="mx-auto mt-4 max-w-[760px] text-5xl font-extrabold leading-[1.08] tracking-tight text-[#0B1C4B] md:text-[56px]">
              Tout ce qu&apos;il vous faut
              <br />
              pour{' '}
              <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-transparent">
                comprendre vos relations
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-[760px] text-lg leading-[1.55] text-[#5E6A85] md:text-[17px]">
              Relatium regroupe tous les outils nécessaires pour cartographier, analyser
              <br />
              et valoriser votre réseau personnel et professionnel.
            </p>
          </section>

          <section className="mt-7 grid gap-3 lg:grid-cols-3">
            {featureCards.map(card => (
              <article
                key={card.title}
                className="flex min-h-[182px] items-stretch rounded-2xl border border-[#EBE9F2] bg-white p-2.5 shadow-[0_10px_26px_rgba(44,57,91,0.04)]"
              >
                <div
                  className="flex w-[43%] shrink-0 items-center justify-center rounded-xl p-3"
                  style={{ backgroundColor: card.imageBg }}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full max-h-[132px] w-full max-w-[220px] object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-3">
                  <div>
                    <h2 className="text-[19px] font-bold leading-[1.3] text-[#172650]">{card.title}</h2>
                    <p className="mt-2 text-[12px] leading-[1.75] text-[#526382]">{card.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFeatureClick(card.actionKey)}
                    className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition ${card.ctaClassName}`}
                  >
                    {card.cta}
                    <ArrowRight className="h-[15px] w-[15px]" />
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section
            className="relative mt-5 overflow-hidden rounded-[18px] border border-[#E8E3F2] bg-cover bg-no-repeat px-7 py-7 md:px-10 md:py-8"
            style={{
              backgroundImage: `url(${featBackground})`,
              backgroundPosition: 'center',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-[5px]" />

            <div className="relative z-10 grid gap-8 md:min-h-[210px] md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#E4DCF8] bg-white text-[#7E4EFF] shadow-[0_10px_24px_rgba(126,78,255,0.16)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-[45px] font-extrabold leading-[1.15] tracking-tight text-[#10224a]">
                  Prêt à mieux comprendre votre réseau ?
                </h2>
                <p className="mt-2 text-[17px] leading-[1.55] text-[#5D6983]">
                  Rejoignez Relatium et profitez de tous nos outils pour gérer vos relations efficacement.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSignupClick}
                    className="rounded-xl bg-violet-600 px-7 py-3 text-[17px] font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.24)] transition hover:bg-violet-700"
                  >
                    Créer mon compte
                  </button>
                  <button
                    type="button"
                    onClick={onAboutClick}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#DDE3F3] bg-white px-7 py-3 text-[17px] font-semibold text-[#34415F] transition hover:border-[#CAD3EA]"
                  >
                    En savoir plus
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="hidden h-full md:block" aria-hidden="true" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
