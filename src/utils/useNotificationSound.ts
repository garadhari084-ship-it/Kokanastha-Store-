import { useEffect, useRef } from 'react';

export function useNotificationSound(shouldPlay: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (shouldPlay) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playBeep = () => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
        }
        
        try {
          const oscillator = audioCtxRef.current.createOscillator();
          const gainNode = audioCtxRef.current.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtxRef.current.currentTime + 0.1);

          gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioCtxRef.current.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.5);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtxRef.current.destination);

          oscillator.start(audioCtxRef.current.currentTime);
          oscillator.stop(audioCtxRef.current.currentTime + 0.5);
        } catch (e) {
          console.error("Error playing notification sound:", e);
        }
      };

      // Play initially
      playBeep();
      
      // Then play every 3 seconds to be annoying enough so they read it
      intervalRef.current = setInterval(playBeep, 3000);
      
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shouldPlay]);
}
