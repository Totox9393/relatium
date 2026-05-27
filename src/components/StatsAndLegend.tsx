import { useMemo, useState, useEffect } from 'react';
import { Friend, Relation, FriendGroup, RelationTypeDB } from '../types';
import { Users, RefreshCw, UserCircle2, MousePointer2, ArrowRight, UserRound, ChevronDown } from 'lucide-react';
import { availableIcons } from './RelationTypeManagement';

interface StatsAndLegendProps {
  relations: Relation[];
  hoveredFriend: Friend | null;
  friends: Friend[];
  groups?: FriendGroup[];
  friendGroups?: Record<string, string[]>;
  relationTypes: RelationTypeDB[];
  onOpenFriendProfile?: (friend: Friend) => void;
}

export function StatsAndLegend({ 
  relations, 
  hoveredFriend, 
  friends, 
  groups = [], 
  friendGroups = {},
  relationTypes,
  onOpenFriendProfile,
}: StatsAndLegendProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [expandedRelationTypes, setExpandedRelationTypes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (hoveredFriend) {
      setSelectedFriend(hoveredFriend);
    }
  }, [hoveredFriend]);

  useEffect(() => {
    setExpandedRelationTypes({});
  }, [selectedFriend?.id]);

  const overviewStats = useMemo(() => {
    return [
      { label: 'Relations', value: relations.length },
      { label: 'Personnes', value: friends.length },
      { label: 'Groupes', value: groups.length },
      { label: 'Types', value: relationTypes.length },
    ];
  }, [relations.length, friends.length, groups.length, relationTypes.length]);

  const lastUpdatedTime = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  }, [relations.length, friends.length, groups.length, relationTypes.length]);

  const selectedFriendInsights = useMemo(() => {
    const friend = selectedFriend;
    if (!friend) return null;

    const friendRelations = relations.filter(r => 
      r.friend1_id === friend.id || r.friend2_id === friend.id
    );

    const relationsByType = friendRelations.reduce((acc, relation) => {
      if (!acc[relation.type]) {
        acc[relation.type] = {
          count: 0,
          friends: new Set()
        };
      }
      acc[relation.type].count++;
      acc[relation.type].friends.add(
        relation.friend1_id === friend.id ? relation.friend2_id : relation.friend1_id
      );
      return acc;
    }, {} as Record<string, { count: number; friends: Set<string> }>);

    const stats = Object.entries(relationsByType)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([type, data]) => ({
        type,
        count: data.count,
        uniqueFriends: data.friends.size,
        style: relationTypes.find(rt => rt.type === type),
        friendNames: Array.from(data.friends)
          .map(friendId => friends.find(friend => friend.id === friendId)?.name)
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => a.localeCompare(b, 'fr')),
      }));

    const totalRelations = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalUniqueFriends = new Set(
      friendRelations.map(relation =>
        relation.friend1_id === friend.id ? relation.friend2_id : relation.friend1_id
      )
    ).size;

    return {
      stats,
      totalRelations,
      totalUniqueFriends,
    };
  }, [selectedFriend, relations, relationTypes, friends]);

  const selectedGroups = useMemo(() => {
    if (!selectedFriend) return [] as FriendGroup[];

    return (friendGroups[selectedFriend.id] || [])
      .map(groupId => groups.find(group => group.id === groupId))
      .filter((group): group is FriendGroup => Boolean(group));
  }, [selectedFriend, friendGroups, groups]);

  const toggleExpandedType = (type: string) => {
    setExpandedRelationTypes(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="mb-6 grid items-start gap-6 md:grid-cols-1 lg:grid-cols-3">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Vue d'ensemble</h3>

        <div className="mt-5 grid grid-cols-4 gap-4">
          {overviewStats.map(stat => (
            <div key={stat.label} className="min-w-0">
              <p className="text-3xl font-semibold leading-none text-violet-600">{stat.value}</p>
              <p className="mt-2 truncate text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
          <p>Dernière mise à jour : aujourd'hui à {lastUpdatedTime}</p>
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Personne sélectionnée</h3>

        {selectedFriend && selectedFriendInsights ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-slate-900">{selectedFriend.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    {selectedGroups.length > 0 ? (
                      <>
                        <div
                          className="inline-flex max-w-[170px] items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: selectedGroups[0].color + '20',
                            color: selectedGroups[0].color,
                          }}
                        >
                          {(() => {
                            const GroupIcon = availableIcons[(selectedGroups[0].icon_name || 'Users') as keyof typeof availableIcons] || Users;
                            return <GroupIcon size={12} />;
                          })()}
                          <span className="truncate">{selectedGroups[0].name}</span>
                        </div>
                        {selectedGroups.length > 1 && (
                          <span className="text-xs font-semibold text-slate-500">+{selectedGroups.length - 1}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">Sans groupe</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-3xl font-semibold text-violet-600">{selectedFriendInsights.totalRelations}</p>
                  <p className="mt-1 text-sm text-slate-500">Relations</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-violet-600">{selectedFriendInsights.totalUniqueFriends}</p>
                  <p className="mt-1 text-sm text-slate-500">Personnes</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedFriend) {
                  onOpenFriendProfile?.(selectedFriend);
                }
              }}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition hover:text-violet-700"
            >
              Voir le profil complet
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-[182px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-violet-500 shadow-sm">
              <MousePointer2 className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-800">Aucune personne sélectionnée</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Passe la souris sur un nom dans la carte pour afficher ses informations ici.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">
          {selectedFriend 
            ? `Relations de ${selectedFriend.name}`
            : 'Résumé des relations'}
        </h3>
        <div className="h-[182px] overflow-y-auto scrollbar-thin pr-2">
          {selectedFriend && selectedFriendInsights && selectedFriendInsights.stats.length > 0 ? (
            <div className="space-y-2">
              {selectedFriendInsights.stats.map(stat => {
                const IconComponent = stat.style
                  ? availableIcons[stat.style.icon_name as keyof typeof availableIcons]
                  : null;
                const isExpanded = Boolean(expandedRelationTypes[stat.type]);

                return (
                  <div
                    key={stat.type}
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: (stat.style?.color || '#94A3B8') + '14' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpandedType(stat.type)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {IconComponent ? (
                          <IconComponent size={16} color={stat.style?.color} />
                        ) : (
                          <UserRound size={16} color="#64748B" />
                        )}

                        <span className="truncate text-sm font-medium text-slate-700">
                          {stat.style?.label || stat.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{stat.count}</span>
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="h-3.5 w-3.5" />
                          {stat.uniqueFriends}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 border-t border-slate-200 pt-2 text-sm text-slate-600">
                        {stat.friendNames.length > 0 ? (
                          <p>
                            Avec : <span className="text-slate-700">{stat.friendNames.join(', ')}</span>
                          </p>
                        ) : (
                          <p>Aucun nom disponible.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
              <p className="text-base font-semibold text-slate-700">Résumé indisponible</p>
              <p className="mt-1 text-sm text-slate-500">
                Survole une personne dans le graphe pour afficher la répartition de ses relations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}