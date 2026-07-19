import React from 'react';
import styles from './EngineeredStepMeter.module.css';

interface EngineeredStepMeterProps {
  mode: 'loading' | 'progress';
  currentStep?: number; // 1-indexed step
  totalSteps?: number;   // total number of steps, defaults to 4
}

export default function EngineeredStepMeter({
  mode,
  currentStep = 0,
  totalSteps = 4,
}: EngineeredStepMeterProps) {
  if (mode === 'loading') {
    return (
      <span className={styles.ticks} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }

  // progress mode
  const stepsArray = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <span className={styles.progress_container} aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {stepsArray.map((step) => {
        const isFilled = step <= currentStep;
        return (
          <i
            key={step}
            className={`${styles.tick} ${isFilled ? styles.filled : styles.empty}`}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
