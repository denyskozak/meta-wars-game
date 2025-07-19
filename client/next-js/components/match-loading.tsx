import Image from "next/image";
import React from "react";

import { CLASS_ICONS } from "@/consts/classes";

interface PlayerInfo {
  id: number;
  nickname?: string;
  classType?: string;
}

interface MatchLoadingProps {
  players: PlayerInfo[];
  text?: string;
}

const getRandomImage = () => {
  const images = [
    "/loading-1.jpg",
    "/loading-2.jpg",
    "/loading-3.jpg",
    "/loading-4.jpg",
    "/loading-5.jpg",
  ];

  return images[Math.floor(Math.random() * images.length)];
};

const randomImage = getRandomImage();

export const MatchLoading = ({
  players,
  text = "Wait Other Players ...",
}: MatchLoadingProps) => {
  return (
    <div className="relative w-full h-full flex justify-center items-center">
      <Image
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover z-[4]"
        height={1961}
        src={randomImage}
        width={3840}
      />
      <Image
        alt="Logo"
        className="absolute top-4 left-4 z-[5] animate-logo-spin"
        height={48}
        src="/logo_big.png"
        width={48}
      />
      <div className="absolute z-[5] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
        <span className="text-xxl font-semibold text-white">{text}</span>
        <div className="flex gap-4 flex-wrap justify-center">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center text-white">
              {p.classType && (
                <div className="w-20 h-20 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                  <Image
                    alt={p.classType}
                    height={80}
                    src={CLASS_ICONS[p.classType] || ""}
                    width={80}
                  />
                </div>
              )}
              <span className="mt-1 text-sm">
                {p.nickname || `Player ${p.id}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
