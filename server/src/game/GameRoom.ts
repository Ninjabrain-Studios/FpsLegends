import { Server, Socket } from 'socket.io';
import { PlayerState } from './PlayerState';
import { MapName, Team, Vector3, PlayerShootPayload, GrenadeThrowPayload } from '../../../shared/types';
import { MATCH_DURATION, MATCH_KILL_TARGET, WEAPON_STATS, STATE_SYNC_INTERVAL, HEADSHOT_MULTIPLIER, SocketEvents } from '../../../shared/constants';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GameRoom {
  matchId: string;
  mapName: MapName;
  players: Map<string, PlayerState>;
  io: Server;

  redTeamScore: number;
  blueTeamScore: number;

  isStarted: boolean;
  startTime: number;
  endTime: number | null;

  stateSyncInterval: NodeJS.Timeout | null;
  gameEndTimeout: NodeJS.Timeout | null;

  spawnPoints: { red: Vector3[]; blue: Vector3[] };

  constructor(matchId: string, mapName: MapName, players: PlayerState[], io: Server) {
    this.matchId = matchId;
    this.mapName = mapName;
    this.players = new Map();
    this.io = io;

    players.forEach(p => this.players.set(p.userId, p));

    this.redTeamScore = 0;
    this.blueTeamScore = 0;

    this.isStarted = false;
    this.startTime = 0;
    this.endTime = null;

    this.stateSyncInterval = null;
    this.gameEndTimeout = null;

    // Set spawn points based on map
    this.spawnPoints = this.getMapSpawnPoints(mapName);
  }

  getMapSpawnPoints(mapName: MapName): { red: Vector3[]; blue: Vector3[] } {
    // Simplified spawn points - in production, these would be more varied
    switch (mapName) {
      case 'Downtown':
        return {
          red: [
            { x: -20, y: 0, z: -20 },
            { x: -18, y: 0, z: -22 },
            { x: -22, y: 0, z: -18 },
            { x: -20, y: 0, z: -24 }
          ],
          blue: [
            { x: 20, y: 0, z: 20 },
            { x: 18, y: 0, z: 22 },
            { x: 22, y: 0, z: 18 },
            { x: 20, y: 0, z: 24 }
          ]
        };
      case 'Warehouse':
        return {
          red: [
            { x: -30, y: 0, z: 0 },
            { x: -28, y: 0, z: 2 },
            { x: -32, y: 0, z: -2 },
            { x: -30, y: 0, z: 4 }
          ],
          blue: [
            { x: 30, y: 0, z: 0 },
            { x: 28, y: 0, z: 2 },
            { x: 32, y: 0, z: -2 },
            { x: 30, y: 0, z: 4 }
          ]
        };
      case 'Sandstorm':
        return {
          red: [
            { x: -40, y: 0, z: -10 },
            { x: -38, y: 0, z: -12 },
            { x: -42, y: 0, z: -8 },
            { x: -40, y: 0, z: -14 }
          ],
          blue: [
            { x: 40, y: 0, z: 10 },
            { x: 38, y: 0, z: 12 },
            { x: 42, y: 0, z: 8 },
            { x: 40, y: 0, z: 14 }
          ]
        };
    }
  }

  start() {
    this.isStarted = true;
    this.startTime = Date.now();

    // Spawn all players
    this.players.forEach(player => {
      const spawnPoint = this.getRandomSpawnPoint(player.team);
      player.respawn(spawnPoint);
    });

    // Start state sync
    this.stateSyncInterval = setInterval(() => {
      this.broadcastGameState();
    }, STATE_SYNC_INTERVAL);

    // Set game end timeout
    this.gameEndTimeout = setTimeout(() => {
      this.endGame('time');
    }, MATCH_DURATION * 1000);

    console.log(`Game ${this.matchId} started on map ${this.mapName}`);
  }

  getRandomSpawnPoint(team: Team): Vector3 {
    const spawns = this.spawnPoints[team];
    return spawns[Math.floor(Math.random() * spawns.length)];
  }

  handlePlayerMove(userId: string, position: Vector3, rotation: Vector3, velocity: Vector3) {
    const player = this.players.get(userId);
    if (player && player.isAlive) {
      player.updatePosition(position, rotation, velocity);
    }
  }

  handlePlayerShoot(userId: string, payload: PlayerShootPayload) {
    const shooter = this.players.get(userId);
    if (!shooter || !shooter.isAlive) return;

    // Broadcast shot fired to all other players
    this.broadcastToRoom(SocketEvents.PLAYER_SHOT_FIRED, {
      userId,
      weapon: payload.weapon,
      origin: payload.origin,
      direction: payload.direction
    }, userId);

    // Check if hit a player
    if (payload.hitPlayerId) {
      const victim = this.players.get(payload.hitPlayerId);
      if (!victim || !victim.isAlive) return;

      // Verify teams (can't shoot teammates)
      if (shooter.team === victim.team) return;

      // Calculate damage
      let damage = WEAPON_STATS[payload.weapon]?.damage || 0;

      if (payload.weapon === 'Sniper') {
        damage = payload.isHeadshot ? WEAPON_STATS.Sniper.headshotDamage : WEAPON_STATS.Sniper.damage;
      } else if (payload.isHeadshot) {
        damage *= HEADSHOT_MULTIPLIER;
      }

      // Apply damage
      const died = victim.takeDamage(damage);

      // Notify victim
      this.io.to(victim.socketId).emit(SocketEvents.PLAYER_HIT, {
        damage,
        newHealth: victim.health,
        attackerId: userId,
        weaponUsed: payload.weapon
      });

      // If killed
      if (died) {
        shooter.addKill();

        // Update team score
        if (shooter.team === 'red') {
          this.redTeamScore++;
        } else {
          this.blueTeamScore++;
        }

        // Broadcast kill
        this.broadcastToRoom(SocketEvents.PLAYER_KILLED, {
          victimId: victim.userId,
          killerId: shooter.userId,
          weapon: payload.weapon,
          isHeadshot: payload.isHeadshot,
          killerTeam: shooter.team,
          victimTeam: victim.team
        });

        // Check win condition
        if (this.redTeamScore >= MATCH_KILL_TARGET || this.blueTeamScore >= MATCH_KILL_TARGET) {
          this.endGame('kills');
        }
      }
    }
  }

  handlePlayerRespawn(userId: string) {
    const player = this.players.get(userId);
    if (!player || player.isAlive) return;

    if (player.canRespawn()) {
      const spawnPoint = this.getRandomSpawnPoint(player.team);
      player.respawn(spawnPoint);

      this.broadcastToRoom(SocketEvents.PLAYER_RESPAWNED, {
        userId: player.userId,
        position: spawnPoint,
        team: player.team
      });
    }
  }

  handleGrenadeThrow(userId: string, payload: GrenadeThrowPayload) {
    const player = this.players.get(userId);
    if (!player || !player.isAlive || player.grenadesRemaining <= 0) return;

    player.grenadesRemaining--;

    const grenadeId = `grenade_${Date.now()}_${Math.random()}`;

    // Broadcast grenade thrown
    this.broadcastToRoom(SocketEvents.GRENADE_THROWN, {
      grenadeId,
      userId,
      position: payload.position,
      velocity: payload.velocity
    });

    // Simulate grenade explosion after fuse time
    setTimeout(() => {
      this.handleGrenadeExplosion(grenadeId, player.userId, payload);
    }, WEAPON_STATS.Grenade.fuseTime);
  }

  handleGrenadeExplosion(grenadeId: string, throwerId: string, throwPayload: GrenadeThrowPayload) {
    const thrower = this.players.get(throwerId);
    if (!thrower) return;

    // Calculate explosion position (simplified - just use throw position)
    const explosionPos = throwPayload.position;

    const damagedPlayers: { userId: string; damage: number }[] = [];

    // Check damage to all players in radius
    this.players.forEach(player => {
      if (!player.isAlive) return;

      const distance = this.calculateDistance(player.position, explosionPos);

      if (distance <= WEAPON_STATS.Grenade.blastRadius) {
        // Calculate damage based on distance
        const damageRatio = 1 - (distance / WEAPON_STATS.Grenade.blastRadius);
        const damage = Math.floor(
          WEAPON_STATS.Grenade.damageRadius +
          (WEAPON_STATS.Grenade.damageCenter - WEAPON_STATS.Grenade.damageRadius) * damageRatio
        );

        const died = player.takeDamage(damage);
        damagedPlayers.push({ userId: player.userId, damage });

        // Notify victim
        this.io.to(player.socketId).emit(SocketEvents.PLAYER_HIT, {
          damage,
          newHealth: player.health,
          attackerId: throwerId,
          weaponUsed: 'Grenade'
        });

        // If killed
        if (died && thrower.team !== player.team) {
          thrower.addKill();

          if (thrower.team === 'red') {
            this.redTeamScore++;
          } else {
            this.blueTeamScore++;
          }

          this.broadcastToRoom(SocketEvents.PLAYER_KILLED, {
            victimId: player.userId,
            killerId: throwerId,
            weapon: 'Grenade',
            isHeadshot: false,
            killerTeam: thrower.team,
            victimTeam: player.team
          });
        }
      }
    });

    // Broadcast explosion
    this.broadcastToRoom(SocketEvents.GRENADE_EXPLODED, {
      grenadeId,
      position: explosionPos,
      damagedPlayers
    });

    // Check win condition
    if (this.redTeamScore >= MATCH_KILL_TARGET || this.blueTeamScore >= MATCH_KILL_TARGET) {
      this.endGame('kills');
    }
  }

  calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  broadcastGameState() {
    if (!this.isStarted) return;

    const timeRemaining = Math.max(0, MATCH_DURATION - Math.floor((Date.now() - this.startTime) / 1000));

    const playerStates = Array.from(this.players.values()).map(p => p.getStateSync());

    this.broadcastToRoom(SocketEvents.GAME_STATE_SYNC, {
      players: playerStates,
      scores: {
        red: this.redTeamScore,
        blue: this.blueTeamScore
      },
      timeRemaining
    });
  }

  async endGame(reason: 'kills' | 'time') {
    if (this.endTime !== null) return; // Already ended

    this.endTime = Date.now();
    const duration = Math.floor((this.endTime - this.startTime) / 1000);

    // Determine winner
    const winningTeam: Team = this.redTeamScore > this.blueTeamScore ? 'red' : 'blue';

    // Stop game loop
    if (this.stateSyncInterval) {
      clearInterval(this.stateSyncInterval);
    }
    if (this.gameEndTimeout) {
      clearTimeout(this.gameEndTimeout);
    }

    // Prepare player stats
    const playerStats = Array.from(this.players.values()).map(p => ({
      userId: p.userId,
      discordUsername: p.discordUsername,
      team: p.team,
      kills: p.kills,
      deaths: p.deaths
    }));

    // Save match to database
    try {
      await this.saveMatchToDatabase(winningTeam, duration, playerStats);
    } catch (error) {
      console.error('Error saving match:', error);
    }

    // Broadcast game end
    this.broadcastToRoom(SocketEvents.GAME_END, {
      winningTeam,
      finalScores: {
        red: this.redTeamScore,
        blue: this.blueTeamScore
      },
      matchDuration: duration,
      playerStats,
      matchId: this.matchId
    });

    console.log(`Game ${this.matchId} ended. Winner: ${winningTeam} team`);
  }

  async saveMatchToDatabase(winningTeam: Team, duration: number, playerStats: any[]) {
    // Create match record
    const match = await prisma.match.create({
      data: {
        id: this.matchId,
        mapName: this.mapName,
        winningTeam,
        redTeamKills: this.redTeamScore,
        blueTeamKills: this.blueTeamScore,
        duration,
        startedAt: new Date(this.startTime),
        endedAt: new Date(this.endTime!)
      }
    });

    // Create match player records and update player stats
    for (const playerStat of playerStats) {
      // Create match player record
      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          userId: playerStat.userId,
          team: playerStat.team,
          kills: playerStat.kills,
          deaths: playerStat.deaths
        }
      });

      // Update player lifetime stats
      const won = playerStat.team === winningTeam;

      await prisma.playerStats.update({
        where: { userId: playerStat.userId },
        data: {
          totalKills: { increment: playerStat.kills },
          totalDeaths: { increment: playerStat.deaths },
          totalWins: { increment: won ? 1 : 0 },
          totalLosses: { increment: won ? 0 : 1 },
          totalMatches: { increment: 1 }
        }
      });
    }
  }

  broadcastToRoom(event: string, data: any, excludeUserId?: string) {
    this.players.forEach(player => {
      if (excludeUserId && player.userId === excludeUserId) return;
      this.io.to(player.socketId).emit(event, data);
    });
  }

  cleanup() {
    if (this.stateSyncInterval) {
      clearInterval(this.stateSyncInterval);
    }
    if (this.gameEndTimeout) {
      clearTimeout(this.gameEndTimeout);
    }
  }
}
