// Shared game constants for FPS Legends
// Used by both client and server for consistency

// Player Constants
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_HEIGHT = 1.8; // units
export const PLAYER_WALK_SPEED = 5; // units per second
export const PLAYER_RUN_SPEED = 8; // units per second
export const HEADSHOT_MULTIPLIER = 2; // 2x damage for headshots

// Respawn Constants
export const RESPAWN_DELAY = 3000; // milliseconds (3 seconds)

// Match Constants
export const MATCH_DURATION = 600; // seconds (10 minutes)
export const MATCH_KILL_TARGET = 50; // kills to win
export const PLAYERS_PER_MATCH = 8; // 8 players (4v4)
export const PLAYERS_PER_TEAM = 4;

// Weapon Stats
export const WEAPON_STATS = {
  AssaultRifle: {
    name: 'AR-15',
    damage: 30,
    fireRate: 600, // rounds per minute
    magazineSize: 30,
    reloadTime: 2500, // milliseconds
    range: 'medium-long',
    fireMode: 'automatic',
    fireInterval: 100 // milliseconds between shots (60000 / 600 RPM)
  },
  SMG: {
    name: 'MP5',
    damage: 20,
    fireRate: 800, // rounds per minute
    magazineSize: 25,
    reloadTime: 2000, // milliseconds
    range: 'short-medium',
    fireMode: 'automatic',
    fireInterval: 75 // milliseconds between shots (60000 / 800 RPM)
  },
  Sniper: {
    name: 'AWP',
    damage: 85, // body shot (headshot = 100, instant kill)
    headshotDamage: 100, // instant kill
    fireRate: 60, // bolt-action, manual per shot
    magazineSize: 5,
    reloadTime: 3000, // milliseconds
    range: 'long',
    fireMode: 'bolt-action',
    fireInterval: 1000 // milliseconds between shots (bolt-action delay)
  },
  Shotgun: {
    name: 'SPAS-12',
    damage: 80, // close range total (8 pellets x 10 each)
    pelletDamage: 10, // damage per pellet
    pelletCount: 8,
    fireRate: 75, // pump-action, slow
    magazineSize: 8,
    reloadTime: 3500, // milliseconds
    range: 'short',
    fireMode: 'pump-action',
    fireInterval: 800, // milliseconds between shots
    spreadAngle: 10 // degrees of spread
  },
  Pistol: {
    name: 'Glock',
    damage: 25,
    fireRate: 240, // semi-auto, as fast as clicking (max ~4/sec)
    magazineSize: 15,
    reloadTime: 1500, // milliseconds
    range: 'short-medium',
    fireMode: 'semi-auto',
    fireInterval: 250 // milliseconds between shots (max 4 per second)
  },
  Knife: {
    name: 'Tactical Knife',
    damage: 50,
    backstabDamage: 100, // instant kill from behind
    range: 1, // meters (melee)
    attackSpeed: 800, // milliseconds between swings
    fireMode: 'melee'
  },
  Grenade: {
    name: 'Frag Grenade',
    damageCenter: 100, // damage at explosion center
    damageRadius: 75, // damage at edge of radius
    blastRadius: 5, // meters
    fuseTime: 3000, // milliseconds after throw
    maxThrowDistance: 20, // meters
    quantity: 2 // grenades per life
  }
} as const;

// Network Constants
export const STATE_SYNC_INTERVAL = 100; // milliseconds (10 times per second)
export const MOVEMENT_SEND_INTERVAL = 50; // milliseconds (20 times per second)

// Lobby Constants
export const LOBBY_COUNTDOWN_DURATION = 5; // seconds

// Map Names
export const MAP_NAMES = ['Downtown', 'Warehouse', 'Sandstorm'] as const;

// Player Skins
export const PLAYER_SKINS = [
  'Urban Assault',
  'Desert Ranger',
  'Heavy Armor',
  'Stealth Ops',
  'Engineer'
] as const;

// Team Colors (for UI)
export const TEAM_COLORS = {
  red: '#FF4444',
  blue: '#4444FF'
} as const;

// Leaderboard Constants
export const LEADERBOARD_DEFAULT_LIMIT = 100;
export const LEADERBOARD_MAX_LIMIT = 500;
