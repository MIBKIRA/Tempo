import React from 'react';
import styles from './EngineeredToggle.module.css';

interface EngineeredToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function EngineeredToggle({
  checked,
  onChange,
  disabled = false,
}: EngineeredToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`${styles.toggle} ${checked ? styles.checked : styles.unchecked}`}
    >
      <div className={`${styles.thumb} ${checked ? styles.thumb_checked : styles.thumb_unchecked}`} />
    </button>
  );
}
