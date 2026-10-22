'use client';

// Variable Mapping: T -> FooterStatus, e -> latest / publishedAt / weeks, t -> timestamp, r -> relativeTime / days, i -> months, n -> title, s -> slug

import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import StatusIndicator from '@/components/layout/utils/StatusIndicator'; // NOTE: module id: 400545
import NavLink from '@/components/navigation/NavLink'; // NOTE: module id: 520237

function formatRelativeTime(publishedAt) {
  if (!publishedAt) return null;
  const timestamp = new Date(publishedAt).getTime();
  if (Number.isNaN(timestamp)) return null;

  const days = Math.floor((Date.now() - timestamp) / 86400000);
  if (days <= 0) return t('common.footer.relativeTime.today');
  if (days === 1) return t('common.footer.relativeTime.yesterday');
  if (days < 7) return t('common.footer.relativeTime.daysAgo', { n: days });

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? t('common.footer.relativeTime.weekAgo') : t('common.footer.relativeTime.weeksAgo', { n: weeks });
  }

  const months = Math.floor(days / 30);
  return months === 1 ? t('common.footer.relativeTime.monthAgo') : t('common.footer.relativeTime.monthsAgo', { n: months });
}

// NOTE: module id: 297428
export default function FooterStatus({ latest }) {
  const relativeTime = formatRelativeTime(latest?.published_at);
  const title = latest?.title;
  const slug = latest?.slug;

  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <StatusIndicator className="size-12" />
      {title && slug ? (
        <>
          <span>{t('common.footer.status.justShipped')}</span>
          <NavLink href={`/animations/${slug}`} variant="nav" className="text-mono-sm -mx-12 -my-6 text-foreground">
            {title}
          </NavLink>
          {relativeTime ? (
            <>
              <span className="opacity-40">·</span>
              <span>{relativeTime}</span>
            </>
          ) : null}
        </>
      ) : (
        <span>{t('common.footer.status.default')}</span>
      )}
    </div>
  );
}
