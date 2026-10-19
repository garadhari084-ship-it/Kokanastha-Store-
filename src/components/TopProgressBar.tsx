import React, { useState, useEffect } from 'react';

export const TopProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let hideTimer: any;
    let incrementTimer: any;

    const startProgress = () => {
      clearTimeout(hideTimer);
      clearInterval(incrementTimer);
      setIsLoading(true);
      setProgress(15);

      incrementTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) {
            clearInterval(incrementTimer);
            return 92;
          }
          const step = Math.random() * 12 + 8;
          return Math.min(92, prev + step);
        });
      }, 150);
    };

    const stopProgress = () => {
      clearInterval(incrementTimer);
      setProgress(100);
      hideTimer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 350);
    };

    const handleStart = () => startProgress();
    const handleStop = () => stopProgress();

    window.addEventListener('app:start-progress', handleStart);
    window.addEventListener('app:stop-progress', handleStop);

    // Auto-intercept any button click across the entire application
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const button = target.closest('button, [role="button"], input[type="submit"], input[type="button"], a');
      if (button && !button.hasAttribute('data-no-progress')) {
        startProgress();
        setTimeout(() => {
          stopProgress();
        }, 450);
      }
    };

    window.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('app:start-progress', handleStart);
      window.removeEventListener('app:stop-progress', handleStop);
      window.removeEventListener('click', handleGlobalClick, true);
      clearTimeout(hideTimer);
      clearInterval(incrementTimer);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-1 bg-transparent pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.9)] transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: 'width, opacity'
        }}
      />
    </div>
  );
};

export const triggerTopProgress = () => {
  window.dispatchEvent(new CustomEvent('app:start-progress'));
};

export const stopTopProgress = () => {
  window.dispatchEvent(new CustomEvent('app:stop-progress'));
};
