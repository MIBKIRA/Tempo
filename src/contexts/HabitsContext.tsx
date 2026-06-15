import React, { createContext, useContext } from 'react';
import { useHabitsData } from '../hooks/useHabitsData';

const HabitsContext = createContext<ReturnType<typeof useHabitsData> | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const value = useHabitsData();
  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
}
