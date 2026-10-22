'use client';

import { Suspense, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { usePageEnterAnimation } from '@/providers/AnimationProvider'; // module id: 488463

const SUBSCRIPTION_MESSAGES = {
  newsletter: {
    title: "You're in. Welcome to the Annnimate newsletter.",
    description: "Expect one short email when there's something worth saying.",
  },
  kits: {
    title: "You're on the list.",
    description: "We'll let you know the moment the next Kit ships.",
  },
};

function SubscriptionToastInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const subscribedType = searchParams?.get('subscribed') || null;
  const hasShownToastRef = useRef(false);

  usePageEnterAnimation(
    () => {
      if (!subscribedType || hasShownToastRef.current) {
        return;
      }

      const messageConfig = SUBSCRIPTION_MESSAGES[subscribedType];
      if (!messageConfig) {
        return;
      }

      hasShownToastRef.current = true;
      toast.success(messageConfig.title, {
        description: messageConfig.description,
        duration: 8000,
      });

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('subscribed');
      const queryString = nextParams.toString();

      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    },
    [subscribedType, pathname],
    'subscription-confirmed-toast',
    !!subscribedType,
  );

  return null;
}

export default function SubscriptionToast() {
  return (
    <Suspense fallback={null}>
      <SubscriptionToastInner />
    </Suspense>
  );
}
