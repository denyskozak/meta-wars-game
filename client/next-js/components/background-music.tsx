"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface BackgroundMusicCtx {
  playing: boolean;
  toggle: () => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicCtx | undefined>(
  undefined,
);

export function useBackgroundMusic() {
  const ctx = useContext(BackgroundMusicContext);

  if (!ctx) {
    throw new Error("useBackgroundMusic must be used within BackgroundMusic");
  }

  return ctx;
}

export function BackgroundMusic({ children }: { children?: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const [playing, setPlaying] = useState(true);

  // Load saved preference from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("bg-music-playing");

    if (stored === "false") {
      setPlaying(false);
    }
  }, []);

  const toggle = () => {
    const audio = audioRef.current;

    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setPlaying(true);
      sessionStorage.setItem("bg-music-playing", "true");
    } else {
      audio.pause();
      setPlaying(false);
      sessionStorage.setItem("bg-music-playing", "false");
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;
    audio.volume = 0.4;
    audio.loop = true;
    const stored = sessionStorage.getItem("bg-music-playing");
    const shouldPlay =
      stored !== "false" && !/^\/matches\/[^/]+\/game/.test(pathname || "");

    if (shouldPlay) {
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <BackgroundMusicContext.Provider value={{ playing, toggle }}>
      <audio ref={audioRef} autoPlay hidden src="/bg.mp3">
        <track kind="captions" />
      </audio>
      {children}
    </BackgroundMusicContext.Provider>
  );
}
