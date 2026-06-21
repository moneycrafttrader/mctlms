'use client';

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[90rem]',
  full: 'max-w-full',
};

export function PageContainer({ children, className, maxWidth = 'lg' }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 md:px-6 py-4 md:py-8', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}
