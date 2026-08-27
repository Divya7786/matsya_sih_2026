import React, { useEffect, useRef, useState } from 'react';

interface MarineVideoBackgroundProps {
  className?: string;
  overlayOpacity?: number; // 0 to 1
  showCanvasSimulation?: boolean;
}

export function MarineVideoBackground({
  className = '',
  overlayOpacity = 0.55,
  showCanvasSimulation = true,
}: MarineVideoBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Underwater 3D particle and marine life simulation
  useEffect(() => {
    if (!showCanvasSimulation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Fish simulation
    interface Fish {
      x: number;
      y: number;
      speed: number;
      size: number;
      direction: 1 | -1;
      waggle: number;
      waggleSpeed: number;
      color: string;
      schoolId: number;
      depth: number; // 0.2 to 1 (scale & opacity)
    }

    const fishes: Fish[] = [];
    const FISH_COUNT = 24;
    for (let i = 0; i < FISH_COUNT; i++) {
      const school = i % 3;
      fishes.push({
        x: Math.random() * width,
        y: 100 + Math.random() * (height - 180),
        speed: (0.8 + Math.random() * 1.4) * (school === 1 ? -1 : 1),
        size: 8 + Math.random() * 14,
        direction: school === 1 ? -1 : 1,
        waggle: Math.random() * Math.PI * 2,
        waggleSpeed: 0.1 + Math.random() * 0.08,
        color: ['#0d9488', '#14b8a6', '#38bdf8', '#fbbf24', '#f97316'][Math.floor(Math.random() * 5)],
        schoolId: school,
        depth: 0.3 + Math.random() * 0.7,
      });
    }

    // Bubbles simulation
    interface Bubble {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wobble: number;
      wobbleSpeed: number;
      opacity: number;
    }
    const bubbles: Bubble[] = [];
    for (let i = 0; i < 35; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1 + Math.random() * 4,
        speed: 0.4 + Math.random() * 1.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }

    // Seaweed strands
    const seaweedPoints: { x: number; height: number; segments: number; phase: number }[] = [];
    const SEAW_COUNT = Math.floor(width / 70);
    for (let i = 0; i < SEAW_COUNT; i++) {
      seaweedPoints.push({
        x: i * 75 + Math.random() * 20,
        height: 120 + Math.random() * 160,
        segments: 6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Light rays
    let rayPhase = 0;

    let time = 0;
    const render = () => {
      time += 0.015;
      rayPhase += 0.008;
      ctx.clearRect(0, 0, width, height);

      // 1. Sunlight Caustics & Rays
      ctx.save();
      for (let r = 0; r < 5; r++) {
        const rayAngle = -0.2 + Math.sin(rayPhase + r * 1.2) * 0.05;
        const startX = (width / 5) * r + Math.sin(time + r) * 30;
        const grad = ctx.createLinearGradient(startX, 0, startX + Math.tan(rayAngle) * height, height);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        grad.addColorStop(0.5, 'rgba(45, 212, 191, 0.06)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(startX - 20, 0);
        ctx.lineTo(startX + 60, 0);
        ctx.lineTo(startX + 180 + Math.tan(rayAngle) * height, height);
        ctx.lineTo(startX - 60 + Math.tan(rayAngle) * height, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 2. Seaweed at bottom
      ctx.save();
      for (const sw of seaweedPoints) {
        ctx.beginPath();
        ctx.moveTo(sw.x, height);
        const segLen = sw.height / sw.segments;
        for (let s = 1; s <= sw.segments; s++) {
          const sway = Math.sin(time * 1.5 + sw.phase + s * 0.4) * (s * 4.5);
          const segY = height - s * segLen;
          ctx.quadraticCurveTo(sw.x + sway * 0.6, segY + segLen * 0.5, sw.x + sway, segY);
        }
        ctx.lineWidth = 4 + Math.sin(sw.phase) * 2;
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.28)';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();

      // 3. Swimming Fishes
      for (const fish of fishes) {
        fish.waggle += fish.waggleSpeed;
        fish.x += fish.speed;
        fish.y += Math.sin(fish.waggle * 0.5) * 0.3;

        // Wrap around screen
        if (fish.speed > 0 && fish.x > width + 50) fish.x = -50;
        if (fish.speed < 0 && fish.x < -50) fish.x = width + 50;

        ctx.save();
        ctx.translate(fish.x, fish.y);
        if (fish.speed < 0) ctx.scale(-1, 1);
        ctx.scale(fish.depth, fish.depth);
        ctx.globalAlpha = 0.45 + fish.depth * 0.4;

        // Fish Body
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.size, fish.size * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail Waggle
        const tailOffset = Math.sin(fish.waggle) * 4;
        ctx.beginPath();
        ctx.moveTo(-fish.size * 0.8, 0);
        ctx.lineTo(-fish.size * 1.5, -fish.size * 0.4 + tailOffset);
        ctx.lineTo(-fish.size * 1.5, fish.size * 0.4 + tailOffset);
        ctx.closePath();
        ctx.fill();

        // Fin
        ctx.beginPath();
        ctx.moveTo(fish.size * 0.1, -fish.size * 0.35);
        ctx.lineTo(fish.size * 0.3, -fish.size * 0.7);
        ctx.lineTo(-fish.size * 0.1, -fish.size * 0.35);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fish.size * 0.55, -fish.size * 0.1, Math.max(1.2, fish.size * 0.09), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(fish.size * 0.58, -fish.size * 0.1, Math.max(0.6, fish.size * 0.05), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Rising Bubbles
      for (const b of bubbles) {
        b.wobble += b.wobbleSpeed;
        b.y -= b.speed;
        b.x += Math.sin(b.wobble) * 0.4;

        if (b.y < -10) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.35})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Bubble highlight reflection
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.8})`;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showCanvasSimulation]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Video Background with graceful fallback */}
      {!videoError ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80"
        >
          {/* Real high quality ocean underwater video stream */}
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
            type="video/mp4"
          />
        </video>
      ) : (
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
      )}

      {/* 3D Underwater Canvas Layer (Fish, Light Rays, Kelp, Bubbles) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Subtle dark gradient overlay for crystal clear text readability */}
      <div
        className="absolute inset-0 z-20"
        style={{
          background: `linear-gradient(to bottom, rgba(15, 23, 42, ${overlayOpacity * 0.95}) 0%, rgba(15, 23, 42, ${overlayOpacity * 0.7}) 50%, rgba(15, 23, 42, ${overlayOpacity * 0.98}) 100%)`,
        }}
      />
    </div>
  );
}
