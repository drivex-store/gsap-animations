'use client';

// Variable Mapping: L -> StudioClock, e -> time / formatter, i -> setTime, t -> updateClock, r -> intervalId

import { useState, useEffect } from 'react'; // NOTE: module id: 271645
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

// NOTE: module id: 297428
export default function StudioClock() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Vienna',
    });

    const updateClock = () => setTime(formatter.format(new Date()));
    updateClock();

    const intervalId = setInterval(updateClock, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return <span className="text-mono-sm text-foreground-muted">{time ? t('common.footer.studioClock', { time }) : ''}</span>;
}
