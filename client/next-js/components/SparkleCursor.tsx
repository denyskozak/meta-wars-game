"use client";
import { useCallback } from "react";
import { loadFull } from "tsparticles";
import { Engine, Container } from "@tsparticles/engine";
import Particles from "@tsparticles/react";

export default function SparkleCursor() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    await container?.refresh();
  }, []);

  return (
    <Particles
      className="pointer-events-none fixed inset-0 z-[9999]"
      id="tsparticles-cursor"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        fullScreen: { enable: false },
        background: { color: "transparent" },
        particles: {
          number: { value: 0 },
          color: { value: ["#ffffff", "#ffe4e1", "#ffffe0"] },
          shape: { type: "circle" },
          opacity: { value: 1 },
          size: { value: { min: 2, max: 4 } },
          life: { duration: { value: 0.6 }, count: 1 },
          move: { enable: true, speed: { min: 10, max: 20 }, decay: 0.1 },
        },
        emitters: {
          direction: "none",
          rate: { delay: 0, quantity: 1 },
          size: { width: 0, height: 0 },
          position: { x: 0, y: 0 },
        },
        interactivity: {
          detectsOn: "window",
          events: {
            onHover: {
              enable: true,
              mode: "trail",
              parallax: { enable: false },
            },
            resize: true,
          },
          modes: {
            trail: { delay: 0.005, quantity: 1, pauseOnStop: true },
          },
        },
      }}
    />
  );
}
