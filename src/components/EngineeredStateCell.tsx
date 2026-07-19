import React from 'react';
import styles from './EngineeredStateCell.module.css';

interface EngineeredStateCellProps {
  status: 'done' | 'partial' | 'missed' | string;
  onCycle: () => void;
  id?: string;
}

export default function EngineeredStateCell({
  status,
  onCycle,
  id,
}: EngineeredStateCellProps) {
  let glyph = '✓';
  let statusClass = styles.done;

  if (status === 'partial') {
    glyph = '~';
    statusClass = styles.partial;
  } else if (status === 'missed') {
    glyph = '✗';
    statusClass = styles.missed;
  }

  return (
    <button
      id={id}
      type="button"
      onClick={onCycle}
      className={`${styles.cell} ${statusClass}`}
      title={`Click status: current is ${status}`}
    >
      <span className={styles.glyph}>{glyph}</span>
    </button>
  );
}
