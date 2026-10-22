'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import config from '@/libs/configs/siteConfig';
import { createClient } from '@/libs/supabase/client';

export default function CrispChat() {
  const pathname = usePathname();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    })();
  }, []);

  useEffect(() => {
    if (userId && window.$crisp) {
      window.$crisp.push(['set', 'session:data', [[['userId', userId]]]]);
    }
  }, [userId]);

  useEffect(() => {
    if (!config?.crisp?.id) {
      return;
    }

    const timerId = setTimeout(() => {
      if (
        window.$crisp &&
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes.includes(pathname)
      ) {
        window.$crisp.push(['do', 'chat:hide']);
      }
    }, 2000);

    return () => clearTimeout(timerId);
  }, [pathname]);

  if (!config?.crisp?.id) {
    return null;
  }

  return (
    <>
      <Script
        id="crisp-stub"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp=[];window.CRISP_WEBSITE_ID="${config.crisp.id}";
          `,
        }}
      />
      <Script
        id="crisp-loader"
        strategy="afterInteractive"
        type="text/partytown"
        src="https://client.crisp.chat/l.js"
        async={true}
      />
    </>
  );
}
