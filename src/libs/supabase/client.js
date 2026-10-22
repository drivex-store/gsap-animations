'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          if (typeof document === 'undefined') return null;
          let match = document.cookie.split("; ").find(row => row.startsWith(`${name}=`));
          return match ? decodeURIComponent(match.split("=")[1]) : null;
        },
        set(name, value, options) {
          if (typeof document === 'undefined') return;
          let cookieStr = `${name}=${encodeURIComponent(value)}`;
          
          if (options?.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
          else if (options?.expires) cookieStr += `; Expires=${options.expires.toUTCString()}`;
          
          if (options?.path) cookieStr += `; Path=${options.path}`;
          else cookieStr += "; Path=/";
          
          if (options?.domain) cookieStr += `; Domain=${options.domain}`;
          if (options?.secure) cookieStr += "; Secure";
          
          if (options?.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
          else cookieStr += "; SameSite=Lax";
          
          document.cookie = cookieStr;
        },
        remove(name, options) {
          if (typeof document === 'undefined') return;
          let cookieStr = `${name}=; Max-Age=-1`;
          
          if (options?.path) cookieStr += `; Path=${options.path}`;
          else cookieStr += "; Path=/";
          
          if (options?.domain) cookieStr += `; Domain=${options.domain}`;
          
          document.cookie = cookieStr;
        }
      }
    }
  );
}
