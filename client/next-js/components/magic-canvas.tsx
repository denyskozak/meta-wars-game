import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export const MagicCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const createParticles = (e: MouseEvent) => {
      const hue = 201; // approx #299ad8
      for (let i = 0; i < 5; i++) {
        const saturation = 70 + Math.random() * 10;
        const lightness = 55 + Math.random() * 10;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          alpha: 1,
          size: 2 + Math.random() * 3,
          color: `hsl(${hue},${saturation}%,${lightness}%)`,
        });
      }
    };

    window.addEventListener("mousemove", createParticles);

    let last = performance.now();
    const frame = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.alpha -= dt;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("mousemove", createParticles);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
      <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-[1]"
      />
  );
};

export default MagicCanvas;