import { useEffect, useState, useRef } from 'react';

/**
 * Simple countdown timer.
 * @param {number} durationSec  Total duration in seconds (from server settings)
 * @param {() => void} [onExpire]  Callback when timer hits 0
 */
export default function usePhaseTimer(durationSec, onExpire) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor(durationSec || 0)));
  const cb = useRef(onExpire);
  cb.current = onExpire;
  // Flag so the expire effect only fires after an actual countdown, not on mount
  const didExpire = useRef(false);

  useEffect(() => {
    didExpire.current = false;
    setTimeLeft(Math.max(0, Math.floor(durationSec || 0)));
  }, [durationSec]);

  useEffect(() => {
    if (!durationSec) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          didExpire.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [durationSec]);

  // Fire onExpire outside of the setState updater to avoid setState-during-render
  useEffect(() => {
    if (timeLeft === 0 && didExpire.current) {
      didExpire.current = false; // prevent double-fire on re-render
      cb.current?.();
    }
  }, [timeLeft]);

  const format = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  return { timeLeft, formatted: format(timeLeft) };
}
