import React from 'react';
import styles from './EngineeredMoodGauge.module.css';

interface EngineeredMoodGaugeProps {
  level: number; // 1 to 5
  color?: string; // hex color or css variable
  className?: string;
}

export default function EngineeredMoodGauge({
  level,
  color = 'var(--tempo-accent-blue)',
  className = '',
}: EngineeredMoodGaugeProps) {
  const bars = [1, 2, 3, 4, 5];
  const heights = ['34%', '52%', '68%', '84%', '100%'];

  return (
    <span
      className={`${styles.gauge_container} ${className}`}
      aria-label={`Mood gauge level ${level} of 5`}
      role="img"
    >
      {bars.map((bar, index) => {
        const isFilled = bar <= level;
        const barStyle = {
          height: heights[index],
          backgroundColor: isFilled ? color : undefined,
        };

        return (
          <i
            key={bar}
            className={`${styles.bar} ${isFilled ? styles.filled : styles.empty}`}
            style={barStyle}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
