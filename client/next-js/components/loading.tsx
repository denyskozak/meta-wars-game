import Image from "next/image";
import React from "react";

export const Loading = () => {

    return  <div className="w-full h-full">
        <Image
            className="absolute top-0 left-0 w-full h-full object-cover z-[0]"
            alt="Turtle Art"
            width={3840}
            height={1961}
            src="/loading.webp"
        />
    </div>
}