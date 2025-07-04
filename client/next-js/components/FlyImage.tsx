import React, {useRef, useEffect, ReactNode} from "react";
import gsap from "gsap";

export const FlyImage= ({ children }: { children: Element }): ReactNode => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (ref.current) {
                gsap.to(ref.current, {
                    y: -1,
                    rotation: 10,
                    duration: 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut",
                });
            }
        }, ref);
        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={ref}
            className="pointer-events-none absolute left-1/2 top-10 z-[1] -translate-x-1/2 -translate-y-1/2"
        >
            {children}
        </div>
    );
};

