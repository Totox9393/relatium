import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Plus,
  UserCircle2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Friend, FriendGroup, RelationTypeDB } from '../types';
import { availableIcons } from './RelationTypeManagement';
import { supabase } from '../lib/supabaseClient';
import groupHeaderBackground from '../../ressources/fond_header_group.png';
import groupsHeaderIcon from '../../ressources/groups_icon.png';
const PAGE_SIZE = 8;

type ViewMode = 'grid' | 'list';

interface GroupMemberRow {
  group_id: string;
  friend_id: string;
}

interface GroupsViewProps {
  searchTerm: string;
  totalFriends: number;
  relationTypes: RelationTypeDB[];
  onGroupsChanged: () => Promise<void>;
  onOpenGroupCreator: () => void;
  onOpenFriendProfile: (friend: Friend) => void;
  onConfirmDelete: (request: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>;
  refreshToken: number;
}

interface GroupWithMembers extends FriendGroup {
  members: Friend[];
  memberCount: number;
}

interface MemberRelationTypeSummary {
  type: string;
  label: string;
  color: string;
  iconName: string;
  count: number;
}

interface MemberRelationSummary {
  relationCount: number;
  topRelationTypes: MemberRelationTypeSummary[];
}

const GROUP_DESCRIPTION_PLACEHOLDER = 'Aucune description renseignée.';

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

function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getNameColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(index);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue} 78% 92%)`,
    text: `hsl(${hue} 55% 38%)`,
  };
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isBestFriendRelationType(type: string, relationTypeMap: Map<string, RelationTypeDB>): boolean {
  const metadata = relationTypeMap.get(type);
  const candidates = [type, metadata?.label || ''];

  return candidates.some(candidate => {
    const normalized = normalizeText(candidate);
    return (
      (normalized.includes('meilleur') && normalized.includes('ami')) ||
      (normalized.includes('best') && normalized.includes('friend'))
    );
  });
}

export function GroupsView({
  searchTerm,
  totalFriends,
  relationTypes,
  onGroupsChanged,
  onOpenGroupCreator,
  onOpenFriendProfile,
  onConfirmDelete,
  refreshToken,
}: GroupsViewProps) {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm.trim());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [showAllGroupMembers, setShowAllGroupMembers] = useState(false);
  const [memberRelationSummaryById, setMemberRelationSummaryById] = useState<Record<string, MemberRelationSummary>>({});
  const [bestFriendLinksInGroup, setBestFriendLinksInGroup] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editorName, setEditorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestSequenceRef = useRef(0);

  const relationTypeMap = useMemo(() => {
    const map = new Map<string, RelationTypeDB>();
    relationTypes.forEach(type => {
      map.set(type.type, type);
    });
    return map;
  }, [relationTypes]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageList = useMemo(() => buildPageList(currentPage, totalPages), [currentPage, totalPages]);

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
  }, [debouncedSearch]);

  useEffect(() => {
    const onPointerDown = () => {
      setOpenMenuGroupId(null);
      setOpenMemberMenuId(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const loadGroups = useCallback(async () => {
    const requestId = ++requestSequenceRef.current;
    setIsLoading(true);
    setError('');

    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let groupQuery = supabase
        .from('relatium_groups_list')
        .select('id,name,color,icon_name,description,created_at', { count: 'estimated' })
        .range(from, to)
        .order('created_at', { ascending: false })
        .order('name', { ascending: true });

      if (debouncedSearch) {
        groupQuery = groupQuery.ilike('name', `%${debouncedSearch}%`);
      }

      const { data: groupRows, error: groupError, count } = await groupQuery;

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (groupError) {
        throw groupError;
      }

      setTotalCount(count || 0);

      if (!groupRows || groupRows.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = groupRows.map(group => group.id);

      const { data: memberRows, error: membersError } = await supabase
        .from('relatium_groups_link')
        .select('group_id,friend_id')
        .in('group_id', groupIds);

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (membersError) {
        throw membersError;
      }

      const typedMembers = (memberRows || []) as GroupMemberRow[];
      const friendIds = Array.from(new Set(typedMembers.map(member => member.friend_id)));

      let friendRows: Friend[] = [];
      if (friendIds.length > 0) {
        const { data: fetchedFriends, error: friendsError } = await supabase
          .from('relatium_friends_list')
          .select('id,name,avatar_url')
          .in('id', friendIds);

        if (requestId !== requestSequenceRef.current) {
          return;
        }

        if (friendsError) {
          throw friendsError;
        }

        friendRows = (fetchedFriends || []) as Friend[];
      }

      const friendMap = new Map<string, Friend>();
      friendRows.forEach(friend => {
        friendMap.set(friend.id, friend);
      });

      const memberIdsByGroup: Record<string, string[]> = {};
      typedMembers.forEach(member => {
        if (!memberIdsByGroup[member.group_id]) {
          memberIdsByGroup[member.group_id] = [];
        }
        memberIdsByGroup[member.group_id].push(member.friend_id);
      });

      const hydratedGroups: GroupWithMembers[] = groupRows.map(group => {
        const memberIds = memberIdsByGroup[group.id] || [];
        const members = memberIds
          .map(memberId => friendMap.get(memberId))
          .filter((member): member is Friend => Boolean(member));

        return {
          ...group,
          members,
          memberCount: memberIds.length,
        };
      });

      setGroups(hydratedGroups);
    } catch (loadError) {
      if (requestId !== requestSequenceRef.current) {
        return;
      }

      console.error('Erreur lors du chargement des groupes:', loadError);
      setError('Impossible de charger les groupes pour le moment.');
      setGroups([]);
    } finally {
      if (requestId === requestSequenceRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups, refreshToken]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setShowAllGroupMembers(false);
  }, [selectedGroup?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedGroupStats = async () => {
      if (!selectedGroup) {
        setMemberRelationSummaryById({});
        setBestFriendLinksInGroup(0);
        return;
      }

      const memberIds = selectedGroup.members.map(member => member.id);
      const initialSummary: Record<string, MemberRelationSummary> = {};
      memberIds.forEach(memberId => {
        initialSummary[memberId] = {
          relationCount: 0,
          topRelationTypes: [],
        };
      });

      if (memberIds.length === 0) {
        setMemberRelationSummaryById(initialSummary);
        setBestFriendLinksInGroup(0);
        return;
      }

      const idsCsv = memberIds.join(',');
      const { data: relationRows, error: relationError } = await supabase
        .from('relatium_relations_link')
        .select('friend1_id,friend2_id,type')
        .or(`friend1_id.in.(${idsCsv}),friend2_id.in.(${idsCsv})`);

      if (relationError) {
        console.error('Erreur lors du chargement des stats du groupe:', relationError);
        if (!cancelled) {
          setMemberRelationSummaryById(initialSummary);
          setBestFriendLinksInGroup(0);
        }
        return;
      }

      const memberIdSet = new Set(memberIds);
      const relationCountByFriend: Record<string, number> = {};
      const relationTypeCountByFriend: Record<string, Record<string, number>> = {};
      memberIds.forEach(memberId => {
        relationCountByFriend[memberId] = 0;
        relationTypeCountByFriend[memberId] = {};
      });

      let bestFriendLinks = 0;
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

        if (
          memberIdSet.has(relation.friend1_id) &&
          memberIdSet.has(relation.friend2_id) &&
          isBestFriendRelationType(relation.type, relationTypeMap)
        ) {
          bestFriendLinks += 1;
        }
      });

      const nextSummaryById: Record<string, MemberRelationSummary> = {};
      memberIds.forEach(memberId => {
        const typeCounts = relationTypeCountByFriend[memberId] || {};
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

        nextSummaryById[memberId] = {
          relationCount: relationCountByFriend[memberId] || 0,
          topRelationTypes,
        };
      });

      if (!cancelled) {
        setMemberRelationSummaryById(nextSummaryById);
        setBestFriendLinksInGroup(bestFriendLinks);
      }
    };

    void loadSelectedGroupStats();

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, relationTypeMap]);

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingGroupId(null);
    setEditorName('');
  };

  const openRenameEditor = (group: GroupWithMembers) => {
    setEditingGroupId(group.id);
    setEditorName(group.name);
    setIsEditorOpen(true);
    setOpenMenuGroupId(null);
  };

  const handleSaveEditor = async () => {
    const trimmedName = editorName.trim();
    if (!trimmedName || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingGroupId) {
        const { error: updateError } = await supabase
          .from('relatium_groups_list')
          .update({ name: trimmedName })
          .eq('id', editingGroupId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const fallbackColor = '#8B5CF6';
        const { error: createError } = await supabase
          .from('relatium_groups_list')
          .insert([
            {
              name: trimmedName,
              color: fallbackColor,
              icon_name: 'Users',
            },
          ]);

        if (createError) {
          throw createError;
        }
      }

      closeEditor();
      await Promise.all([onGroupsChanged(), loadGroups()]);
    } catch (saveError) {
      console.error('Erreur lors de l\'enregistrement du groupe:', saveError);
      setError('Impossible d\'enregistrer ce groupe pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group: GroupWithMembers) => {
    setOpenMenuGroupId(null);

    const isConfirmed = await onConfirmDelete({
      title: 'Supprimer ce groupe ?',
      message: `Cette action supprimera le groupe "${group.name}". Les personnes resteront dans votre réseau, mais leurs appartenances à ce groupe seront retirées.`,
    });
    if (!isConfirmed) {
      return;
    }

    setError('');

    try {
      const { error: deleteError } = await supabase.from('relatium_groups_list').delete().eq('id', group.id);
      if (deleteError) {
        throw deleteError;
      }

      await Promise.all([onGroupsChanged(), loadGroups()]);
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
    } catch (deleteErr) {
      console.error('Erreur lors de la suppression du groupe:', deleteErr);
      setError('Impossible de supprimer ce groupe pour le moment.');
    }
  };

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!selectedGroup) return;
    const member = selectedGroup.members.find(groupMember => groupMember.id === memberId);
    const isConfirmed = await onConfirmDelete({
      title: 'Retirer cette personne du groupe ?',
      message: `Cette action retirera ${member?.name ? `"${member.name}"` : 'cette personne'} du groupe "${selectedGroup.name}".`,
      confirmLabel: 'Retirer',
    });

    if (!isConfirmed) return;

    setRemovingMemberId(memberId);
    const { error } = await supabase
      .from('relatium_groups_link')
      .delete()
      .eq('group_id', selectedGroup.id)
      .eq('friend_id', memberId);
    setRemovingMemberId(null);
    if (error) return;
    setSelectedGroup(prev =>
      prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId), memberCount: prev.memberCount - 1 } : prev,
    );
    await onGroupsChanged();
  }, [onConfirmDelete, selectedGroup, onGroupsChanged]);

  const summaryText = `${totalCount} groupe${totalCount > 1 ? 's' : ''} • ${totalFriends} personnes`;

  const filteredSelectedMembers = useMemo(() => {
    if (!selectedGroup) {
      return [] as Friend[];
    }

    return selectedGroup.members;
  }, [selectedGroup]);

  const previewMembers = useMemo(() => {
    if (showAllGroupMembers) {
      return filteredSelectedMembers;
    }

    return filteredSelectedMembers.slice(0, 5);
  }, [filteredSelectedMembers, showAllGroupMembers]);

  const hiddenMembersCount = useMemo(() => {
    if (!selectedGroup || showAllGroupMembers) {
      return 0;
    }

    return Math.max(0, selectedGroup.memberCount - previewMembers.length);
  }, [selectedGroup, previewMembers.length, showAllGroupMembers]);

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <img src={groupsHeaderIcon} alt="Icône Groupes" className="h-[76px] w-[76px] shrink-0 object-contain" />
            <div>
              <h2 className="text-[34px] font-semibold leading-tight text-slate-900">Groupes</h2>
              <p className="mt-1 text-sm text-slate-500">Organisez vos relations par contextes et affinites.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <button
              type="button"
              onClick={onOpenGroupCreator}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              <Plus className="h-4 w-4" />
              Creer un groupe
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[320px_1fr]">
          <div className="relative rounded-2xl border border-slate-200 bg-white px-4 py-4">
           

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Tous mes groupes</p>
                <p className="text-sm font-semibold text-violet-600">{summaryText}</p>
                <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  Racine
                </span>
              </div>
            </div>
          </div>


        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 flex min-h-[280px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des groupes...
          </div>
        ) : groups.length > 0 ? (
          <>
            <div
              className={`mt-5 gap-4 ${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                  : 'flex flex-col'
              }`}
            >
              {groups.map(group => {
                const Icon =
                  availableIcons[(group.icon_name || 'Users') as keyof typeof availableIcons] || Users;
                const shownMembers = group.members.slice(0, 6);
                const hiddenCount = Math.max(0, group.memberCount - shownMembers.length);
                const groupDescription = group.description?.trim() || GROUP_DESCRIPTION_PLACEHOLDER;

                return (
                  <article
                    key={group.id}
                    className={`relative rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
                      viewMode === 'list' ? 'flex items-start justify-between gap-4' : ''
                    }`}
                    style={{ borderColor: '#E2E8F0', minHeight: viewMode === 'grid' ? '224px' : undefined }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
                      style={{ backgroundColor: group.color }}
                    />

                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setOpenMenuGroupId(prev => (prev === group.id ? null : group.id));
                      }}
                      className="absolute right-3 top-3 rounded-md p-1.5 text-violet-500 transition hover:bg-violet-50 hover:text-violet-700"
                      title="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuGroupId === group.id && (
                      <div
                        className="absolute right-3 top-11 z-10 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                        onPointerDown={event => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGroup(group);
                            setOpenMenuGroupId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </button>
                        <button
                          type="button"
                          onClick={() => openRenameEditor(group)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Renommer
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteGroup(group)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    )}

                    <div className={viewMode === 'list' ? 'flex min-w-0 flex-1 items-start gap-4' : ''}>
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${group.color}20` }}>
                        <Icon className="h-6 w-6" style={{ color: group.color }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-8 text-[32px] font-semibold leading-none text-slate-900 md:text-[30px]">
                          {group.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{group.memberCount} personnes</p>

                        <div className="mt-4 flex items-center -space-x-2">
                          {shownMembers.map(member => (
                            <button
                              key={`${group.id}-${member.id}`}
                              type="button"
                              className="h-8 w-8 overflow-hidden rounded-full border-2 border-white shadow-sm"
                              title={member.name}
                            >
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                <span
                                  className="flex h-full w-full items-center justify-center text-[10px] font-bold"
                                  style={{
                                    backgroundColor: getNameColor(member.name).bg,
                                    color: getNameColor(member.name).text,
                                  }}
                                >
                                  {getNameInitials(member.name)}
                                </span>
                              )}
                            </button>
                          ))}

                          {hiddenCount > 0 && (
                            <span className="ml-1 inline-flex h-8 items-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-500">
                              +{hiddenCount}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {groupDescription}
                        </p>

                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Cree le {formatDate(group.created_at)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

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

            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/40 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                  <p className="text-base font-semibold text-violet-700">Organisez encore mieux votre reseau</p>
                  <p className="text-sm text-violet-600">
                    Creez des groupes pour affiner votre organisation et retrouver rapidement vos contacts.
                  </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenGroupCreator}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4" />
                  Creer un groupe
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Aucun groupe trouve pour ces filtres.
          </div>
        )}
      </div>

      {isEditorOpen &&
        createPortal(
          <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/45 p-4" onClick={closeEditor}>
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
              onClick={event => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingGroupId ? 'Renommer le groupe' : 'Creer un groupe'}
                </h3>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-600">Nom du groupe</label>
              <input
                value={editorName}
                onChange={event => setEditorName(event.target.value)}
                placeholder="Ex: Cercle proche"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEditor()}
                  disabled={!editorName.trim() || isSubmitting}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? '...' : editingGroupId ? 'Renommer' : 'Creer'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {selectedGroup &&
        createPortal(
          <div
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/45 p-4"
            onClick={() => setSelectedGroup(null)}
          >
            <div
              className="relative w-full max-w-[920px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)]"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="absolute right-4 top-4 z-20 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className="relative px-6 pb-6 pt-6 sm:px-7"
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 56%, rgba(255,255,255,0.64) 78%, rgba(255,255,255,0.3) 100%), url(${groupHeaderBackground})`,
                  backgroundPosition: 'left top, right center',
                  backgroundRepeat: 'no-repeat, no-repeat',
                  backgroundSize: '100% 100%, auto 112%',
                }}
              >

                <div className="relative flex items-start gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${selectedGroup.color}22` }}
                  >
                    {(() => {
                      const SelectedGroupIcon =
                        availableIcons[(selectedGroup.icon_name || 'Users') as keyof typeof availableIcons] || Users;
                      return <SelectedGroupIcon className="h-9 w-9" style={{ color: selectedGroup.color }} />;
                    })()}
                  </div>

                  <div className="min-w-0 flex-1 pr-10">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[40px] font-semibold leading-none text-slate-900 sm:text-[38px]">
                        {selectedGroup.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => openRenameEditor(selectedGroup)}
                        className="rounded-md bg-pink-100 p-1.5 text-pink-500 transition hover:bg-pink-200"
                        title="Renommer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {selectedGroup.memberCount} personnes
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        Créé le {formatDate(selectedGroup.created_at)}
                      </span>
                    </div>

                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-700">
                      {selectedGroup.description?.trim() || GROUP_DESCRIPTION_PLACEHOLDER}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 pb-4 sm:px-7">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.08)]">
                  <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{selectedGroup.memberCount}</p>
                        <p className="text-xs font-semibold text-slate-500">Membres</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{bestFriendLinksInGroup}</p>
                        <p className="text-xs font-semibold text-slate-500">Meilleurs amis</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{formatDate(selectedGroup.created_at)}</p>
                        <p className="text-xs font-semibold text-slate-500">Créer le</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-5 pt-4 sm:px-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-slate-900">Membres du groupe</h4>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {previewMembers.length > 0 ? (
                    <div className={`${showAllGroupMembers ? 'max-h-[360px]' : 'max-h-[290px]'} overflow-y-auto`}>
                      {previewMembers.map((member, index) => {
                        const relationSummary = memberRelationSummaryById[member.id];
                        const displayedTypeCount = relationSummary?.topRelationTypes.reduce(
                          (sum, typeItem) => sum + typeItem.count,
                          0,
                        ) || 0;

                        return (
                          <div
                            key={`${selectedGroup.id}-${member.id}`}
                            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 ${
                              index < previewMembers.length - 1 ? 'border-b border-slate-100' : ''
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <span
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold"
                                  style={{
                                    backgroundColor: getNameColor(member.name).bg,
                                    color: getNameColor(member.name).text,
                                  }}
                                >
                                  {getNameInitials(member.name)}
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className="truncate text-sm font-semibold text-slate-800">{member.name}</span>

                                {relationSummary && relationSummary.topRelationTypes.length > 0 && (
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    {relationSummary.topRelationTypes.map(typeItem => {
                                      const TypeIcon =
                                        availableIcons[typeItem.iconName as keyof typeof availableIcons] || UserCircle2;

                                      return (
                                        <span
                                          key={`${selectedGroup.id}-${member.id}-${typeItem.type}`}
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

                                    {relationSummary.relationCount > displayedTypeCount && (
                                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                                        +{relationSummary.relationCount - displayedTypeCount}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="relative" onPointerDown={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setOpenMemberMenuId(prev => prev === member.id ? null : member.id)}
                                className="rounded-md border border-slate-200 p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                                title="Options"
                              >
                                {removingMemberId === member.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <MoreHorizontal className="h-4 w-4" />
                                }
                              </button>
                              {openMemberMenuId === member.id && (
                                <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    onClick={() => {
                                      setOpenMemberMenuId(null);
                                      onOpenFriendProfile(member);
                                    }}
                                  >
                                    <UserCircle2 className="h-4 w-4 text-slate-400" />
                                    Voir le profil
                                  </button>
                                  <div className="mx-2 border-t border-slate-100" />
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                    onClick={() => {
                                      setOpenMemberMenuId(null);
                                      void handleRemoveMember(member.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Retirer du groupe
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Ce groupe ne contient encore aucun membre.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-violet-50/50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      {hiddenMembersCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          + {hiddenMembersCount} autres membres
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Tous les membres affiches
                        </span>
                      )}

                      <div className="flex -space-x-2">
                        {selectedGroup.members.slice(0, 4).map(member => (
                          <span
                            key={`footer-avatar-${member.id}`}
                            className="h-7 w-7 overflow-hidden rounded-full border-2 border-white"
                            title={member.name}
                          >
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                            ) : (
                              <span
                                className="flex h-full w-full items-center justify-center text-[9px] font-bold"
                                style={{
                                  backgroundColor: getNameColor(member.name).bg,
                                  color: getNameColor(member.name).text,
                                }}
                              >
                                {getNameInitials(member.name)}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAllGroupMembers(true)}
                      disabled={hiddenMembersCount === 0}
                      className="text-sm font-semibold text-violet-700 transition hover:text-violet-800 disabled:cursor-default disabled:text-slate-400"
                    >
                      {hiddenMembersCount > 0 ? 'Voir tous les membres →' : 'Tous les membres affichés'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => void handleDeleteGroup(selectedGroup)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer le groupe
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
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
