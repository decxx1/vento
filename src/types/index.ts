export interface Category {
  id: number;
  name: string;
  color: string;
}

export type EventStatus = 'normal' | 'pending' | 'completed' | 'deactivated';

export interface Event {
  id: number;
  category_id: number;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  status: EventStatus;
}
