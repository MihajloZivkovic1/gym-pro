'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export function OrientationLock() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isTablet = window.innerWidth <= 1024;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isTablet && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 bg-emerald-600 flex items-center justify-center z-50">
      <div className="text-center text-white p-8">
        <RotateCcw className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Okrenite uređaj</h2>
        <p className="text-emerald-100">
          Ova aplikacija je optimizovana za landscape mode
        </p>
      </div>
    </div>
  );
}