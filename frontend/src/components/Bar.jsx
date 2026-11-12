import React from 'react';
import { cn } from '@/lib/utils';

// A horizontal progress bar. `danger` colours it as a warning.
export default function Bar({ value, danger, className }) {
  const width = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div className={cn('h-full rounded-full', danger ? 'bg-destructive' : 'bg-primary')} style={{ width: `${width}%` }} />
    </div>
  );
}
