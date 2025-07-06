"use client";

import React, { useRef } from "react";
import { Button, type ButtonProps } from "@heroui/react";

export function ButtonWithSound({ onPress, ...props }: ButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePress: typeof onPress = (event) => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
      } catch {
        // ignore play errors
      }
    }
    onPress?.(event);
  };

  return (
    <>
      <audio ref={audioRef} hidden src="/button_click.ogg">
        <track kind="captions" />
      </audio>
      <Button {...props} onPress={handlePress} />
    </>
  );
}
