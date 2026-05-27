import { useState } from 'react';
import sidebarBackground from '../../ressources/fond_volet_gauche.png';
import insightBackground from '../../ressources/fond_container_insight.png';
import logoV1 from '../../ressources/logo_v1.png';
import {
  ArrowRight,
  Trophy,
  UserPlus,
  Settings2,
  LogOut,
  Search,
  LayoutDashboard,
  Network,
  BookUser,
  UsersRound,
  Tags,
  BarChart3,
  Activity,
  Settings,
  Lightbulb,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { getProfilePictureSrc } from '../profilePictures';

type NavigationView = 'dashboard' | 'relation-map' | 'directory' | 'groups' | 'relation-types' | 'statistics' | 'analysis' | 'settings';
type DailyTipAction = 'Créer un type' | 'Ajouter une personne' | 'Mettre à jour les liens' | 'Créer un groupe' | 'Voir l\'analyse';

interface NavigationProps {
  onShowRanking: () => void;
  onShowAddFriend: () => void;
  onShowRelationTypeManagement: () => void;
  onSignOut: () => void;
  onShowRelationTypeCreator: () => void;
  onShowGroupCreator: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeView: NavigationView;
  onSelectView: (view: NavigationView) => void;
  currentUsername?: string | null;
  currentAvatarUrl?: string | null;
  showDailyTip?: boolean;
}

export function Navigation({ 
  onShowRanking, 
  onShowAddFriend, 
  onShowRelationTypeManagement,
  onSignOut,
  onShowRelationTypeCreator,
  onShowGroupCreator,
  searchTerm,
  onSearchChange,
  isSidebarCollapsed,
  onToggleSidebar,
  activeView,
  onSelectView,
  currentUsername,
  currentAvatarUrl,
  showDailyTip = true,
}: NavigationProps) {
  const displayedUsername = currentUsername?.trim() || 'Utilisateur';
  const userInitial = displayedUsername.charAt(0).toUpperCase();
  const profilePictureSrc = getProfilePictureSrc(currentAvatarUrl);

  const menuItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, view: 'dashboard' as const },
    { label: 'Carte des relations', icon: Network, view: 'relation-map' as const },
    { label: 'Répertoire', icon: BookUser, view: 'directory' as const },
    { label: 'Groupes', icon: UsersRound, view: 'groups' as const },
    { label: 'Types de relation', icon: Tags, view: 'relation-types' as const },
    { label: 'Statistiques', icon: BarChart3, view: 'statistics' as const },
    { label: 'Analyse', icon: Activity, view: 'analysis' as const },
    { label: 'Paramètres', icon: Settings, view: 'settings' as const },
  ];

  const dailyTips: Array<{ title: string; action: DailyTipAction }> = [
    {
      title: 'Ajoute un nouveau type de relation pour mieux segmenter ton réseau.',
      action: 'Créer un type',
    },
    {
      title: 'Pense à ajouter une nouvelle personne rencontrée cette semaine pour enrichir ta carte.',
      action: 'Ajouter une personne',
    },
    {
      title: 'Mets à jour les liens importants pour garder une carte à jour de ton réseau.',
      action: 'Mettre à jour les liens',
    },
    {
      title: 'Crée un groupe pour organiser tes relations par contexte ou centre d’intérêt.',
      action: 'Créer un groupe',
    },
    {
      title: 'Compare deux personnes pour découvrir leurs liens communs et les mettre à jour si besoin.',
      action: 'Voir l\'analyse',
    },
  ];

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const [tipIndex, setTipIndex] = useState(() => day % dailyTips.length);
  const tipOfTheDay = dailyTips[tipIndex];

  const showNextTip = () => {
    setTipIndex(previous => (previous + 1) % dailyTips.length);
  };

  const handleTipActionClick = (action: DailyTipAction) => {
    switch (action) {
      case 'Créer un type':
        onShowRelationTypeCreator();
        break;
      case 'Ajouter une personne':
        onShowAddFriend();
        break;
      case 'Mettre à jour les liens':
        onSelectView('relation-map');
        break;
      case 'Créer un groupe':
        onShowGroupCreator();
        break;
      case 'Voir l\'analyse':
        onSelectView('analysis');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="h-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-full items-center gap-3">
            <div className="flex min-w-[220px] items-center gap-4">
              <span className="relative h-7 w-7 overflow-visible">
                <img src={logoV1} alt="Relatium" className="h-full w-full origin-center scale-[1.8] object-contain" />
              </span>
              <h1 className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-[35px] font-extrabold leading-none tracking-[-0.03em] text-transparent">
                Relatium
              </h1>
            </div>

            <div className="flex-1">
              <div className="relative mx-auto max-w-3xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une personne, un groupe, un type de relation..."
                  value={searchTerm}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            <div className="hidden items-center gap-2 xl:flex">
              <button
                onClick={onShowRanking}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                <Trophy className="h-4 w-4" />
                Classement de mondialité 
              </button>

              <button
                onClick={onShowAddFriend}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <UserPlus className="h-4 w-4" />
                Ajouter une personne
              </button>

              <button
                onClick={onShowRelationTypeManagement}
                className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-600"
              >
                <Settings2 className="h-4 w-4" />
                Gérer les relations
              </button>

              <div className="inline-flex min-w-0 max-w-[190px] items-center gap-2">
	                <span
	                  className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-100 to-sky-100 text-sm font-bold text-violet-700 ring-1 ring-inset ring-violet-200"
	                  aria-hidden="true"
	                >
	                  {profilePictureSrc ? (
	                    <img src={profilePictureSrc} alt="" className="h-full w-full object-cover" draggable={false} />
	                  ) : (
	                    userInitial
	                  )}
	                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-slate-700" title={displayedUsername}>
                  {displayedUsername}
                </span>
              </div>

              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-20 z-30 hidden border-r border-slate-200 bg-white lg:flex lg:flex-col ${
          isSidebarCollapsed ? 'w-[80px]' : 'w-[244px]'
        } transition-all duration-300`}
        style={{
          backgroundImage: `url(${sidebarBackground})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.view ? activeView === item.view : false;
              const isEnabled = Boolean(item.view);

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.view) {
                      onSelectView(item.view);
                    }
                  }}
                  disabled={!isEnabled}
	                  className={`relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
	                    isActive
	                      ? 'bg-violet-100/80 text-violet-700'
	                      : isEnabled
	                        ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
	                        : 'cursor-not-allowed text-slate-400'
	                  } ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
	                >
	                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full bg-violet-500"
                    />
                  )}
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`}
                  />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {!isSidebarCollapsed && showDailyTip && (
            <div
              className="relative mt-6 flex min-h-[188px] flex-col rounded-2xl border border-violet-200/70 p-4 shadow-[0_8px_20px_rgba(124,58,237,0.08)]"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.42), rgba(245,241,255,0.56)), url(${insightBackground})`,
                backgroundPosition: 'right bottom',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '125%',
              }}
            >
              <button
                type="button"
                onClick={showNextTip}
                className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-white/90 text-violet-600 transition hover:bg-violet-50"
                aria-label="Conseil suivant"
                title="Conseil suivant"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div>
                <div className="mb-3 flex items-center gap-2 text-violet-700">
                  <Lightbulb className="h-4 w-4" />
                  <p className="text-sm font-semibold">Conseil du jour</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{tipOfTheDay.title}</p>
              </div>
              <button
                type="button"
                onClick={() => handleTipActionClick(tipOfTheDay.action)}
                className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <span>{tipOfTheDay.action}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-auto border-t border-slate-300 pt-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`group flex w-full items-center px-2 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 ${
                isSidebarCollapsed ? 'justify-center' : 'justify-start gap-2.5'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:text-violet-600">
                {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </span>
              {!isSidebarCollapsed && <span>Réduire le menu</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm xl:hidden">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={onShowRanking}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            <Trophy className="h-4 w-4" />
            Classement
          </button>

          <button
            onClick={onShowAddFriend}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter
          </button>

          <button
            onClick={onShowRelationTypeManagement}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-pink-600"
          >
            <Settings2 className="h-4 w-4" />
            Types
          </button>

          <div className="hidden min-w-0 max-w-[150px] items-center gap-2 sm:inline-flex">
            <span
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-100 to-sky-100 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200"
              aria-hidden="true"
            >
              {profilePictureSrc ? (
                <img src={profilePictureSrc} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                userInitial
              )}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-slate-700" title={displayedUsername}>
              {displayedUsername}
            </span>
          </div>

          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sortir
          </button>
        </div>
      </div>
    </>
  );
}
