import { useEffect, useRef, useState } from 'react';

export function useNotificationSound(shouldPlay: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    const initAudio = () => {
      if (!interacted) {
        setInteracted(true);
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
          }
        } catch (e) {
          console.error("Audio init error:", e);
        }
      }
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [interacted]);

  useEffect(() => {
    if (shouldPlay && interacted) {
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {}
      }

      const playBeep = () => {
        if (!audioCtxRef.current) return;
        
        // Try to resume if it's suspended
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
      
      // Then play every 3 seconds
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
  }, [shouldPlay, interacted]);
}
