'use client';

import React, { useEffect, useRef } from 'react';

export default function SpaceHero({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasDimensions = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    const nebulas: Nebula[] = [];
    const particles: Particle[] = [];

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.05 + 0.01,
        twinkleSpeed: Math.random() * 0.01 + 0.005,
        twinkleDirection: 1,
      });
    }

    const nebulae: Nebula[] = [];

    nebulae.push({
      x: canvas.width * 0.3,
      y: canvas.height * 0.2,
      radius: 150,
      color: 'rgba(52, 152, 219, 0.4)',
      pulseSpeed: 0.001,
      pulseDirection: 1,
      scale: 1,
      moveX: 0.1,
      moveY: 0.05,
      moveDirection: { x: 1, y: 1 },
    });

    nebulae.push({
      x: canvas.width * 0.7,
      y: canvas.height * 0.6,
      radius: 200,
      color: 'rgba(155, 89, 182, 0.4)',
      pulseSpeed: 0.0008,
      pulseDirection: -1,
      scale: 1,
      moveX: 0.08,
      moveY: 0.04,
      moveDirection: { x: -1, y: 1 },
    });

    nebulae.push({
      x: canvas.width * 0.5,
      y: canvas.height * 0.4,
      radius: 120,
      color: 'rgba(231, 76, 60, 0.4)',
      pulseSpeed: 0.0012,
      pulseDirection: 1,
      scale: 1,
      moveX: 0.12,
      moveY: 0.06,
      moveDirection: { x: 1, y: -1 },
    });

    nebulae.push({
      x: canvas.width * 0.2,
      y: canvas.height * 0.7,
      radius: 180,
      color: 'rgba(46, 204, 113, 0.4)',
      pulseSpeed: 0.001,
      pulseDirection: -1,
      scale: 1,
      moveX: 0.07,
      moveY: 0.09,
      moveDirection: { x: -1, y: -1 },
    });

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.2 + 0.1,
        speed: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
        },
      });
    }

    let animationFrameId: number;
    let lastShootingStarTime = 0;

    const animate = (timestamp: number) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0, 'rgba(3, 0, 20, 0.6)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
      gradient.addColorStop(1, 'black');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nebulas.forEach(nebula => {
        nebula.scale += nebula.pulseSpeed * nebula.pulseDirection;
        if (nebula.scale > 1.1) {
          nebula.scale = 1.1;
          nebula.pulseDirection = -1;
        } else if (nebula.scale < 0.9) {
          nebula.scale = 0.9;
          nebula.pulseDirection = 1;
        }

        nebula.x += nebula.moveX * nebula.moveDirection.x;
        nebula.y += nebula.moveY * nebula.moveDirection.y;

        if (nebula.x > canvas.width - nebula.radius || nebula.x < nebula.radius) {
          nebula.moveDirection.x *= -1;
        }
        if (nebula.y > canvas.height - nebula.radius || nebula.y < nebula.radius) {
          nebula.moveDirection.y *= -1;
        }

        const gradient = ctx.createRadialGradient(
          nebula.x + nebula.moveX,
          nebula.y + nebula.moveY,
          0,
          nebula.x + nebula.moveX,
          nebula.y + nebula.moveY,
          nebula.radius * nebula.scale
        );

        const colorMatch = RegExp(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/).exec(nebula.color);
        if (colorMatch) {
          const [, r, g, b] = colorMatch;
          gradient.addColorStop(0, nebula.color);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        } else {
          gradient.addColorStop(0, nebula.color);
          gradient.addColorStop(1, 'rgba(100, 100, 150, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          nebula.x + nebula.moveX,
          nebula.y + nebula.moveY,
          nebula.radius * nebula.scale,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }

        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > 0.8) {
          star.opacity = 0.8;
          star.twinkleDirection = -1;
        } else if (star.opacity < 0.2) {
          star.opacity = 0.2;
          star.twinkleDirection = 1;
        }

        ctx.fillStyle = `rgba(100, 100, 150, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (timestamp - lastShootingStarTime > 3000 && Math.random() < 0.02) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * (canvas.height / 2),
          length: Math.random() * 80 + 40,
          speed: Math.random() * 5 + 10,
          angle: (Math.random() * Math.PI) / 4 - Math.PI / 8,
          opacity: 0,
          fadeSpeed: 0.05,
        });
        lastShootingStarTime = timestamp;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        if (!star) continue;

        if (
          star.opacity < 1 &&
          star.x > 0 &&
          star.x < canvas.width &&
          star.y > 0 &&
          star.y < canvas.height
        ) {
          star.opacity += star.fadeSpeed;
        } else {
          star.opacity -= star.fadeSpeed;
        }

        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        if (star.opacity > 0) {
          ctx.strokeStyle = `rgba(100, 100, 150, ${star.opacity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(
            star.x - Math.cos(star.angle) * star.length,
            star.y - Math.sin(star.angle) * star.length
          );
          ctx.stroke();
        }

        if (
          star.opacity <= 0 ||
          star.x < -star.length ||
          star.x > canvas.width + star.length ||
          star.y < -star.length ||
          star.y > canvas.height + star.length
        ) {
          shootingStars.splice(i, 1);
        }
      }

      particles.forEach(particle => {
        particle.x += particle.speed.x;
        particle.y += particle.speed.y;

        particle.opacity -= 0.01;
        if (particle.opacity < 0) particle.opacity = 0;

        ctx.fillStyle = `rgba(100, 100, 150, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      <div className="relative z-10 flex w-full items-center justify-center py-20">
        <div className="mx-auto text-center">{children}</div>
      </div>
    </div>
  );
}

type Star = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinkleDirection: number;
};

type ShootingStar = {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  fadeSpeed: number;
};

type Nebula = {
  x: number;
  y: number;
  radius: number;
  color: string;
  pulseSpeed: number;
  pulseDirection: number;
  scale: number;
  moveX: number;
  moveY: number;
  moveDirection: { x: number; y: number };
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: { x: number; y: number };
};
