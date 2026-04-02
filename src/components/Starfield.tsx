"use client";

import React, { useEffect, useRef } from 'react';

const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    interface Star {
      x: number;
      y: number;
      originX: number;
      originY: number;
      radius: number;
      speed: number;
      alpha: number;
      baseAlpha: number;
    }

    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      alpha: number;
      life: number;
      maxLife: number;
    }

    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    
    for (let i = 0; i < 350; i++) {
      const baseAlpha = Math.random() * 0.6 + 0.1;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      stars.push({
        x, y,
        originX: x,
        originY: y,
        radius: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.15 + 0.02,
        alpha: baseAlpha,
        baseAlpha,
      });
    }

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 8 + 6,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 40 + 30,
      });
    };

    // Spawn shooting stars randomly
    let shootingTimer: number;
    const scheduleShootingStar = () => {
      const delay = Math.random() * 6000 + 3000; // 3-9 seconds
      shootingTimer = window.setTimeout(() => {
        spawnShootingStar();
        scheduleShootingStar();
      }, delay);
    };
    scheduleShootingStar();

    const MOUSE_RADIUS = 130;
    const PUSH_FORCE = 35;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      // Render stars
      stars.forEach((star) => {
        const dx = star.originX - mx;
        const dy = star.originY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && mx > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * PUSH_FORCE;
          const angle = Math.atan2(dy, dx);
          star.x = star.originX + Math.cos(angle) * force;
          star.y = star.originY + Math.sin(angle) * force;
        } else {
          star.x += (star.originX - star.x) * 0.08;
          star.y += (star.originY - star.y) * 0.08;
        }

        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        star.originY -= star.speed;
        star.alpha += (Math.random() - 0.5) * 0.02;
        if (star.alpha < star.baseAlpha * 0.3) star.alpha = star.baseAlpha * 0.3;
        if (star.alpha > star.baseAlpha * 1.5) star.alpha = star.baseAlpha * 1.5;

        if (star.originY < -2) {
          star.originY = canvas.height + 2;
          star.originX = Math.random() * canvas.width;
          star.x = star.originX;
          star.y = star.originY;
        }
      });

      // Render shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        // Fade in then out
        if (ss.life < ss.maxLife * 0.2) {
          ss.alpha = ss.life / (ss.maxLife * 0.2);
        } else {
          ss.alpha = 1 - (ss.life - ss.maxLife * 0.2) / (ss.maxLife * 0.8);
        }

        if (ss.life >= ss.maxLife || ss.alpha <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Draw trail
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.7, `rgba(201, 168, 76, ${ss.alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.alpha * 0.9})`);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Head glow
        ctx.globalAlpha = ss.alpha * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(shootingTimer);
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
