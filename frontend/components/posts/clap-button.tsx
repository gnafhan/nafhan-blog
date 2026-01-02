'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { postsApi } from '@/lib/api/posts';
import { cn } from '@/lib/utils';

interface ClapButtonProps {
  postId: string;
  initialClaps: number;
}

interface FloatingClap {
  id: number;
  x: number;
  y: number;
}

export function ClapButton({ postId, initialClaps }: ClapButtonProps) {
  const [claps, setClaps] = useState(initialClaps);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingClaps, setFloatingClaps] = useState<FloatingClap[]>([]);
  const [pendingClaps, setPendingClaps] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clapIdRef = useRef(0);

  // Debounced API call
  useEffect(() => {
    if (pendingClaps > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(async () => {
        // Send all pending claps
        for (let i = 0; i < pendingClaps; i++) {
          try {
            const result = await postsApi.clap(postId);
            setClaps(result.claps);
          } catch (error) {
            console.error('Failed to add clap:', error);
          }
        }
        setPendingClaps(0);
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pendingClaps, postId]);

  const handleClap = useCallback(() => {
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);

    // Add floating clap animation
    const newClapId = clapIdRef.current++;
    const randomX = Math.random() * 40 - 20; // -20 to 20
    const randomY = Math.random() * 20 - 10; // -10 to 10
    
    setFloatingClaps(prev => [...prev, { id: newClapId, x: randomX, y: randomY }]);
    
    // Remove floating clap after animation
    setTimeout(() => {
      setFloatingClaps(prev => prev.filter(c => c.id !== newClapId));
    }, 1000);

    // Optimistic update
    setClaps(prev => prev + 1);
    setPendingClaps(prev => prev + 1);
  }, []);

  const formatClaps = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {/* Floating claps animation */}
        {floatingClaps.map((clap) => (
          <span
            key={clap.id}
            className="absolute pointer-events-none animate-float-up text-2xl"
            style={{
              left: `calc(50% + ${clap.x}px)`,
              top: `calc(50% + ${clap.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            👏
          </span>
        ))}
        
        {/* Clap button */}
        <button
          ref={buttonRef}
          onClick={handleClap}
          className={cn(
            'relative flex items-center justify-center w-12 h-12 rounded-full',
            'border-2 border-gray-200 hover:border-primary/50',
            'bg-white hover:bg-primary/5 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'active:scale-95',
            isAnimating && 'scale-110'
          )}
          aria-label="Clap for this post"
        >
          <span 
            className={cn(
              'text-2xl transition-transform duration-150',
              isAnimating && 'scale-125'
            )}
          >
            👏
          </span>
          
          {/* Ripple effect */}
          {isAnimating && (
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          )}
        </button>
      </div>
      
      {/* Clap count */}
      <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
        {formatClaps(claps)}
      </span>
    </div>
  );
}
