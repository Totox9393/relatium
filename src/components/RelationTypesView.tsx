import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings2,
  Tags,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Friend, Relation, RelationTypeDB } from '../types';
import { availableIcons } from './RelationTypeManagement';
import relationTypeHeaderBackground from '../../ressources/fond_header_relationstypes.png';
import relationTypesHeaderIcon from '../../ressources/relationstypes_icon.png';

const PAGE_SIZE = 12;

type ViewMode = 'grid' | 'list';
type RelationTypeSortMode = 'az' | 'za' | 'intensity-desc' | 'intensity-asc';

interface RelationTypesViewProps {
  searchTerm: string;
  relationTypes: RelationTypeDB[];
  relations: Relation[];
  friends: Friend[];
  onOpenRelationTypeCreator: () => void;
  onOpenRelationTypeEditor: (relationType: RelationTypeDB) => void;
  onDeleteRelationType: (relationType: RelationTypeDB) => Promise<boolean>;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildPageList(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Date inconnue';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function RelationTypesView({
  searchTerm,
  relationTypes,
  relations,
  friends,
  onOpenRelationTypeCreator,
  onOpenRelationTypeEditor,
  onDeleteRelationType,
}: RelationTypesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<RelationTypeSortMode>('az');
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');
  const [openMenuTypeId, setOpenMenuTypeId] = useState<string | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<RelationTypeDB | null>(null);
  const [showAllTypeRelations, setShowAllTypeRelations] = useState(false);

  const relationCountByType = useMemo(() => {
    const result: Record<string, number> = {};

    relations.forEach(relation => {
      result[relation.type] = (result[relation.type] || 0) + 1;
    });

    return result;
  }, [relations]);

  const intensityStatsByType = useMemo(() => {
    const aggregations: Record<string, { sum: number; count: number }> = {};

    relations.forEach(relation => {
      if (typeof relation.intensity !== 'number') {
        return;
      }

      if (!aggregations[relation.type]) {
        aggregations[relation.type] = { sum: 0, count: 0 };
      }

      aggregations[relation.type].sum += relation.intensity;
      aggregations[relation.type].count += 1;
    });

    return aggregations;
  }, [relations]);

  const friendNameById = useMemo(() => {
    const map = new Map<string, string>();
    friends.forEach(friend => {
      map.set(friend.id, friend.name);
    });
    return map;
  }, [friends]);

  const selectedTypeRelations = useMemo(() => {
    if (!selectedRelationType) {
      return [] as Relation[];
    }

    return relations
      .filter(relation => relation.type === selectedRelationType.type)
      .sort((a, b) => {
        const intensityA = typeof a.intensity === 'number' ? a.intensity : -1;
        const intensityB = typeof b.intensity === 'number' ? b.intensity : -1;
        return intensityB - intensityA;
      });
  }, [relations, selectedRelationType]);

  const selectedTypeUniquePeopleCount = useMemo(() => {
    const uniqueIds = new Set<string>();
    selectedTypeRelations.forEach(relation => {
      uniqueIds.add(relation.friend1_id);
      uniqueIds.add(relation.friend2_id);
    });
    return uniqueIds.size;
  }, [selectedTypeRelations]);

  const previewTypeRelations = useMemo(() => {
    if (showAllTypeRelations) {
      return selectedTypeRelations;
    }

    return selectedTypeRelations.slice(0, 6);
  }, [selectedTypeRelations, showAllTypeRelations]);

  const hiddenTypeRelationsCount = useMemo(() => {
    if (showAllTypeRelations) {
      return 0;
    }

    return Math.max(0, selectedTypeRelations.length - previewTypeRelations.length);
  }, [previewTypeRelations.length, selectedTypeRelations.length, showAllTypeRelations]);

