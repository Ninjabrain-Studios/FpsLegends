import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from '../game/GameRoom';
import { PlayerState } from '../game/PlayerState';
import { QueuedPlayer } from './matchmakingService';
import { MapName, Team, SocketEvents, LOBBY_COUNTDOWN_DURATION } from '../../../shared/constants';

class GameService {
  private activeGames: Map<string, GameRoom> = new Map();
  private playerGameMap: Map<string, string> = new Map(); // userId -> matchId

  async createGame(matchPlayers: QueuedPlayer[], mapName: MapName, io: Server): Promise<string> {
    const matchId = uuidv4();

    // Assign teams
    const redTeam = matchPlayers.slice(0, 4);
    const blueTeam = matchPlayers.slice(4, 8);

    // Create player states
    const playerStates: PlayerState[] = [];

    redTeam.forEach(p => {
      const playerState = new PlayerState(
        p.userId,
        p.socketId,
        p.discordUsername,
        p.discordAvatar,
        p.selectedSkin,
        'red',
        p.weaponChoice
      );
      playerStates.push(playerState);
      this.playerGameMap.set(p.userId, matchId);
    });

    blueTeam.forEach(p => {
      const playerState = new PlayerState(
        p.userId,
        p.socketId,
        p.discordUsername,
        p.discordAvatar,
        p.selectedSkin,
        'blue',
        p.weaponChoice
      );
      playerStates.push(playerState);
      this.playerGameMap.set(p.userId, matchId);
    });

    // Create game room
    const gameRoom = new GameRoom(matchId, mapName, playerStates, io);
    this.activeGames.set(matchId, gameRoom);

    // Notify players - matchmaking found
    const playersInfo = playerStates.map(p => ({
      userId: p.userId,
      discordUsername: p.discordUsername,
      discordAvatar: p.discordAvatar,
      team: p.team,
      selectedSkin: p.selectedSkin
    }));

    matchPlayers.forEach(p => {
      io.to(p.socketId).emit(SocketEvents.MATCHMAKING_FOUND, {
        matchId,
        players: playersInfo,
        mapName
      });
    });

    // Start lobby countdown
    this.startLobbyCountdown(matchId, matchPlayers, io);

    return matchId;
  }

  private startLobbyCountdown(matchId: string, matchPlayers: QueuedPlayer[], io: Server) {
    let countdown = LOBBY_COUNTDOWN_DURATION;

    const countdownInterval = setInterval(() => {
      matchPlayers.forEach(p => {
        io.to(p.socketId).emit(SocketEvents.LOBBY_COUNTDOWN, { seconds: countdown });
      });

      countdown--;

      if (countdown < 0) {
        clearInterval(countdownInterval);
        this.startGame(matchId, io);
      }
    }, 1000);
  }

  private startGame(matchId: string, io: Server) {
    const gameRoom = this.activeGames.get(matchId);
    if (!gameRoom) {
      console.error(`Game ${matchId} not found`);
      return;
    }

    // Notify players to load game
    gameRoom.players.forEach(player => {
      const spawnPoint = gameRoom.getRandomSpawnPoint(player.team);

      io.to(player.socketId).emit(SocketEvents.GAME_START, {
        matchId,
        mapName: gameRoom.mapName,
        yourTeam: player.team,
        yourSpawnPoint: spawnPoint
      });
    });

    // Wait a bit for players to load, then start game
    setTimeout(() => {
      gameRoom.start();

      // Notify all players game has started
      gameRoom.players.forEach(player => {
        io.to(player.socketId).emit(SocketEvents.GAME_STARTED, {
          startTime: new Date(gameRoom.startTime).toISOString()
        });
      });
    }, 2000);
  }

  getGameForPlayer(userId: string): GameRoom | undefined {
    const matchId = this.playerGameMap.get(userId);
    if (!matchId) return undefined;
    return this.activeGames.get(matchId);
  }

  playerReady(userId: string) {
    const gameRoom = this.getGameForPlayer(userId);
    if (!gameRoom) return;

    const player = gameRoom.players.get(userId);
    if (player) {
      player.isReady = true;
    }
  }

  removeGame(matchId: string) {
    const gameRoom = this.activeGames.get(matchId);
    if (gameRoom) {
      gameRoom.cleanup();

      // Remove player mappings
      gameRoom.players.forEach(player => {
        this.playerGameMap.delete(player.userId);
      });

      this.activeGames.delete(matchId);
      console.log(`Game ${matchId} removed from active games`);
    }
  }

  handlePlayerDisconnect(userId: string) {
    const gameRoom = this.getGameForPlayer(userId);
    if (gameRoom) {
      // For now, just mark player as disconnected
      // In production, you might want to handle reconnection or replace with bot
      console.log(`Player ${userId} disconnected from game ${gameRoom.matchId}`);
    }
    this.playerGameMap.delete(userId);
  }
}

// Note: uuid module isn't in dependencies, we'll use a simple function instead
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default new GameService();
