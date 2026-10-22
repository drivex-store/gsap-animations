'use client';
import { useEffect } from 'react';
import { useAnimation } from '@/providers/AnimationProvider';

export default function PageReady() {
  const { revealPage } = useAnimation();
  useEffect(() => {
    document.body.setAttribute('data-page-ready', 'true');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealPage();
      });
    });
  }, [revealPage]);
  return null;
}
