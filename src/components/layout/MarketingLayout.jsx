import { Suspense } from 'react';
import LenisProvider from '@/providers/LenisProvider'; // module id: 776017
import { PppStrip } from '@/features/pricing/PppLabel'; // module id: 245647
import Header from '@/components/layout/Header'; // module id: 76624
import Footer from '@/components/layout/Footer'; // module id: 297428

export default function MarketingLayout({
  children,
  animationCount,
  latestAnimation,
}) {
  return (
    <LenisProvider>
      <div className="v2-marketing flex flex-col min-h-screen">
        <PppStrip />

        <Suspense fallback={null}>
          <Header latestAnimation={latestAnimation} />
        </Suspense>

        <main
          className="flex-1 relative z-[2] bg-background"
          data-transition-content
        >
          {children}
        </main>

        <Footer
          animationCount={animationCount}
          latestAnimation={latestAnimation}
        />
      </div>
    </LenisProvider>
  );
}
