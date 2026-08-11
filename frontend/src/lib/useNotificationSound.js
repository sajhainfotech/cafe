"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Notification chime with browser autoplay handled.
 *
 * Browsers refuse to play audio until the user has interacted with the page, so
 * this primes the element on the first click/keypress/touch and then plays on
 * demand. If playback is still blocked it falls back to a short WebAudio beep.
 *
 * Previously duplicated in AdminHeader and the order page.
 */
export function useNotificationSound(src = "/notification.mp3", volume = 1) {
  const audioRef = useRef(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      // Play-then-immediately-pause is what actually satisfies the gesture
      // requirement; the result doesn't matter.
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});
    };

    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach((event) =>
      document.addEventListener(event, unlock, { once: true, passive: true }),
    );

    return () => {
      events.forEach((event) => document.removeEventListener(event, unlock));
      audio.pause();
      audioRef.current = null;
    };
  }, [src, volume]);

  return useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.currentTime = 0;
      await audio.play();
      return true;
    } catch {
      return beep();
    }
  }, []);
}

/** Last resort when the audio file can't play: synthesise a short tone. */
function beep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
    return true;
  } catch {
    return false;
  }
}
