'use client';

import { cn } from '@/lib/utils';
import type { ComponentProps, HTMLAttributes } from 'react';
import { memo } from 'react';

export type ResponseProps = HTMLAttributes<HTMLDivElement> & {
  children: string | React.ReactNode;
};

export const Response = memo(
  ({
    className,
    children,
    ...props
  }: ResponseProps) => {
    return (
      <div
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose prose-sm dark:prose-invert max-w-none',
          className
        )}
        {...props}
      >
        {typeof children === 'string' ? (
          <div className="whitespace-pre-wrap break-words">{children}</div>
        ) : (
          children
        )}
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';

