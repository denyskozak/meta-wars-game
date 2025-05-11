import gsap from "gsap";
import { useMemo } from "react";

import TweenVars = gsap.TweenVars;

export const useAnimation = () => {
  const tl = useMemo(
    () => gsap.timeline({ defaults: { duration: 1, ease: "back.out(1.7)" } }),
    [],
  );
  // Animate each word from an off-screen, rotated state to its normal position
  const fadeInClass = (className: string, extend: TweenVars = {}) => {
    return tl.from(className, {
      // starting state for each word:
      y: 50, // move 50px down (word starts below its final spot)
      opacity: 0, // start invisible
      scale: 0.5, // start half size (50% scale)
      rotation: 45, // start rotated 45 degrees
      color: "#ff4500", // start with a bright color (e.g., orange-red)
      // animate to the default (final) state of the element:
      duration: 0.8,
      stagger: 0.2, // stagger each word by 0.2 seconds&#8203;:contentReference[oaicite:4]{index=4}
      ease: "bounce.out", // bounce easing for a jumping effect,
      ...extend,
    });
  };

  return [fadeInClass];
};
