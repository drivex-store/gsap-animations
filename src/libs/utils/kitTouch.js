// Variable Mapping: t -> getParam / rawCookieValue / payload, e -> at / parsedData / encodedValue, a -> sidParam, o -> subscriberId

// NOTE: module id: 660219
export const FIRST_TOUCH_COOKIE = 'anm_ftp';
export const FIRST_TOUCH_MAX_AGE_S = 34560000;
export const KIT_TOUCH_COOKIE = 'anm_kit';

// NOTE: module id: 660219
export function buildKitTouch({ getParam, at = null }) {
  const sidParam = getParam('sid');
  const subscriberId =
    sidParam && /^[0-9a-f]{16}$/.test(sidParam)
      ? sidParam
      : getParam('ck_subscriber_id');

  return subscriberId && /^(\d{1,20}|[0-9a-f]{16})$/.test(subscriberId)
    ? {
        id: subscriberId,
        campaign: getParam('utm_campaign') || null,
        at: at || null,
      }
    : null;
}

// NOTE: module id: 660219
export function parseFirstTouch(rawCookieValue) {
  if (!rawCookieValue || typeof rawCookieValue !== 'string') {
    return null;
  }

  try {
    const parsedData = JSON.parse(decodeURIComponent(rawCookieValue));
    if (
      !parsedData ||
      typeof parsedData !== 'object' ||
      Array.isArray(parsedData)
    ) {
      return null;
    }
    return parsedData;
  } catch {
    return null;
  }
}

// NOTE: module id: 660219
export function serializeFirstTouch(payload) {
  try {
    const encodedValue = encodeURIComponent(JSON.stringify(payload));
    return encodedValue.length <= 800 ? encodedValue : null;
  } catch {
    return null;
  }
}
