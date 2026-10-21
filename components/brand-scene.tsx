'use client';

import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';

const VectorCore3D = dynamic(() => import('./vector-core-3d').then((module) => module.VectorCore3D), {
  ssr: false,
  loading: () => <div className="h-[360px] rounded-[32px] bg-[#101714]" />,
});

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia('(min-width: 1024px)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

export function BrandScene() {
  // Do not mount a WebGL renderer behind a hidden mobile layout.
  const desktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia('(min-width: 1024px)').matches, () => false);
  return desktop ? <VectorCore3D /> : null;
}
