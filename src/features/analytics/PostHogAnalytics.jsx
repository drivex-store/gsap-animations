'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

const POSTHOG_KEY = 'phc_Yecr0Uo2VzDFAMckw6XdMeHxMC8JorR3xFeMYmtBm3v';
const POSTHOG_HOST = '/relay-A8q3';
const POSTHOG_UI_HOST = 'https://eu.posthog.com';
const SENSITIVE_PARAMS = [
  'token_hash',
  'token',
  'code',
  'access_token',
  'refresh_token',
];

function scrubSearchParams(searchParams) {
  if (!searchParams || !searchParams.toString()) {
    return '';
  }

  const cleanParams = new URLSearchParams(searchParams.toString());
  for (const param of SENSITIVE_PARAMS) {
    cleanParams.delete(param);
  }

  return cleanParams.toString();
}

function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      !pathname ||
      !window.posthog ||
      typeof window.posthog.capture !== 'function'
    ) {
      return;
    }

    const cleanSearch = scrubSearchParams(searchParams);
    let currentUrl = window.origin + pathname;
    if (cleanSearch) {
      currentUrl = `${currentUrl}?${cleanSearch}`;
    }

    window.posthog.capture('$pageview', {$current_url: currentUrl,
      $pathname: pathname,$search_params: cleanSearch,
    });
  }, [pathname, searchParams]);

  return null;
}

function PostHogConsentListener() {
  useEffect(() => {
    const handleConsentChange = () => {
      const posthog = window.posthog;
      if (!posthog || typeof posthog.set_config !== 'function') {
        return;
      }

      let isAnalyticsAllowed = false;
      try {
        const match = document.cookie.match(/(?:^|; )annnimate_consent=([^;]+)/);
        if (match) {
          const parsedConsent = JSON.parse(atob(decodeURIComponent(match[1])));
          isAnalyticsAllowed = parsedConsent && parsedConsent.analytics === true;
        }
      } catch {
        isAnalyticsAllowed = false;
      }

      if (isAnalyticsAllowed) {
        posthog.set_config({
          persistence: 'localStorage+cookie',
          autocapture: true,
          disable_session_recording: false,
        });
        if (typeof posthog.startSessionRecording === 'function') {
          posthog.startSessionRecording();
        }
      } else {
        if (typeof posthog.stopSessionRecording === 'function') {
          posthog.stopSessionRecording();
        }
        posthog.set_config({
          persistence: 'memory',
          autocapture: false,
          disable_session_recording: true,
        });
        document.cookie.split('; ').forEach((cookieStr) => {
          const cookieName = cookieStr.split('=')[0];
          if (cookieName.startsWith('ph_')) {
            document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });
      }
    };

    window.addEventListener('annnimate:consent-changed', handleConsentChange);
    return () => {
      window.removeEventListener(
        'annnimate:consent-changed',
        handleConsentChange,
      );
    };
  }, []);

  return null;
}

export default function PostHogAnalytics() {
  if (!POSTHOG_KEY || POSTHOG_KEY.includes('YOUR_PROJECT_API_KEY')) {
    return null;
  }

  return (
    <>
      <Script
        id="posthog-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags startSessionRecording stopSessionRecording captureException".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

            // Pick the init config based on the user's current consent cookie.
            // No cookie or analytics:false -> cookieless minimal mode. ePrivacy
            // 5(3) isn't triggered because nothing is stored on the device.
            (function () {
              var allowed = false;
              try {
                var match = document.cookie.match(/(?:^|; )annnimate_consent=([^;]+)/);
                if (match) {
                  var data = JSON.parse(atob(decodeURIComponent(match[1])));
                  allowed = data && data.analytics === true;
                }
              } catch (_) { allowed = false; }
              var SENSITIVE_RE = /([?&])(token_hash|token|code|access_token|refresh_token)=[^&#]*/g;
              var sanitize = function (props) {
                for (var k in props) {
                  if (typeof props[k] === 'string' && props[k].indexOf('=') !== -1) {
                    props[k] = props[k].replace(SENSITIVE_RE, '$1$2=REDACTED');
                  }
                }
                return props;
              };
              var cookieless = {
                api_host: '${POSTHOG_HOST}',
                ui_host: '${POSTHOG_UI_HOST}',
                sanitize_properties: sanitize,
                persistence: 'memory',
                person_profiles: 'identified_only',
                capture_pageview: false,
                capture_pageleave: false,
                autocapture: false,
                capture_dead_clicks: false,
                capture_heatmaps: false,
                disable_scroll_properties: true,
                disable_surveys: true,
                disable_session_recording: true,
                disable_web_experiments: true
              };

              var full = {
                api_host: '${POSTHOG_HOST}',
                ui_host: '${POSTHOG_UI_HOST}',
                sanitize_properties: sanitize,
                persistence: 'localStorage+cookie',
                person_profiles: 'identified_only',
                capture_pageview: false,
                capture_pageleave: true,
                autocapture: true,
                capture_dead_clicks: false,
                capture_heatmaps: false,
                disable_scroll_properties: true,
                disable_surveys: true,
                disable_session_recording: false,
                disable_web_experiments: true,
                session_recording: { maskAllInputs: true, maskTextContent: false }
              };

              posthog.init('${POSTHOG_KEY}', allowed ? full : cookieless);
            })();
          `,
        }}
      />
      <PostHogConsentListener />
      <Suspense fallback={null}>
        <PostHogPageviewTracker />
      </Suspense>
    </>
  );
}
