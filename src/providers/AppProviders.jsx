'use client';

import { Suspense } from 'react';
import { Tooltip } from 'react-tooltip';
import { IconContext } from '@phosphor-icons/react'; // NOTE: module id: 207867
import AppToaster from '@/components/ui/AppToaster';
import { AttributionTracker } from '@/libs/analytics/AttributionTracker';
import { GridOverlay } from '@/components/layout/utils/GridOverlay';
import SubscriptionToast from '@/features/marketing/SubscriptionToast';

const iconContextValue = {
  weight: 'fill',
};

export default function AppProviders({ children }) {
  return (
    <IconContext.Provider value={iconContextValue}>
      {children}
      <AttributionTracker />
      <GridOverlay />
      <AppToaster />
      <Suspense fallback={null}>
        <SubscriptionToast />
      </Suspense>
      <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm shadow-lg" />
    </IconContext.Provider>
  );
}