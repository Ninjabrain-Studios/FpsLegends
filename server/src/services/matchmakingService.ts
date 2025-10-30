import { Server, Socket } from 'socket.io';
import { WeaponType, MapName } from '../../../shared/types';
import { PLAYERS_PER_MATCH, MAP_NAMES } from '../../../shared/constants';
import { PrismaClient } from '@prisma/client';
import gameService from './gameService';

const prisma = new PrismaClient();

interface QueuedPlayer {
  userId: string;
  socketId: string;
  socket: Socket;
  discordUsername: string;
  discordAvatar: string;
  selectedSkin: string;
  weaponChoice: WeaponType;
  joinedAt: number;
}

class MatchmakingService {
  private queue: QueuedPlayer[] = [];
  private io: Server | null = null;

  initialize(io: Server) {
    this.io = io;
  }

  async addToQueue(userId: string, socket: Socket, weaponChoice: WeaponType) {
    // Check if player already in queue
    const existing = this.queue.find(p => p.userId === userId);
    if (existing) {
      console.log(`Player ${userId} already in queue`);
      return;
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error(`User ${userId} not found`);
      return;
    }

    const queuedPlayer: QueuedPlayer = {
      userId,
      socketId: socket.id,
      socket,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar || '',
      selectedSkin: user.selectedSkin,
      weaponChoice,
      joinedAt: Date.now()
    };

    this.queue.push(queuedPlayer);
    console.log(`Player ${user.discordUsername} joined queue. Queue size: ${this.queue.length}/${PLAYERS_PER_MATCH}`);

    // Check if we can create a match
    if (this.queue.length >= PLAYERS_PER_MATCH) {
      this.createMatch();
    }
  }

  removeFromQueue(userId: string) {
    const index = this.queue.findIndex(p => p.userId === userId);
    if (index !== -1) {
      const player = this.queue[index];
      this.queue.splice(index, 1);
      console.log(`Player ${player.discordUsername} left queue. Queue size: ${this.queue.length}`);
    }
  }

  private async createMatch() {
    if (!this.io) {
      console.error('Socket.io not initialized');
      return;
    }

    // Take first 8 players from queue
    const matchPlayers = this.queue.splice(0, PLAYERS_PER_MATCH);

    // Randomly select map
    const mapName: MapName = MAP_NAMES[Math.floor(Math.random() * MAP_NAMES.length)];

    // Assign teams (first 4 to red, next 4 to blue)
    const redTeam = matchPlayers.slice(0, 4);
    const bluTeam = matchPlayers.slice(4, 8);

    // Create match in game service
    const matchId = await gameService.createGame(matchPlayers, mapName, this.io);

    console.log(`Match ${matchId} created on map ${mapName}`);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isPlayerInQueue(userId: string): boolean {
    return this.queue.some(p => p.userId === userId);
  }
}

export default new MatchmakingService();
export { QueuedPlayer };
