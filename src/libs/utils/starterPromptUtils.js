'use client';

// NOTE: module id: 927627
// Variable Mapping: o -> STARTER_PROMPT_KEY, c -> suppressStarterPrompt, e (inside readSubscriberId) -> urlTouch, u (inside readSubscriberId) -> cookieValue

import { buildKitTouch, parseFirstTouch, KIT_TOUCH_COOKIE } from '@/libs/utils/kitTouch'; // NOTE: module id: 660219

export const STARTER_PROMPT_KEY = 'anm_starter_prompt_dismissed_v1';

export function suppressStarterPrompt() {
  try {
    window.localStorage.setItem(STARTER_PROMPT_KEY, String(Date.now()));
  } catch (err) {
    // Ignore error
  }
}

export function readSubscriberId() {
  if (typeof document === 'undefined') return null;

  const urlTouch = buildKitTouch({
    getParam: (param) => new URLSearchParams(window.location.search).get(param),
  });

  if (urlTouch?.id) {
    return urlTouch.id;
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${KIT_TOUCH_COOKIE}=`))
    ?.slice(KIT_TOUCH_COOKIE.length + 1);

  return parseFirstTouch(cookieValue)?.id || null;
}
