import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Friend, Relation, FriendGroup } from '../types';
import { availableIcons } from './RelationTypeManagement';
import { RelationTypeDB } from '../types';
import { Maximize, Minimize, Filter, ChevronDown } from 'lucide-react';

interface FriendGraphProps {
  friends: Friend[];
  relations: Relation[];
  groups: FriendGroup[];
  friendGroups: Record<string, string[]>;
  hoveredFriend: Friend | null;
  searchTerm: string;
  onFriendClick: (friend: Friend) => void;
  onFriendHover: (friend: Friend | null) => void;
  relationTypes?: RelationTypeDB[]; // <-- AJOUT : recevoir les types depuis App
  relationTypeFilters: Record<string, boolean>;
  onToggleRelationType: (type: string) => void;
  onResetRelationTypeFilters: () => void;
  onSetRelationTypeVisibility: (type: string, visible: boolean) => void;
  isImmersiveView?: boolean;
  animationsEnabled?: boolean;
}

export function FriendGraph({
  friends,
  relations,
  groups,
  friendGroups,
  hoveredFriend,
  searchTerm,
  onFriendClick,
  onFriendHover,
  relationTypes = [],
  relationTypeFilters,
  onToggleRelationType,
  onResetRelationTypeFilters,
  onSetRelationTypeVisibility,
  isImmersiveView = false,
  animationsEnabled = true,
}: FriendGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Friend, d3.SimulationLinkDatum<Friend>> | null>(null);
  const animationFrameRef = useRef<number>();
  const suppressNextClickRef = useRef(false);
  const typeFilterMenuRef = useRef<HTMLDivElement>(null);

  // fullscreen state + toggle
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [highlightedFilterTypes, setHighlightedFilterTypes] = React.useState<string[]>([]);
  const [isTypeFilterMenuOpen, setIsTypeFilterMenuOpen] = React.useState(false);
  const [isIntensityColoringEnabled, setIsIntensityColoringEnabled] = React.useState(true);
  const [groupFilters, setGroupFilters] = React.useState<Record<string, boolean>>({});

  const activeHighlightedTypes = useMemo(() => {
    return new Set<string>(highlightedFilterTypes);
  }, [highlightedFilterTypes]);

  const hasActiveHighlights = activeHighlightedTypes.size > 0;

  const totalTypeCount = relationTypes.length;
  const enabledTypeCount = useMemo(
    () => relationTypes.reduce((count, type) => count + (relationTypeFilters[type.type] ?? true ? 1 : 0), 0),
    [relationTypeFilters, relationTypes],
  );
  const areAllTypesEnabled = totalTypeCount === 0 || enabledTypeCount === totalTypeCount;
  const areNoTypesEnabled = enabledTypeCount === 0;
  const totalGroupCount = groups.length;
  const enabledGroupCount = useMemo(
    () => groups.reduce((count, group) => count + (groupFilters[group.id] ?? true ? 1 : 0), 0),
    [groupFilters, groups],
  );
  const areAllGroupsEnabled = totalGroupCount === 0 || enabledGroupCount === totalGroupCount;
  const areNoGroupsEnabled = totalGroupCount > 0 && enabledGroupCount === 0;
  const isGroupFilteringStrict = useMemo(() => {
    if (groups.length === 0) {
      return false;
    }

    return groups.some(group => (groupFilters[group.id] ?? true) === false);
  }, [groupFilters, groups]);

  const friendGroupIdsMap = useMemo(() => {
    return Object.entries(friendGroups).reduce((acc, [friendId, groupIds]) => {
      acc[friendId] = new Set(groupIds);
      return acc;
    }, {} as Record<string, Set<string>>);
  }, [friendGroups]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    setGroupFilters(prev => {
      const next: Record<string, boolean> = {};
      groups.forEach(group => {
        next[group.id] = prev[group.id] ?? true;
      });
      return next;
    });
  }, [groups]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterMenuRef.current && !typeFilterMenuRef.current.contains(event.target as Node)) {
        setIsTypeFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erreur fullscreen', err);
    }
  };

  const relationCounts = useMemo(() => {
    return relations.reduce((acc, relation) => {
      acc[relation.type] = (acc[relation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [relations]);

  const relationTypeStyleMap = useMemo(() => {
    return new Map(relationTypes.map(type => [type.type, type]));
  }, [relationTypes]);

  // Memoize filtered friends
  const filteredFriends = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return friends.filter(friend => friend.name.toLowerCase().includes(normalizedSearch));
  }, [friends, searchTerm]);

  const groupFilteredFriends = useMemo(() => {
    if (!isGroupFilteringStrict) {
      return filteredFriends;
    }

    return filteredFriends.filter(friend => {
      const friendGroupIds = friendGroupIdsMap[friend.id];
      if (!friendGroupIds || friendGroupIds.size === 0) {
        return false;
      }

      return Array.from(friendGroupIds).some(groupId => groupFilters[groupId] ?? true);
    });
  }, [filteredFriends, friendGroupIdsMap, groupFilters, isGroupFilteringStrict]);

  const groupVisibleFriendIds = useMemo(() => {
    return new Set(groupFilteredFriends.map(friend => friend.id));
  }, [groupFilteredFriends]);

  const groupMemberCounts = useMemo(() => {
    const counts = groups.reduce((acc, group) => {
      acc[group.id] = 0;
      return acc;
    }, {} as Record<string, number>);

    Object.values(friendGroups).forEach(groupIds => {
      new Set(groupIds).forEach(groupId => {
        if (counts[groupId] !== undefined) {
          counts[groupId] += 1;
        }
      });
    });

    return counts;
  }, [friendGroups, groups]);

  const visibleRelations = useMemo(() => {
    return relations.filter(relation => {
      const typeVisible = relationTypeFilters[relation.type] ?? true;
      if (!typeVisible) {
        return false;
      }

      if (!isGroupFilteringStrict) {
        return true;
      }

      return groupVisibleFriendIds.has(relation.friend1_id) && groupVisibleFriendIds.has(relation.friend2_id);
    });
  }, [groupVisibleFriendIds, isGroupFilteringStrict, relations, relationTypeFilters]);

  const isTypeFilteringStrict = useMemo(() => {
    return relationTypes.some(type => (relationTypeFilters[type.type] ?? true) === false);
  }, [relationTypeFilters, relationTypes]);

  const connectedVisibleFriendIds = useMemo(() => {
    const ids = new Set<string>();
    visibleRelations.forEach(relation => {
      ids.add(relation.friend1_id);
      ids.add(relation.friend2_id);
    });
    return ids;
  }, [visibleRelations]);

  // Memoize grouped relations to prevent unnecessary recalculations
  const groupedRelations = useMemo(() => {
    return visibleRelations.reduce((acc, relation) => {
      const [friend1, friend2] = [relation.friend1_id, relation.friend2_id].sort();
      const key = `${friend1}-${friend2}`;
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(relation);
      return acc;
    }, {} as Record<string, Relation[]>);
  }, [visibleRelations]);

  const displayedFriends = useMemo(() => {
    if (!isTypeFilteringStrict) {
      return groupFilteredFriends;
    }

    return groupFilteredFriends.filter(friend => connectedVisibleFriendIds.has(friend.id));
  }, [connectedVisibleFriendIds, groupFilteredFriends, isTypeFilteringStrict]);

  useEffect(() => {
    const availableTypes = new Set(relationTypes.map(type => type.type));
    setHighlightedFilterTypes(prev => prev.filter(type => availableTypes.has(type)));
  }, [relationTypes]);

  const handleToggleRelationCheckbox = (type: string) => {
    const isChecked = relationTypeFilters[type] ?? true;
    onToggleRelationType(type);

    if (isChecked) {
      setHighlightedFilterTypes(prev => prev.filter(activeType => activeType !== type));
    }
  };

  const handleHighlightToggle = (type: string) => {
    const isChecked = relationTypeFilters[type] ?? true;
    if (!isChecked) {
      onSetRelationTypeVisibility(type, true);
    }

    setHighlightedFilterTypes(prev =>
      prev.includes(type)
        ? prev.filter(activeType => activeType !== type)
        : [...prev, type]
    );
  };

  const handleSetAllRelationTypeVisibility = (visible: boolean) => {
    relationTypes.forEach(type => {
      onSetRelationTypeVisibility(type.type, visible);
    });

    if (!visible) {
      setHighlightedFilterTypes([]);
    }

    setIsTypeFilterMenuOpen(false);
  };

  const handleToggleGroupVisibility = (groupId: string) => {
    setGroupFilters(prev => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  const handleSetAllGroupVisibility = (visible: boolean) => {
    setGroupFilters(prev => {
      const next = { ...prev };
      groups.forEach(group => {
        next[group.id] = visible;
      });
      return next;
    });
  };

  const handleResetFilters = () => {
    onResetRelationTypeFilters();
    setGroupFilters(prev => {
      const next = { ...prev };
      groups.forEach(group => {
        next[group.id] = true;
      });
      return next;
    });
    setHighlightedFilterTypes([]);
    setIsTypeFilterMenuOpen(false);
  };

  useEffect(() => {
    if (!svgRef.current || friends.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Lightweight force profile kept as default to reduce jank on dense graphs.
    const simulation = d3.forceSimulation<Friend>(friends)
      .force('charge', d3.forceManyBody().strength(-130))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(52))
      .force('link', d3.forceLink<Friend, d3.SimulationLinkDatum<Friend>>(visibleRelations as unknown as d3.SimulationLinkDatum<Friend>[])
        .id(d => d.id)
        .distance(130)
      );

    simulation
      .alphaDecay(0.08)
      .velocityDecay(0.55);

    simulation.on('tick', () => {
      // Cancel any existing animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule update on next animation frame
      animationFrameRef.current = requestAnimationFrame(() => {
        friends.forEach(friend => {
          friend.x = Math.max(60, Math.min(width - 60, friend.x || 0));
          friend.y = Math.max(20, Math.min(height - 20, friend.y || 0));
        });
        // Force re-render
        forceUpdate(Date.now());
      });
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationsEnabled, friends.length, visibleRelations]);

  // Use state to force re-render
  const [, forceUpdate] = React.useState({});

  const handleDragStart = useCallback((_event: React.PointerEvent, friend: Friend) => {
    if (!simulationRef.current || !containerRef.current) return;

    const dragThreshold = 4;
    const startX = _event.clientX;
    const startY = _event.clientY;
    let hasMoved = false;
    
    friend.fx = friend.x;
    friend.fy = friend.y;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const handleDrag = (event: PointerEvent) => {
      if (!containerRef.current) return;

      const distanceX = Math.abs(event.clientX - startX);
      const distanceY = Math.abs(event.clientY - startY);
      if (distanceX > dragThreshold || distanceY > dragThreshold) {
        hasMoved = true;
      }
      
      const x = event.clientX - containerRect.left;
      const y = event.clientY - containerRect.top;
      
      friend.fx = Math.max(60, Math.min(containerRect.width - 60, x));
      friend.fy = Math.max(20, Math.min(containerRect.height - 20, y));
      
      simulationRef.current?.alpha(0.5).restart();
    };
    
    const handleDragEnd = () => {
      friend.fx = null;
      friend.fy = null;
      simulationRef.current?.alpha(0.5).restart();

      if (hasMoved) {
        // Ignore the click event fired right after a drag release.
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 0);
      }
      
      window.removeEventListener('pointermove', handleDrag);
      window.removeEventListener('pointerup', handleDragEnd);
    };
    
    window.addEventListener('pointermove', handleDrag);
    window.addEventListener('pointerup', handleDragEnd);
  }, []);

  // Memoize path calculation function
  const calculatePath = useCallback((source: Friend, target: Friend) => {
    return d3.line().curve(d3.curveBasis)([
      [source.x || 0, source.y || 0],
      [
        ((source.x || 0) + (target.x || 0)) / 2,
        ((source.y || 0) + (target.y || 0)) / 2 - 30
      ],
      [target.x || 0, target.y || 0]
    ]);
  }, []);

  const getRelationGroupStrokeColor = useCallback((relationGroup: Relation[], isHighlightedType: boolean) => {
    if (!isIntensityColoringEnabled) {
      return isHighlightedType ? '#EC4899' : '#d1d5db';
    }

    const strongestIntensityRelation = relationGroup.reduce<Relation | null>((bestRelation, relation) => {
      if (typeof relation.intensity !== 'number') {
        return bestRelation;
      }

      const normalizedIntensity = Math.max(0, Math.min(100, relation.intensity));
      const currentBestIntensity =
        bestRelation && typeof bestRelation.intensity === 'number'
          ? Math.max(0, Math.min(100, bestRelation.intensity))
          : -1;

      return normalizedIntensity > currentBestIntensity ? relation : bestRelation;
    }, null);

    if (!strongestIntensityRelation || typeof strongestIntensityRelation.intensity !== 'number') {
      return '#d1d5db';
    }

    const relationTypeStyle = relationTypeStyleMap.get(strongestIntensityRelation.type);
    const targetColor = relationTypeStyle?.color || 'var(--accent-500)';
    const normalizedIntensity = Math.max(0, Math.min(100, strongestIntensityRelation.intensity));
    const colorFactor = normalizedIntensity / 100;

    return d3.interpolateRgb('#d1d5db', targetColor)(colorFactor);
  }, [isIntensityColoringEnabled, relationTypeStyleMap]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${
        isImmersiveView ? 'h-full w-full' : 'rounded-lg bg-white p-4 shadow-lg lg:p-6'
      }`}
      style={isImmersiveView ? undefined : { height: '60vh' }}
    >
      <div className="flex h-full gap-4">
        <div className="relative min-w-0 flex-1">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              className="bg-white/90 hover:bg-white border border-gray-200 p-2 rounded-full shadow-sm flex items-center justify-center"
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-gray-700" /> : <Maximize className="w-5 h-5 text-gray-700" />}
            </button>
          </div>

          <svg ref={svgRef} width="100%" height="100%" className="overflow-hidden">
            {Object.values(groupedRelations).map((relationGroup) => {
              const firstRelation = relationGroup[0];
              if (!firstRelation.source?.x || !firstRelation.source?.y || !firstRelation.target?.x || !firstRelation.target?.y) return null;

              const path = calculatePath(firstRelation.source, firstRelation.target);

              // Détermine si ce lien doit être mis en évidence
              const isHighlightedType = relationGroup.some(r => activeHighlightedTypes.has(r.type));
              const relationStrokeColor = getRelationGroupStrokeColor(relationGroup, isHighlightedType);

              let relationOpacity = hoveredFriend && (hoveredFriend.id === firstRelation.friend1_id || hoveredFriend.id === firstRelation.friend2_id)
                ? 1
                : 0.2;

              if (hasActiveHighlights) {
                relationOpacity = isHighlightedType ? 1 : 0.14;
              }

              return (
                <g key={`${firstRelation.friend1_id}-${firstRelation.friend2_id}`}>
                  <path
                    d={path || ''}
                    stroke={relationStrokeColor}
                    strokeWidth={isHighlightedType ? 6 : hasActiveHighlights ? 2.5 : 4}
                    fill="none"
                    opacity={relationOpacity}
                    style={{ transition: animationsEnabled ? 'opacity 150ms ease-in-out, stroke 150ms, stroke-width 150ms' : 'none' }}
                  />
                  <foreignObject
                    x={(firstRelation.source.x + firstRelation.target.x) / 2 - (12 * relationGroup.length)}
                    y={(firstRelation.source.y + firstRelation.target.y) / 2 - 42}
                    width={24 * relationGroup.length}
                    height="24"
                    style={{
                      opacity: hasActiveHighlights
                        ? (isHighlightedType ? 1 : 0.18)
                        : (hoveredFriend && (hoveredFriend.id === firstRelation.friend1_id || hoveredFriend.id === firstRelation.friend2_id) ? 1 : 0.3),
                      transition: animationsEnabled ? 'opacity 150ms ease-in-out' : 'none'
                    }}
                  >
                    <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm">
                      {relationGroup.map((relation) => {
                        const relationStyle = relationTypes.find(rt => rt.type === relation.type);
                        if (!relationStyle) return null;
                        const IconComponent =
                          availableIcons[relationStyle.icon_name as keyof typeof availableIcons] ?? availableIcons.Users;
                        return IconComponent ? (
                          <div key={relation.id}>
                            <IconComponent size={20} color={relationStyle.color} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {displayedFriends.map((friend) => {
              const isHighlighted = searchTerm && friend.name.toLowerCase().includes(searchTerm.toLowerCase());
              const friendGroupColors = friendGroups[friend.id]?.map(groupId =>
                groups.find(g => g.id === groupId)?.color
              ).filter(Boolean) || [];

              return (
                <g
                  key={friend.id}
                  transform={`translate(${friend.x || 0},${friend.y || 0})`}
                  onPointerDown={(e) => handleDragStart(e, friend)}
                  onMouseEnter={() => onFriendHover(friend)}
                  onMouseLeave={() => onFriendHover(null)}
                  onClick={(event) => {
                    if (suppressNextClickRef.current) {
                      event.preventDefault();
                      event.stopPropagation();
                      return;
                    }
                    onFriendClick(friend);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <foreignObject
                    x="-60"
                    y="-20"
                    width="120"
                    height="40"
                    className="overflow-visible"
                  >
                    <div
                      style={{
                        transform: hoveredFriend?.id === friend.id ? 'scale(1.1)' : 'scale(1)',
                        transition: animationsEnabled ? 'all 150ms ease-in-out' : 'none',
                        borderColor: isHighlighted ? '#FCD34D' : hoveredFriend?.id === friend.id ? '#EC4899' : 'var(--accent-500)',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        userSelect: 'none'
                      }}
                      className="relative px-4 py-2 bg-white rounded-full shadow-md text-center"
                    >
                      {friendGroupColors.length > 0 && (
                        <div className="absolute -top-1 -right-1 flex -space-x-1">
                          {friendGroupColors.map((color, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full border border-white"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                      {friend.name}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="hidden w-[208px] shrink-0 flex-col rounded-lg border border-slate-200 bg-white/95 p-3 lg:flex">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Coloration intensité</span>
              <button
                type="button"
                role="switch"
                aria-checked={isIntensityColoringEnabled}
                onClick={() => setIsIntensityColoringEnabled(previous => !previous)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  isIntensityColoringEnabled ? 'bg-violet-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    isIntensityColoringEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
            <p className="mt-1 text-[11px] text-slate-500">
              Plus l'intensité est forte, plus la couleur du lien est marquée.
            </p>
          </div>

          <div ref={typeFilterMenuRef} className="relative mb-3">
            <button
              type="button"
              onClick={() => setIsTypeFilterMenuOpen(previous => !previous)}
              className="inline-flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-100"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">Filtres</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isTypeFilterMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <p className="mt-1 px-1 text-[11px] font-medium text-slate-500">
              {enabledTypeCount}/{totalTypeCount} types • {enabledGroupCount}/{totalGroupCount} groupes
            </p>

            {isTypeFilterMenuOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
                <button
                  type="button"
                  onClick={() => handleSetAllRelationTypeVisibility(true)}
                  disabled={areAllTypesEnabled}
                  className="mb-1 inline-flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Tout cocher (types)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAllRelationTypeVisibility(false)}
                  disabled={areNoTypesEnabled}
                  className="mb-1 inline-flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Tout décocher (types)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAllGroupVisibility(true)}
                  disabled={areAllGroupsEnabled}
                  className="mb-1 inline-flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Tout cocher (groupes)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAllGroupVisibility(false)}
                  disabled={areNoGroupsEnabled}
                  className="mb-1 inline-flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Tout décocher (groupes)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-violet-600 transition hover:bg-violet-50"
                >
                  <span>Réinitialiser</span>
                </button>

                {groups.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <div className="mb-1 flex items-center justify-between px-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Groupes</p>
                      <span className="text-[11px] font-medium text-slate-500">{enabledGroupCount}/{totalGroupCount}</span>
                    </div>

                    <div className="mt-1 space-y-1">
                      {groups.map(group => {
                        const isGroupChecked = groupFilters[group.id] ?? true;

                        return (
                          <label
                            key={group.id}
                            className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1.5 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={isGroupChecked}
                              onChange={() => handleToggleGroupVisibility(group.id)}
                              className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                            />

                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />

                            <span className="min-w-0 flex-1 truncate font-medium">{group.name}</span>

                            <span className="text-xs text-slate-500">{groupMemberCounts[group.id] || 0}</span>
                          </label>
                        );
                      })}
                    </div>

                    <p className="mt-2 px-2 text-[11px] text-slate-500">
                      Le filtre de groupes masque ou affiche les personnes de la carte.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto pr-1">
            {relationTypes.map((type) => {
              const IconComponent = availableIcons[type.icon_name as keyof typeof availableIcons];
              const isChecked = relationTypeFilters[type.type] ?? true;
              const isHighlighted = activeHighlightedTypes.has(type.type);

              return (
                <div
                  key={type.type}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                    hasActiveHighlights
                      ? (isHighlighted ? 'bg-violet-50 text-violet-700' : 'text-slate-500 opacity-60')
                      : (isChecked ? 'text-slate-700' : 'text-slate-400')
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleRelationCheckbox(type.type)}
                    className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                  />

                  <button
                    type="button"
                    onClick={() => handleHighlightToggle(type.type)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {IconComponent ? <IconComponent size={14} color={type.color} /> : null}

                    <span className="truncate">
                      {type.label} ({relationCounts[type.type] || 0})
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
