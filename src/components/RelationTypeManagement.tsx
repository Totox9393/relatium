import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { RelationTypeDB, FriendGroup } from '../types';
import { supabase } from '../lib/supabaseClient';

export const availableIcons = {
  Activity: Icons.Activity,
  Anchor: Icons.Anchor,
  Award: Icons.Award,
  Baby: Icons.Baby,
  BadgeCheck: Icons.BadgeCheck,
  Balloon: Icons.PartyPopper,
  Beer: Icons.Beer,
  Book: Icons.Book,
  Briefcase: Icons.Briefcase,
  Camera: Icons.Camera,
  Coffee: Icons.Coffee,
  Crown: Icons.Crown,
  Dumbbell: Icons.Dumbbell,
  Flame: Icons.Flame,
  Gamepad2: Icons.Gamepad2,
  Gift: Icons.Gift,
  GraduationCap: Icons.GraduationCap,
  Heart: Icons.Heart,
  HeartCrack: Icons.HeartCrack,
  HeartHandshake: Icons.HeartHandshake,
  HeartPulse: Icons.HeartPulse,
  Home: Icons.Home,
  Medal: Icons.Medal,
  Music: Icons.Music,
  PartyPopper: Icons.PartyPopper,
  Plane: Icons.Plane,
  School: Icons.School,
  Skull: Icons.Skull,
  Smile: Icons.Smile,
  SmilePlus: Icons.SmilePlus,
  Star: Icons.Star,
  Sun: Icons.Sun,
  Trophy: Icons.Trophy,
  UserCheck: Icons.UserCheck,
  UserMinus: Icons.UserMinus,
  UserPlus: Icons.UserPlus,
  Users: Icons.Users,
  Utensils: Icons.Utensils,
  Wine: Icons.Wine,
  Wrench: Icons.Wrench,
  X: Icons.X,
} as const;

