'use client';

import dynamic from 'next/dynamic';
const VectorCore3D = dynamic(() => import('./vector-core-3d').then((module) => module.VectorCore3D), {
  ssr: false,
  loading: () => <div className="h-[360px] rounded-[32px] bg-[#101714]" />,
});

export function BrandScene() {
  return <VectorCore3D />;
}
