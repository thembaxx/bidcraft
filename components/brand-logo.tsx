'use client';

import React from 'react';
import { motion } from 'motion/react';

interface BrandLogoMarkProps {
  size?: number;
  interactive?: boolean;
}

export function BrandLogoMark({ size = 36, interactive = true }: BrandLogoMarkProps) {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.06, rotate: 4 } : undefined}
      whileTap={interactive ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      style={{ width: size, height: size }}
      className="relative inline-flex items-center justify-center rounded-[26%] bg-[#0D0F0E] shadow-sm border border-[#309F92]/40 overflow-hidden shrink-0 select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="brandCoreGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#309F92" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#162220" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0D0F0E" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="brandGoldFacet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EDFF8C" />
            <stop offset="50%" stopColor="#309F92" />
            <stop offset="100%" stopColor="#1C6960" />
          </linearGradient>
        </defs>

        <rect width="512" height="512" rx="118" fill="url(#brandCoreGlow)" />

        {/* Concentric Precision Target Ring */}
        <circle
          cx="256"
          cy="256"
          r="182"
          fill="none"
          stroke="#309F92"
          strokeWidth="6"
          strokeDasharray="14 10"
          opacity="0.7"
        />

        {/* Faceted Geodesic Polyhedron Crest (Inspired by IMG_5047_c312454a.jpeg) */}
        <polygon
          points="256,76 392,154 392,358 256,436 120,358 120,154"
          fill="#101715"
          stroke="url(#brandGoldFacet)"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <polygon
          points="256,76 392,154 256,256"
          fill="#309F92"
          fillOpacity="0.35"
          stroke="#EDFF8C"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <polygon
          points="120,154 256,76 256,256"
          fill="#EDFF8C"
          fillOpacity="0.28"
          stroke="#EDFF8C"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <polygon
          points="392,154 392,358 256,256"
          fill="#309F92"
          fillOpacity="0.18"
          stroke="#309F92"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* 3x3 Vector Core Matrix */}
        <circle cx="198" cy="198" r="16" fill="#FFFFFF" />
        <circle cx="256" cy="198" r="16" fill="#FFFFFF" />
        <circle cx="314" cy="198" r="19" fill="#EDFF8C" />
        <circle cx="198" cy="256" r="16" fill="#FFFFFF" />
        <circle cx="256" cy="256" r="26" fill="#EDFF8C" stroke="#0D0F0E" strokeWidth="6" />
        <circle cx="314" cy="256" r="16" fill="#FFFFFF" />
        <circle cx="198" cy="314" r="16" fill="#FFFFFF" />
        <circle cx="256" cy="314" r="16" fill="#FFFFFF" />
        <circle cx="314" cy="314" r="16" fill="#309F92" />
      </svg>
    </motion.div>
  );
}
