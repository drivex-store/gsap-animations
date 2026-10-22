'use client';

import { useEffect, useState } from 'react';

import { CookiePreferencesModal } from '@/features/cookie/CookiePreferencesModal'; // module id: 42223

export function CookieConsentProvider() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenPreferences = () => setIsOpen(true);

    window.addEventListener('annnimate:open-cookie-preferences', handleOpenPreferences);

    return () => {
      window.removeEventListener('annnimate:open-cookie-preferences', handleOpenPreferences);
    };
  }, []);

  return <CookiePreferencesModal open={isOpen} onOpenChange={setIsOpen} />;
}

export default CookieConsentProvider;
