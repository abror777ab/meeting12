'use client';

import React from 'react';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  colorClass?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSpeaking?: boolean;
}

export function Avatar({
  name,
  colorClass = 'from-blue-600 to-indigo-700',
  size = 'md',
  isSpeaking = false,
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-medium',
    lg: 'w-16 h-16 text-xl font-bold',
    xl: 'w-24 h-24 text-3xl font-extrabold',
    '2xl': 'w-32 h-32 text-4xl font-extrabold',
  };

  const speakingRing = isSpeaking
    ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-gray-900 animate-pulse'
    : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr ${colorClass} text-white shadow-md select-none transition-all duration-300 ${sizes[size]} ${speakingRing}`}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}