const COLOR_PRESETS = ['#EC4899', '#F97316', '#FACC15', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#D946EF', '#A8A29E'];
const ICON_KEYS = Object.keys(availableIcons) as Array<keyof typeof availableIcons>;

type RelationTypeRecord = RelationTypeDB & {
  created_at?: string;
  updated_at?: string;
};

type GroupRecord = FriendGroup & {
  created_at?: string;
  updated_at?: string;
};

type EditorState = {
  entity: 'relation' | 'group';
  mode: 'create' | 'edit';
  id?: string;
};

interface RelationTypeManagementProps {
  onClose: () => void;
  onUpdate: () => Promise<void>;
  onConfirmDelete: (request: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>;
  startInGroupCreateMode?: boolean;
  startInRelationCreateMode?: boolean;
  initialRelationTypeToEdit?: RelationTypeDB | null;
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const slugifyType = (value: string) => {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return slug || 'type_relation';
};

const formatShortDate = (value?: string) => {
  if (!value) return 'Date indisponible';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const RelationTypeManagement = ({
  onClose,
  onUpdate,
  onConfirmDelete,
  startInGroupCreateMode = false,
  startInRelationCreateMode = false,
  initialRelationTypeToEdit = null,
}: RelationTypeManagementProps) => {
  const openEditorDirectly = startInGroupCreateMode || startInRelationCreateMode || Boolean(initialRelationTypeToEdit);

  const [activeTab, setActiveTab] = useState<'relations' | 'groups'>(
    startInGroupCreateMode ? 'groups' : 'relations',
  );
  const [relationTypes, setRelationTypes] = useState<RelationTypeRecord[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [relationSearch, setRelationSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [relationSort, setRelationSort] = useState<'az' | 'za'>('az');
  const [groupSort, setGroupSort] = useState<'az' | 'za'>('az');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editor, setEditor] = useState<EditorState | null>(
    startInGroupCreateMode
      ? { entity: 'group', mode: 'create' }
      : startInRelationCreateMode
        ? { entity: 'relation', mode: 'create' }
        : initialRelationTypeToEdit
          ? { entity: 'relation', mode: 'edit', id: initialRelationTypeToEdit.id }
        : null,
  );
  const [editorName, setEditorName] = useState(initialRelationTypeToEdit?.label || '');
  const [editorIcon, setEditorIcon] = useState<keyof typeof availableIcons>(
    startInGroupCreateMode
      ? 'Users'
      : ((initialRelationTypeToEdit?.icon_name as keyof typeof availableIcons) || 'Heart'),
  );
  const [editorColor, setEditorColor] = useState(initialRelationTypeToEdit?.color || COLOR_PRESETS[0]);
  const [editorDescription, setEditorDescription] = useState(initialRelationTypeToEdit?.description || '');
  const [editorVisibility, setEditorVisibility] = useState<'all' | 'groups' | 'private'>('private');
  const [showIconGrid, setShowIconGrid] = useState(openEditorDirectly);
  const [showMoreIcons, setShowMoreIcons] = useState(false);

  const [usageLoading, setUsageLoading] = useState(false);
  const [relationUsageCount, setRelationUsageCount] = useState(0);
  const [relationUsageGroupCount, setRelationUsageGroupCount] = useState(0);
  const [groupMembersCount, setGroupMembersCount] = useState(0);
  const [editorCreatedAt, setEditorCreatedAt] = useState<string | undefined>(initialRelationTypeToEdit?.created_at);
  const [editorUpdatedAt, setEditorUpdatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    void fetchRelationTypes();
    void fetchGroups();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!initialRelationTypeToEdit) {
      return;
    }

    void loadRelationUsage(initialRelationTypeToEdit as RelationTypeRecord);
  }, [initialRelationTypeToEdit?.id]);

  const fetchRelationTypes = async () => {
    try {
      const { data, error: relationError } = await supabase
        .from('relatium_relations_definition')
        .select('*')
        .order('created_at', { ascending: true });

      if (relationError) throw relationError;
      if (data) setRelationTypes(data as RelationTypeRecord[]);
    } catch (err) {
      console.error('Erreur lors du chargement des types de relation:', err);
      setError('Erreur lors du chargement des types de relation');
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error: groupsError } = await supabase
        .from('relatium_groups_list')
        .select('*')
        .order('created_at', { ascending: true });

      if (groupsError) throw groupsError;
      if (data) setGroups(data as GroupRecord[]);
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setError('Erreur lors du chargement des groupes');
    }
  };

  const isSystemType = (relationType: RelationTypeRecord) => Boolean(relationType.is_system);

  const filteredRelationTypes = useMemo(() => {
    const query = normalizeText(relationSearch.trim());
    const filtered = relationTypes.filter(relationType => {
      if (!query) return true;
      return (
        normalizeText(relationType.label).includes(query) ||
        normalizeText(relationType.type).includes(query)
      );
    });

    return filtered.sort((a, b) => {
      const compared = a.label.localeCompare(b.label, 'fr');
      return relationSort === 'az' ? compared : -compared;
    });
  }, [relationTypes, relationSearch, relationSort]);

  const filteredGroups = useMemo(() => {
    const query = normalizeText(groupSearch.trim());
    const filtered = groups.filter(group => {
      if (!query) return true;
      return normalizeText(group.name).includes(query);
    });

    return filtered.sort((a, b) => {
      const compared = a.name.localeCompare(b.name, 'fr');
      return groupSort === 'az' ? compared : -compared;
    });
  }, [groups, groupSearch, groupSort]);

  const systemTypeCount = relationTypes.filter(isSystemType).length;
  const customTypeCount = relationTypes.length - systemTypeCount;

  const visibleIconKeys = showMoreIcons ? ICON_KEYS : ICON_KEYS.slice(0, 24);

  const currentRelation =
    editor?.entity === 'relation' && editor.id
      ? relationTypes.find(relationType => relationType.id === editor.id)
      : undefined;

  const currentGroup =
    editor?.entity === 'group' && editor.id
      ? groups.find(group => group.id === editor.id)
      : undefined;

  const renderIcon = (iconName: keyof typeof availableIcons, props: Record<string, unknown> = {}) => {
    const IconComponent = availableIcons[iconName];
    return IconComponent ? <IconComponent {...(props as never)} /> : null;
  };

  const resetEditorPlaceholders = () => {
    setEditorDescription('');
    setEditorVisibility('private');
    setShowIconGrid(false);
    setShowMoreIcons(false);
    setUsageLoading(false);
    setRelationUsageCount(0);
    setRelationUsageGroupCount(0);
    setGroupMembersCount(0);
    setEditorCreatedAt(undefined);
    setEditorUpdatedAt(undefined);
  };

  const openCreateRelationEditor = () => {
    resetEditorPlaceholders();
    setError(null);
    setEditor({ entity: 'relation', mode: 'create' });
    setEditorName('');
    setEditorIcon('Heart');
    setEditorColor(COLOR_PRESETS[0]);
    setShowIconGrid(true);
  };

  const openCreateGroupEditor = () => {
    resetEditorPlaceholders();
    setError(null);
    setEditor({ entity: 'group', mode: 'create' });
    setEditorName('');
    setEditorIcon('Users');
    setEditorColor(COLOR_PRESETS[0]);
    setEditorDescription('');
    setShowIconGrid(true);
  };

  const loadRelationUsage = async (relationType: RelationTypeRecord) => {
    setUsageLoading(true);
    setRelationUsageCount(0);
    setRelationUsageGroupCount(0);

    try {
      const { data: relationData, count, error: relationError } = await supabase
        .from('relatium_relations_link')
        .select('friend1_id, friend2_id', { count: 'exact' })
        .eq('type', relationType.type);

      if (relationError) throw relationError;

      setRelationUsageCount(count ?? 0);

      const friendIds = new Set<string>();
      (relationData || []).forEach(relation => {
        if (relation.friend1_id) friendIds.add(relation.friend1_id);
        if (relation.friend2_id) friendIds.add(relation.friend2_id);
      });

      if (friendIds.size === 0) {
        setRelationUsageGroupCount(0);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from('relatium_groups_link')
        .select('group_id, friend_id')
        .in('friend_id', Array.from(friendIds));

      if (memberError) throw memberError;

      const uniqueGroupIds = new Set((memberData || []).map(member => member.group_id));
      setRelationUsageGroupCount(uniqueGroupIds.size);
    } catch (err) {
      console.error('Erreur lors du chargement des stats du type:', err);
      setRelationUsageCount(0);
      setRelationUsageGroupCount(0);
    } finally {
      setUsageLoading(false);
    }
  };

  const loadGroupUsage = async (group: GroupRecord) => {
    setUsageLoading(true);
    setGroupMembersCount(0);

    try {
      const { count, error: membersError } = await supabase
        .from('relatium_groups_link')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (membersError) throw membersError;
      setGroupMembersCount(count ?? 0);
    } catch (err) {
      console.error('Erreur lors du chargement des stats du groupe:', err);
      setGroupMembersCount(0);
    } finally {
      setUsageLoading(false);
    }
  };

  const openEditRelationEditor = (relationType: RelationTypeRecord) => {
    resetEditorPlaceholders();
    setError(null);
    setEditor({ entity: 'relation', mode: 'edit', id: relationType.id });
    setEditorName(relationType.label);
    setEditorIcon((relationType.icon_name as keyof typeof availableIcons) || 'Heart');
    setEditorColor(relationType.color || COLOR_PRESETS[0]);
    setEditorDescription(relationType.description || '');
    setShowIconGrid(true);
    setEditorCreatedAt(relationType.created_at);
    setEditorUpdatedAt(relationType.updated_at);
    void loadRelationUsage(relationType);
  };

  const openEditGroupEditor = (group: GroupRecord) => {
    resetEditorPlaceholders();
    setError(null);
    setEditor({ entity: 'group', mode: 'edit', id: group.id });
    setEditorName(group.name);
    setEditorIcon((group.icon_name as keyof typeof availableIcons) || 'Users');
    setEditorColor(group.color || COLOR_PRESETS[0]);
    setEditorDescription(group.description || '');
    setShowIconGrid(true);
    setEditorCreatedAt(group.created_at);
    setEditorUpdatedAt(group.updated_at);
    void loadGroupUsage(group);
  };

  const closeEditor = () => {
    if (openEditorDirectly) {
      onClose();
      return;
    }

    setEditor(null);
    setShowIconGrid(false);
    setShowMoreIcons(false);
  };

  const handleDeleteType = async (type: string): Promise<boolean> => {
    if (isDeleting) return false;
    const relationType = relationTypes.find(item => item.type === type);
    const confirmed = await onConfirmDelete({
      title: 'Supprimer ce type de relation ?',
      message: `Cette action supprimera le type "${relationType?.label ?? type}" et toutes les relations qui l’utilisent. Cette action est irréversible.`,
    });

    if (!confirmed) return false;

    setIsDeleting(true);
    setError(null);

    try {
      const { error: deleteRelationsError } = await supabase.from('relatium_relations_link').delete().eq('type', type);
      if (deleteRelationsError) throw deleteRelationsError;

      const { error: deleteTypeError } = await supabase.from('relatium_relations_definition').delete().eq('type', type);
      if (deleteTypeError) throw deleteTypeError;

      setRelationTypes(prev => prev.filter(item => item.type !== type));
      await onUpdate();
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du type de relation:', err);
      setError('Erreur lors de la suppression du type de relation');
      await fetchRelationTypes();
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string): Promise<boolean> => {
    if (isDeleting) return false;
    const group = groups.find(item => item.id === groupId);
    const confirmed = await onConfirmDelete({
      title: 'Supprimer ce groupe ?',
      message: `Cette action supprimera le groupe "${group?.name ?? 'sélectionné'}". Les personnes resteront dans votre réseau, mais leurs appartenances à ce groupe seront retirées.`,
    });

    if (!confirmed) return false;

    setIsDeleting(true);
    setError(null);

    try {
      const { error: deleteGroupError } = await supabase.from('relatium_groups_list').delete().eq('id', groupId);
      if (deleteGroupError) throw deleteGroupError;

      setGroups(prev => prev.filter(group => group.id !== groupId));
      await onUpdate();
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du groupe:', err);
      setError('Erreur lors de la suppression du groupe');
      await fetchGroups();
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFromEditor = async () => {
    if (!editor || editor.mode !== 'edit') return;

    if (editor.entity === 'relation' && currentRelation) {
      const deleted = await handleDeleteType(currentRelation.type);
      if (deleted) closeEditor();
      return;
    }

    if (editor.entity === 'group' && currentGroup) {
      const deleted = await handleDeleteGroup(currentGroup.id);
      if (deleted) closeEditor();
    }
  };

  const buildUniqueTypeIdentifier = (label: string) => {
    const baseIdentifier = slugifyType(label);
    const existing = new Set(relationTypes.map(relationType => relationType.type));

    if (!existing.has(baseIdentifier)) return baseIdentifier;

    let index = 2;
    let candidate = `${baseIdentifier}_${index}`;

    while (existing.has(candidate)) {
      index += 1;
      candidate = `${baseIdentifier}_${index}`;
    }

    return candidate;
  };

  const handleEditorSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editor) return;

    const trimmedName = editorName.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    setError(null);

    try {
      if (editor.entity === 'relation') {
        const normalizedDescription = editorDescription.trim();

        if (editor.mode === 'create') {
          const generatedType = buildUniqueTypeIdentifier(trimmedName);

          const { error: createError } = await supabase.from('relatium_relations_definition').insert([
            {
              type: generatedType,
              label: trimmedName,
              icon_name: editorIcon,
              color: editorColor,
              description: normalizedDescription || null,
            },
          ]);

          if (createError) throw createError;
        } else if (editor.id) {
          const { error: updateError } = await supabase
            .from('relatium_relations_definition')
            .update({
              label: trimmedName,
              icon_name: editorIcon,
              color: editorColor,
              description: normalizedDescription || null,
            })
            .eq('id', editor.id);

          if (updateError) throw updateError;
        }

        await fetchRelationTypes();
      }

      if (editor.entity === 'group') {
        const normalizedDescription = editorDescription.trim();

        if (editor.mode === 'create') {
          const { error: createError } = await supabase.from('relatium_groups_list').insert([
            {
              name: trimmedName,
              color: editorColor,
              icon_name: editorIcon,
              description: normalizedDescription || null,
            },
          ]);

          if (createError) throw createError;
        } else if (editor.id) {
          const { error: updateError } = await supabase
            .from('relatium_groups_list')
            .update({
              name: trimmedName,
              color: editorColor,
              icon_name: editorIcon,
              description: normalizedDescription || null,
            })
            .eq('id', editor.id);

          if (updateError) throw updateError;
        }

        await fetchGroups();
      }

      await onUpdate();
      closeEditor();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const renderListingView = () => {
    return (
      <>
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[34px] font-semibold leading-none text-slate-900">Gestion des types et groupes</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Fermer"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('relations')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'relations'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icons.GitPullRequest className="h-4 w-4" />
              Types de relation
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'groups'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icons.Users className="h-4 w-4" />
              Groupes
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
          {error && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {activeTab === 'relations' ? (
            <>
              <p className="text-sm text-slate-500">
                Creez, modifiez et organisez les types de relation disponibles sur votre carte.
              </p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={relationSearch}
                    onChange={event => setRelationSearch(event.target.value)}
                    placeholder="Rechercher un type..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={openCreateRelationEditor}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <Icons.Plus className="h-4 w-4" />
                  Nouveau type
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  Tous {relationTypes.length}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Personnalises {customTypeCount}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Systeme {systemTypeCount}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Trier par :</span>
                  <select
                    value={relationSort}
                    onChange={event => setRelationSort(event.target.value as 'az' | 'za')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="az">A-Z</option>
                    <option value="za">Z-A</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="scrollbar-thin h-full overflow-y-auto">
                  {filteredRelationTypes.length > 0 ? (
                    filteredRelationTypes.map((relationType, index) => {
                      const systemType = isSystemType(relationType);

                      return (
                        <div
                          key={relationType.id}
                          className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2.5 ${
                            index < filteredRelationTypes.length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                        >
                          <Icons.GripVertical className="h-4 w-4 text-slate-300" />

                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: relationType.color + '1F' }}
                            >
                              {renderIcon(relationType.icon_name as keyof typeof availableIcons, {
                                className: 'h-4 w-4',
                                style: { color: relationType.color },
                              })}
                            </div>
                            <p className="truncate text-sm font-semibold text-slate-800">{relationType.label}</p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              systemType ? 'bg-slate-100 text-slate-500' : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            {systemType ? 'Systeme' : 'Personnalise'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditRelationEditor(relationType)}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Modifier"
                            >
                              <Icons.Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled
                              className="rounded-md p-1.5 text-slate-400"
                              title="Option a venir"
                            >
                              <Icons.Square className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleDeleteType(relationType.type);
                              }}
                              disabled={isDeleting}
                              className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Icons.Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Aucun type ne correspond a cette recherche.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">Organisez les groupes utilises pour classer rapidement vos personnes.</p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={groupSearch}
                    onChange={event => setGroupSearch(event.target.value)}
                    placeholder="Rechercher un groupe..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={openCreateGroupEditor}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <Icons.Plus className="h-4 w-4" />
                  Nouveau groupe
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  Groupes {groups.length}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Trier par :</span>
                  <select
                    value={groupSort}
                    onChange={event => setGroupSort(event.target.value as 'az' | 'za')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="az">A-Z</option>
                    <option value="za">Z-A</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="scrollbar-thin h-full overflow-y-auto">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group, index) => (
                      <div
                        key={group.id}
                        className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2.5 ${
                          index < filteredGroups.length - 1 ? 'border-b border-slate-100' : ''
                        }`}
                      >
                        <Icons.GripVertical className="h-4 w-4 text-slate-300" />
                        <div className="flex min-w-0 items-center gap-3">
                          {renderIcon((group.icon_name as keyof typeof availableIcons) || 'Users', {
                            className: 'h-4 w-4 shrink-0',
                            style: { color: group.color },
                          })}
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                          <p className="truncate text-sm font-semibold text-slate-800">{group.name}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          Groupe
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditGroupEditor(group)}
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Modifier"
                          >
                            <Icons.Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void handleDeleteGroup(group.id);
                            }}
                            disabled={isDeleting}
                            className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Icons.Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Aucun groupe ne correspond a cette recherche.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  const renderEditorView = () => {
    if (!editor) return null;

    const isRelationEditor = editor.entity === 'relation';
    const isEditMode = editor.mode === 'edit';
    const isNameValid = editorName.trim().length > 0;
    const editorTitle = isRelationEditor ? 'Creer / Modifier un type de relation' : 'Creer / Modifier un groupe';
    const primaryButtonLabel = isEditMode ? 'Enregistrer' : 'Creer';

    return (
      <>
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[34px] font-semibold leading-none text-slate-900">{editorTitle}</h2>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Fermer"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleEditorSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)]">
              <aside className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <p className="text-xs font-semibold text-slate-500">Apercu</p>

                  <div className="mt-4 flex flex-col items-center text-center">
                    {isRelationEditor ? (
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full"
                        style={{ backgroundColor: editorColor + '20' }}
                      >
                        {renderIcon(editorIcon, {
                          className: 'h-8 w-8',
                          style: { color: editorColor },
                        })}
                      </div>
                    ) : (
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full"
                        style={{ backgroundColor: editorColor + '20' }}
                      >
                        {renderIcon(editorIcon, {
                          className: 'h-8 w-8',
                          style: { color: editorColor },
                        })}
                      </div>
                    )}

                    <p className="mt-3 text-lg font-semibold text-slate-800">
                      {editorName.trim() || (isRelationEditor ? 'Nouveau type' : 'Nouveau groupe')}
                    </p>
                    <span className="mt-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Personnalise
                    </span>
                  </div>
                </div>

                {isEditMode && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-600">
                    <p className="text-xs font-semibold text-slate-500">Utilisation</p>

                    {usageLoading ? (
                      <p className="mt-3 text-sm text-slate-500">Chargement...</p>
                    ) : isRelationEditor ? (
                      <div className="mt-3 space-y-3">
                        <p className="flex items-start gap-2">
                          <Icons.CircleDot className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          <span>
                            <span className="font-semibold text-slate-800">{relationUsageCount} relations</span>
                            <br />
                            utilisent ce type
                          </span>
                        </p>
                        <p className="flex items-start gap-2">
                          <Icons.Users className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          <span>
                            <span className="font-semibold text-slate-800">{relationUsageGroupCount} groupes</span>
                            <br />
                            incluent ce type
                          </span>
                        </p>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                          <Icons.User className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          Créé le {formatShortDate(editorCreatedAt)}
                        </p>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                          <Icons.Clock3 className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          Modifié le {formatShortDate(editorUpdatedAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <p className="flex items-start gap-2">
                          <Icons.Users className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          <span>
                            <span className="font-semibold text-slate-800">{groupMembersCount} membres</span>
                            <br />
                            dans ce groupe
                          </span>
                        </p>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                          <Icons.User className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          Créé le {formatShortDate(editorCreatedAt)}
                        </p>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                          <Icons.Clock3 className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                          Modifié le {formatShortDate(editorUpdatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteFromEditor();
                    }}
                    disabled={isDeleting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                    {isRelationEditor ? 'Supprimer le type' : 'Supprimer le groupe'}
                  </button>
                )}
              </aside>

              <section className="space-y-3.5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">{isRelationEditor ? 'Nom du type' : 'Nom du groupe'}</label>
                    <span className="text-xs text-slate-400">{editorName.length}/30</span>
                  </div>
                  <input
                    value={editorName}
                    onChange={event => setEditorName(event.target.value)}
                    maxLength={30}
                    placeholder={isRelationEditor ? 'Ex: Coup de coeur' : 'Ex: Collègues'}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Icône</label>
                  <button
                    type="button"
                    onClick={() => setShowIconGrid(prev => !prev)}
                    className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      {renderIcon(editorIcon, {
                        className: 'h-4 w-4',
                        style: { color: editorColor },
                      })}
                      {editorIcon}
                    </span>
                    <Icons.ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {showIconGrid && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="grid grid-cols-7 gap-1.5">
                        {visibleIconKeys.map(iconName => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setEditorIcon(iconName)}
                            className={`flex h-9 items-center justify-center rounded-lg border transition ${
                              editorIcon === iconName
                                ? 'border-violet-300 bg-violet-50 text-violet-700'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                            title={iconName}
                          >
                            {renderIcon(iconName, { className: 'h-4 w-4' })}
                          </button>
                        ))}
                      </div>

                      {!showMoreIcons && ICON_KEYS.length > visibleIconKeys.length && (
                        <button
                          type="button"
                          onClick={() => setShowMoreIcons(true)}
                          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-violet-600 transition hover:bg-violet-50"
                        >
                          Plus d'icônes
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Couleur</label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {COLOR_PRESETS.map(color => {
                      const selected = editorColor.toLowerCase() === color.toLowerCase();

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditorColor(color)}
                          className={`h-5 w-5 rounded-full border-2 transition ${
                            selected ? 'border-violet-500 ring-2 ring-violet-200' : 'border-white ring-1 ring-slate-200'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Choisir la couleur ${color}`}
                        />
                      );
                    })}

                    <input
                      type="color"
                      value={editorColor}
                      onChange={event => setEditorColor(event.target.value)}
                      className="ml-1 h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-white"
                      aria-label="Choisir une couleur personnalisée"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description (optionnelle)</label>
                  <textarea
                    value={editorDescription}
                    onChange={event => setEditorDescription(event.target.value)}
                    placeholder="Ex: Personnes de confiance avec qui vous partagez vos moments importants."
                    maxLength={120}
                    className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  <p className="text-right text-xs text-slate-400">{editorDescription.length}/120</p>
                </div>

                <div className="space-y-2" aria-hidden="true">
                  <div className="h-5 w-24 rounded-full bg-gradient-to-r from-violet-100 via-fuchsia-100 to-transparent" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative h-[68px] overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
                      <Icons.Sparkles className="absolute left-3 top-3 h-4 w-4 text-violet-300" />
                      <span className="absolute bottom-3 left-3 h-2 w-16 rounded-full bg-violet-100" />
                      <span className="absolute bottom-3 right-3 h-2 w-7 rounded-full bg-fuchsia-100" />
                    </div>

                    <div className="relative h-[68px] overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-violet-50">
                      <span className="absolute left-3 top-3 h-8 w-8 rounded-full bg-sky-100" />
                      <span className="absolute left-7 top-5 h-7 w-7 rounded-full bg-violet-100" />
                      <span className="absolute bottom-3 left-3 h-2 w-20 rounded-full bg-sky-100" />
                    </div>

                    <div className="relative h-[68px] overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-violet-50">
                      <Icons.Orbit className="absolute right-3 top-3 h-5 w-5 text-emerald-300" />
                      <span className="absolute bottom-3 left-3 h-2 w-10 rounded-full bg-emerald-100" />
                      <span className="absolute bottom-3 right-3 h-2 w-14 rounded-full bg-violet-100" />
                    </div>
                  </div>
                </div>

                <div className="hidden">
                  <label className="text-sm font-semibold text-slate-700">Visibilité</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorVisibility('all')}
                      className={`rounded-xl border px-2.5 py-3 text-center transition ${
                        editorVisibility === 'all'
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Icons.Globe className="h-4 w-4" />
                        Tout le monde
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Visible par tous</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorVisibility('groups')}
                      className={`rounded-xl border px-2.5 py-3 text-center transition ${
                        editorVisibility === 'groups'
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Icons.Users className="h-4 w-4" />
                        Mes groupes
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Visible par mes groupes</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorVisibility('private')}
                      className={`rounded-xl border px-2.5 py-3 text-center transition ${
                        editorVisibility === 'private'
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Icons.Lock className="h-4 w-4" />
                        Moi uniquement
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Visible uniquement par moi</p>
                    </button>
                  </div>
                </div>

              </section>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={!isNameValid || isSaving || isDeleting}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {primaryButtonLabel}
              <Icons.Check className="h-4 w-4" />
            </button>
          </div>
        </form>
      </>
    );
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-4"
      style={{
        zIndex: 10020,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
        style={{
          width: '760px',
          maxWidth: 'calc(100vw - 32px)',
          height: '860px',
          maxHeight: 'calc(100vh - 32px)',
        }}
        onClick={event => event.stopPropagation()}
      >
        {editor ? renderEditorView() : renderListingView()}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default RelationTypeManagement;
