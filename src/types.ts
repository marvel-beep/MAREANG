export interface HistoryItem {
  id: number;
  expression: string;
  result: string;
  steps: string;
  category: string;
  timestamp: string;
}

export type AppState = 'home' | 'camera' | 'result' | 'loading';
