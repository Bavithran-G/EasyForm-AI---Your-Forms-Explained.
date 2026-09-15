import { useEffect, useState, useRef } from 'react';

interface ParallaxCoordinates {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export function useMouseParallax(sensitivity: number = 1) {
  const [coords, setCoords] = useState<ParallaxCoordinates>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const stateRef = useRef({
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    isMobile: false,
  });

  useEffect(() => {
    // Check if mobile / touch device
    stateRef.current.isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window);

    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isMobile) return;
      // Normalize to [-1, 1] relative to viewport center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      stateRef.current.targetX = ((e.clientX - centerX) / centerX) * sensitivity;
      stateRef.current.targetY = ((e.clientY - centerY) / centerY) * sensitivity;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animationFrameId: number;
    let startTime = performance.now();

    const updateSpring = () => {
      const time = (performance.now() - startTime) * 0.001;
      
      // Add subtle idle floating movement
      const idleX = Math.sin(time * 0.8) * 0.08;
      const idleY = Math.cos(time * 0.6) * 0.08;

      const effectiveTargetX = stateRef.current.targetX + idleX;
      const effectiveTargetY = stateRef.current.targetY + idleY;

      // Smooth buttery interpolation (LERP with damping)
      stateRef.current.currentX += (effectiveTargetX - stateRef.current.currentX) * 0.06;
      stateRef.current.currentY += (effectiveTargetY - stateRef.current.currentY) * 0.06;

      setCoords({
        x: stateRef.current.currentX,
        y: stateRef.current.currentY,
        targetX: effectiveTargetX,
        targetY: effectiveTargetY,
      });

      animationFrameId = requestAnimationFrame(updateSpring);
    };

    animationFrameId = requestAnimationFrame(updateSpring);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [sensitivity]);

  return coords;
}
