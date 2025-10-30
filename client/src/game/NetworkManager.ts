import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../types';
import type {
  MatchmakingJoinPayload,
  MatchFoundPayload,
  LobbyCountdownPayload,
  GameStartPayload,
  GameStartedPayload,
  GameStateSyncPayload,
  PlayerMovePayload,
  PlayerShootPayload,
  PlayerHitPayload,
  PlayerKilledPayload,
  PlayerRespawnedPayload,
  GrenadeThrowPayload,
  GrenadeThrownPayload,
  GrenadeExplodedPayload,
  GameEndPayload,
  WeaponType
} from '../types';

export class NetworkManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private callbacks: Map<string, Function> = new Map();

  connect(token: string): Promise<void> {
    this.token = token;

    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

      this.socket = io(wsUrl, {
        auth: { token }
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Matchmaking events
    this.socket.on(SocketEvents.MATCHMAKING_FOUND, (data: MatchFoundPayload) => {
      this.trigger('matchmaking:found', data);
    });

    // Lobby events
    this.socket.on(SocketEvents.LOBBY_COUNTDOWN, (data: LobbyCountdownPayload) => {
      this.trigger('lobby:countdown', data);
    });

    this.socket.on(SocketEvents.GAME_START, (data: GameStartPayload) => {
      this.trigger('game:start', data);
    });

    // Game state events
    this.socket.on(SocketEvents.GAME_STARTED, (data: GameStartedPayload) => {
      this.trigger('game:started', data);
    });

    this.socket.on(SocketEvents.GAME_STATE_SYNC, (data: GameStateSyncPayload) => {
      this.trigger('game:state_sync', data);
    });

    // Player action events
    this.socket.on(SocketEvents.PLAYER_SHOT_FIRED, (data: any) => {
      this.trigger('player:shot_fired', data);
    });

    this.socket.on(SocketEvents.PLAYER_HIT, (data: PlayerHitPayload) => {
      this.trigger('player:hit', data);
    });

    this.socket.on(SocketEvents.PLAYER_KILLED, (data: PlayerKilledPayload) => {
      this.trigger('player:killed', data);
    });

    this.socket.on(SocketEvents.PLAYER_RESPAWNED, (data: PlayerRespawnedPayload) => {
      this.trigger('player:respawned', data);
    });

    // Grenade events
    this.socket.on(SocketEvents.GRENADE_THROWN, (data: GrenadeThrownPayload) => {
      this.trigger('grenade:thrown', data);
    });

    this.socket.on(SocketEvents.GRENADE_EXPLODED, (data: GrenadeExplodedPayload) => {
      this.trigger('grenade:exploded', data);
    });

    // Game end
    this.socket.on(SocketEvents.GAME_END, (data: GameEndPayload) => {
      this.trigger('game:end', data);
    });
  }

  // Emit events to server
  joinMatchmaking(weaponChoice: WeaponType) {
    if (!this.socket) return;
    const payload: MatchmakingJoinPayload = { weaponChoice };
    this.socket.emit(SocketEvents.MATCHMAKING_JOIN, payload);
  }

  leaveMatchmaking() {
    if (!this.socket) return;
    this.socket.emit(SocketEvents.MATCHMAKING_LEAVE);
  }

  gameReady() {
    if (!this.socket) return;
    this.socket.emit(SocketEvents.GAME_READY);
  }

  sendPlayerMove(payload: PlayerMovePayload) {
    if (!this.socket) return;
    this.socket.emit(SocketEvents.PLAYER_MOVE, payload);
  }

  sendPlayerShoot(payload: PlayerShootPayload) {
    if (!this.socket) return;
    this.socket.emit(SocketEvents.PLAYER_SHOOT, payload);
  }

  requestRespawn() {
    if (!this.socket) return;
    this.socket.emit(SocketEvents.PLAYER_RESPAWN);
  }

  throwGrenade(payload: GrenadeThrowPayload) {
    if (!this.socket) return;
    this.socket.emit(SocketEvents.PLAYER_GRENADE_THROW, payload);
  }

  // Event callback system
  on(event: string, callback: Function) {
    this.callbacks.set(event, callback);
  }

  off(event: string) {
    this.callbacks.delete(event);
  }

  private trigger(event: string, data: any) {
    const callback = this.callbacks.get(event);
    if (callback) {
      callback(data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const networkManager = new NetworkManager();
