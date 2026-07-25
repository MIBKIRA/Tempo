import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import EngineeredButton from './EngineeredButton';

interface TempoitWordmarkProps extends React.ComponentPropsWithoutRef<'svg'> {
  className?: string;
  style?: React.CSSProperties;
  showReplayButton?: boolean;
  autoPlayDelay?: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeBackOut(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export default function TempoitWordmark({
  className = '',
  style,
  showReplayButton = true,
  autoPlayDelay = 900,
  ...props
}: TempoitWordmarkProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);

  const isPlayingRef = useRef(false);
  const activeFramesRef = useRef<number[]>([]);
  const activeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const bowstringRef = useRef<SVGPathElement>(null);

  const cancelAllAnimations = useCallback(() => {
    activeFramesRef.current.forEach((id) => cancelAnimationFrame(id));
    activeFramesRef.current = [];
    activeTimeoutsRef.current.forEach((id) => clearTimeout(id));
    activeTimeoutsRef.current = [];
  }, []);

  const playIntro = useCallback(() => {
    if (isPlayingRef.current) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setIsPlaying(false);
      setIsIntroDone(true);
      isPlayingRef.current = false;
      if (bowstringRef.current) {
        bowstringRef.current.setAttribute('d', 'M20,44 Q96,41 172,44');
        bowstringRef.current.style.stroke = 'var(--tempo-text-primary)';
        bowstringRef.current.style.filter = 'none';
      }
      return;
    }

    cancelAllAnimations();
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsIntroDone(false);

    // Initial bowstring reset
    if (bowstringRef.current) {
      bowstringRef.current.setAttribute('d', 'M20,44 Q96,41 172,44');
      bowstringRef.current.style.stroke = 'var(--tempo-text-primary)';
      bowstringRef.current.style.filter = 'none';
    }

    // JS-driven bowstring animation
    let start: number | null = null;
    const TOTAL_BOWSTRING_DURATION = 1250; // ms

    function animateBowstring(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;

      if (bowstringRef.current) {
        if (elapsed < 200) {
          // Pre-draw delay
          bowstringRef.current.setAttribute('d', 'M20,44 Q96,41 172,44');
          bowstringRef.current.style.stroke = 'var(--tempo-text-primary)';
          bowstringRef.current.style.filter = 'none';
        } else if (elapsed < 536) {
          // Pull back / tension phase: 200ms to 536ms (336ms duration)
          const p = (elapsed - 200) / 336;
          const eased = easeInOutCubic(Math.min(1, Math.max(0, p)));
          const y = 41 + (95 - 41) * eased;
          bowstringRef.current.setAttribute('d', `M20,44 Q96,${y.toFixed(2)} 172,44`);
          bowstringRef.current.style.stroke = 'var(--tempo-accent-blue)';
          bowstringRef.current.style.filter = 'drop-shadow(0 0 11px rgba(59, 130, 246, 0.4))';
        } else if (elapsed < 683) {
          // Release / overshoot snap phase: 536ms to 683ms (147ms duration)
          const p = (elapsed - 536) / 147;
          const eased = easeBackOut(Math.min(1, Math.max(0, p)));
          const y = 95 + (18 - 95) * eased;
          bowstringRef.current.setAttribute('d', `M20,44 Q96,${y.toFixed(2)} 172,44`);
          bowstringRef.current.style.stroke = 'var(--tempo-accent-blue)';
          bowstringRef.current.style.filter = 'drop-shadow(0 0 7px rgba(59, 130, 246, 0.4))';
        } else if (elapsed <= TOTAL_BOWSTRING_DURATION) {
          // Settle phase: 683ms to 1250ms (567ms duration)
          const p = (elapsed - 683) / 567;
          const eased = easeInOutCubic(Math.min(1, Math.max(0, p)));
          const y = 18 + (41 - 18) * eased;
          bowstringRef.current.setAttribute('d', `M20,44 Q96,${y.toFixed(2)} 172,44`);
          bowstringRef.current.style.stroke = 'var(--tempo-text-primary)';
          bowstringRef.current.style.filter = 'none';
        } else {
          bowstringRef.current.setAttribute('d', 'M20,44 Q96,41 172,44');
          bowstringRef.current.style.stroke = 'var(--tempo-text-primary)';
          bowstringRef.current.style.filter = 'none';
        }
      }

      if (elapsed < TOTAL_BOWSTRING_DURATION) {
        const frameId = requestAnimationFrame(animateBowstring);
        activeFramesRef.current.push(frameId);
      }
    }

    const frameId = requestAnimationFrame(animateBowstring);
    activeFramesRef.current.push(frameId);

    // Complete sequence after 3100ms
    const timer = setTimeout(() => {
      setIsPlaying(false);
      setIsIntroDone(true);
      isPlayingRef.current = false;
    }, 3100);
    activeTimeoutsRef.current.push(timer);
  }, [cancelAllAnimations]);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setIsPlaying(false);
      setIsIntroDone(true);
      isPlayingRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      playIntro();
    }, autoPlayDelay);
    activeTimeoutsRef.current.push(timer);

    return () => {
      cancelAllAnimations();
      isPlayingRef.current = false;
    };
  }, [autoPlayDelay, playIntro, cancelAllAnimations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playIntro();
    }
  };

  const wordmarkClasses = [
    'tempoit-wordmark',
    isPlaying ? 'playing' : '',
    isIntroDone ? 'intro-done' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col items-center w-full">
      <style>{`
        .tempoit-wordmark {
          overflow: visible;
          display: block;
          max-width: 100%;
          cursor: pointer;
        }

        .tempoit-wordmark .bar-path {
          fill: none;
          stroke: var(--tempo-text-primary);
          stroke-width: 18;
          stroke-linecap: round;
          transition: d 0.4s cubic-bezier(0.65, 0, 0.35, 1), stroke 0.35s ease, filter 0.35s ease;
        }

        .tempoit-wordmark .stem-shape,
        .tempoit-wordmark .projectile-shape {
          fill: var(--tempo-text-primary);
        }

        .tempoit-wordmark .letter-stroke {
          fill: none;
          stroke: var(--tempo-text-primary);
          stroke-width: 22;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .tempoit-wordmark .dot-shape {
          fill: var(--tempo-text-primary);
        }

        .tempoit-wordmark .reveal-el {
          opacity: 0;
          transform: translateY(12px) scale(0.95);
        }

        .tempoit-wordmark .final-i-stem {
          opacity: 0;
        }

        .tempoit-wordmark .i-dot {
          opacity: 0;
        }

        .tempoit-wordmark .projectile-shape {
          opacity: 1;
        }

        /* Hover + tap micro-interaction when intro is done */
        .tempoit-wordmark.intro-done:hover .bar-path {
          d: path("M20,44 Q96,58 172,44");
        }

        .tempoit-wordmark.intro-done:hover {
          transform: scale(1.015);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Playing animation keyframe assignments */
        .tempoit-wordmark.playing .projectile-shape {
          animation: tempoitArrowFlight 0.62s cubic-bezier(0.16, 1, 0.3, 1) 0.87s both;
          transform-origin: 96px 116px;
          will-change: transform, opacity;
        }

        .tempoit-wordmark.playing .final-i-stem {
          animation: tempoitStemSettle 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) 1.37s both;
          transform-origin: 695px 169px;
        }

        .tempoit-wordmark.playing .i-dot {
          animation: tempoitDotDrop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 1.6s both;
        }

        .tempoit-wordmark.playing .e-letter {
          animation: tempoitRevealUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1.95s both;
          transform-origin: 248px 130px;
        }

        .tempoit-wordmark.playing .m-letter {
          animation: tempoitRevealUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 2.04s both;
          transform-origin: 372px 125px;
        }

        .tempoit-wordmark.playing .p-letter {
          animation: tempoitRevealUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 2.13s both;
          transform-origin: 497px 130px;
        }

        .tempoit-wordmark.playing .o-letter {
          animation: tempoitRevealUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 2.22s both;
          transform-origin: 614px 130px;
        }

        .tempoit-wordmark.playing .final-t {
          animation: tempoitRevealUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) 2.68s both;
          transform-origin: 768px 110px;
        }

        /* Fully revealed state */
        .tempoit-wordmark.intro-done .reveal-el,
        .tempoit-wordmark.intro-done .final-i-stem,
        .tempoit-wordmark.intro-done .i-dot {
          opacity: 1;
          transform: none;
        }

        .tempoit-wordmark.intro-done .projectile-shape {
          opacity: 0;
        }

        @keyframes tempoitArrowFlight {
          0%   { transform: translate(0,0) rotate(0deg) scale(1,1); fill: var(--tempo-text-primary); opacity: 1; }
          10%  { transform: translate(0,0) rotate(0deg) scale(1,1); fill: var(--tempo-text-primary); opacity: 1; }
          45%  { transform: translate(249px,-72px) rotate(-85deg) scale(0.94,0.9); fill: var(--tempo-accent-blue); opacity: 1; }
          78%  { transform: translate(513px,14px) rotate(-40deg) scale(0.85,0.81); fill: var(--tempo-accent-blue); opacity: 1; }
          100% { transform: translate(599px,0) rotate(0deg) scale(0.82,0.79); fill: var(--tempo-accent-blue); opacity: 0; }
        }

        @keyframes tempoitStemSettle {
          0%   { opacity: 0; transform: scaleY(0.8); }
          100% { opacity: 1; transform: scaleY(1); }
        }

        @keyframes tempoitDotDrop {
          0%   { opacity: 0; transform: translateY(-16px) scale(0.5); fill: var(--tempo-accent-blue); }
          55%  { fill: var(--tempo-accent-blue); }
          100% { opacity: 1; transform: translateY(0) scale(1); fill: var(--tempo-text-primary); }
        }

        @keyframes tempoitRevealUp {
          0%   { opacity: 0; transform: translateY(12px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tempoit-wordmark.playing .projectile-shape,
          .tempoit-wordmark.playing .final-i-stem,
          .tempoit-wordmark.playing .i-dot,
          .tempoit-wordmark.playing .e-letter,
          .tempoit-wordmark.playing .m-letter,
          .tempoit-wordmark.playing .p-letter,
          .tempoit-wordmark.playing .o-letter,
          .tempoit-wordmark.playing .final-t {
            animation-duration: 0.01ms !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>

      <svg
        viewBox="-10 -30 840 260"
        xmlns="http://www.w3.org/2000/svg"
        role="button"
        aria-label="Replay the Tempoit logo animation"
        tabIndex={0}
        className={wordmarkClasses}
        style={style}
        onClick={playIntro}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <g id="t-icon">
          <path ref={bowstringRef} className="bar-path" d="M20,44 Q96,41 172,44" />
          <path
            className="stem-shape"
            d="M83,55 C84,97 88,147 91,177 Q96,184 101,177 C104,147 108,97 109,55 Z"
          />
          <path
            className="projectile-shape"
            d="M83,55 C84,97 88,147 91,177 Q96,184 101,177 C104,147 108,97 109,55 Z"
          />
        </g>

        <g id="letter-e" className="reveal-el e-letter">
          <path
            className="letter-stroke"
            d="M285,142 A39,39 0 0,1 248,169 A39,39 0 0,1 209,130 A39,39 0 0,1 248,91 A39,39 0 0,1 285,118"
          />
          <path className="letter-stroke" d="M209,130 L284,130" />
        </g>

        <g id="letter-m" className="reveal-el m-letter">
          <path
            className="letter-stroke"
            d="M326,169 L326,100 C326,80 372,80 372,100 L372,169 L372,100 C372,80 418,80 418,100 L418,169"
          />
        </g>

        <g id="letter-p" className="reveal-el p-letter">
          <path className="letter-stroke" d="M458,91 L458,209" />
          <path className="letter-stroke" d="M536,130 A39,39 0 1,1 458,130 A39,39 0 1,1 536,130" />
        </g>

        <g id="letter-o" className="reveal-el o-letter">
          <path className="letter-stroke" d="M653,130 A39,39 0 1,1 575,130 A39,39 0 1,1 653,130" />
        </g>

        <path id="letter-i-stem" className="letter-stroke final-i-stem" d="M695,91 L695,169" />
        <circle id="letter-i-dot" className="dot-shape i-dot" cx="695" cy="50" r="12" />

        <g id="letter-t-final" className="reveal-el final-t">
          <path className="letter-stroke" d="M768,46 L768,160 C768,172 778,176 790,174" />
          <path className="letter-stroke" d="M736,80 L798,80" />
        </g>
      </svg>

      {showReplayButton && (
        <div className="flex justify-center mt-3">
          <EngineeredButton
            variant="secondary"
            showGoogleIcon={false}
            onClick={playIntro}
            style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '999px' }}
          >
            <div className="flex items-center gap-1.5 text-[var(--tempo-text-secondary)]">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </div>
          </EngineeredButton>
        </div>
      )}
    </div>
  );
}
