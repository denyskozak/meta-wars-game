import Image from "next/image";
import React from "react";
import { Progress } from "@heroui/react";

import { assetUrl } from "@/utilities/assets";

interface LoadingProps {
  text: string;
  hideProgress?: boolean;
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

export const Loading = ({ text, hideProgress = false }: LoadingProps) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 5));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex justify-center items-center">
      <Image
        alt="Turtle Art"
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
        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[5] flex flex-col items-center gap-2">
        <img
          alt="How to play"
          className="w-96 h-auto"
          src={assetUrl("/images/how-to-play.webp")}
        />
        {!hideProgress && (
          <Progress
            disableAnimation
            aria-label="Loading"
            className="w-full"
            value={progress}
          />
        )}
      </div>
    </div>
  );
};
