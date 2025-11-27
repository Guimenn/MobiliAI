'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

// Context for sharing scroll state
type ConversationContextType = {
  isAtBottom: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
};

const ConversationContext = createContext<ConversationContextType | null>(null);

const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('ConversationScrollButton must be used within Conversation');
  }
  return context;
};

export type ConversationProps = ComponentProps<'div'>;

export const Conversation = ({ className, ...props }: ConversationProps) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // pixels from bottom
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkIfAtBottom();
    container.addEventListener('scroll', checkIfAtBottom);
    const resizeObserver = new ResizeObserver(checkIfAtBottom);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkIfAtBottom);
      resizeObserver.disconnect();
    };
  }, [checkIfAtBottom]);

  // Auto-scroll when content changes
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(false);
    }
  }, [props.children, isAtBottom, scrollToBottom]);

  const contextValue: ConversationContextType = {
    isAtBottom,
    scrollToBottom,
    containerRef,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn('relative flex-1 overflow-y-auto', className)}
        role="log"
        {...props}
      />
    </ConversationContext.Provider>
  );
};

export type ConversationContentProps = ComponentProps<'div'>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <div className={cn('p-4', className)} {...props} />
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useConversationContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (isAtBottom) return null;

  return (
    <Button
      className={cn(
        'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
        className
      )}
      onClick={handleScrollToBottom}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      <ArrowDownIcon className="size-4" />
    </Button>
  );
};

