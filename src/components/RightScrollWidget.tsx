import React, { useState, useEffect, useRef, useCallback } from 'react';

interface RightScrollWidgetProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const RightScrollWidget: React.FC<RightScrollWidgetProps> = ({ 
  containerRef,
  className = ''
}) => {
  const [thumbMetrics, setThumbMetrics] = useState({
    thumbTop: 0,
    thumbHeight: 40,
    canScroll: false,
    scrollProgress: 0,
  });

  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const scrollHoldIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to find the active scrollable container
  const getScrollContainer = useCallback((): HTMLElement | Window => {
    if (containerRef?.current) {
      return containerRef.current;
    }
    const mainEl = document.querySelector('main');
    if (mainEl && (mainEl.scrollHeight > mainEl.clientHeight || mainEl.classList.contains('overflow-y-auto'))) {
      return mainEl;
    }
    return window;
  }, [containerRef]);

  // Update scroll metrics
  const updateMetrics = useCallback(() => {
    const container = getScrollContainer();
    let scrollTop = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    if (container === window) {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      const el = container as HTMLElement;
      scrollTop = el.scrollTop;
      scrollHeight = el.scrollHeight;
      clientHeight = el.clientHeight;
    }

    const trackHeight = trackRef.current ? trackRef.current.clientHeight : (clientHeight - 36);
    const maxScroll = scrollHeight - clientHeight;
    const canScroll = maxScroll > 10 && trackHeight > 40;

    if (!canScroll || trackHeight <= 0) {
      setThumbMetrics({
        thumbTop: 0,
        thumbHeight: trackHeight > 0 ? trackHeight : 30,
        canScroll: false,
        scrollProgress: 0,
      });
      return;
    }

    // Proportional thumb height (minimum 28px)
    const rawThumbHeight = Math.max(28, Math.min(trackHeight - 8, (clientHeight / scrollHeight) * trackHeight));
    const availableTrack = trackHeight - rawThumbHeight;
    const scrollRatio = Math.max(0, Math.min(1, scrollTop / maxScroll));
    const thumbTop = scrollRatio * availableTrack;

    setThumbMetrics({
      thumbTop,
      thumbHeight: rawThumbHeight,
      canScroll: true,
      scrollProgress: Math.round(scrollRatio * 100),
    });
  }, [getScrollContainer]);

  useEffect(() => {
    const container = getScrollContainer();
    const handleScroll = () => {
      if (!isDraggingRef.current) {
        updateMetrics();
      }
    };

    if (container === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      (container as HTMLElement).addEventListener('scroll', handleScroll, { passive: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });

    if (container !== window) {
      resizeObserver.observe(container as HTMLElement);
    } else if (document.body) {
      resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', updateMetrics);

    updateMetrics();
    const interval = setInterval(updateMetrics, 800);

    return () => {
      if (container === window) {
        window.removeEventListener('scroll', handleScroll);
      } else {
        (container as HTMLElement).removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', updateMetrics);
      resizeObserver.disconnect();
      clearInterval(interval);
      if (scrollHoldIntervalRef.current) {
        clearInterval(scrollHoldIntervalRef.current);
      }
    };
  }, [getScrollContainer, updateMetrics]);

  // Scroll actions
  const doScroll = (delta: number) => {
    const container = getScrollContainer();
    if (container === window) {
      window.scrollBy({ top: delta, behavior: 'smooth' });
    } else {
      (container as HTMLElement).scrollBy({ top: delta, behavior: 'smooth' });
    }
  };

  const handleArrowScroll = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -180 : 180;
    doScroll(delta);
  };

  const startContinuousScroll = (direction: 'up' | 'down') => {
    handleArrowScroll(direction);
    if (scrollHoldIntervalRef.current) clearInterval(scrollHoldIntervalRef.current);
    scrollHoldIntervalRef.current = setInterval(() => {
      const delta = direction === 'up' ? -90 : 90;
      const container = getScrollContainer();
      if (container === window) {
        window.scrollBy({ top: delta });
      } else {
        (container as HTMLElement).scrollBy({ top: delta });
      }
    }, 50);
  };

  const stopContinuousScroll = () => {
    if (scrollHoldIntervalRef.current) {
      clearInterval(scrollHoldIntervalRef.current);
      scrollHoldIntervalRef.current = null;
    }
  };

  // Track click handler
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !thumbMetrics.canScroll) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const availableTrack = rect.height - thumbMetrics.thumbHeight;
    if (availableTrack <= 0) return;

    const targetThumbTop = clickY - thumbMetrics.thumbHeight / 2;
    const ratio = Math.max(0, Math.min(1, targetThumbTop / availableTrack));

    const container = getScrollContainer();
    if (container === window) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: maxScroll * ratio, behavior: 'smooth' });
    } else {
      const el = container as HTMLElement;
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: maxScroll * ratio, behavior: 'smooth' });
    }
  };

  // Drag thumb
  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;

    const container = getScrollContainer();
    if (container === window) {
      startScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
    } else {
      startScrollTopRef.current = (container as HTMLElement).scrollTop;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !trackRef.current) return;
      const deltaY = moveEvent.clientY - startYRef.current;
      const trackHeight = trackRef.current.clientHeight;
      const availableTrack = trackHeight - thumbMetrics.thumbHeight;
      if (availableTrack <= 0) return;

      const containerEl = getScrollContainer();
      let scrollHeight = 0;
      let clientHeight = 0;

      if (containerEl === window) {
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        const el = containerEl as HTMLElement;
        scrollHeight = el.scrollHeight;
        clientHeight = el.clientHeight;
      }

      const maxScroll = scrollHeight - clientHeight;
      const scrollPerPixel = maxScroll / availableTrack;
      const newScrollTop = Math.max(0, Math.min(maxScroll, startScrollTopRef.current + deltaY * scrollPerPixel));

      if (containerEl === window) {
        window.scrollTo({ top: newScrollTop });
      } else {
        (containerEl as HTMLElement).scrollTop = newScrollTop;
      }
      updateMetrics();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      updateMetrics();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <aside 
      id="right-slim-scrollbar"
      className={`fixed right-0 top-0 bottom-0 z-40 w-[11px] sm:w-[13px] bg-[#f1f3f5] dark:bg-[#111827] border-l border-slate-200/90 dark:border-slate-800/90 flex flex-col items-center select-none ${className}`}
      style={{ userSelect: 'none' }}
    >
      {/* Top Scroll Arrow Button (▲) */}
      <button
        id="scrollbar-arrow-up"
        type="button"
        onMouseDown={() => startContinuousScroll('up')}
        onMouseUp={stopContinuousScroll}
        onMouseLeave={stopContinuousScroll}
        onClick={() => handleArrowScroll('up')}
        className="w-full h-[16px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title="Scroll Up"
        aria-label="Scroll Up"
      >
        <svg 
          width="7" 
          height="6" 
          viewBox="0 0 7 6" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3.5 0.5L7 5.5H0L3.5 0.5Z" />
        </svg>
      </button>

      {/* Vertical Scroll Track Area */}
      <div 
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative flex-1 w-full cursor-pointer bg-[#f1f3f5] dark:bg-[#111827] overflow-hidden"
      >
        {/* Rounded Thumb Bar */}
        {thumbMetrics.canScroll && (
          <div
            id="scrollbar-thumb"
            onMouseDown={handleThumbMouseDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              height: `${thumbMetrics.thumbHeight}px`,
              transform: `translateY(${thumbMetrics.thumbTop}px)`,
            }}
            className="absolute left-[1px] right-[1px] bg-[#888888] hover:bg-[#666666] active:bg-[#444444] dark:bg-[#71717a] dark:hover:bg-[#a1a1aa] dark:active:bg-[#e4e4e7] rounded-full cursor-grab active:cursor-grabbing transition-colors duration-150"
          />
        )}
      </div>

      {/* Bottom Scroll Arrow Button (▼) */}
      <button
        id="scrollbar-arrow-down"
        type="button"
        onMouseDown={() => startContinuousScroll('down')}
        onMouseUp={stopContinuousScroll}
        onMouseLeave={stopContinuousScroll}
        onClick={() => handleArrowScroll('down')}
        className="w-full h-[16px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title="Scroll Down"
        aria-label="Scroll Down"
      >
        <svg 
          width="7" 
          height="6" 
          viewBox="0 0 7 6" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3.5 5.5L0 0.5H7L3.5 5.5Z" />
        </svg>
      </button>
    </aside>
  );
};
