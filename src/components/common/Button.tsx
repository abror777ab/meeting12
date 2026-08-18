'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'control' | 'controlActive' | 'controlDanger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-95';

    const variants = {
      primary:
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400/20',
      secondary:
        'bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/10 backdrop-blur-md',
      danger:
        'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 border border-red-500/30',
      ghost:
        'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white',
      control:
        'bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 hover:text-white border border-gray-700/50 backdrop-blur-lg shadow-md rounded-2xl',
      controlActive:
        'bg-white text-gray-900 hover:bg-gray-100 border border-white shadow-lg rounded-2xl font-semibold',
      controlDanger:
        'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 border border-red-400/30 rounded-2xl',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2.5 font-semibold',
      icon: 'p-3 w-12 h-12 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
