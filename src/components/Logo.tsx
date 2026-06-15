import React from 'react';

interface LogoProps extends React.ComponentPropsWithoutRef<'svg'> {
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      fill="none"
      className={className}
      {...props}
    >
      {/* Main Blue Card Base (Precision Block) representing standard desktop icon boundaries */}
      <rect x="64" y="64" width="384" height="384" fill="#1B4FD8" stroke="#1E40AF" strokeWidth={2} />
      
      {/* Blueprint Fine Grid Overlay (Precision instrument background) */}
      <line x1="64" y1="128" x2="448" y2="128" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} strokeDasharray="4 4" />
      <line x1="64" y1="192" x2="448" y2="192" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} />
      <line x1="64" y1="256" x2="448" y2="256" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} strokeDasharray="4 4" />
      <line x1="64" y1="320" x2="448" y2="320" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} />
      <line x1="64" y1="384" x2="448" y2="384" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} strokeDasharray="4 4" />
      
      <line x1="128" y1="64" x2="128" y2="448" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} strokeDasharray="4 4" />
      <line x1="192" y1="64" x2="192" y2="448" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} />
      <line x1="256" y1="64" x2="256" y2="448" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} strokeDasharray="4 4" />
      <line x1="320" y1="64" x2="320" y2="448" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} />
      <line x1="384" y1="64" x2="384" y2="448" stroke="#FFFFFF" strokeOpacity={0.10} strokeWidth={1} strokeDasharray="4 4" />
      
      {/* Outer Drafting Frame inside Blue Rectangle */}
      <rect x="80" y="80" width="352" height="352" fill="none" stroke="#FFFFFF" strokeOpacity={0.20} strokeWidth={1} />
      
      {/* Precision Corner Markers (Drafting Crosshairs) */}
      <path d="M 72,80 H 88 M 80,72 V 88" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} />
      <path d="M 424,80 H 440 M 432,72 V 88" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} />
      <path d="M 72,432 H 88 M 80,424 V 440" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} />
      <path d="M 424,432 H 440 M 432,424 V 440" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} />
      
      {/* Compass/Technical Notation Tick Marks around border */}
      <path d="M 160,80 V 85 M 224,80 V 85 M 288,80 V 85 M 352,80 V 85" stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1} />
      <path d="M 160,432 V 427 M 224,432 V 427 M 288,432 V 427 M 352,432 V 427" stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1} />
      <path d="M 80,160 H 85 M 80,224 H 85 M 80,288 H 85 M 80,352 H 85" stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1} />
      <path d="M 432,160 H 427 M 432,224 H 427 M 432,288 H 427 M 432,352 H 427" stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1} />
      
      {/* Central Precision T-Cutout */}
      <path d="M 144,144 H 368 V 208 H 288 V 368 H 224 V 208 H 144 Z" fill="#FFFFFF" />
      
      {/* Coordinate technical text/subtle labels in corners */}
      <text x="92" y="100" fontFamily="monospace, sans-serif" fontSize="10" fill="#FFFFFF" fillOpacity={0.25} fontWeight="bold">SEC_A</text>
      <text x="382" y="100" fontFamily="monospace, sans-serif" fontSize="10" fill="#FFFFFF" fillOpacity={0.25} fontWeight="bold" textAnchor="end">SYS.T</text>
      <text x="92" y="420" fontFamily="monospace, sans-serif" fontSize="10" fill="#FFFFFF" fillOpacity={0.25} fontWeight="bold">512_PX</text>
      <text x="382" y="420" fontFamily="monospace, sans-serif" fontSize="10" fill="#FFFFFF" fillOpacity={0.25} fontWeight="bold" textAnchor="end">V1.0</text>
    </svg>
  );
}

export function LogoSm({ className, ...props }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32" 
      fill="none"
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="28" height="28" fill="#1B4FD8" />
      <path d="M 8,8 H 24 V 12 H 18 V 24 H 14 V 12 H 8 Z" fill="#FFFFFF" />
    </svg>
  );
}
