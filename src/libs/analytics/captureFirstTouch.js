
import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE_S,
  KIT_TOUCH_COOKIE,
  serializeFirstTouch,
  parseFirstTouch,
  buildKitTouch
} from '@/libs/utils/kitTouch'

const FIRST_TOUCH_SESSION_KEY = 'anm_ft'

function getCurrentAttribution() {
  const params = new URLSearchParams(window.location.search)

  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
    referrer: document.referrer || null,
    landing_path: window.location.pathname || null
  }
}

function getCookie(name) {
  const prefix = `${name}=`
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(prefix))

  return cookie ? cookie.slice(prefix.length) : null
}

function setCookie(name, value) {
  document.cookie = `${name}=${value}; Max-Age=${FIRST_TOUCH_MAX_AGE_S}; Path=/; SameSite=Lax`
}

export function captureFirstTouch() {
  const attribution = {
    ...getCurrentAttribution(),
    at: new Date().toISOString()
  }

  try {
    if (!sessionStorage.getItem(FIRST_TOUCH_SESSION_KEY)) {
      sessionStorage.setItem(
        FIRST_TOUCH_SESSION_KEY,
        JSON.stringify(attribution)
      )
    }
  } catch {}

  try {
    if (!getCookie(FIRST_TOUCH_COOKIE)) {
      const serialized = serializeFirstTouch(attribution)

      if (serialized) {
        setCookie(FIRST_TOUCH_COOKIE, serialized)
      }
    }
  } catch {}

  try {
    const kitTouch = buildKitTouch({
      getParam: (name) =>
        new URLSearchParams(window.location.search).get(name),
      at: attribution.at
    })

    if (!kitTouch) return

    const existing = parseFirstTouch(getCookie(KIT_TOUCH_COOKIE))

    const isSameCampaign =
      existing &&
      existing.id === kitTouch.id &&
      (existing.campaign || null) === (kitTouch.campaign || null)

    if (!isSameCampaign) {
      const serialized = serializeFirstTouch(kitTouch)

      if (serialized) {
        setCookie(KIT_TOUCH_COOKIE, serialized)
      }
    }
  } catch {}
}

export function collectAttribution() {
  try {
    const stored = sessionStorage.getItem(FIRST_TOUCH_SESSION_KEY)

    if (stored) {
      return JSON.parse(stored)
    }
  } catch {}

  return getCurrentAttribution()
}
