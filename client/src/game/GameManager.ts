import { SceneManager } from './SceneManager';
import { networkManager } from './NetworkManager';
import { MapName, Team } from '../types';

export class GameManager {
  private sceneManager: SceneManager | null = null;
  private matchId: string | null = null;
  private playerTeam: Team | null = null;

  async initialize(matchId: string, mapName: MapName, yourTeam: Team, spawnPoint: { x: number; y: number; z: number }) {
    this.matchId = matchId;
    this.playerTeam = yourTeam;

    // Get canvas
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    canvas.style.display = 'block';

    // Initialize scene
    this.sceneManager = new SceneManager(canvas, mapName, yourTeam, spawnPoint);
    await this.sceneManager.initialize();

    // Setup network event listeners
    this.setupNetworkListeners();

    // Notify server we're ready
    networkManager.gameReady();

    // Request pointer lock
    canvas.onclick = () => {
      canvas.requestPointerLock();
    };
  }

  private setupNetworkListeners() {
    if (!this.sceneManager) return;

    // Game state sync
    networkManager.on('game:state_sync', (data: any) => {
      if (this.sceneManager) {
        this.sceneManager.updateRemotePlayers(data.players);
      }
    });

    // Player killed
    networkManager.on('player:killed', (data: any) => {
      if (this.sceneManager) {
        this.sceneManager.handlePlayerKilled(data);
      }
    });

    // Player respawned
    networkManager.on('player:respawned', (data: any) => {
      if (this.sceneManager) {
        this.sceneManager.handlePlayerRespawned(data);
      }
    });

    // Grenade thrown
    networkManager.on('grenade:thrown', (data: any) => {
      if (this.sceneManager) {
        this.sceneManager.spawnGrenade(data);
      }
    });

    // Grenade exploded
    networkManager.on('grenade:exploded', (data: any) => {
      if (this.sceneManager) {
        this.sceneManager.handleGrenadeExplosion(data);
      }
    });
  }

  cleanup() {
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    canvas.style.display = 'none';

    document.exitPointerLock();
  }
}

export const gameManager = new GameManager();
