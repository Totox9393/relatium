import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Heart,
  Layers3,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { Friend, FriendGroup, Relation, RelationTypeDB } from '../types';
import { availableIcons } from './RelationTypeManagement';
import statsIcon from '../../ressources/stats_icon.png';

interface StatisticsProps {
  relations: Relation[];
  friends: Friend[];
  groups: FriendGroup[];
  friendGroups: Record<string, string[]>;
  relationTypes: RelationTypeDB[];
  onOpenGroupsView: () => void;
}

type PeriodKey = 'this-month' | 'last-30' | 'last-90';

const PERIOD_OPTIONS: Array<{ value: PeriodKey; label: string }> = [
  { value: 'this-month', label: 'Ce mois-ci' },
  { value: 'last-30', label: '30 derniers jours' },
  { value: 'last-90', label: '90 derniers jours' },
];

const FALLBACK_COLORS = ['#8B5CF6', '#3B82F6', '#F97316', '#EC4899', '#14B8A6', '#6366F1', '#F43F5E'];

const toValidDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfMonth = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), 1);

const endOfMonth = (value: Date): Date => endOfDay(new Date(value.getFullYear(), value.getMonth() + 1, 0));

const eachDay = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const cursor = startOfDay(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const formatDate = (value: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);

const formatShortDate = (value: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(value);

const percentage = (value: number, total: number): number => (total === 0 ? 0 : (value / total) * 100);

const countInRange = (dates: Date[], start: Date, end: Date): number =>
  dates.filter(date => date >= start && date <= end).length;

const getPeriodRange = (period: PeriodKey, now: Date): { start: Date; end: Date } => {
  const todayEnd = endOfDay(now);

  if (period === 'this-month') {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }

  if (period === 'last-90') {
    const start = startOfDay(new Date(todayEnd));
    start.setDate(start.getDate() - 89);
    return { start, end: todayEnd };
  }

  const start = startOfDay(new Date(todayEnd));
  start.setDate(start.getDate() - 29);
  return { start, end: todayEnd };
};

const getDeltaLabel = (delta: number, period: PeriodKey): string => {
  const suffix = period === 'this-month' ? 'ce mois-ci' : 'sur la période';

  if (delta > 0) {
    return `+ ${delta} ${suffix}`;
  }

  if (delta < 0) {
    return `${delta} ${suffix}`;
  }

  return 'Aucun changement';
};

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

const describeDonutArc = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
};

type DonutHoverInfo = {
  type: string;
  label: string;
  color: string;
  count: number;
  percent: number;
};

export function Statistics({ relations, friends, groups, friendGroups, relationTypes, onOpenGroupsView }: StatisticsProps) {
  const [period, setPeriod] = useState<PeriodKey>('this-month');
  const [hoveredDonut, setHoveredDonut] = useState<DonutHoverInfo | null>(null);

  const now = new Date();

  const range = useMemo(() => getPeriodRange(period, now), [period, now]);

  const previousRange = useMemo(() => {
    const durationMs = range.end.getTime() - range.start.getTime() + 1;
    const previousEnd = new Date(range.start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - durationMs + 1);

    return {
      start: startOfDay(previousStart),
      end: endOfDay(previousEnd),
    };
  }, [range.end, range.start]);

  const relationDates = useMemo(() => relations.map(relation => toValidDate(relation.created_at)).filter((value): value is Date => value !== null), [relations]);
  const friendDates = useMemo(() => friends.map(friend => toValidDate(friend.created_at)).filter((value): value is Date => value !== null), [friends]);
  const groupDates = useMemo(() => groups.map(group => toValidDate(group.created_at)).filter((value): value is Date => value !== null), [groups]);
  const relationTypeDates = useMemo(
    () => relationTypes.map(type => toValidDate(type.created_at)).filter((value): value is Date => value !== null),
    [relationTypes],
  );

  const totalActivities = useMemo(() => {
    const relationsCreated = countInRange(relationDates, range.start, range.end);
    const contactsAdded = countInRange(friendDates, range.start, range.end);
    const groupsCreated = countInRange(groupDates, range.start, range.end);
    const typesCreated = countInRange(relationTypeDates, range.start, range.end);

    return relationsCreated + contactsAdded + groupsCreated + typesCreated;
  }, [friendDates, groupDates, range.end, range.start, relationDates, relationTypeDates]);

  const previousActivities = useMemo(() => {
    const relationsCreated = countInRange(relationDates, previousRange.start, previousRange.end);
    const contactsAdded = countInRange(friendDates, previousRange.start, previousRange.end);
    const groupsCreated = countInRange(groupDates, previousRange.start, previousRange.end);
    const typesCreated = countInRange(relationTypeDates, previousRange.start, previousRange.end);

    return relationsCreated + contactsAdded + groupsCreated + typesCreated;
  }, [friendDates, groupDates, previousRange.end, previousRange.start, relationDates, relationTypeDates]);

  const kpiCards = useMemo(() => {
    const contactsNow = friends.length;
    const contactsPrev = contactsNow - (countInRange(friendDates, range.start, range.end) - countInRange(friendDates, previousRange.start, previousRange.end));

    const groupsNow = groups.length;
    const groupsPrev = groupsNow - (countInRange(groupDates, range.start, range.end) - countInRange(groupDates, previousRange.start, previousRange.end));

    const relationsNow = relations.length;
    const relationsPrev = relationsNow - (countInRange(relationDates, range.start, range.end) - countInRange(relationDates, previousRange.start, previousRange.end));

    const relationTypesNow = relationTypes.length;
    const relationTypesPrev =
      relationTypesNow -
      (countInRange(relationTypeDates, range.start, range.end) - countInRange(relationTypeDates, previousRange.start, previousRange.end));

    return [
      {
        title: 'Contacts totaux',
        value: contactsNow,
        delta: contactsNow - contactsPrev,
        icon: Users,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
      {
        title: 'Groupes',
        value: groupsNow,
        delta: groupsNow - groupsPrev,
        icon: UsersRound,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        title: 'Relations totales',
        value: relationsNow,
        delta: relationsNow - relationsPrev,
        icon: Activity,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
      {
        title: 'Types de relation',
        value: relationTypesNow,
        delta: relationTypesNow - relationTypesPrev,
        icon: Heart,
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
      },
      {
        title: 'Activités enregistrées',
        value: totalActivities,
        delta: totalActivities - previousActivities,
        icon: TrendingUp,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
    ];
  }, [
    friendDates,
    friends.length,
    groupDates,
    groups.length,
    period,
    previousActivities,
    previousRange.end,
    previousRange.start,
    range.end,
    range.start,
    relationDates,
    relationTypeDates,
    relationTypes.length,
    relations.length,
    totalActivities,
  ]);

  const relationEvolution = useMemo(() => {
    const days = eachDay(range.start, range.end);
    const additionsByDay = new Map<string, number>();
    const knownDatedRelations = relationDates.length;

    relationDates.forEach(date => {
      const key = startOfDay(date).toISOString();
      additionsByDay.set(key, (additionsByDay.get(key) || 0) + 1);
    });

    const initialValue = relations.length - knownDatedRelations + relationDates.filter(date => date < range.start).length;

    let running = initialValue;

    return days.map(day => {
      const key = day.toISOString();
      running += additionsByDay.get(key) || 0;

      return {
        day,
        value: running,
      };
    });
  }, [range.end, range.start, relationDates, relations.length]);

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};

    relations.forEach(relation => {
      counts[relation.type] = (counts[relation.type] || 0) + 1;
    });

    const ordered = Object.entries(counts)
      .map(([type, count], index) => {
        const style = relationTypes.find(item => item.type === type);
        return {
          type,
          label: style?.label || type,
          color: style?.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

    const total = ordered.reduce((sum, item) => sum + item.count, 0);

    return {
      total,
      items: ordered,
    };
  }, [relationTypes, relations]);

  const donutSegments = useMemo(() => {
    let cursor = -90;

    return donutData.items.map(item => {
      const percentValue = percentage(item.count, donutData.total);
      const angle = (percentValue / 100) * 360;
      const segment = {
        ...item,
        percent: percentValue,
        startAngle: cursor,
        endAngle: cursor + angle,
      };
      cursor += angle;
      return segment;
    });
  }, [donutData.items, donutData.total]);

  const donutGradient = useMemo(() => {
    if (donutData.items.length === 0 || donutData.total === 0) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }

    let cursor = 0;
    const stops = donutData.items.map(item => {
      const value = percentage(item.count, donutData.total);
      const from = cursor;
      cursor += value;
      return `${item.color} ${from}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }, [donutData.items, donutData.total]);

  const contactsAdded = useMemo(() => {
    const bucketCount = 5;
    const duration = range.end.getTime() - range.start.getTime();
    const bucketSize = duration / bucketCount;

    return Array.from({ length: bucketCount }).map((_, index) => {
      const bucketStart = new Date(range.start.getTime() + bucketSize * index);
      const rawEnd = new Date(range.start.getTime() + bucketSize * (index + 1) - 1);
      const bucketEnd = index === bucketCount - 1 ? range.end : rawEnd;
      const value = friendDates.filter(date => date >= bucketStart && date <= bucketEnd).length;

      return {
        label: formatShortDate(bucketStart),
        value,
      };
    });
  }, [friendDates, range.end, range.start]);

  const activities = useMemo(() => {
    const relationsCreated = countInRange(relationDates, range.start, range.end);
    const contactsCreated = countInRange(friendDates, range.start, range.end);
    const groupsCreated = countInRange(groupDates, range.start, range.end);

    return [
      {
        label: 'Relations créées',
        value: relationsCreated,
        icon: Activity,
        rowClass: 'bg-violet-50 text-violet-700',
      },
      {
        label: 'Relations mises à jour',
        value: 0,
        icon: RefreshCw,
        rowClass: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Contacts ajoutés',
        value: contactsCreated,
        icon: UserPlus,
        rowClass: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Groupes créés',
        value: groupsCreated,
        icon: Layers3,
        rowClass: 'bg-rose-50 text-rose-700',
      },
    ];
  }, [friendDates, groupDates, range.end, range.start, relationDates]);

  const topGroups = useMemo(() => {
    const memberCount = new Map<string, number>();

    Object.values(friendGroups).forEach(groupIds => {
      groupIds.forEach(groupId => {
        memberCount.set(groupId, (memberCount.get(groupId) || 0) + 1);
      });
    });

    return groups
      .map(group => ({
        ...group,
        members: memberCount.get(group.id) || 0,
      }))
      .sort((a, b) => b.members - a.members)
      .slice(0, 4);
  }, [friendGroups, groups]);

  const connectedFriends = useMemo(() => {
    const connected = new Set<string>();

    relations.forEach(relation => {
      connected.add(relation.friend1_id);
      connected.add(relation.friend2_id);
    });

    return connected.size;
  }, [relations]);

  const overviewProgress = friends.length === 0 ? 0 : Math.round((connectedFriends / friends.length) * 100);
  const overviewProgressClamped = Math.max(0, Math.min(overviewProgress, 100));
  const overviewHue = Math.round((overviewProgressClamped / 100) * 120);
  const overviewRingColor = `hsl(${overviewHue} 72% 44%)`;
  const overviewRingTrackColor = `hsl(${overviewHue} 32% 90%)`;

  const rangeLabel = `${formatDate(range.start)} - ${formatDate(range.end)}`;
  const chartMax = Math.max(...relationEvolution.map(point => point.value), 1);
  const chartMin = Math.min(...relationEvolution.map(point => point.value), 0);
  const chartSpan = Math.max(chartMax - chartMin, 1);
  const yTicks = 4;
  const lineWidth = 760;
  const lineHeight = 240;
  const padX = 56;
  const padY = 24;
  const drawWidth = lineWidth - padX * 2;
  const drawHeight = lineHeight - padY * 2;

  const linePath = relationEvolution
    .map((point, index) => {
      const x = padX + (drawWidth * index) / Math.max(relationEvolution.length - 1, 1);
      const y = padY + drawHeight - ((point.value - chartMin) / chartSpan) * drawHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const lastPoint = relationEvolution[relationEvolution.length - 1];
  const lastIndex = relationEvolution.length - 1;
  const lastX = padX + (drawWidth * Math.max(lastIndex, 0)) / Math.max(relationEvolution.length - 1, 1);
  const lastY = padY + drawHeight - ((((lastPoint?.value || 0) - chartMin) / chartSpan) * drawHeight);

  const barWidth = 340;
  const barHeight = 180;
  const barPadX = 22;
  const barPadY = 16;
  const barDrawWidth = barWidth - barPadX * 2;
  const barDrawHeight = barHeight - barPadY * 2;
  const maxBars = Math.max(...contactsAdded.map(item => item.value), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <img src={statsIcon} alt="Icône Statistiques" className="h-[76px] w-[76px] shrink-0 object-contain" />
          <div>
            <h2 className="text-[34px] font-semibold leading-tight text-slate-900">Statistiques</h2>
            <p className="mt-1 text-sm text-slate-500">Analyse de votre réseau et de vos relations.</p>
          </div>
        </div>

        <label className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
          <CalendarDays className="h-4 w-4 text-violet-600" />
          <span>{rangeLabel}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
          <select
            aria-label="Selection de la periode"
            value={period}
            onChange={event => setPeriod(event.target.value as PeriodKey)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {kpiCards.map(card => {
          const Icon = card.icon;
          const isPositive = card.delta > 0;

          return (
            <article key={card.title} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="text-[36px] font-semibold leading-none text-slate-900">{card.value}</p>
                </div>
              </div>
              <p className={`mt-2 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
                {getDeltaLabel(card.delta, period)}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Évolution des relations</h3>
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
              Relations totales
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${lineWidth} ${lineHeight}`} className="h-[220px] min-w-[640px] w-full">
              {Array.from({ length: yTicks + 1 }).map((_, index) => {
                const y = padY + (drawHeight * index) / yTicks;
                const value = Math.round(chartMax - (chartSpan * index) / yTicks);
                return (
                  <g key={index}>
                    <line x1={padX} y1={y} x2={padX + drawWidth} y2={y} stroke="#E2E8F0" strokeWidth="1" />
                    <text x={padX - 10} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="11">
                      {value}
                    </text>
                  </g>
                );
              })}

              <path d={linePath} fill="none" style={{stroke: 'var(--accent-500)'}} strokeWidth="3" strokeLinecap="round" />
              <circle cx={lastX} cy={lastY} r="5" style={{fill: 'var(--accent-500)'}} />

              <g>
                <rect x={Math.max(lastX - 76, padX)} y={Math.max(lastY - 56, padY)} width="148" height="40" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
                <text x={Math.max(lastX - 64, padX + 10)} y={Math.max(lastY - 38, padY + 16)} fill="#64748B" fontSize="11">
                  {lastPoint ? formatDate(lastPoint.day) : ''}
                </text>
                <text x={Math.max(lastX - 64, padX + 10)} y={Math.max(lastY - 24, padY + 30)} fill="#0F172A" fontSize="12" fontWeight="600">
                  {lastPoint?.value || 0} relations
                </text>
              </g>

              {relationEvolution
                .filter((_, index) => index % Math.ceil(relationEvolution.length / 5) === 0)
                .map(point => {
                  const index = relationEvolution.findIndex(item => item.day.getTime() === point.day.getTime());
                  const x = padX + (drawWidth * index) / Math.max(relationEvolution.length - 1, 1);
                  return (
                    <text key={point.day.toISOString()} x={x} y={lineHeight - 8} textAnchor="middle" fill="#94A3B8" fontSize="11">
                      {formatShortDate(point.day)}
                    </text>
                  );
                })}
            </svg>
          </div>
        </article>

        <article className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Répartition par type de relation</h3>
          </div>

          {hoveredDonut && (
            <div className="pointer-events-none absolute right-4 top-14 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: hoveredDonut.color }} />
                <span className="font-semibold text-slate-800">{hoveredDonut.label}</span>
              </div>
              <p className="mt-1 text-slate-600">
                {hoveredDonut.count} relations ({hoveredDonut.percent.toFixed(1)}%)
              </p>
            </div>
          )}

          <div className="grid items-center gap-4 md:grid-cols-[220px_1fr]">
            <div className="relative mx-auto h-[190px] w-[190px]">
              <div className="flex h-[190px] w-[190px] items-center justify-center rounded-full" style={{ background: donutGradient }}>
                <div className="flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <span className="text-[36px] font-semibold leading-none text-slate-900">{donutData.total}</span>
                  <span className="text-sm text-slate-500">Total</span>
                </div>
              </div>

              {donutSegments.length > 0 && (
                <svg viewBox="0 0 190 190" className="absolute inset-0 h-[190px] w-[190px]" onMouseLeave={() => setHoveredDonut(null)}>
                  {donutSegments.map(segment => (
                    <path
                      key={segment.type}
                      d={describeDonutArc(95, 95, 94, 58, segment.startAngle, segment.endAngle)}
                      fill="transparent"
                      pointerEvents="all"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() =>
                        setHoveredDonut({
                          type: segment.type,
                          label: segment.label,
                          color: segment.color,
                          count: segment.count,
                          percent: segment.percent,
                        })
                      }
                    />
                  ))}
                </svg>
              )}
            </div>

            <div className="space-y-2">
              {donutData.items.slice(0, 6).map(item => (
                <div
                  key={item.type}
                  className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm transition-colors"
                  onMouseEnter={() =>
                    setHoveredDonut({
                      type: item.type,
                      label: item.label,
                      color: item.color,
                      count: item.count,
                      percent: percentage(item.count, donutData.total),
                    })
                  }
                  onMouseLeave={() => setHoveredDonut(null)}
                  style={{ backgroundColor: hoveredDonut?.type === item.type ? `${item.color}15` : undefined }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-slate-700">{item.label}</span>
                  </div>
                  <span className="shrink-0 font-medium text-slate-600">
                    {item.count} ({percentage(item.count, donutData.total).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Personnes ajoutées</h3>
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{PERIOD_OPTIONS.find(option => option.value === period)?.label}</span>
          </div>
          <p className="mt-3 text-[36px] font-semibold leading-none text-slate-900">{contactsAdded.reduce((sum, item) => sum + item.value, 0)}</p>
          <p className="mt-1 text-sm text-slate-500">nouvelles personnes</p>

          <svg viewBox={`0 0 ${barWidth} ${barHeight}`} className="mt-3 h-[160px] w-full">
            <line x1={barPadX} y1={barPadY + barDrawHeight} x2={barPadX + barDrawWidth} y2={barPadY + barDrawHeight} stroke="#E2E8F0" />
            {contactsAdded.map((bucket, index) => {
              const unit = barDrawWidth / contactsAdded.length;
              const x = barPadX + unit * index + unit * 0.2;
              const width = unit * 0.6;
              const height = (bucket.value / maxBars) * (barDrawHeight - 10);
              const y = barPadY + barDrawHeight - height;

              return (
                <g key={`${bucket.label}-${index}`}>
                  <rect x={x} y={y} width={width} height={height} rx="6" style={{fill: 'var(--accent-500)'}} opacity="0.9" />
                  <text x={x + width / 2} y={barPadY + barDrawHeight + 14} textAnchor="middle" fill="#94A3B8" fontSize="11">
                    {bucket.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Activités récentes</h3>
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{PERIOD_OPTIONS.find(option => option.value === period)?.label}</span>
          </div>

          <div className="mt-4 space-y-2">
            {activities.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${item.rowClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-sm text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Top des groupes</h3>
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">Par nombre de membres</span>
          </div>

          <div className="mt-4 space-y-2">
            {topGroups.length > 0 ? (
              topGroups.map(group => {
                const Icon = availableIcons[(group.icon_name || 'Users') as keyof typeof availableIcons] || Users;

                return (
                  <div key={group.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${group.color}20`, color: group.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-sm font-medium text-slate-700">{group.name}</span>
                    </div>
                    <span className="text-sm text-slate-500">{group.members} personnes</span>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Aucun groupe disponible.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenGroupsView}
            className="mt-3 w-full rounded-lg bg-violet-50 py-2 text-sm font-semibold text-violet-600"
          >
            Voir tous les groupes
          </button>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Vue d&apos;ensemble</h3>
          <div className="mt-5 flex flex-col items-center justify-center">
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${overviewRingColor} ${overviewProgressClamped}%, ${overviewRingTrackColor} ${overviewProgressClamped}% 100%)`,
              }}
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[32px] font-semibold leading-none text-slate-900">
                {overviewProgress}%
              </div>
            </div>

            <p className="mt-4 text-center text-sm font-medium text-slate-700">
              de votre réseau dispose d&apos;au moins une relation
            </p>
          </div>

          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>Objectif : 80%</span>
              <span>{overviewProgress}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: overviewRingTrackColor }}>
              <div className="h-full rounded-full" style={{ width: `${overviewProgressClamped}%`, backgroundColor: overviewRingColor }} />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
