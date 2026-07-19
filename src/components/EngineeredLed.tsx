import React from 'react';
import styles from './EngineeredLed.module.css';

interface EngineeredLedProps {
  color: string;
  active?: boolean;
}

export default function EngineeredLed({
  color,
  active = true,
}: EngineeredLedProps) {
  const customStyle = {
    '--led-color': color,
  } as React.CSSProperties;

  return (
    <span
      className={`${styles.led} ${active ? styles.active : ''}`}
      style={customStyle}
      aria-hidden="true"
    />
  );
}
