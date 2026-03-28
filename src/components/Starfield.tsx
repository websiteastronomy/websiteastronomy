"use client";

import React, { useEffect, useRef } from 'react';

const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    interface Star {
      x: number;
      y: number;
      radius: number;
      speed: number;
      alpha: number;
      baseAlpha: number;
    }

    const stars: Star[] = [];
    
    // More stars, smaller and subtler — like the reference site
    for (let i = 0; i < 300; i++) {
      const baseAlpha = Math.random() * 0.6 + 0.1;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.15 + 0.02,
        alpha: baseAlpha,
        baseAlpha: baseAlpha,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Slow upward drift
        star.y -= star.speed;

        // Subtle twinkle
        star.alpha += (Math.random() - 0.5) * 0.02;
        if (star.alpha < star.baseAlpha * 0.3) star.alpha = star.baseAlpha * 0.3;
        if (star.alpha > star.baseAlpha * 1.5) star.alpha = star.baseAlpha * 1.5;

        // Reset
        if (star.y < -2) {
          star.y = canvas.height + 2;
          star.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, #1a2744 0%, #0c1222 50%, #080e1a 100%)'
      }}
    />
  );
};

export default Starfield;
