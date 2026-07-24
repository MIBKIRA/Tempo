import React, { useEffect, useRef, useCallback } from 'react';

interface LogoProps extends React.ComponentPropsWithoutRef<'svg'> {
  className?: string;
  style?: React.CSSProperties;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeBackOut(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function Logo({ className, style, ...props }: LogoProps) {
  const isAnimatingRef = useRef(false);
  const activeFramesRef = useRef<number[]>([]);
  const activeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const crossbarRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGRectElement>(null);
  const fletchRef = useRef<SVGGElement>(null);

  const cancelAllAnimations = useCallback(() => {
    activeFramesRef.current.forEach((id) => cancelAnimationFrame(id));
    activeFramesRef.current = [];
    activeTimeoutsRef.current.forEach((id) => clearTimeout(id));
    activeTimeoutsRef.current = [];
  }, []);

  const animateValue = useCallback(
    (
      duration: number,
      easeFn: (t: number) => number,
      onUpdate: (progress: number) => void,
      onDone?: () => void
    ) => {
      let start: number | null = null;
      function frame(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const t = Math.min(1, elapsed / duration);
        onUpdate(easeFn(t));
        if (t < 1) {
          const frameId = requestAnimationFrame(frame);
          activeFramesRef.current.push(frameId);
        } else if (onDone) {
          onDone();
        }
      }
      const frameId = requestAnimationFrame(frame);
      activeFramesRef.current.push(frameId);
    },
    []
  );

  const playLogo = useCallback(() => {
    if (isAnimatingRef.current) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      if (crossbarRef.current) crossbarRef.current.setAttribute('d', 'M20,30 L50,30 L80,30');
      if (dotRef.current) {
        dotRef.current.style.opacity = '1';
        dotRef.current.style.transform = 'scale(1)';
      }
      if (fletchRef.current) fletchRef.current.style.opacity = '0';
      return;
    }

    isAnimatingRef.current = true;

    // Reset to initial draw state
    if (crossbarRef.current) crossbarRef.current.setAttribute('d', 'M20,30 L50,30 L80,30');
    if (dotRef.current) {
      dotRef.current.style.opacity = '0';
      dotRef.current.style.transform = 'scale(0)';
    }
    if (fletchRef.current) fletchRef.current.style.opacity = '0';

    const startFrame = requestAnimationFrame(() => {
      if (fletchRef.current) fletchRef.current.style.opacity = '0.85';

      // DRAW PHASE: 30 -> 14 over 420ms with easeInOutCubic
      animateValue(
        420,
        easeInOutCubic,
        (p) => {
          const y = 30 + (14 - 30) * p;
          if (crossbarRef.current) {
            crossbarRef.current.setAttribute('d', `M20,30 L50,${y.toFixed(2)} L80,30`);
          }
        },
        () => {
          if (fletchRef.current) fletchRef.current.style.opacity = '0';

          // Dot appears 90ms into release phase
          const dotTimer = setTimeout(() => {
            if (dotRef.current) {
              dotRef.current.style.opacity = '1';
              dotRef.current.style.transform = 'scale(1)';
            }
          }, 90);
          activeTimeoutsRef.current.push(dotTimer);

          // RELEASE PHASE: 14 -> 30 over 260ms with easeBackOut
          animateValue(
            260,
            easeBackOut,
            (p) => {
              const y = 14 + (30 - 14) * p;
              if (crossbarRef.current) {
                crossbarRef.current.setAttribute('d', `M20,30 L50,${y.toFixed(2)} L80,30`);
              }
            },
            () => {
              isAnimatingRef.current = false;
            }
          );
        }
      );
    });
    activeFramesRef.current.push(startFrame);
  }, [animateValue]);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      if (crossbarRef.current) crossbarRef.current.setAttribute('d', 'M20,30 L50,30 L80,30');
      if (dotRef.current) {
        dotRef.current.style.opacity = '1';
        dotRef.current.style.transform = 'scale(1)';
      }
      if (fletchRef.current) fletchRef.current.style.opacity = '0';
      return;
    }

    // Auto play once ~300ms after mount
    const autoPlayTimer = setTimeout(() => {
      playLogo();
    }, 300);
    activeTimeoutsRef.current.push(autoPlayTimer);

    return () => {
      cancelAllAnimations();
      isAnimatingRef.current = false;
    };
  }, [playLogo, cancelAllAnimations]);

  const handleInteraction = () => {
    playLogo();
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ cursor: 'pointer', ...style }}
      onMouseEnter={handleInteraction}
      onClick={handleInteraction}
      {...props}
    >
      <g
        ref={fletchRef}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ opacity: 0, transition: 'opacity 120ms ease' }}
      >
        <line x1="41" y1="34" x2="47" y2="40" />
        <line x1="59" y1="34" x2="53" y2="40" />
      </g>
      <rect x="46" y="30" width="8" height="48" rx="1" fill="currentColor" />
      <path
        ref={crossbarRef}
        d="M20,30 L50,30 L80,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        ref={dotRef}
        x="45"
        y="11"
        width="10"
        height="10"
        rx="2"
        transform="rotate(45 50 16)"
        fill="var(--tempo-accent-blue, #3b5bfd)"
        style={{
          opacity: 0,
          transform: 'scale(0)',
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transition:
            'opacity 260ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </svg>
  );
}

export function LogoSm({ className, style, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <path
        d="M20,30 L50,30 L80,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="46" y="30" width="8" height="48" rx="1" fill="currentColor" />
      <rect
        x="45"
        y="11"
        width="10"
        height="10"
        rx="2"
        transform="rotate(45 50 16)"
        fill="var(--tempo-accent-blue, #3b5bfd)"
      />
    </svg>
  );
}
