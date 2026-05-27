import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Flame,
  Gamepad2,
  GraduationCap,
  Heart,
  Lock,
  Network,
  Play,
  Star,
  UserRound,
  Users,
  Users2,
} from 'lucide-react';
import landingBackground from '../../ressources/fond_landing.png';
import logoV1 from '../../ressources/logo_v1.png';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onFeaturesClick: () => void;
  onAboutClick: () => void;
  onPricingClick: () => void;
  onBlogClick: () => void;
  onContactClick: () => void;
  onTrailerClick: () => void;
  isAuthenticated?: boolean;
  onLogoutClick?: () => void;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const graphCenter = { x: 276, y: 248 };

const relationNodes = [
  {
    label: 'Lucas',
    icon: Users,
    color: '#63D286',
    lineColor: '#6ED38B',
    lineIcon: Users,
    x: 88,
    y: 78,
    iconNudge: { x: 0, y: 0.5 },
    lineIconNudge: { x: 0, y: 0.3 },
  },
  {
    label: 'Chloé',
    icon: Heart,
    color: '#F56FA0',
    lineColor: '#F3C46A',
    lineIcon: Star,
    x: 282,
    y: 20,
    iconNudge: { x: 0, y: 0 },
    lineIconNudge: { x: 0, y: 0.2 },
  },
  {
    label: 'Amélia',
    icon: Star,
    color: '#F4C938',
    lineColor: '#F2C94C',
    lineIcon: Heart,
    x: 468,
    y: 82,
    iconNudge: { x: 0, y: 0.2 },
    lineIconNudge: { x: 0, y: 0.2 },
  },
  {
    label: 'Enzo',
    icon: GraduationCap,
    color: '#7EA3FF',
    lineColor: '#8A7CF6',
    lineIcon: Gamepad2,
    x: 486,
    y: 232,
    iconNudge: { x: 0, y: -0.5 },
    lineIconNudge: { x: 0, y: 0.2 },
  },
  {
    label: 'Sophie',
    icon: Users,
    color: '#63D286',
    lineColor: '#C6CCD8',
    lineIcon: Users,
    x: 432,
    y: 398,
    iconNudge: { x: 0, y: 0.5 },
    lineIconNudge: { x: 0, y: 0.3 },
  },
  {
    label: 'Thomas',
    icon: Flame,
    color: '#FFA236',
    lineColor: '#FFA43E',
    lineIcon: Star,
    x: 274,
    y: 436,
    iconNudge: { x: 0, y: 0.8 },
    lineIconNudge: { x: 0, y: 0.2 },
  },
  {
    label: 'Marc',
    icon: Briefcase,
    color: '#72A7FF',
    lineColor: '#72A7FF',
    lineIcon: Briefcase,
    x: 70,
    y: 378,
    iconNudge: { x: 0, y: 0.4 },
    lineIconNudge: { x: 0, y: 0.3 },
  },
  {
    label: 'Julie',
    icon: Heart,
    color: '#F56FA0',
    lineColor: '#F58AB9',
    lineIcon: Heart,
    x: 30,
    y: 238,
    iconNudge: { x: 0, y: 0 },
    lineIconNudge: { x: 0, y: 0.2 },
  },
];

const featureCards = [
  {
    title: 'Carte interactive',
    text: 'Visualisez tout votre réseau d’un seul coup d’œil grâce à la carte de relations.',
    icon: Network,
    color: '#8B5CF6',
    iconBg: '#ECE3FF',
  },
  {
    title: 'Statistiques avancées',
    text: 'Découvrez des statistiques détaillées sur vos relations et votre réseau.',
    icon: BarChart3,
    color: '#22C55E',
    iconBg: '#DFF3E5',
  },
  {
    title: 'Types de relations',
    text: 'Personnalisez et gérez tous les types de relations selon vos besoins.',
    icon: Heart,
    color: '#EC4899',
    iconBg: '#F8E0EC',
  },
  {
    title: 'Comparez vos relations',
    text: 'Comparez facilement les réseaux de deux personnes pour révéler les liens manquants.',
    icon: Users,
    color: '#F59E0B',
    iconBg: '#F8EDDC',
  },
  {
    title: 'Confidentialité',
    text: 'Vos données sont sécurisées et restent privées. Votre réseau vous appartient.',
    icon: Lock,
    color: '#3B82F6',
    iconBg: '#DEE8FA',
  },
];

const toolStats = [
  {
    value: '100%',
    label: 'Gratuit pour toujours',
    icon: Heart,
  },
  {
    value: '∞',
    label: 'Relations sans limite',
    icon: Users2,
  },
  {
    value: 'Sécurisé',
    label: 'Vos données protégées',
    icon: Lock,
  },
  {
    value: 'Simple',
    label: 'Interface intuitive',
    icon: Star,
  },
];

