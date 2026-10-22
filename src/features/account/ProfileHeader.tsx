import { useEffect, useState } from 'react';
import { FileStack, Mail, Star } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Skeleton } from '@/components/Skeleton';
import { StarRatingDisplay } from '@/components/StarRating';
import { useCatalog } from '@/context/CatalogContext';
import { useDataSync } from '@/context/DataSyncContext';
import { userService } from '@/services';
import type { User, UserStats } from '@/types';
import { formatDate, formatRating, pluralize } from '@/utils/format';

export function ProfileHeader({ user }: { user: User }) {
  const { findCareer } = useCatalog();
  const { postsVersion } = useDataSync();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    let active = true;
    userService
      .getUserStats(user.id)
      .then((s) => active && setStats(s))
      .catch(() => active && setStats({ postCount: 0, ratingAvg: 0, ratingCount: 0 }));
    return () => {
      active = false;
    };
  }, [user.id, postsVersion]);

  return (
    <section className="card overflow-hidden" aria-labelledby="profile-name">
      <div className="h-20 bg-primary-500 md:h-24" aria-hidden />
      <div className="px-4 pb-5 md:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={user.name} src={user.avatarUrl} size="xl" className="ring-4" />
          {/* El texto empieza debajo del banner para no quedar sobre el color de marca. */}
          <div className="min-w-0 flex-1 sm:pt-14">
            <h1 id="profile-name" className="truncate text-2xl font-semibold text-ink">
              {user.name}
            </h1>
            <p className="text-sm font-medium text-primary-700">{findCareer(user.careerId)?.name ?? 'Carrera'}</p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-muted">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {user.email}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary-50 p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <FileStack className="h-4 w-4" aria-hidden /> Publicaciones
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-ink">
              {stats ? stats.postCount : <Skeleton className="h-7 w-10" />}
            </dd>
          </div>
          <div className="rounded-lg bg-primary-50 p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Star className="h-4 w-4" aria-hidden /> Valoración recibida
            </dt>
            <dd className="mt-1">
              {stats ? (
                stats.ratingCount ? (
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="text-2xl font-semibold text-ink">{formatRating(stats.ratingAvg)}</span>
                    <StarRatingDisplay value={stats.ratingAvg} />
                    <span className="w-full text-xs text-ink-muted">
                      {pluralize(stats.ratingCount, 'valoración', 'valoraciones')}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-ink-muted">Aún sin valoraciones</span>
                )
              ) : (
                <Skeleton className="h-7 w-24" />
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-muted">Miembro desde el {formatDate(user.joinedAt)}</p>
      </div>
    </section>
  );
}
