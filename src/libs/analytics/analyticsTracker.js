'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/libs/auth/analytics';

const DEPTH_THRESHOLDS = [25, 50, 75, 100];

export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const pageName = (pathname && pathname !== '/' && pathname.split('/')[1]) || 'home';
    const startTime = Date.now();
    const reportedDepths = new Set();
    
    let maxDepth = 0;
    let hasReportedTime = false;
    let rafId = 0;
    
    const docEl = document.documentElement;
    let maxScrollableHeight = docEl.scrollHeight - window.innerHeight;
    const resizeObserver = new ResizeObserver(() => {
      maxScrollableHeight = docEl.scrollHeight - window.innerHeight;
    });
    resizeObserver.observe(docEl);

    let currentScrollY = window.scrollY;
    const checkScroll = () => {
      rafId = 0;
      const percentage = maxScrollableHeight > 0 
        ? Math.min(100, Math.round((currentScrollY / maxScrollableHeight) * 100)) 
        : 100;
        
      if (percentage > maxDepth) {
        maxDepth = percentage;
      }
      for (const threshold of DEPTH_THRESHOLDS) {
        if (percentage >= threshold && !reportedDepths.has(threshold)) {
          reportedDepths.add(threshold);
          analytics.track('marketing_scroll_depth', {
            page: pageName,
            depth: threshold
          });
        }
      }
    };
    const onScroll = () => {
      currentScrollY = window.scrollY;
      if (!rafId) {
        rafId = requestAnimationFrame(checkScroll);
      }
    };
    const reportTimeOnPage = () => {
      if (hasReportedTime) return;
      
      const secondsOnPage = Math.round((Date.now() - startTime) / 1000);
      if (secondsOnPage < 1) return;
      
      hasReportedTime = true;
      analytics.track(
        'marketing_time_on_page',
        { page: pageName, seconds: secondsOnPage, max_scroll_depth: maxDepth },
        { transport: 'sendBeacon' }
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportTimeOnPage();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', reportTimeOnPage);
    
    checkScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', reportTimeOnPage);
      
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
      
      reportTimeOnPage();
    };
  }, [pathname]);

  return null;
}
