import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Network,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Friend, Relation, RelationTypeDB } from '../types';
import { IndividualNetworkVenn } from './IndividualNetworkVenn';
import { availableIcons } from './RelationTypeManagement';
import { SearchableCombobox } from './SearchableCombobox';
import analysisHeaderIcon from '../../ressources/analyse_icon.png';

interface AnalysisViewProps {
  friends: Friend[];
  relations: Relation[];
  relationTypes: RelationTypeDB[];
  onOpenFriendProfile: (friend: Friend) => void;
  onCreateDirectRelation: (friend1Id: string, friend2Id: string, relationType: string) => Promise<boolean>;
  onDeleteDirectRelationType: (friend1Id: string, friend2Id: string, relationType: string) => Promise<boolean>;
}

function getPairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}::${id2}` : `${id2}::${id1}`;
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
    text: `hsl(${hue} 58% 36%)`,
  };
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function FriendAvatar({ friend, size = 'md' }: { friend: Friend; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';

  if (friend.avatar_url) {
    return <img src={friend.avatar_url} alt={friend.name} className={`${sizeClasses} rounded-full object-cover`} />;
  }

  const color = getNameColor(friend.name);

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full font-semibold`}
      style={{ backgroundColor: color.bg, color: color.text }}
      aria-hidden="true"
    >
      {getNameInitials(friend.name)}
    </div>
  );
}

function FriendSelect({
  label,
  selectedId,
  options,
  excludedId,
  onChange,
}: {
  label: string;
  selectedId: string;
  options: Friend[];
  excludedId?: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <SearchableCombobox
        value={selectedId}
        onChange={onChange}
        options={options}
        placeholder="Sélectionner une personne"
        excludeId={excludedId}
      />
    </label>
  );
}

function RelationTypeCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: RelationTypeDB[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = options.find(option => option.type === value);

  const filteredOptions = useMemo(
    () => options.filter(option => option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())),
    [options, searchQuery],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setIsOpen(previous => !previous);
        }}
        disabled={disabled}
        className="group flex h-9 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedOption ? (
          (() => {
            const SelectedIcon = availableIcons[selectedOption.icon_name as keyof typeof availableIcons] || Network;
            return (
              <>
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${selectedOption.color}24`, color: selectedOption.color }}
                  aria-hidden="true"
                >
                  <SelectedIcon className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{selectedOption.label}</span>
              </>
            );
          })()
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-slate-400">{placeholder}</span>
        )}

        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Rechercher un type..."
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="scrollbar-thin max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="rounded-lg px-3 py-4 text-center text-sm text-slate-500">Aucun type trouve</div>
            ) : (
              filteredOptions.map(option => {
                const OptionIcon = availableIcons[option.icon_name as keyof typeof availableIcons] || Network;
                return (
                  <button
                    key={option.type}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                      value === option.type ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      onChange(option.type);
                      setIsOpen(false);
                    }}
                  >
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${option.color}24`, color: option.color }}
                      aria-hidden="true"
                    >
                      <OptionIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{option.label}</span>
                    {value === option.type ? <Check className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalysisView({
  friends,
  relations,
  relationTypes,
  onOpenFriendProfile,
  onCreateDirectRelation,
  onDeleteDirectRelationType,
}: AnalysisViewProps) {
  const PREVIEW_COUNT = 3;

  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [friends],
  );

  const friendById = useMemo(() => {
    const map = new Map<string, Friend>();
    sortedFriends.forEach(friend => {
      map.set(friend.id, friend);
    });
    return map;
  }, [sortedFriends]);

  const relationsByPair = useMemo(() => {
    const map = new Map<string, Relation[]>();
    relations.forEach(relation => {
      const key = getPairKey(relation.friend1_id, relation.friend2_id);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(relation);
    });
    return map;
  }, [relations]);

  const neighborsByFriend = useMemo(() => {
    const map = new Map<string, Set<string>>();

    friends.forEach(friend => {
      map.set(friend.id, new Set<string>());
    });

    relations.forEach(relation => {
      if (!map.has(relation.friend1_id)) {
        map.set(relation.friend1_id, new Set<string>());
      }
      if (!map.has(relation.friend2_id)) {
        map.set(relation.friend2_id, new Set<string>());
      }

      map.get(relation.friend1_id)?.add(relation.friend2_id);
      map.get(relation.friend2_id)?.add(relation.friend1_id);
    });

    return map;
  }, [friends, relations]);

  const [person1Id, setPerson1Id] = useState('');
  const [person2Id, setPerson2Id] = useState('');
  const [showAllCommon, setShowAllCommon] = useState(false);
  const [showAllOnlyPerson2Knows, setShowAllOnlyPerson2Knows] = useState(false);
  const [showAllOnlyPerson1Knows, setShowAllOnlyPerson1Knows] = useState(false);
  const [selectedDirectRelationType, setSelectedDirectRelationType] = useState('');
  const [isAddingDirectRelation, setIsAddingDirectRelation] = useState(false);
  const [deletingDirectRelationType, setDeletingDirectRelationType] = useState('');
  const [directRelationFeedback, setDirectRelationFeedback] = useState('');

  useEffect(() => {
    if (sortedFriends.length === 0) {
      setPerson1Id('');
      setPerson2Id('');
      return;
    }

    const firstCandidate = sortedFriends[0]?.id || '';

    setPerson1Id(previous => {
      const stillExists = sortedFriends.some(friend => friend.id === previous);
      if (stillExists) return previous;
      return firstCandidate;
    });

    setPerson2Id(previous => {
      const stillExists = sortedFriends.some(friend => friend.id === previous);
      const fallback = sortedFriends.find(friend => friend.id !== (person1Id || firstCandidate))?.id || '';

      if (stillExists && previous !== (person1Id || firstCandidate)) {
        return previous;
      }

      return fallback;
    });
  }, [person1Id, sortedFriends]);

  const selectedPerson1 = person1Id ? friendById.get(person1Id) || null : null;
  const selectedPerson2 = person2Id ? friendById.get(person2Id) || null : null;

  const analysis = useMemo(() => {
    if (!selectedPerson1 || !selectedPerson2) {
      return {
        commonFriends: [] as Friend[],
        onlyPerson1Knows: [] as Friend[],
        onlyPerson2Knows: [] as Friend[],
        typeBreakdown: [] as Array<{ type: string; label: string; color: string; count: number; percent: number }>,
        totals: {
          person1Network: 0,
          person2Network: 0,
          common: 0,
          onlyPerson1: 0,
          onlyPerson2: 0,
        },
      };
    }

    const neighbors1 = new Set(neighborsByFriend.get(selectedPerson1.id) || []);
    const neighbors2 = new Set(neighborsByFriend.get(selectedPerson2.id) || []);

    neighbors1.delete(selectedPerson2.id);
    neighbors2.delete(selectedPerson1.id);

    const commonIds = [...neighbors1].filter(id => neighbors2.has(id));
    const onlyPerson1Ids = [...neighbors1].filter(id => !neighbors2.has(id));
    const onlyPerson2Ids = [...neighbors2].filter(id => !neighbors1.has(id));

    const byName = (idA: string, idB: string) => {
      const nameA = friendById.get(idA)?.name || '';
      const nameB = friendById.get(idB)?.name || '';
      return nameA.localeCompare(nameB, 'fr');
    };

    commonIds.sort(byName);
    onlyPerson1Ids.sort(byName);
    onlyPerson2Ids.sort(byName);

    const commonFriends = commonIds.map(id => friendById.get(id)).filter((value): value is Friend => Boolean(value));
    const onlyPerson1Knows = onlyPerson1Ids.map(id => friendById.get(id)).filter((value): value is Friend => Boolean(value));
    const onlyPerson2Knows = onlyPerson2Ids.map(id => friendById.get(id)).filter((value): value is Friend => Boolean(value));

    const relationTypeMeta = new Map<string, RelationTypeDB>();
    relationTypes.forEach(type => {
      relationTypeMeta.set(type.type, type);
    });

    const typeCounts = new Map<string, number>();

    commonIds.forEach(commonId => {
      const person1Pair = relationsByPair.get(getPairKey(selectedPerson1.id, commonId)) || [];
      const person2Pair = relationsByPair.get(getPairKey(selectedPerson2.id, commonId)) || [];

      [...person1Pair, ...person2Pair].forEach(relation => {
        typeCounts.set(relation.type, (typeCounts.get(relation.type) || 0) + 1);
      });
    });

    // Fallback: if no common connections have a type breakdown, use the direct relation between selected people.
    if (typeCounts.size === 0) {
      const directRelations = relationsByPair.get(getPairKey(selectedPerson1.id, selectedPerson2.id)) || [];
      directRelations.forEach(relation => {
        typeCounts.set(relation.type, (typeCounts.get(relation.type) || 0) + 1);
      });
    }

    const totalTypes = [...typeCounts.values()].reduce((sum, count) => sum + count, 0);

    const typeBreakdown = [...typeCounts.entries()]
      .map(([type, count]) => {
        const metadata = relationTypeMeta.get(type);
        return {
          type,
          label: metadata?.label || type,
          color: metadata?.color || '#8B5CF6',
          count,
          percent: totalTypes > 0 ? (count / totalTypes) * 100 : 0,
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label, 'fr');
      });

    return {
      commonFriends,
      onlyPerson1Knows,
      onlyPerson2Knows,
      typeBreakdown,
      totals: {
        person1Network: neighbors1.size,
        person2Network: neighbors2.size,
        common: commonFriends.length,
        onlyPerson1: onlyPerson1Knows.length,
        onlyPerson2: onlyPerson2Knows.length,
      },
    };
  }, [selectedPerson1, selectedPerson2, neighborsByFriend, friendById, relationTypes, relationsByPair]);

  const donutStyle = useMemo(() => {
    if (analysis.typeBreakdown.length === 0) {
      return 'conic-gradient(#E2E8F0 0% 100%)';
    }

    let cursor = 0;
    const stops = analysis.typeBreakdown.map(item => {
      const start = cursor;
      cursor += item.percent;
      return `${item.color} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }, [analysis.typeBreakdown]);

  const overlapRatio = useMemo(() => {
    const total = analysis.totals.person1Network + analysis.totals.person2Network;
    if (total === 0) return 0;
    return Math.round((analysis.totals.common * 2 * 100) / total);
  }, [analysis.totals.common, analysis.totals.person1Network, analysis.totals.person2Network]);

  const directRelationTypes = useMemo(() => {
    if (!selectedPerson1 || !selectedPerson2) {
      return [] as Array<{ type: string; label: string; iconName: string; color: string; count: number }>;
    }

    const directRelations = relationsByPair.get(getPairKey(selectedPerson1.id, selectedPerson2.id)) || [];
    const typeMetaByType = new Map<string, RelationTypeDB>();
    relationTypes.forEach(type => {
      typeMetaByType.set(type.type, type);
    });

    const uniqueByType = new Map<string, { type: string; label: string; iconName: string; color: string; count: number }>();

    directRelations.forEach(relation => {
      const existing = uniqueByType.get(relation.type);
      if (existing) {
        existing.count += 1;
        return;
      }

      const relationMeta = typeMetaByType.get(relation.type);
      uniqueByType.set(relation.type, {
        type: relation.type,
        label: relationMeta?.label || relation.type,
        iconName: relationMeta?.icon_name || 'Users',
        color: relationMeta?.color || '#64748B',
        count: 1,
      });
    });

    return [...uniqueByType.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [relationTypes, relationsByPair, selectedPerson1, selectedPerson2]);

  const addableDirectRelationTypes = useMemo(() => {
    const existingTypes = new Set(directRelationTypes.map(item => item.type));
    return relationTypes
      .filter(type => !existingTypes.has(type.type))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [directRelationTypes, relationTypes]);

  useEffect(() => {
    if (addableDirectRelationTypes.length === 0) {
      if (selectedDirectRelationType !== '') {
        setSelectedDirectRelationType('');
      }
      return;
    }

    const hasSelectedType = addableDirectRelationTypes.some(type => type.type === selectedDirectRelationType);
    if (!hasSelectedType) {
      setSelectedDirectRelationType(addableDirectRelationTypes[0].type);
    }
  }, [addableDirectRelationTypes, selectedDirectRelationType]);

  const handleAddDirectRelation = async () => {
    if (!selectedPerson1 || !selectedPerson2 || !selectedDirectRelationType) {
      return;
    }

    setDirectRelationFeedback('');
    setIsAddingDirectRelation(true);

    const isSuccess = await onCreateDirectRelation(selectedPerson1.id, selectedPerson2.id, selectedDirectRelationType);

    setIsAddingDirectRelation(false);
    setDirectRelationFeedback(isSuccess ? 'Lien direct ajouté.' : 'Impossible d\'ajouter ce lien pour le moment.');
  };

  const handleDeleteDirectRelationType = async (relationType: string) => {
    if (!selectedPerson1 || !selectedPerson2) {
      return;
    }

    setDirectRelationFeedback('');
    setDeletingDirectRelationType(relationType);

    const isSuccess = await onDeleteDirectRelationType(selectedPerson1.id, selectedPerson2.id, relationType);

    setDeletingDirectRelationType('');
    setDirectRelationFeedback(isSuccess ? 'Lien direct supprimé.' : 'Impossible de supprimer ce lien pour le moment.');
  };

  useEffect(() => {
    setShowAllCommon(false);
    setShowAllOnlyPerson2Knows(false);
    setShowAllOnlyPerson1Knows(false);
    setDirectRelationFeedback('');
  }, [person1Id, person2Id]);

  if (sortedFriends.length < 2) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <img src={analysisHeaderIcon} alt="Icône Analyse" className="h-[76px] w-[76px] shrink-0 object-contain" />
          <div>
            <h2 className="text-[34px] font-semibold leading-tight text-slate-900">Analyse</h2>
            <p className="mt-1 text-sm text-slate-500">Ajoute au moins 2 personnes pour comparer leurs réseaux.</p>
          </div>
        </div>
      </section>
    );
  }

  const commonPreview = analysis.commonFriends.slice(0, 6);
  const hiddenCommonCount = Math.max(analysis.commonFriends.length - commonPreview.length, 0);
  const canExpandCommon = analysis.commonFriends.length > PREVIEW_COUNT;
  const canExpandOnlyPerson2Knows = analysis.onlyPerson2Knows.length > PREVIEW_COUNT;
  const canExpandOnlyPerson1Knows = analysis.onlyPerson1Knows.length > PREVIEW_COUNT;

  const commonListPreview = showAllCommon ? analysis.commonFriends : analysis.commonFriends.slice(0, PREVIEW_COUNT);
  const onlyPerson2KnowsPreview = showAllOnlyPerson2Knows
    ? analysis.onlyPerson2Knows
    : analysis.onlyPerson2Knows.slice(0, PREVIEW_COUNT);
  const onlyPerson1KnowsPreview = showAllOnlyPerson1Knows
    ? analysis.onlyPerson1Knows
    : analysis.onlyPerson1Knows.slice(0, PREVIEW_COUNT);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <img src={analysisHeaderIcon} alt="Icône Analyse" className="h-[76px] w-[76px] shrink-0 object-contain" />
        <div>
          <h2 className="text-[34px] font-semibold leading-tight text-slate-900">Analyse</h2>
          <p className="mt-1 text-sm text-slate-500">Compare deux personnes et découvre leurs relations en commun.</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <FriendSelect
            label="Personne 1"
            selectedId={person1Id}
            options={sortedFriends}
            excludedId={person2Id}
            onChange={nextId => {
              if (nextId === person2Id) {
                setPerson2Id(person1Id);
              }
              setPerson1Id(nextId);
            }}
          />

          <button
            type="button"
            onClick={() => {
              setPerson1Id(person2Id);
              setPerson2Id(person1Id);
            }}
            className="mb-0.5 inline-flex h-10 w-10 items-center justify-center self-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Inverser les personnes"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <FriendSelect
            label="Personne 2"
            selectedId={person2Id}
            options={sortedFriends}
            excludedId={person1Id}
            onChange={nextId => {
              if (nextId === person1Id) {
                setPerson1Id(person2Id);
              }
              setPerson2Id(nextId);
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.85fr_1fr] xl:items-start">
        <div className="space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-[31px] font-semibold text-slate-900">En résumé</h3>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${
                      directRelationTypes.length > 0
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                    aria-hidden="true"
                  >
                    {directRelationTypes.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lien direct</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedPerson1?.name} et {selectedPerson2?.name}{' '}
                      {directRelationTypes.length > 0 ? 'se connaissent' : 'ne se connaissent pas'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {directRelationTypes.length > 0
                        ? `${directRelationTypes.length} type(s) de lien direct actuellement définis.`
                        : 'Ajoute un type de lien pour les relier directement.'}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold ${
                    directRelationTypes.length > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {directRelationTypes.length > 0 ? `${directRelationTypes.length} lien(s)` : 'Aucun lien'}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Liens entre eux</p>

                <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5">
                  {directRelationTypes.length === 0 ? (
                    <span className="text-xs font-medium text-slate-500">Aucune relation directe enregistrée.</span>
                  ) : (
                    directRelationTypes.map(item => {
                      const DirectRelationIcon = availableIcons[item.iconName as keyof typeof availableIcons] || Network;
                      const isDeleting = deletingDirectRelationType === item.type;

                      return (
                        <span
                          key={`direct-relation-${item.type}`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-1.5 py-1 text-xs font-medium text-slate-700"
                        >
                          <span
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${item.color}24`, color: item.color }}
                            aria-hidden="true"
                          >
                            <DirectRelationIcon className="h-3 w-3" />
                          </span>
                          <span>{item.label}{item.count > 1 ? ` (${item.count})` : ''}</span>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDirectRelationType(item.type)}
                            disabled={isAddingDirectRelation || isDeleting}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title={`Supprimer le lien ${item.label}`}
                            aria-label={`Supprimer le lien ${item.label}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ajouter un lien</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <RelationTypeCombobox
                    value={selectedDirectRelationType}
                    onChange={setSelectedDirectRelationType}
                    options={addableDirectRelationTypes}
                    placeholder="Choisir un type"
                    disabled={addableDirectRelationTypes.length === 0 || isAddingDirectRelation || deletingDirectRelationType !== ''}
                  />

                  <button
                    type="button"
                    onClick={() => void handleAddDirectRelation()}
                    disabled={
                      addableDirectRelationTypes.length === 0
                      || !selectedDirectRelationType
                      || isAddingDirectRelation
                      || deletingDirectRelationType !== ''
                    }
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAddingDirectRelation ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>

                {directRelationFeedback && (
                  <p className="mt-2 text-xs font-medium text-slate-600">{directRelationFeedback}</p>
                )}
              </div>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-[27px] font-semibold text-slate-900">Réseaux individuels</h3>

              <div className="mt-5 overflow-hidden rounded-2xl border border-violet-100/80 bg-gradient-to-b from-violet-50/45 via-white to-pink-50/35 p-3">
                <IndividualNetworkVenn
                  leftLabel={selectedPerson1?.name || ''}
                  rightLabel={selectedPerson2?.name || ''}
                  leftTotal={analysis.totals.person1Network}
                  rightTotal={analysis.totals.person2Network}
                  common={analysis.totals.common}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
                  Uniquement {selectedPerson1?.name}: {analysis.totals.onlyPerson1}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-700">
                  Relations en commun: {analysis.totals.common}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 font-semibold text-pink-700">
                  Uniquement {selectedPerson2?.name}: {analysis.totals.onlyPerson2}
                </span>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-[27px] font-semibold text-slate-900">Types de relation en commun</h3>

              <div className="mt-5 grid items-center gap-4 sm:grid-cols-[170px_1fr]">
                <div className="mx-auto flex h-[160px] w-[160px] items-center justify-center rounded-full" style={{ background: donutStyle }}>
                  <div className="flex h-[102px] w-[102px] items-center justify-center rounded-full bg-white text-center shadow-inner">
                    <span className="text-[34px] font-semibold leading-none text-slate-900">{analysis.typeBreakdown.reduce((sum, item) => sum + item.count, 0)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {analysis.typeBreakdown.length > 0 ? (
                    analysis.typeBreakdown.slice(0, 5).map(item => (
                      <div key={item.type} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-slate-700">{item.label}</span>
                        </div>
                        <span className="shrink-0 font-medium text-slate-600">
                          {item.count} ({formatPercent(item.percent)}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Aucun type de relation en commun à afficher.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
                <p className="flex items-start gap-2 text-sm text-violet-700">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {selectedPerson1?.name} et {selectedPerson2?.name} partagent {analysis.totals.common} relations en commun, soit {overlapRatio}% de leurs réseaux respectifs.
                  </span>
                </p>
              </div>
            </article>
          </div>
        </div>

        <div className="space-y-4">
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3.5">
              <h3 className="text-[24px] font-semibold leading-none text-violet-700">Relations en commun</h3>
              <p className="mt-1 text-sm text-violet-700/80">Le noyau partagé entre {selectedPerson1?.name} et {selectedPerson2?.name}</p>
            </div>

            <div className="space-y-3.5 p-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50/75 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {commonPreview.map((friend, index) => (
                      <div
                        key={friend.id}
                        className="-ml-2 first:ml-0"
                        style={{ zIndex: commonPreview.length - index }}
                      >
                        <div className="rounded-full border-2 border-white shadow-sm">
                          <FriendAvatar friend={friend} size="lg" />
                        </div>
                      </div>
                    ))}

                    {hiddenCommonCount > 0 && (
                      <span className="ml-1.5 inline-flex h-9 items-center rounded-full bg-white px-2.5 text-xs font-semibold text-violet-700 shadow-sm">
                        +{hiddenCommonCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[30px] font-semibold leading-none text-violet-700">{analysis.commonFriends.length}</p>
                    <p className="text-sm font-medium text-violet-700/90">relations partagées</p>
                    <p className="mt-0.5 text-xs text-violet-700/75">{overlapRatio}% de recouvrement global</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Aperçu des contacts communs</p>
                </div>

                <div className="max-h-[180px] space-y-1.5 overflow-auto p-2 scrollbar-thin">
                  {commonListPreview.length > 0 ? (
                    commonListPreview.map((friend, index) => (
                      <div key={`common-list-${friend.id}`} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                        <span className="inline-flex w-5 shrink-0 justify-center text-xs font-semibold text-slate-400">{index + 1}</span>
                        <FriendAvatar friend={friend} size="sm" />
                        <button
                          type="button"
                          onClick={() => onOpenFriendProfile(friend)}
                          className="truncate text-left text-sm font-semibold text-violet-700 transition hover:text-violet-800 hover:underline"
                          title={`Ouvrir le profil de ${friend.name}`}
                        >
                          {friend.name}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="px-2 py-2 text-sm text-slate-500">Aucune relation en commun.</p>
                  )}
                </div>
              </div>

              {canExpandCommon && (
                <button
                  type="button"
                  onClick={() => setShowAllCommon(previous => !previous)}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-100"
                >
                  {showAllCommon ? 'Voir moins' : `Voir toutes (${analysis.commonFriends.length})`}
                </button>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">{selectedPerson1?.name} ne connaît pas</h3>
            <div className="scrollbar-thin mt-3 max-h-[136px] space-y-2 overflow-y-auto pr-1">
              {onlyPerson2KnowsPreview.map(friend => (
                <div key={friend.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2">
                  <FriendAvatar friend={friend} size="sm" />
                  <button
                    type="button"
                    onClick={() => onOpenFriendProfile(friend)}
                    className="truncate text-left text-sm font-semibold text-violet-700 transition hover:text-violet-800 hover:underline"
                    title={`Ouvrir le profil de ${friend.name}`}
                  >
                    {friend.name}
                  </button>
                </div>
              ))}

              {analysis.onlyPerson2Knows.length === 0 && (
                <p className="text-sm text-slate-500">Aucune différence détectée.</p>
              )}
            </div>

            {canExpandOnlyPerson2Knows && (
              <button
                type="button"
                onClick={() => setShowAllOnlyPerson2Knows(previous => !previous)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-100"
              >
                {showAllOnlyPerson2Knows ? 'Voir moins' : `Voir toutes (${analysis.onlyPerson2Knows.length})`}
              </button>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">{selectedPerson2?.name} ne connaît pas</h3>
            <div className="scrollbar-thin mt-3 max-h-[136px] space-y-2 overflow-y-auto pr-1">
              {onlyPerson1KnowsPreview.map(friend => (
                <div key={friend.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2">
                  <FriendAvatar friend={friend} size="sm" />
                  <button
                    type="button"
                    onClick={() => onOpenFriendProfile(friend)}
                    className="truncate text-left text-sm font-semibold text-violet-700 transition hover:text-violet-800 hover:underline"
                    title={`Ouvrir le profil de ${friend.name}`}
                  >
                    {friend.name}
                  </button>
                </div>
              ))}

              {analysis.onlyPerson1Knows.length === 0 && (
                <p className="text-sm text-slate-500">Aucune différence détectée.</p>
              )}
            </div>

            {canExpandOnlyPerson1Knows && (
              <button
                type="button"
                onClick={() => setShowAllOnlyPerson1Knows(previous => !previous)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-100"
              >
                {showAllOnlyPerson1Knows ? 'Voir moins' : `Voir toutes (${analysis.onlyPerson1Knows.length})`}
              </button>
            )}
          </article>
        </div>
      </div>

    </section>
  );
}
