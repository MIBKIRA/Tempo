import React from 'react';

export interface TempoIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function Deep({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="9.5" y="9.5" width="5" height="5" fill="currentColor" />
    </svg>
  );
}

export function Light({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M8 14 L14 8 M14 8 L14 11.3 M14 8 L10.7 8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Admin({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="7.5" y1="9" x2="16.5" y2="9" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="7.5" y1="12" x2="14.5" y2="12" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="7.5" y1="15" x2="12.5" y2="15" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Creative({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15 4 H4 V20 H20 V9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Social({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="4" y="4" width="11" height="11" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="11" y="11" width="9" height="9" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Streak({ size = 24, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 2.5 L15.5 9 L13.5 9.5 L17 15 L12 21.5 L7 15 L10.5 9.5 L8.5 9 Z" fill="currentColor" />
    </svg>
  );
}

export function Evening({ size = 24, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.5 4.2c-4.4 0-8 3.6-8 8s3.6 8 8 8c1.6 0 3.1-.5 4.4-1.3-.4.05-.9.08-1.3.08-4.4 0-8-3.6-8-8 0-3.1 1.8-5.9 4.4-7.2-.5-.4-1-.5-1.5-.58z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Rain({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line x1="5" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="8" y1="12" x2="6" y2="17" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="13" y1="12" x2="11" y2="17" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="18" y1="12" x2="16" y2="17" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Ocean({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <polyline
        points="4,9 7,7 10,9 13,7 16,9 19,7 20,9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
      />
      <polyline
        points="4,15 7,13 10,15 13,13 16,15 19,13 20,15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Forest({ size = 24, strokeWidth = 1.8, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 3 L17 10 H14 L18 16 H6 L10 10 H7 Z" fill="currentColor" />
      <line x1="12" y1="16" x2="12" y2="20" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Cafe({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="5" y="8" width="12" height="9" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M17 10 H19 V14 H17" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="5" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Insight({ size = 24, strokeWidth = 1.6, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function Milestone({ size = 24, strokeWidth = 1.8, ...props }: TempoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 16 L12 10 L18 16"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M6 20 L12 14 L18 20"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export const TempoIcons = {
  Deep,
  Light,
  Admin,
  Creative,
  Social,
  Streak,
  Evening,
  Rain,
  Ocean,
  Forest,
  Cafe,
  Insight,
  Milestone,
};
