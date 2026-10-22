// Variable Mapping:
// t (module scope) -> CONSENT_COOKIE_NAME
// r (function) -> setConsent
// e (setConsent param) -> consentData
// r (setConsent block) -> base64Data
// n (setConsent block) -> expires
// o (setConsent block) -> cookieString
// n (function) -> dispatchConsentChanged
// e (getConsent block) -> cookieMatch
// t (getConsent block) -> cookieValue
// r (getConsent block) -> decodedString
// n (getConsent block) -> parsedData

// NOTE: module id: 160725

const CONSENT_COOKIE_NAME = 'annnimate_consent';

export const defaultConsent = {
  version: 1,
  timestamp: null,
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
  method: null,
};

export function setConsent(consentData) {
  if (typeof document === 'undefined') return;

  const base64Data = btoa(
    JSON.stringify({
      ...consentData,
      version: 1,
      timestamp: new Date().toISOString(),
      essential: true,
    }),
  );

  const expires = new Date();
  expires.setDate(expires.getDate() + 365);

  let cookieString = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(base64Data)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

  if (window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

export function dispatchConsentChanged() {
  window.dispatchEvent(new CustomEvent('annnimate:consent-changed'));
}

export function acceptAll() {
  setConsent({
    essential: true,
    analytics: true,
    functional: true,
    marketing: false,
    method: 'explicit',
  });
  dispatchConsentChanged();
}

export function getConsent() {
  if (typeof document === 'undefined') return null;

  const cookieMatch = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!cookieMatch) return null;

  try {
    const cookieValue = cookieMatch.split('=')[1];
    const decodedString = atob(decodeURIComponent(cookieValue));
    const parsedData = JSON.parse(decodedString);

    if (parsedData.version !== 1) {
      return null;
    }

    return parsedData;
  } catch {
    return null;
  }
}
