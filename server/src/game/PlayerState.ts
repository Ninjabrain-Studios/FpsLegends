import { Vector3, Team, WeaponType } from '../../../shared/types';
import { PLAYER_MAX_HEALTH } from '../../../shared/constants';

export class PlayerState {
  userId: string;
  socketId: string;
  discordUsername: string;
  discordAvatar: string;
  selectedSkin: string;
  team: Team;
  weaponChoice: WeaponType;

  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;

  health: number;
  isAlive: boolean;
  currentWeapon: WeaponType;

  kills: number;
  deaths: number;

  lastDeathTime: number;
  grenadesRemaining: number;

  isReady: boolean;

  constructor(
    userId: string,
    socketId: string,
    discordUsername: string,
    discordAvatar: string,
    selectedSkin: string,
    team: Team,
    weaponChoice: WeaponType
  ) {
    this.userId = userId;
    this.socketId = socketId;
    this.discordUsername = discordUsername;
    this.discordAvatar = discordAvatar;
    this.selectedSkin = selectedSkin;
    this.team = team;
    this.weaponChoice = weaponChoice;

    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };

    this.health = PLAYER_MAX_HEALTH;
    this.isAlive = true;
    this.currentWeapon = weaponChoice;

    this.kills = 0;
    this.deaths = 0;

    this.lastDeathTime = 0;
    this.grenadesRemaining = 2;

    this.isReady = false;
  }

  updatePosition(position: Vector3, rotation: Vector3, velocity: Vector3) {
    this.position = position;
    this.rotation = rotation;
    this.velocity = velocity;
  }

  takeDamage(damage: number): boolean {
    if (!this.isAlive) return false;

    this.health = Math.max(0, this.health - damage);

    if (this.health <= 0) {
      this.die();
      return true; // Player died
    }

    return false; // Player still alive
  }

  die() {
    this.isAlive = false;
    this.health = 0;
    this.deaths++;
    this.lastDeathTime = Date.now();
  }

  respawn(spawnPosition: Vector3) {
    this.health = PLAYER_MAX_HEALTH;
    this.isAlive = true;
    this.position = spawnPosition;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.grenadesRemaining = 2;
    this.currentWeapon = this.weaponChoice;
  }

  addKill() {
    this.kills++;
  }

  canRespawn(): boolean {
    if (this.isAlive) return false;
    const timeSinceDeath = Date.now() - this.lastDeathTime;
    return timeSinceDeath >= 3000; // 3 seconds respawn delay
  }

  getStateSync() {
    return {
      userId: this.userId,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      isAlive: this.isAlive,
      currentWeapon: this.currentWeapon
    };
  }
}
