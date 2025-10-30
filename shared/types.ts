// Shared TypeScript types for FPS Legends
// Used by both client and server

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type WeaponType = 'AssaultRifle' | 'SMG' | 'Sniper' | 'Shotgun' | 'Pistol' | 'Knife' | 'Grenade';
export type Team = 'red' | 'blue';
export type MapName = 'Downtown' | 'Warehouse' | 'Sandstorm';
export type PlayerSkin = 'Urban Assault' | 'Desert Ranger' | 'Heavy Armor' | 'Stealth Ops' | 'Engineer';

// User and Stats Interfaces
export interface UserProfile {
  id: string;
  discordUsername: string;
  discordAvatar: string;
  selectedSkin: PlayerSkin;
  stats?: PlayerStatsData;
}

export interface PlayerStatsData {
  totalKills: number;
  totalDeaths: number;
  totalWins: number;
  totalLosses: number;
  totalMatches: number;
}

// Matchmaking Events
export interface MatchmakingJoinPayload {
  weaponChoice: WeaponType;
}

export interface PlayerInfo {
  userId: string;
  discordUsername: string;
  discordAvatar: string;
  team: Team;
  selectedSkin: PlayerSkin;
}

export interface MatchFoundPayload {
  matchId: string;
  players: PlayerInfo[];
  mapName: MapName;
}

// Lobby Events
export interface LobbyCountdownPayload {
  seconds: number;
}

export interface GameStartPayload {
  matchId: string;
  mapName: MapName;
  yourTeam: Team;
  yourSpawnPoint: Vector3;
}

// Game State Events
export interface GameStartedPayload {
  startTime: string;
}

export interface PlayerStateSync {
  userId: string;
  position: Vector3;
  rotation: Vector3;
  health: number;
  isAlive: boolean;
  currentWeapon: WeaponType;
}

export interface GameStateSyncPayload {
  players: PlayerStateSync[];
  scores: {
    red: number;
    blue: number;
  };
  timeRemaining: number;
}

// Player Action Events
export interface PlayerMovePayload {
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
}

export interface PlayerShootPayload {
  weapon: WeaponType;
  origin: Vector3;
  direction: Vector3;
  hitPlayerId: string | null;
  hitPosition: Vector3 | null;
  isHeadshot: boolean;
}

export interface PlayerShotFiredPayload {
  userId: string;
  weapon: WeaponType;
  origin: Vector3;
  direction: Vector3;
}

export interface PlayerHitPayload {
  damage: number;
  newHealth: number;
  attackerId: string;
  weaponUsed: WeaponType;
}

export interface PlayerKilledPayload {
  victimId: string;
  killerId: string;
  weapon: WeaponType;
  isHeadshot: boolean;
  killerTeam: Team;
  victimTeam: Team;
}

export interface PlayerRespawnedPayload {
  userId: string;
  position: Vector3;
  team: Team;
}

export interface GrenadeThrowPayload {
  position: Vector3;
  velocity: Vector3;
}

export interface GrenadeThrownPayload {
  grenadeId: string;
  userId: string;
  position: Vector3;
  velocity: Vector3;
}

export interface GrenadeExplodedPayload {
  grenadeId: string;
  position: Vector3;
  damagedPlayers: {
    userId: string;
    damage: number;
  }[];
}

// Game Result Events
export interface PlayerMatchStats {
  userId: string;
  discordUsername: string;
  team: Team;
  kills: number;
  deaths: number;
}

export interface GameEndPayload {
  winningTeam: Team;
  finalScores: {
    red: number;
    blue: number;
  };
  matchDuration: number;
  playerStats: PlayerMatchStats[];
  matchId: string;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  discordUsername: string;
  discordAvatar: string;
  totalKills: number;
  totalDeaths: number;
  totalWins: number;
  totalMatches: number;
  kdRatio: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

// Match Details
export interface MatchPlayerDetails {
  userId: string;
  discordUsername: string;
  discordAvatar: string;
  team: Team;
  kills: number;
  deaths: number;
}

export interface MatchDetailsResponse {
  id: string;
  mapName: MapName;
  winningTeam: Team;
  redTeamKills: number;
  blueTeamKills: number;
  duration: number;
  startedAt: string;
  endedAt: string;
  players: MatchPlayerDetails[];
}

// Auth Responses
export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ErrorResponse {
  error: string;
}

// Socket Event Names
export const SocketEvents = {
  // Matchmaking
  MATCHMAKING_JOIN: 'matchmaking:join',
  MATCHMAKING_FOUND: 'matchmaking:found',
  MATCHMAKING_LEAVE: 'matchmaking:leave',

  // Lobby
  LOBBY_COUNTDOWN: 'lobby:countdown',
  GAME_START: 'game:start',

  // Game State
  GAME_READY: 'game:ready',
  GAME_STARTED: 'game:started',
  GAME_STATE_SYNC: 'game:state_sync',

  // Player Actions
  PLAYER_MOVE: 'player:move',
  PLAYER_SHOOT: 'player:shoot',
  PLAYER_SHOT_FIRED: 'player:shot_fired',
  PLAYER_HIT: 'player:hit',
  PLAYER_KILLED: 'player:killed',
  PLAYER_RESPAWN: 'player:respawn',
  PLAYER_RESPAWNED: 'player:respawned',
  PLAYER_GRENADE_THROW: 'player:grenade_throw',
  GRENADE_THROWN: 'grenade:thrown',
  GRENADE_EXPLODED: 'grenade:exploded',

  // Game End
  GAME_END: 'game:end'
} as const;
