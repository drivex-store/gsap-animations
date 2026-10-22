'use client';

import { useEffect } from 'react';

import { analytics } from '@/libs/auth/analytics';

const MAX_ERRORS_PER_SESSION = 25;

export default function GlobalErrorTracker() {
  useEffect(() => {
    let errorCount = 0;
    const seenSignatures = new Set();

    const reportError = (source, errorObj, metadata) => {
      const message = errorObj?.message || String(errorObj ?? '');
      if (!message || errorCount >= MAX_ERRORS_PER_SESSION) {
        return;
      }

      const signature = `${source}|${message.slice(0, 200)}`;
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        errorCount += 1;
        try {
          analytics.error.exception(
            errorObj instanceof Error ? errorObj : new Error(message),
            {
              source,
              ...metadata,
            },
          );
        } catch {}
      }
    };

    const handleWindowError = (event) => {
      reportError(
        'uncaught_error',
        event?.error || new Error(event?.message || ''),
        {
          file: event?.filename,
          line: event?.lineno,
          path: window.location?.pathname,
        },
      );
    };

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      reportError(
        'unhandled_rejection',
        reason instanceof Error ? reason : new Error(String(reason ?? '')),
        {
          path: window.location?.pathname,
        },
      );
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}