  useEffect(() => {
    const onPointerDown = () => {
      setOpenMenuTypeId(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    setShowAllTypeRelations(false);
  }, [selectedRelationType?.id]);

  const handleDeleteType = async (relationType: RelationTypeDB) => {
    if (deletingTypeId) {
      return;
    }

    setDeletingTypeId(relationType.id);

    try {
      const deleted = await onDeleteRelationType(relationType);
      if (!deleted) {
        return;
      }

      if (selectedRelationType?.id === relationType.id) {
        setSelectedRelationType(null);
      }

      setOpenMenuTypeId(null);
    } finally {
      setDeletingTypeId(null);
    }
  };

  const effectiveSearch = useMemo(() => {
    const localValue = localSearch.trim();
    const globalValue = searchTerm.trim();
    return localValue || globalValue;
  }, [localSearch, searchTerm]);

  const filteredRelationTypes = useMemo(() => {
    const query = normalizeText(effectiveSearch);

    const filtered = !query
      ? [...relationTypes]
      : relationTypes.filter(relationType => {
          const haystack = [
            relationType.label,
            relationType.type,
            relationType.description || '',
          ]
            .map(value => normalizeText(value))
            .join(' ');

          return haystack.includes(query);
        });

    const getIntensityScore = (relationType: RelationTypeDB) => {
      const stats = intensityStatsByType[relationType.type];
      if (stats && stats.count > 0) {
        return stats.sum / stats.count;
      }

      return null;
    };

    return filtered.sort((a, b) => {
      if (sortMode === 'az') {
        return a.label.localeCompare(b.label, 'fr');
      }

      if (sortMode === 'za') {
        return b.label.localeCompare(a.label, 'fr');
      }

      const scoreA = getIntensityScore(a);
      const scoreB = getIntensityScore(b);
      const hasScoreA = typeof scoreA === 'number';
      const hasScoreB = typeof scoreB === 'number';

      if (hasScoreA && hasScoreB) {
        const diff = sortMode === 'intensity-desc' ? scoreB - scoreA : scoreA - scoreB;
        if (Math.abs(diff) > 0.0001) {
          return diff;
        }
      } else if (hasScoreA !== hasScoreB) {
        return hasScoreA ? -1 : 1;
      }

      return a.label.localeCompare(b.label, 'fr');
    });
  }, [effectiveSearch, intensityStatsByType, relationTypes, sortMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, sortMode, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredRelationTypes.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRelationTypes = useMemo(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return filteredRelationTypes.slice(from, to);
  }, [currentPage, filteredRelationTypes]);

  const pageList = useMemo(() => buildPageList(currentPage, totalPages), [currentPage, totalPages]);

  const systemTypeCount = relationTypes.filter(relationType => Boolean(relationType.is_system)).length;
  const customTypeCount = relationTypes.length - systemTypeCount;

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={relationTypesHeaderIcon}
              alt="Icône Types de relation"
              className="h-[76px] w-[76px] shrink-0 object-contain"
            />
            <div>
              <h2 className="text-[34px] font-semibold leading-tight text-slate-900">Types de relation</h2>
              <p className="mt-1 text-sm text-slate-500">
                Organisez et personnalisez les types de relation pour mieux segmenter votre réseau.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[220px] max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={localSearch}
                onChange={event => setLocalSearch(event.target.value)}
                placeholder="Rechercher un type..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              type="button"
              onClick={onOpenRelationTypeCreator}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Nouveau type
            </button>

            <select
              value={sortMode}
              onChange={event => setSortMode(event.target.value as RelationTypeSortMode)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              title="Trier les types"
            >
              <option value="az">Trier: A-Z</option>
              <option value="za">Trier: Z-A</option>
              <option value="intensity-desc">Trier: intensité (forte → faible)</option>
              <option value="intensity-asc">Trier: intensité (faible → forte)</option>
            </select>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 transition ${
                  viewMode === 'grid' ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-50'
                }`}
                title="Affichage en grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-md p-2 transition ${
                  viewMode === 'list' ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-50'
                }`}
                title="Affichage en liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Tags className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Tous les types</p>
                <p className="text-2xl font-semibold text-slate-900">{relationTypes.length}</p>
                <p className="text-xs text-slate-500">types disponibles</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Personnalises</p>
                <p className="text-2xl font-semibold text-slate-900">{customTypeCount}</p>
                <p className="text-xs text-slate-500">créés par vous</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Système</p>
                <p className="text-2xl font-semibold text-slate-900">{systemTypeCount}</p>
                <p className="text-xs text-slate-500">types par défaut</p>
              </div>
            </div>
          </article>
        </div>

        {paginatedRelationTypes.length > 0 ? (
          <>
            <div className={`mt-4 gap-3 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5' : 'flex flex-col'}`}>
              {paginatedRelationTypes.map(relationType => {
                const Icon =
                  availableIcons[(relationType.icon_name || 'Users') as keyof typeof availableIcons] || Users;
                const relationCount = relationCountByType[relationType.type] || 0;
                const intensityStats = intensityStatsByType[relationType.type];
                const averageIntensity = intensityStats && intensityStats.count > 0
                  ? Math.round(intensityStats.sum / intensityStats.count)
                  : null;
                const description =
                  relationType.description?.trim() || 'Description non renseignée pour ce type de relation.';
                const isMenuOpen = openMenuTypeId === relationType.id;
                return (
                  <article
                    key={relationType.id}
                    className={`relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
                      viewMode === 'list' ? 'flex items-center justify-between gap-3' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setOpenMenuTypeId(prev => (prev === relationType.id ? null : relationType.id));
                      }}
                      className="absolute right-3 top-3 rounded-md p-1.5 text-violet-500 transition hover:bg-violet-50 hover:text-violet-700"
                      title="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-3 top-11 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                        onPointerDown={event => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRelationType(relationType);
                            setOpenMenuTypeId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuTypeId(null);
                            onOpenRelationTypeEditor(relationType);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editer
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void handleDeleteType(relationType);
                          }}
                          disabled={deletingTypeId === relationType.id}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingTypeId === relationType.id
                            ? 'Suppression...'
                            : 'Supprimer'}
                        </button>
                      </div>
                    )}

                    <div className={viewMode === 'list' ? 'flex min-w-0 flex-1 items-center gap-4' : ''}>
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${relationType.color}22` }}>
                        <Icon className="h-5 w-5" style={{ color: relationType.color }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-8 text-[30px] font-semibold leading-none text-slate-900 md:text-[28px]">
                          {relationType.label}
                        </h3>

                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            relationType.is_system
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-violet-100 text-violet-700'
                          }`}
                        >
                          {relationType.is_system ? 'Système' : 'Personnalisé'}
                        </span>

                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{description}</p>

                        <p className="mt-2 text-xs font-medium text-slate-400">
                          {relationCount} relation{relationCount > 1 ? 's' : ''}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {averageIntensity !== null
                            ? `Intensité moyenne : ${averageIntensity}/100`
                              : 'Intensité non renseignée'}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                  title="Page precedente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {pageList.map((item, index) =>
                  item === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`min-w-8 rounded-md border px-2 py-1 text-sm font-semibold transition ${
                        currentPage === item
                          ? 'border-violet-300 bg-violet-50 text-violet-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                  title="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <span className="ml-2 text-sm font-semibold text-slate-500">
                  {currentPage} sur {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Aucun type de relation trouvé pour ces filtres.
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/40 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-violet-700">Personnalisez encore plus votre réseau</p>
              <p className="text-sm text-violet-600">
                Ajoutez de nouveaux types de relation pour mieux organiser et filtrer vos connexions.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenRelationTypeCreator}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Nouveau type
            </button>
          </div>
        </div>
      </div>

      {selectedRelationType &&
        createPortal(
          <div
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/45 p-4"
            onClick={() => setSelectedRelationType(null)}
          >
            <div
              className="relative w-full max-w-[920px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)]"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedRelationType(null)}
                className="absolute right-4 top-4 z-20 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className="relative px-6 pb-6 pt-6 sm:px-7"
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 56%, rgba(255,255,255,0.64) 78%, rgba(255,255,255,0.3) 100%), url(${relationTypeHeaderBackground})`,
                  backgroundPosition: 'left top, right center',
                  backgroundRepeat: 'no-repeat, no-repeat',
                  backgroundSize: '100% 100%, auto 112%',
                }}
              >
                <div className="relative flex items-start gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${selectedRelationType.color}22` }}
                  >
                    {(() => {
                      const SelectedTypeIcon =
                        availableIcons[(selectedRelationType.icon_name || 'Users') as keyof typeof availableIcons] || Users;
                      return <SelectedTypeIcon className="h-9 w-9" style={{ color: selectedRelationType.color }} />;
                    })()}
                  </div>

                  <div className="min-w-0 flex-1 pr-10">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[40px] font-semibold leading-none text-slate-900 sm:text-[38px]">
                        {selectedRelationType.label}
                      </h3>

                      <button
                        type="button"
                        onClick={() => {
                          const relationTypeToEdit = selectedRelationType;
                          setSelectedRelationType(null);
                          onOpenRelationTypeEditor(relationTypeToEdit);
                        }}
                        className="rounded-md bg-pink-100 p-1.5 text-pink-500 transition hover:bg-pink-200"
                        title="Editer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Tags className="h-4 w-4" />
                        {relationCountByType[selectedRelationType.type] || 0} relation
                        {(relationCountByType[selectedRelationType.type] || 0) > 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        Créé le {formatDate(selectedRelationType.created_at)}
                      </span>
                    </div>

                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-700">
                      {selectedRelationType.description?.trim() || 'Description non renseignée pour ce type de relation.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 pb-4 sm:px-7">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.08)]">
                  <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <Tags className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{selectedTypeRelations.length}</p>
                        <p className="text-xs font-semibold text-slate-500">Relations</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{selectedTypeUniquePeopleCount}</p>
                        <p className="text-xs font-semibold text-slate-500">Personnes liées</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{formatDate(selectedRelationType.created_at)}</p>
                        <p className="text-xs font-semibold text-slate-500">Créer le</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-5 pt-4 sm:px-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-slate-900">Relations de ce type</h4>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {previewTypeRelations.length > 0 ? (
                    <div className={`${showAllTypeRelations ? 'max-h-[360px]' : 'max-h-[290px]'} overflow-y-auto`}>
                      {previewTypeRelations.map((relation, index) => {
                        const friend1Name = friendNameById.get(relation.friend1_id) || 'Personne inconnue';
                        const friend2Name = friendNameById.get(relation.friend2_id) || 'Personne inconnue';

                        return (
                          <div
                            key={relation.id}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                              index < previewTypeRelations.length - 1 ? 'border-b border-slate-100' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{friend1Name}</p>
                              <p className="truncate text-xs text-slate-500">avec {friend2Name}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              {typeof relation.intensity === 'number' && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                  {Math.round(relation.intensity)}/100
                                </span>
                              )}

                              <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                {selectedRelationType.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Aucune relation n'utilise encore ce type.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-violet-50/50 px-3 py-3">
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {hiddenTypeRelationsCount > 0
                        ? `+ ${hiddenTypeRelationsCount} autres relations`
                        : 'Toutes les relations affichées'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowAllTypeRelations(true)}
                      disabled={hiddenTypeRelationsCount === 0}
                      className="text-sm font-semibold text-violet-700 transition hover:text-violet-800 disabled:cursor-default disabled:text-slate-400"
                    >
                      {hiddenTypeRelationsCount > 0 ? 'Voir toutes les relations →' : 'Tout est affiché'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteType(selectedRelationType);
                  }}
                  disabled={deletingTypeId === selectedRelationType.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingTypeId === selectedRelationType.id
                    ? 'Suppression...'
                    : 'Supprimer le type'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRelationType(null)}
                  className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
