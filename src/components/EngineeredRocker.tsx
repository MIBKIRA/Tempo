import React from 'react';
import styles from './EngineeredRocker.module.css';

export interface RockerOption {
  id: string;
  label: React.ReactNode;
  color?: string;
}

interface EngineeredRockerProps {
  options: RockerOption[];
  activeId: string;
  onChange: (id: string) => void;
  fullWidth?: boolean;
}

export default function EngineeredRocker({
  options,
  activeId,
  onChange,
  fullWidth = false,
}: EngineeredRockerProps) {
  return (
    <div className={`${styles.container} ${fullWidth ? styles.full_width : ''}`}>
      {options.map((option) => {
        const isActive = option.id === activeId;
        const customStyle = option.color 
          ? ({ '--active-color': option.color } as React.CSSProperties) 
          : {};

        return (
          <button
            key={option.id}
            type="button"
            style={customStyle}
            onClick={() => {
              if (!isActive) {
                onChange(option.id);
              }
            }}
            className={`${styles.rocker_btn} ${
              isActive ? styles.active : styles.inactive
            } ${fullWidth ? styles.btn_full_width : ''}`}
          >
            {isActive && <span className={styles.rail} aria-hidden="true" />}
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