export function LandingPage({
  onLoginClick,
  onSignupClick,
  onFeaturesClick,
  onAboutClick,
  onPricingClick,
  onBlogClick,
  onContactClick,
  onTrailerClick,
  isAuthenticated = false,
  onLogoutClick,
}: LandingPageProps) {
  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat pb-8"
      style={{
        backgroundImage: `url(${landingBackground})`,
      }}
    >
      <div>
        <header className="relative z-30 mx-auto flex max-w-[1376px] items-center justify-between px-6 pb-6 pt-5 md:px-10">
          <div className="inline-flex items-center gap-4">
            <span className="relative h-8 w-8 overflow-visible">
              <img src={logoV1} alt="Relatium" className="h-full w-full origin-center scale-[1.75] object-contain" />
            </span>
            <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-[31px] font-extrabold tracking-[-0.02em] text-transparent">
              Relatium
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-slate-600 lg:flex">
            {navItems.map(item => (
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
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onLogoutClick}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Déconnexion
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </header>

        <section className="mx-auto grid max-w-[1530px] gap-10 px-6 pb-10 md:px-10 lg:grid-cols-[1.03fr_1fr]">
          <div className="pt-2">

            <h1 className="mt-6 max-w-[580px] text-[66px] font-extrabold leading-[1.03] tracking-tight text-[#0B1C4B]">
              Découvrez la vraie valeur de vos
              <br />
              <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-transparent">
                relations.
              </span>{' '}
              <span className="text-pink-400">❤</span>
            </h1>

            <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-slate-600">
              Relatium est un outil de cartographie relationnelle qui vous permet de créer un graphique interactif de toutes les personnes qui composent votre vie et les liens qui vous unissent.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSignupClick}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)] transition hover:bg-violet-700"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onTrailerClick}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-6 py-3 text-sm font-semibold text-violet-600 transition hover:border-violet-300"
              >
                Voir le trailer
                <Play className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-7 flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-[11px] font-bold text-white">
                  AL
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-500 text-[11px] font-bold text-white">
                  MO
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-[11px] font-bold text-white">
                  TR
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-200 text-[10px] font-bold text-slate-700">
                  +2K
                </div>
              </div>

              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Créez sans limite</span>
                <br />
                grâce à Relatium
              </p>
            </div>
          </div>

          <div className="pointer-events-none relative min-h-[500px] px-2 py-1">
            <div className="relative mx-auto h-[510px] w-full max-w-[560px]">
              <div
                className="absolute inset-0 landing-graph-rotate"
                style={{ transformOrigin: `${graphCenter.x}px ${graphCenter.y}px` }}
              >
              {relationNodes.map((node, nodeIndex) => {
                const dx = node.x - graphCenter.x;
                const dy = node.y - graphCenter.y;
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                const length = Math.sqrt(dx * dx + dy * dy);
                const lineIconX = graphCenter.x + dx * 0.58;
                const lineIconY = graphCenter.y + dy * 0.58;
                const iconNudge = node.iconNudge ?? { x: 0, y: 0 };
                const lineIconNudge = node.lineIconNudge ?? { x: 0, y: 0 };
                const Icon = node.icon;
                const LineIcon = node.lineIcon;

                return (
                  <div key={node.label}>
                    <div
                      className="absolute border-t border-dashed landing-graph-link-pulse"
                      style={{
                        left: graphCenter.x,
                        top: graphCenter.y,
                        width: `${length}px`,
                        borderColor: node.lineColor,
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '0 0',
                        opacity: 0.9,
                        animationDelay: `${nodeIndex * 0.18}s`,
                      }}
                    />

                    <div
                      className="absolute h-4 w-4 rounded-full bg-white landing-graph-link-pulse"
                      style={{
                        left: `${lineIconX - 8}px`,
                        top: `${lineIconY - 8}px`,
                        animationDelay: `${nodeIndex * 0.22}s`,
                      }}
                    >
                      <LineIcon
                        className="absolute h-[11px] w-[11px] landing-graph-link-pulse"
                        style={{
                          left: '50%',
                          top: '50%',
                          color: node.lineColor,
                          transform: `translate(-50%, -50%) translate(${lineIconNudge.x}px, ${lineIconNudge.y}px)`,
                          animationDelay: `${nodeIndex * 0.18}s`,
                        }}
                      />
                    </div>

                    <div
                      className="absolute landing-graph-counter-rotate"
                      style={{
                        left: `${node.x - 30}px`,
                        top: `${node.y - 30}px`,
                      }}
                    >
                      <div
                        className="landing-graph-node-float"
                        style={{ animationDelay: `${nodeIndex * 0.35}s` }}
                      >
                        <div className="relative h-[60px] w-[60px] rounded-full border-2 border-white bg-white shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
                          <Icon
                            className="absolute h-7 w-7"
                            style={{
                              left: '50%',
                              top: '50%',
                              color: node.color,
                              transform: `translate(-50%, -50%) translate(${iconNudge.x}px, ${iconNudge.y}px)`,
                            }}
                          />
                        </div>
                        <p className="mx-auto mt-1.5 w-fit rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                          {node.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              <div
                className="absolute flex h-[84px] w-[84px] items-center justify-center rounded-full border border-violet-100 bg-white shadow-[0_14px_32px_rgba(124,58,237,0.12)] landing-graph-core-pulse"
                style={{
                  left: `${graphCenter.x - 42}px`,
                  top: `${graphCenter.y - 42}px`,
                }}
              >
                <UserRound
                  className="absolute h-9 w-9 text-violet-600"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>

              <p
                className="absolute rounded-full bg-white px-4 py-1 text-[13px] font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                style={{
                  left: `${graphCenter.x}px`,
                  top: `${graphCenter.y + 46}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                Vous
              </p>

              <span className="absolute left-[18%] top-[31%] h-2 w-2 rounded-full bg-slate-300" />
              <span className="absolute left-[35%] top-[14%] h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="absolute right-[20%] top-[26%] h-2 w-2 rounded-full bg-slate-300" />
              <span className="absolute right-[26%] bottom-[21%] h-2 w-2 rounded-full bg-slate-300" />
              <span className="absolute left-[30%] bottom-[22%] h-2 w-2 rounded-full bg-slate-300" />
            </div>
          </div>
        </section>

        <section className="mx-auto mb-8 w-full max-w-[1530px] px-6 md:px-10">
          <div className="rounded-[30px] border border-[#e8e3f2] bg-white px-6 pb-7 pt-7 shadow-[0_14px_34px_rgba(123,97,255,0.06)] md:px-9">
          <p className="text-center text-[10px] font-bold tracking-[0.16em] text-[#8f7bff]">
            <span className="mr-1 text-[#8f7bff]">✦</span>
            PARCE QUE CHAQUE RELATION COMPTE
          </p>
          <h2 className="mt-1 text-center text-[37px] font-extrabold leading-[1.1] tracking-tight text-[#0B1C4B] md:text-[49px]">
            Un outil complet pour votre réseau
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {featureCards.map(card => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-xl border border-[#ece8f4] bg-white px-4 py-5 text-center"
                >
                  <div
                    className="mx-auto inline-flex items-center justify-center rounded-full"
                    style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: card.iconBg,
                      color: card.color,
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                  </div>
                  <h3 className="mt-3 text-[19px] font-semibold leading-[1.28] text-[#132750]">{card.title}</h3>
                  <p className="mt-2 text-[12px] leading-[1.55] text-[#576a8e]">{card.text}</p>
                </article>
              );
            })}
          </div>

          <div
            className="relative mt-4 overflow-hidden rounded-xl border border-[#b9a0ff] px-3 py-4"
            style={{ background: 'linear-gradient(90deg, #c8abff 0%, #ad8df8 52%, #8f6de8 100%)' }}
          >
            <span className="pointer-events-none absolute -left-2 top-6 h-12 w-12 rounded-full border border-white/20" />
            <span className="pointer-events-none absolute left-6 top-11 h-1.5 w-1.5 rounded-full bg-white/25" />
            <span className="pointer-events-none absolute left-12 top-8 h-1.5 w-1.5 rounded-full bg-white/25" />
            <span className="pointer-events-none absolute -right-2 top-6 h-12 w-12 rounded-full border border-white/20" />
            <span className="pointer-events-none absolute right-6 top-11 h-1.5 w-1.5 rounded-full bg-white/25" />
            <span className="pointer-events-none absolute right-12 top-8 h-1.5 w-1.5 rounded-full bg-white/25" />

            <div className="relative grid grid-cols-1 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-2">
              {toolStats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`text-center lg:px-2 ${index < toolStats.length - 1 ? 'lg:border-r lg:border-white/25' : ''}`}
                  >
                    <Icon className="mx-auto h-4 w-4 text-white" />
                    <p className="mt-1 text-[34px] font-bold leading-none text-white md:text-[36px]">{stat.value}</p>
                    <p className="mt-1 text-[12px] text-[#f4eeff]">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </section>
      </div>
    </div>
  );
}
