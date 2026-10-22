'use client';

import { useEffect, useState } from 'react';

let cachedGeo;
let inflightPromise = null;

const logDebug = (...args) => {
  try {
    if (/[?&]pppdebug=1/.test(window.location.search)) {
      console.log('[ppp]', ...args);
    }
  } catch {}
};

function fetchPppGeo() {
  if (cachedGeo !== undefined) {
    logDebug('cached answer', cachedGeo);
    return Promise.resolve(cachedGeo);
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  let endpoint = '/api/geo/ppp';

  try {
    const overrideCountry = new URLSearchParams(window.location.search).get(
      'pppcountry',
    );
    if (overrideCountry) {
      endpoint += `?country=${encodeURIComponent(overrideCountry)}`;
    }
  } catch {}

  logDebug('fetching', endpoint);

  inflightPromise = fetch(endpoint, { cache: 'no-store' })
    .then((response) => {
      logDebug(
        'response',
        response.status,
        'x-vercel-cache:',
        response.headers.get('x-vercel-cache'),
        'x-vercel-id:',
        response.headers.get('x-vercel-id'),
      );
      return response.ok ? response.json() : null;
    })
    .then((data) => {
      logDebug('parsed', data);
      cachedGeo =
        data?.tier === 'T2' || data?.tier === 'T3'
          ? { tier: data.tier, country: data.country || null }
          : null;
      logDebug('decided', cachedGeo);
      return cachedGeo;
    })
    .catch((error) => {
      logDebug('fetch failed', error?.message);
      cachedGeo = null;
      return null;
    })
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}

export function usePppGeo() {
  const [geo, setGeo] = useState(cachedGeo === undefined ? null : cachedGeo);

  useEffect(() => {
    let isMounted = true;

    fetchPppGeo().then((result) => {
      logDebug('hook resolved', result, 'mounted:', isMounted);
      if (isMounted && result) {
        setGeo(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return geo;
}

export function usePppTier() {
  return usePppGeo()?.tier ?? null;
}
