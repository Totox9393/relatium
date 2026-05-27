import { useMemo } from 'react';
import { Crown, Medal, RefreshCw, Sparkles, Trophy, UsersRound, X } from 'lucide-react';
import { Friend, Relation } from '../types';
import podiumHeaderBackground from '../../ressources/fond_modal_podium.png';

interface RankingProps {
  friends: Friend[];
  relations: Relation[];
  onClose: () => void;
  onOpenFriendProfile: (friend: Friend) => void;
}

export function Ranking({ friends, relations, onClose, onOpenFriendProfile }: RankingProps) {
  const rankedFriends = useMemo(() => {
    const relationCountByFriend = new Map<string, number>();

    friends.forEach(friend => {
      relationCountByFriend.set(friend.id, 0);
    });

    relations.forEach(relation => {
      relationCountByFriend.set(relation.friend1_id, (relationCountByFriend.get(relation.friend1_id) || 0) + 1);
      relationCountByFriend.set(relation.friend2_id, (relationCountByFriend.get(relation.friend2_id) || 0) + 1);
    });

    return friends
      .map(friend => ({
        ...friend,
        relationCount: relationCountByFriend.get(friend.id) || 0,
      }))
      .sort((a, b) => {
        if (b.relationCount !== a.relationCount) {
          return b.relationCount - a.relationCount;
        }

        return a.name.localeCompare(b.name, 'fr');
      });
  }, [friends, relations]);

  const podium = {
    first: rankedFriends[0] || null,
    second: rankedFriends[1] || null,
    third: rankedFriends[2] || null,
  };

  const topTenRemainder = rankedFriends.slice(3, 10);

  const lastUpdatedDate = useMemo(() => {
    const latestRelationDate = relations
      .map(relation => relation.created_at)
      .filter((date): date is string => Boolean(date))
      .map(date => new Date(date))
      .filter(date => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const referenceDate = latestRelationDate || new Date();

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(referenceDate);
  }, [relations]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const PodiumCard = ({
    friend,
    rank,
    cardClassName,
    relationBadgeClassName,
    iconClassName,
    crownClassName,
    heightClassName,
  }: {
    friend: (Friend & { relationCount: number }) | null;
    rank: number;
    cardClassName: string;
    relationBadgeClassName: string;
    iconClassName: string;
    crownClassName: string;
    heightClassName: string;
  }) => {
    if (!friend) {
      return (
        <div className="flex w-[230px] flex-col items-center">
          <div className={`relative w-full ${heightClassName} rounded-t-2xl border border-dashed border-slate-200 bg-slate-50`} />
        </div>
      );
    }

    return (
      <div className="flex w-[230px] flex-col items-center">
        <div className={`relative flex w-full flex-col items-center rounded-t-2xl border px-4 pt-8 ${heightClassName} ${cardClassName}`}>
          <Crown className={`absolute -top-7 left-1/2 h-6 w-6 -translate-x-1/2 ${crownClassName}`} />
          <div className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-current bg-white text-[30px] font-semibold leading-none">
            <span className="text-xl leading-none">{rank}</span>
          </div>

          <button
            type="button"
            onClick={() => onOpenFriendProfile(friend)}
            className="text-[34px] font-semibold leading-none text-slate-900 transition hover:text-violet-700 hover:underline hover:decoration-violet-300 hover:underline-offset-4"
          >
            {friend.name}
          </button>

          <span className={`mt-2 rounded-full px-3 py-1 text-base font-semibold ${relationBadgeClassName}`}>
            {friend.relationCount} relations
          </span>

          <div className="mt-auto pb-5 opacity-40">
            {rank === 1 ? <Trophy className={`h-16 w-16 ${iconClassName}`} /> : <Medal className={`h-14 w-14 ${iconClassName}`} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[88vh] w-full max-w-[980px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div
          className="bg-no-repeat px-8 pb-6 pt-6"
          style={{
            backgroundImage: `url(${podiumHeaderBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-3 text-[33px] font-semibold leading-none text-indigo-950">
                <Trophy className="h-8 w-8 text-amber-500" />
                Classement des plus mondiaux
              </h2>
              <p className="mt-2 text-base text-slate-500">Ces personnes sont les plus connectées du réseau !</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-violet-100 text-violet-950 transition hover:bg-violet-50"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-2xl px-4 pb-0 pt-2">
            <div className="mx-auto flex items-end justify-center gap-6 pb-0 pt-8">
              <PodiumCard
                friend={podium.second}
                rank={2}
                heightClassName="h-[200px]"
                cardClassName="border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 text-slate-400"
                relationBadgeClassName="bg-violet-100 text-violet-700"
                iconClassName="text-slate-400"
                crownClassName="text-slate-400"
              />

              <PodiumCard
                friend={podium.first}
                rank={1}
                heightClassName="h-[265px]"
                cardClassName="border-amber-300 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-50 text-amber-700"
                relationBadgeClassName="bg-amber-200 text-amber-700"
                iconClassName="text-amber-500"
                crownClassName="text-amber-500"
              />

              <PodiumCard
                friend={podium.third}
                rank={3}
                heightClassName="h-[185px]"
                cardClassName="border-orange-200 bg-gradient-to-b from-orange-100 to-orange-50 text-orange-700"
                relationBadgeClassName="bg-orange-100 text-orange-700"
                iconClassName="text-orange-300"
                crownClassName="text-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-slate-100 bg-slate-50/50 px-8 py-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[28px] font-semibold text-indigo-950">
              <UsersRound className="h-5 w-5 text-violet-500" />
              Top 10 des plus mondiaux
            </h3>

            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-100 bg-white scrollbar-thin">
              {topTenRemainder.length > 0 ? (
                topTenRemainder.map((friend, index) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 4}
                    </span>

                    <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-700">
                          {getInitials(friend.name)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenFriendProfile(friend)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-slate-800 transition hover:text-violet-700 hover:underline hover:decoration-violet-300 hover:underline-offset-2"
                    >
                      {friend.name}
                    </button>

                    <span className="text-sm font-medium text-violet-600">{friend.relationCount} relations</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">Pas assez de données pour afficher le top 10.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-800">
                <Sparkles className="h-4 w-4" />
                À propos du classement
              </h3>
              <p className="text-sm text-slate-600">
                Le classement est basé sur le nombre total de relations actives (tous types confondus).
              </p>

              <div className="mt-3 rounded-lg border border-violet-100 bg-white/70 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Bon à savoir
                </p>
                <p className="mt-1 text-sm text-violet-700/90">
                  Entretenez vos relations pour rester connecté et gagner des places !
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-8 py-3.5">
          <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4" />
            Données mises à jour le {lastUpdatedDate}
          </p>
        </div>
      </div>
    </div>
  );
}