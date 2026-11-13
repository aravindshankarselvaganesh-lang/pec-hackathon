'use client';

import React, { useEffect, useState, useRef } from 'react';

export function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const targetPos = useRef({ x: -1000, y: -1000 });
  const currentPos = useRef({ x: -1000, y: -1000 });
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    // Smooth animation loop using lerp for natural fluid motion
    const animate = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;
      setMousePos({ x: currentPos.current.x, y: currentPos.current.y });
      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Dynamic Mouse-Follow Glow */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out opacity-80"
        style={{
          background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, rgba(230, 182, 92, 0.14), rgba(217, 109, 76, 0.06), rgba(24, 63, 53, 0.02) 50%, transparent 80%)`,
        }}
      />

      {/* 2. Organic Floating Ambient Orbs (Broken-Grid Anchors) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#E6EFE8]/70 to-[#FDF8ED]/40 blur-3xl opacity-75 animate-blob" />
      <div
        className="absolute top-1/3 -right-36 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#FDF2EF]/60 to-[#FDF8ED]/70 blur-3xl opacity-70 animate-blob"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-t from-[#E6EFE8]/80 to-[#FAF8F3]/50 blur-3xl opacity-60 animate-blob"
        style={{ animationDelay: '8s' }}
      />

      {/* 3. Subtle Organic Texture Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(#183F35 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
