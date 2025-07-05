'use client'

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.loop = true;
    if (/^\/matches\/[^/]+\/game/.test(pathname || '')) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return <audio ref={audioRef} src="/bg.mp3" autoPlay />;
}
