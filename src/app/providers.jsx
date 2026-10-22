import { AnimationProvider } from '@/providers/AnimationProvider';
import { CategoryProvider } from '@/providers/CategoryProvider';
import { CookieConsentProvider } from '@/providers/CookieConsentProvider';
import { ListSizeProvider } from '@/providers/ListSizeProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ScrollLockProvider } from '@/providers/ScrollLockProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { UserProvider } from '@/providers/UserProvider';
import AppProviders from '@/providers/AppProviders';
import PageReady from '@/providers/contexts/PageReady';
import CookieBanner from '@/features/cookie/CookieBanner';
import { ConsentAwareAnalytics } from '@/features/analytics/ConsentAwareAnalytics';

/**
 * Context providers WRAP children (they render {children}).
 * ConsentAwareAnalytics / CookieConsentProvider / CookieBanner / PageReady
 * are standalone components that take NO children — they must be SIBLINGS,
 * otherwise the whole page content is swallowed.
 */
export default function Provider({ children, categories = [] }) {
  return (
    <AnimationProvider>
      <CategoryProvider value={categories}>
        <ListSizeProvider>
          <NotificationProvider>
            <ScrollLockProvider>
              <ThemeProvider>
                <UserProvider>
                  <AppProviders>
                    {children}

                    {/* standalone siblings */}
                    <PageReady />
                    <ConsentAwareAnalytics />
                    <CookieConsentProvider />
                    <CookieBanner />
                  </AppProviders>
                </UserProvider>
              </ThemeProvider>
            </ScrollLockProvider>
          </NotificationProvider>
        </ListSizeProvider>
      </CategoryProvider>
    </AnimationProvider>
  );
}
