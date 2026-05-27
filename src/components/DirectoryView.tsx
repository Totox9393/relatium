import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Filter,
  Loader2,
  Trash2,
  UserCircle2,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Friend, RelationTypeDB } from '../types';
import { availableIcons } from './RelationTypeManagement';
import { supabase } from '../lib/supabaseClient';
import directoryHeaderIcon from '../../ressources/repertoire2_icon.png';

const PAGE_SIZE = 24;

type SortOption = 'created_desc' | 'created_asc' | 'name_asc';
type CreatedFilter = 'all' | '30d' | '365d';

interface DirectoryViewProps {
  searchTerm: string;
  relationTypes: RelationTypeDB[];
  onOpenFriendProfile: (friend: Friend) => void;
  onDeleteFriend: (friendId: string) => Promise<void>;
  refreshToken: number;
}

interface DirectoryRelationType {
  type: string;
  label: string;
  color: string;
  iconName: string;
  count: number;
}

interface DirectoryFriend extends Friend {
  relationCount: number;
  topRelationTypes: DirectoryRelationType[];
}

function formatCreatedDate(createdAt?: string): string {
  if (!createdAt) {
    return 'Date inconnue';
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCreatedAfterIso(filter: CreatedFilter): string | null {
  if (filter === 'all') {
    return null;
  }

  const date = new Date();
  if (filter === '30d') {
    date.setDate(date.getDate() - 30);
  } else if (filter === '365d') {
    date.setDate(date.getDate() - 365);
  }

  return date.toISOString();
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

export function DirectoryView({
  searchTerm,
  relationTypes,
  onOpenFriendProfile,
  onDeleteFriend,
  refreshToken,
}: DirectoryViewProps) {
  const [friends, setFriends] = useState<DirectoryFriend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [createdFilter, setCreatedFilter] = useState<CreatedFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingFriendId, setDeletingFriendId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm.trim());
  const requestSequenceRef = useRef(0);

  const relationTypeMap = useMemo(() => {
    const map = new Map<string, RelationTypeDB>();
    relationTypes.forEach(type => {
      map.set(type.type, type);
    });
    return map;
  }, [relationTypes]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, createdFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageList = useMemo(() => buildPageList(currentPage, totalPages), [currentPage, totalPages]);

  const loadDirectory = useCallback(async () => {
    const requestId = ++requestSequenceRef.current;
    setIsLoading(true);
    setError('');

    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('relatium_friends_list')
        .select('id,name,avatar_url,created_at', { count: 'estimated' })
        .range(from, to);

      if (debouncedSearch) {
        query = query.ilike('name', `%${debouncedSearch}%`);
      }

      const createdAfterIso = getCreatedAfterIso(createdFilter);
      if (createdAfterIso) {
        query = query.gte('created_at', createdAfterIso);
      }

      if (sortBy === 'created_desc') {
        query = query.order('created_at', { ascending: false }).order('name', { ascending: true });
      } else if (sortBy === 'created_asc') {
        query = query.order('created_at', { ascending: true }).order('name', { ascending: true });
      } else {
        query = query.order('name', { ascending: true }).order('created_at', { ascending: false });
      }

      const { data: pageFriends, error: friendsError, count } = await query;

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (friendsError) {
        throw friendsError;
      }

      const friendRows = pageFriends || [];
      setTotalCount(count || 0);

      if (friendRows.length === 0) {
        setFriends([]);
        return;
      }

      const friendIds = friendRows.map(friend => friend.id);
      const idsCsv = friendIds.join(',');

      const { data: relationRows, error: relationsError } = await supabase
        .from('relatium_relations_link')
        .select('friend1_id,friend2_id,type')
        .or(`friend1_id.in.(${idsCsv}),friend2_id.in.(${idsCsv})`);

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (relationsError) {
        throw relationsError;
      }

      const relationCountByFriend: Record<string, number> = {};
      const relationTypeCountByFriend: Record<string, Record<string, number>> = {};

      friendIds.forEach(friendId => {
        relationCountByFriend[friendId] = 0;
        relationTypeCountByFriend[friendId] = {};
      });

      (relationRows || []).forEach(relation => {
        if (relationCountByFriend[relation.friend1_id] !== undefined) {
          relationCountByFriend[relation.friend1_id] += 1;
          relationTypeCountByFriend[relation.friend1_id][relation.type] =
            (relationTypeCountByFriend[relation.friend1_id][relation.type] || 0) + 1;
        }

        if (relationCountByFriend[relation.friend2_id] !== undefined) {
          relationCountByFriend[relation.friend2_id] += 1;
          relationTypeCountByFriend[relation.friend2_id][relation.type] =
            (relationTypeCountByFriend[relation.friend2_id][relation.type] || 0) + 1;
        }
      });

      const directoryRows: DirectoryFriend[] = friendRows.map(friend => {
        const typeCounts = relationTypeCountByFriend[friend.id] || {};
        const topRelationTypes = Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type, countValue]) => {
            const typeMeta = relationTypeMap.get(type);
            return {
              type,
              label: typeMeta?.label || type,
              color: typeMeta?.color || '#94A3B8',
              iconName: typeMeta?.icon_name || 'Users',
              count: countValue,
            };
          });

        return {
          ...friend,
          relationCount: relationCountByFriend[friend.id] || 0,
          topRelationTypes,
        };
      });

      setFriends(directoryRows);
    } catch (loadError) {
      if (requestId !== requestSequenceRef.current) {
        return;
      }

      console.error('Erreur lors du chargement du répertoire:', loadError);
      setError('Impossible de charger le répertoire pour le moment.');
      setFriends([]);
    } finally {
      if (requestId === requestSequenceRef.current) {
        setIsLoading(false);
      }
    }
  }, [createdFilter, currentPage, debouncedSearch, relationTypeMap, sortBy]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory, refreshToken]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async (friendItem: DirectoryFriend) => {
    setDeletingFriendId(friendItem.id);

    try {
      await onDeleteFriend(friendItem.id);
      await loadDirectory();
    } finally {
      setDeletingFriendId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <img src={directoryHeaderIcon} alt="Icône Répertoire" className="h-[76px] w-[76px] shrink-0 object-contain" />
            <div>
              <h2 className="text-[34px] font-semibold leading-tight text-slate-900">Répertoire</h2>
              <p className="mt-1 text-sm text-slate-500">Tous les utilisateurs de votre réseau</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={event => setSortBy(event.target.value as SortOption)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                <option value="created_desc">Trier par : Plus récents</option>
                <option value="created_asc">Trier par : Plus anciens</option>
                <option value="name_asc">Trier par : Prénom (A-Z)</option>
              </select>
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={createdFilter}
                onChange={event => setCreatedFilter(event.target.value as CreatedFilter)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                <option value="all">Tous</option>
                <option value="30d">Créés il y a 30 jours</option>
                <option value="365d">Créés il y a 1 an</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 text-sm font-semibold text-violet-600">{totalCount} personnes</div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 flex min-h-[280px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement du répertoire...
          </div>
        ) : friends.length > 0 ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {friends.map(friend => {
                const displayedTypeCount = friend.topRelationTypes.reduce((sum, item) => sum + item.count, 0);

                return (
                  <article
                    key={friend.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-violet-200 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                          <Users className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenFriendProfile(friend)}
                          className="truncate text-left text-base font-semibold text-slate-900 transition hover:text-violet-700"
                        >
                          {friend.name}
                        </button>

                        <p className="text-xs font-semibold text-violet-600">{friend.relationCount} relations</p>
                        <p className="text-xs text-slate-400">Créé le {formatCreatedDate(friend.created_at)}</p>

                        {friend.topRelationTypes.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {friend.topRelationTypes.map(typeItem => {
                              const TypeIcon =
                                availableIcons[typeItem.iconName as keyof typeof availableIcons] || UserCircle2;

                              return (
                                <span
                                  key={`${friend.id}-${typeItem.type}`}
                                  title={`${typeItem.label}: ${typeItem.count}`}
                                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                                  style={{
                                    backgroundColor: `${typeItem.color}20`,
                                    color: typeItem.color,
                                  }}
                                >
                                  <TypeIcon className="h-3 w-3" />
                                  {typeItem.count}
                                </span>
                              );
                            })}

                            {friend.relationCount > displayedTypeCount && (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                                +{friend.relationCount - displayedTypeCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenFriendProfile(friend)}
                        className="rounded-lg border border-violet-200 p-1.5 text-violet-500 transition hover:bg-violet-50"
                        title="Voir le profil"
                      >
                        <UserCircle2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(friend)}
                        disabled={deletingFriendId === friend.id}
                        className="rounded-lg border border-rose-200 p-1.5 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                  title="Page précédente"
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
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Aucun utilisateur trouvé pour ces filtres.
          </div>
        )}
      </div>
    </section>
  );
}
