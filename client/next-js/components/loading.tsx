import Image from "next/image";
import React from "react";
import { Progress } from "@heroui/react";

import { assetUrl } from "@/utilities/assets";

interface LoadingProps {
  text: string;
}

export const Loading = ({ text }: LoadingProps) => {
  const imageSrc = React.useMemo(() => {
    const images = [
      "/loading-1.webp",
      "/loading-2.webp",
      "/loading-3.webp",
      "/loading-4.webp",
      "/loading-5.webp",
    ];

    return images[Math.floor(Math.random() * images.length)];
  }, []);

  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 1));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Image
        alt="Turtle Art"
        className="absolute top-0 left-0 w-full h-full object-cover z-[2]"
        height={1961}
        src={imageSrc}
        width={3840}
      />
      <span className="absolute z-[3] text-xl font-semibold text-white">
        {text}
      </span>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-2">
        <img
          alt="How to play"
          className="w-96 h-auto"
          src={assetUrl("/images/how-to-play.webp")}
        />
        <Progress aria-label="Loading" className="w-full" value={progress} />
      </div>
    </div>
  );
};
