import Image from "next/image";
import React from "react";

interface LoadingProps {
  text: string;
}
export const Loading = ({ text }: LoadingProps) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <Image
        alt="Turtle Art"
        className="absolute top-0 left-0 w-full h-full object-cover z-[2]"
        height={1961}
        src="/loading.webp"
        width={3840}
      />
      <span className="absolute z-[3] text-xl font-semibold">{text}</span>
    </div>
  );
};
