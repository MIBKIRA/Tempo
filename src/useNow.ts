import { useState, useEffect } from 'react';

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  return now;
}
