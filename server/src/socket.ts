import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import matchmakingService from './services/matchmakingService';
import gameService from './services/gameService';
import { SocketEvents, MatchmakingJoinPayload, PlayerMovePayload, PlayerShootPayload, GrenadeThrowPayload } from '../../shared/types';

export function setupSocketIO(io: Server) {
  // Initialize services
  matchmakingService.initialize(io);

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, secret) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`Player ${userId} connected (socket: ${socket.id})`);

    // ===== MATCHMAKING EVENTS =====

    socket.on(SocketEvents.MATCHMAKING_JOIN, async (payload: MatchmakingJoinPayload) => {
      console.log(`Player ${userId} joining matchmaking with weapon: ${payload.weaponChoice}`);
      await matchmakingService.addToQueue(userId, socket, payload.weaponChoice);
    });

    socket.on(SocketEvents.MATCHMAKING_LEAVE, () => {
      console.log(`Player ${userId} leaving matchmaking`);
      matchmakingService.removeFromQueue(userId);
    });

    // ===== GAME STATE EVENTS =====

    socket.on(SocketEvents.GAME_READY, () => {
      gameService.playerReady(userId);
    });

    // ===== PLAYER ACTION EVENTS =====

    socket.on(SocketEvents.PLAYER_MOVE, (payload: PlayerMovePayload) => {
      const gameRoom = gameService.getGameForPlayer(userId);
      if (gameRoom) {
        gameRoom.handlePlayerMove(userId, payload.position, payload.rotation, payload.velocity);
      }
    });

    socket.on(SocketEvents.PLAYER_SHOOT, (payload: PlayerShootPayload) => {
      const gameRoom = gameService.getGameForPlayer(userId);
      if (gameRoom) {
        gameRoom.handlePlayerShoot(userId, payload);
      }
    });

    socket.on(SocketEvents.PLAYER_RESPAWN, () => {
      const gameRoom = gameService.getGameForPlayer(userId);
      if (gameRoom) {
        gameRoom.handlePlayerRespawn(userId);
      }
    });

    socket.on(SocketEvents.PLAYER_GRENADE_THROW, (payload: GrenadeThrowPayload) => {
      const gameRoom = gameService.getGameForPlayer(userId);
      if (gameRoom) {
        gameRoom.handleGrenadeThrow(userId, payload);
      }
    });

    // ===== DISCONNECT =====

    socket.on('disconnect', () => {
      console.log(`Player ${userId} disconnected (socket: ${socket.id})`);
      matchmakingService.removeFromQueue(userId);
      gameService.handlePlayerDisconnect(userId);
    });
  });

  console.log('Socket.IO initialized');
}
