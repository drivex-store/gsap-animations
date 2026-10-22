'use client';

import { useEffect, useState } from 'react';

import { getConsent } from '@/libs/configs/acceptAll';

import CrispChat from '@/features/analytics/CrispChat'; // module id: 837558
import GlobalErrorTracker from '@/features/analytics/GlobalErrorTracker'; // module id: 837558
import PostHogAnalytics from '@/features/analytics/PostHogAnalytics'; // module id: 837558

export function ConsentAwareAnalytics() {
  const [consent, setConsent] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setConsent(getConsent());

    const handleConsentChange = () => setConsent(getConsent());
    window.addEventListener('annnimate:consent-changed', handleConsentChange);

    return () => {
      window.removeEventListener('annnimate:consent-changed', handleConsentChange);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <PostHogAnalytics />
      <GlobalErrorTracker />
      {consent?.functional && <CrispChat />}
    </>
  );
}

export default ConsentAwareAnalytics;
