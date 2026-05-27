import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  Pencil,
  Search,
  Users,
  Info,
  Link2,
  UserCircle2,
  Check,
} from 'lucide-react';
import { Friend, FriendGroup, Relation } from '../types';
import { availableIcons } from './RelationTypeManagement';
import { RelationTypeDB } from '../types';
import { supabase } from '../lib/supabaseClient';

interface FriendProfileProps {
  friend: Friend;
  friends: Friend[];
  relations: Relation[];
  groups: FriendGroup[];
  friendGroups: Record<string, string[]>;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDeleteRelation: (id: string) => Promise<void>;
  onAddRelation: () => void;
  onEditRelation: (relation: Relation) => void;
  onUpdateName: (id: string, name: string) => Promise<boolean>;
  onRefreshData: () => Promise<void>;
  onConfirmDelete: (request: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>;
  relationTypes: RelationTypeDB[];
  onOpenFriendProfile: (friend: Friend) => void;
}

type ProfileTab = 'relations' | 'groups' | 'infos';

export function FriendProfile({
  friend,
  friends,
  relations,
  groups,
  friendGroups,
  onClose,
  onDelete,
  onDeleteRelation,
  onAddRelation,
  onEditRelation,
  onUpdateName,
  onRefreshData,
  onConfirmDelete,
  relationTypes,
  onOpenFriendProfile,
}: FriendProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('relations');
  const [searchValue, setSearchValue] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [groupRelationsByType, setGroupRelationsByType] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(friend.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupError, setGroupError] = useState('');
  const [isGroupPending, setIsGroupPending] = useState(false);

  useEffect(() => {
    setEditedName(friend.name);
    setIsEditingName(false);
    setSearchValue('');
    setSelectedTypeFilter('all');
    setGroupRelationsByType(false);
    setActiveTab('relations');
  }, [friend.id, friend.name]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const relationRows = useMemo(() => {
    return relations
      .filter(relation => relation.friend1_id === friend.id || relation.friend2_id === friend.id)
      .map(relation => {
        const otherFriendId = relation.friend1_id === friend.id ? relation.friend2_id : relation.friend1_id;
        const otherFriend = friends.find(item => item.id === otherFriendId);
        const relationType = relationTypes.find(type => type.type === relation.type);
        const IconComponent = relationType
          ? availableIcons[relationType.icon_name as keyof typeof availableIcons]
          : null;

        return {
          relation,
          otherFriend,
          otherFriendName: otherFriend?.name || 'Personne inconnue',
          relationLabel: relationType?.label || relation.type,
          relationColor: relationType?.color || '#94A3B8',
          IconComponent,
        };
      })
      .sort((a, b) => a.otherFriendName.localeCompare(b.otherFriendName, 'fr'));
  }, [relations, friend.id, friends, relationTypes]);

  const filteredRelations = useMemo(() => {
    return relationRows.filter(row => {
      const matchesSearch = row.otherFriendName.toLowerCase().includes(searchValue.toLowerCase());
      const matchesType = selectedTypeFilter === 'all' || row.relation.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [relationRows, searchValue, selectedTypeFilter]);

  const selectedFilterMeta = useMemo(() => {
    if (selectedTypeFilter === 'all') {
      return {
        label: 'Tous',
        color: '#7C3AED',
        IconComponent: null,
      };
    }

    const selectedType = relationTypes.find(type => type.type === selectedTypeFilter);
    return {
      label: selectedType?.label || selectedTypeFilter,
      color: selectedType?.color || '#7C3AED',
      IconComponent: selectedType
        ? availableIcons[selectedType.icon_name as keyof typeof availableIcons]
        : null,
    };
  }, [selectedTypeFilter, relationTypes]);

  const groupedRelations = useMemo(() => {
    const grouped = filteredRelations.reduce((acc, row) => {
      const key = row.relation.type;
      if (!acc[key]) {
        acc[key] = {
          type: row.relation.type,
          relationLabel: row.relationLabel,
          relationColor: row.relationColor,
          IconComponent: row.IconComponent,
          friendEntries: [] as Array<{ id: string; name: string }>,
          relationIds: [] as string[],
        };
      }

      if (row.otherFriend) {
        const hasFriendAlready = acc[key].friendEntries.some(entry => entry.id === row.otherFriend?.id);
        if (!hasFriendAlready) {
          acc[key].friendEntries.push({
            id: row.otherFriend.id,
            name: row.otherFriend.name,
          });
        }
      }

      acc[key].relationIds.push(row.relation.id);
      return acc;
    }, {} as Record<string, {
      type: string;
      relationLabel: string;
      relationColor: string;
      IconComponent: typeof row.IconComponent;
      friendEntries: Array<{ id: string; name: string }>;
      relationIds: string[];
    }>);

    return Object.values(grouped)
      .map(group => ({
        ...group,
        friendEntries: group.friendEntries.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      }))
      .sort((a, b) => a.relationLabel.localeCompare(b.relationLabel, 'fr'));
  }, [filteredRelations]);

  const handleOpenRelatedProfile = (targetFriend: Friend) => {
    if (targetFriend.id === friend.id) return;
    onOpenFriendProfile(targetFriend);
  };

  const relationCount = relationRows.length;
  const usedRelationTypesCount = new Set(relationRows.map(row => row.relation.type)).size;

  const createdAtLabel = useMemo(() => {
    if (!friend.created_at) {
      return 'date inconnue';
    }

    const createdAtDate = new Date(friend.created_at);
    if (Number.isNaN(createdAtDate.getTime())) {
      return 'date inconnue';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(createdAtDate);
  }, [friend.created_at]);

  const memberGroups = useMemo(() => {
    const memberIds = new Set(friendGroups[friend.id] || []);
    return groups.filter(group => memberIds.has(group.id));
  }, [friendGroups, friend.id, groups]);

  const availableGroups = useMemo(() => {
    const memberIds = new Set(friendGroups[friend.id] || []);
    return groups.filter(group => !memberIds.has(group.id));
  }, [friendGroups, friend.id, groups]);

  const handleSaveName = async () => {
    const trimmedName = editedName.trim();

    if (!trimmedName || trimmedName === friend.name) {
      setIsEditingName(false);
      setEditedName(friend.name);
      return;
    }

    setIsSavingName(true);
    const success = await onUpdateName(friend.id, trimmedName);
    setIsSavingName(false);

    if (success) {
      setIsEditingName(false);
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedGroupId) return;

    setGroupError('');
    setIsGroupPending(true);

    try {
      const { error } = await supabase
        .from('relatium_groups_link')
        .insert([{ group_id: selectedGroupId, friend_id: friend.id }]);

      if (error) throw error;

      setSelectedGroupId('');
      await onRefreshData();
    } catch (err) {
      console.error('Erreur lors de l\'ajout au groupe:', err);
      setGroupError('Impossible d\'ajouter ce groupe pour le moment.');
    } finally {
      setIsGroupPending(false);
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    const group = groups.find(groupItem => groupItem.id === groupId);
    const confirmed = await onConfirmDelete({
      title: 'Retirer cette personne du groupe ?',
      message: `Cette action retirera "${friend.name}" du groupe "${group?.name ?? 'sélectionné'}".`,
      confirmLabel: 'Retirer',
    });

    if (!confirmed) {
      return;
    }

    setGroupError('');
    setIsGroupPending(true);

    try {
      const { error } = await supabase
        .from('relatium_groups_link')
        .delete()
        .eq('group_id', groupId)
        .eq('friend_id', friend.id);

      if (error) throw error;

      await onRefreshData();
    } catch (err) {
      console.error('Erreur lors de la suppression du groupe:', err);
      setGroupError('Impossible de retirer ce groupe pour le moment.');
    } finally {
      setIsGroupPending(false);
    }
  };

  const tabs = [
    { key: 'relations' as const, label: `Relations (${relationCount})`, icon: Link2 },
    { key: 'groups' as const, label: `Groupes (${memberGroups.length})`, icon: Users },
    { key: 'infos' as const, label: 'Infos', icon: Info },
  ];

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-900/45 p-4"
      style={{
        zIndex: 12000,
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
        <div className="border-b border-slate-200 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <UserCircle2 className="h-8 w-8" />
              </div>

              <div className="min-w-0">
                {isEditingName ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={editedName}
                      onChange={event => setEditedName(event.target.value)}
                      className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-3xl font-semibold text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSavingName ? '...' : 'OK'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedName(friend.name);
                        setIsEditingName(false);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <h2 className="truncate py-0.5 text-[40px] font-semibold leading-tight text-slate-900">{friend.name}</h2>
                )}

                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  Créé le {createdAtLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isEditingName) {
                    handleSaveName();
                    return;
                  }
                  setEditedName(friend.name);
                  setIsEditingName(true);
                }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-violet-600"
                title="Modifier le nom"
              >
                {isEditingName ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={() => onDelete(friend.id)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                title="Supprimer la personne"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-3xl font-semibold leading-none text-violet-600">{relationCount}</p>
                <p className="mt-1 text-sm text-slate-500">Relations</p>
              </div>
              <div>
                <p className="text-3xl font-semibold leading-none text-violet-600">{memberGroups.length}</p>
                <p className="mt-1 text-sm text-slate-500">Groupes</p>
              </div>
              <div>
                <p className="text-3xl font-semibold leading-none text-violet-600">{usedRelationTypesCount}</p>
                <p className="mt-1 text-sm text-slate-500">Types de relation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 pt-3">
          <div className="flex gap-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 border-b-2 px-1.5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6 py-4">
          {activeTab === 'relations' && (
            <div className="flex h-full flex-col">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchValue}
                    onChange={event => setSearchValue(event.target.value)}
                    placeholder="Rechercher une relation..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={onAddRelation}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une relation
                </button>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${selectedFilterMeta.color}20`,
                    color: selectedFilterMeta.color,
                  }}
                >
                  {selectedFilterMeta.IconComponent ? <selectedFilterMeta.IconComponent size={12} color={selectedFilterMeta.color} /> : null}
                  {selectedFilterMeta.label}
                </span>
                <select
                  value={selectedTypeFilter}
                  onChange={event => setSelectedTypeFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="all">Tous les types</option>
                  {relationTypes.map(type => (
                    <option key={type.type} value={type.type}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <label className="ml-1 inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={groupRelationsByType}
                    onChange={event => setGroupRelationsByType(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                  />
                  Regrouper par type
                </label>
              </div>

              <p className="mb-2 text-sm font-semibold text-slate-700">
                {groupRelationsByType ? 'Relations regroupées' : 'Relations directes'}
              </p>

              <p className="mb-2 text-xs text-slate-500">
                Intensité = importance de ce lien dans ton réseau (pas une note positive/négative).
              </p>

              <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto pr-1">
                {groupRelationsByType ? (
                  groupedRelations.length > 0 ? (
                    groupedRelations.map(group => {
                      const GroupIcon = group.IconComponent;
                      return (
                        <div
                          key={group.type}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{ backgroundColor: group.relationColor + '20', color: group.relationColor }}
                            >
                              {GroupIcon ? <GroupIcon size={12} color={group.relationColor} /> : null}
                              {group.relationLabel} ({group.friendEntries.length})
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {group.friendEntries.map(entry => (
                              <button
                                key={`${group.type}-${entry.id}`}
                                type="button"
                                onClick={() => handleOpenRelatedProfile({ id: entry.id, name: entry.name })}
                                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-50"
                              >
                                {entry.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucune relation ne correspond à la recherche.
                    </div>
                  )
                ) : filteredRelations.length > 0 ? (
                  filteredRelations.map(row => {
                    const IconComponent = row.IconComponent;
                    return (
                      <div
                        key={row.relation.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          {row.otherFriend ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRelatedProfile(row.otherFriend)}
                              className="truncate text-sm font-semibold text-violet-700 transition hover:text-violet-800"
                            >
                              {row.otherFriendName}
                            </button>
                          ) : (
                            <p className="truncate text-sm font-semibold text-slate-800">{row.otherFriendName}</p>
                          )}
                        </div>

                        <div
                          className="mx-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ backgroundColor: row.relationColor + '20', color: row.relationColor }}
                        >
                          {IconComponent ? <IconComponent size={12} color={row.relationColor} /> : null}
                          {row.relationLabel}
                        </div>

                        {typeof row.relation.intensity === 'number' && (
                          <div className="mr-2 min-w-[86px]">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                              <span>Intensité</span>
                              <span>{Math.round(row.relation.intensity)}/100</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${Math.max(0, Math.min(100, row.relation.intensity))}%`,
                                  backgroundColor: row.relationColor,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditRelation(row.relation)}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-violet-600"
                            title="Modifier la relation"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRelation(row.relation.id)}
                            className="rounded-md border border-slate-200 p-1.5 text-rose-500 transition hover:bg-rose-50"
                            title="Supprimer la relation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Aucune relation ne correspond à la recherche.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="flex h-full flex-col">
              {groupError && <p className="mb-2 text-sm text-rose-600">{groupError}</p>}

              <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto pr-1">
                {memberGroups.length > 0 ? (
                  memberGroups.map(group => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {(() => {
                          const GroupIcon =
                            availableIcons[(group.icon_name || 'Users') as keyof typeof availableIcons] || Users;

                          return <GroupIcon className="h-3.5 w-3.5" style={{ color: group.color }} />;
                        })()}
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="text-sm font-medium text-slate-700">{group.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromGroup(group.id)}
                        disabled={isGroupPending}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-60"
                      >
                        Retirer
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Cette personne n'appartient encore a aucun groupe.
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <select
                  value={selectedGroupId}
                  onChange={event => setSelectedGroupId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">Selectionner un groupe</option>
                  {availableGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddToGroup}
                  disabled={!selectedGroupId || isGroupPending}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {activeTab === 'infos' && (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Cette section sera enrichie dans une prochaine iteration.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
