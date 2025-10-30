// Re-export shared types
export * from '../../../shared/types';
export * from '../../../shared/constants';

// Client-specific types
export interface GameState {
  isInGame: boolean;
  isInLobby: boolean;
  isInMatchmaking: boolean;
  matchId: string | null;
}

export interface UIState {
  currentView: 'menu' | 'lobby' | 'game' | 'leaderboard' | 'profile';
  showHUD: boolean;
}
