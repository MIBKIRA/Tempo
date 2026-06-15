export type EnergyType = 'deep' | 'light' | 'admin' | 'creative' | 'social';
export type ItemType = 'task' | 'scheduled_task' | 'event';

export interface Task {
  id: number | string;
  type?: ItemType;
  title: string;
  energy: EnergyType;
  duration: string;
  gravity: number;
  completed: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
  date?: string; // "YYYY-MM-DD" e.g., "2026-06-13"
  inboxStatus?: 'unprocessed' | 'scheduled' | 'delegated' | 'deleted' | 'converted_to_project';
  capturedAt?: string;
  captureSource?: string;
  inboxNotes?: string;
  projectId?: string | number;
}

export interface Intention {
  id: number;
  text: string;
  energy: EnergyType;
}

export interface Habit {
  id: string;
  name: string;
  value: number; // percentage (0 - 100)
  color: string;
  count: number;
}

export interface TimeBlock {
  id: number;
  title: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  energy: EnergyType;
  notes?: string;
  completed?: boolean;
}
