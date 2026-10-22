'use client';

import { useEffect, useRef } from 'react';

import { captureFirstTouch, collectAttribution } from '@/libs/analytics/captureFirstTouch';

import { useUser } from '@/hooks/useUser'; // module id: 201220

const SEVEN_DAYS_MS = 604800000;

export function AttributionTracker() {
  const { user, profile } = useUser();
  const hasBackfilledRef = useRef(false);

  useEffect(() => {
    captureFirstTouch();
  }, []);

  useEffect(() => {
    if (
      !user ||
      !profile ||
      hasBackfilledRef.current ||
      profile.ft_at ||
      profile.ft_channel
    ) {
      return;
    }

    const createdAtMs = profile.created_at
      ? new Date(profile.created_at).getTime()
      : 0;

    if (!createdAtMs || Date.now() - createdAtMs > SEVEN_DAYS_MS) {
      return;
    }

    hasBackfilledRef.current = true;

    fetch('/api/attribution/backfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectAttribution()),
    }).catch(() => {});
  }, [user, profile]);

  return null;
}
