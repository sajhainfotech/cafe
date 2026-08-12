"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Notification chime, with browser autoplay policy handled.
 *
 * Why this works on localhost but not in production:
 *
 * Chrome gates autoplay on its Media Engagement Index, and localhost scores
 * highly after a few days of development, so audio just plays there with no
 * gesture. A fresh production domain starts at zero, so the first play() is
 * rejected with NotAllowedError until the user has interacted with the page.
 * Safari and Firefox block unconditionally until a gesture, in both places.
 *
 * So the element has to be primed inside a real user gesture. Two things
 * previously stopped that from recovering:
 *
 *   - the unlock marked itself done *before* play() resolved, so a single
 *     failed attempt permanently disabled every later retry;
 *   - the listeners used { once: true }, removing themselves even when the
 *     attempt had failed.
 *
 * Now it keeps listening until a play() actually succeeds.
 */
export function useNotificationSound(src = "/notification.mp3", volume = 1) {
  const audioRef = useRef(null);
  const unlockedRef = useRef(false);
  const contextRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;
    unlockedRef.current = false;

    audio.addEventListener("error", () => {
      console.warn(
        `[notification] could not load ${src} — check the file is served in production`,
      );
    });

    const events = ["pointerdown", "keydown", "touchstart"];

    const detach = () =>
      events.forEach((event) => document.removeEventListener(event, unlock));

    async function unlock() {
      if (unlockedRef.current) return;

      // A suspended AudioContext produces silence, so resume it in the same
      // gesture — this is what the beep fallback needs to be audible.
      if (contextRef.current?.state === "suspended") {
        contextRef.current.resume().catch(() => {});
      }

      try {
        // Play-then-pause inside the gesture is what actually grants permission.
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        unlockedRef.current = true;
        detach();
      } catch {
        // Still blocked, or the file isn't loaded yet. Stay subscribed and try
        // again on the next gesture rather than giving up for the session.
      }
    }

    events.forEach((event) =>
      document.addEventListener(event, unlock, { passive: true }),
    );

    return () => {
      detach();
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
      return beep(contextRef);
    }
  }, []);
}

/**
 * Last resort when the file can't play: synthesise a short tone.
 *
 * Reuses one AudioContext — Chrome caps how many a page may create, and the
 * previous version built a new one on every call. It also has to be resumed:
 * a context constructed outside a user gesture starts suspended and is silent.
 */
function beep(contextRef) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    if (!contextRef.current) contextRef.current = new AudioCtx();
    const ctx = contextRef.current;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    if (ctx.state !== "running") return false;

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
