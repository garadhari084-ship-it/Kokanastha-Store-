import { useEffect, useRef } from 'react';

export function useNotificationSound(shouldPlay: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // First Chime Tone (high pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // E6

      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second Chime Tone (Harmonic Echo)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.15); // C6
      osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.28); // G6

      gain2.gain.setValueAtTime(0.01, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.19);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.error("Error playing notification sound:", e);
    }
  };

  useEffect(() => {
    if (!shouldPlay) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Try playing immediately
    playBeep();

    // Repeat every 2.5 seconds while notification popup is active
    intervalRef.current = setInterval(() => {
      playBeep();
    }, 2500);

    // Global listener to unlock/resume audio if browser restricted initial autoplay
    const unlockAndPlay = () => {
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().then(() => {
            playBeep();
          }).catch(() => {});
        } else {
          playBeep();
        }
      } else {
        playBeep();
      }
    };

    window.addEventListener('click', unlockAndPlay);
    window.addEventListener('touchstart', unlockAndPlay);
    window.addEventListener('keydown', unlockAndPlay);
    window.addEventListener('pointerdown', unlockAndPlay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('click', unlockAndPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
      window.removeEventListener('pointerdown', unlockAndPlay);
    };
  }, [shouldPlay]);
}

