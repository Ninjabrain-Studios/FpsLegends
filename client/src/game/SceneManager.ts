import { Engine, Scene, UniversalCamera, Vector3, HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial, Color3, ShadowGenerator, Mesh } from '@babylonjs/core';
import { MapName, Team } from '../types';
import { Player } from './Player';
import { networkManager } from './NetworkManager';

export class SceneManager {
  private engine: Engine;
  private scene: Scene;
  private camera: UniversalCamera;
  private player: Player;
  private mapName: MapName;
  private playerTeam: Team;
  private spawnPoint: Vector3;
  private remotePlayers: Map<string, Mesh> = new Map();

  constructor(canvas: HTMLCanvasElement, mapName: MapName, playerTeam: Team, spawnPoint: { x: number; y: number; z: number }) {
    this.mapName = mapName;
    this.playerTeam = playerTeam;
    this.spawnPoint = new Vector3(spawnPoint.x, spawnPoint.y, spawnPoint.z);

    // Create engine and scene
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.5, 0.7, 1.0).toColor4();

    // Create camera
    this.camera = new UniversalCamera('camera', this.spawnPoint, this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.speed = 0.5;
    this.camera.angularSensibility = 1000;

    // Create player controller
    this.player = new Player(this.scene, this.camera, playerTeam);
  }

  async initialize() {
    // Setup lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene);
    dirLight.position = new Vector3(20, 40, 20);
    dirLight.intensity = 0.5;

    // Load map
    this.createMap();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.player.update();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private createMap() {
    // Ground
    const ground = MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, this.scene);
    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.3, 0.5, 0.3);
    ground.material = groundMat;

    // Create simple map based on mapName
    switch (this.mapName) {
      case 'Downtown':
        this.createUrbanMap();
        break;
      case 'Warehouse':
        this.createWarehouseMap();
        break;
      case 'Sandstorm':
        this.createDesertMap();
        break;
    }
  }

  private createUrbanMap() {
    // Create some buildings
    for (let i = 0; i < 5; i++) {
      const building = MeshBuilder.CreateBox(`building${i}`, { height: 15 + Math.random() * 10, width: 10, depth: 10 }, this.scene);
      building.position = new Vector3(
        (Math.random() - 0.5) * 80,
        (building.scaling.y * 15) / 2,
        (Math.random() - 0.5) * 80
      );

      const mat = new StandardMaterial(`buildingMat${i}`, this.scene);
      mat.diffuseColor = new Color3(0.6, 0.6, 0.6);
      building.material = mat;
    }

    // Create cover obstacles
    for (let i = 0; i < 10; i++) {
      const box = MeshBuilder.CreateBox(`cover${i}`, { height: 2, width: 3, depth: 1 }, this.scene);
      box.position = new Vector3(
        (Math.random() - 0.5) * 60,
        1,
        (Math.random() - 0.5) * 60
      );

      const mat = new StandardMaterial(`coverMat${i}`, this.scene);
      mat.diffuseColor = new Color3(0.5, 0.4, 0.3);
      box.material = mat;
    }
  }

  private createWarehouseMap() {
    // Warehouse walls
    const wall1 = MeshBuilder.CreateBox('wall1', { height: 15, width: 80, depth: 2 }, this.scene);
    wall1.position = new Vector3(0, 7.5, -40);

    const wall2 = MeshBuilder.CreateBox('wall2', { height: 15, width: 80, depth: 2 }, this.scene);
    wall2.position = new Vector3(0, 7.5, 40);

    const wall3 = MeshBuilder.CreateBox('wall3', { height: 15, width: 2, depth: 80 }, this.scene);
    wall3.position = new Vector3(-40, 7.5, 0);

    const wall4 = MeshBuilder.CreateBox('wall4', { height: 15, width: 2, depth: 80 }, this.scene);
    wall4.position = new Vector3(40, 7.5, 0);

    // Crates
    for (let i = 0; i < 15; i++) {
      const crate = MeshBuilder.CreateBox(`crate${i}`, { size: 3 }, this.scene);
      crate.position = new Vector3(
        (Math.random() - 0.5) * 60,
        1.5,
        (Math.random() - 0.5) * 60
      );

      const mat = new StandardMaterial(`crateMat${i}`, this.scene);
      mat.diffuseColor = new Color3(0.6, 0.4, 0.2);
      crate.material = mat;
    }
  }

  private createDesertMap() {
    // Terrain color
    const ground = this.scene.getMeshByName('ground');
    if (ground) {
      const mat = ground.material as StandardMaterial;
      mat.diffuseColor = new Color3(0.8, 0.7, 0.5);
    }

    // Bunkers
    for (let i = 0; i < 3; i++) {
      const bunker = MeshBuilder.CreateBox(`bunker${i}`, { height: 3, width: 6, depth: 6 }, this.scene);
      bunker.position = new Vector3(
        (Math.random() - 0.5) * 80,
        1.5,
        (Math.random() - 0.5) * 80
      );

      const mat = new StandardMaterial(`bunkerMat${i}`, this.scene);
      mat.diffuseColor = new Color3(0.6, 0.6, 0.5);
      bunker.material = mat;
    }

    // Rocks
    for (let i = 0; i < 20; i++) {
      const rock = MeshBuilder.CreateSphere(`rock${i}`, { diameter: 2 + Math.random() * 2 }, this.scene);
      rock.scaling.y = 0.6;
      rock.position = new Vector3(
        (Math.random() - 0.5) * 90,
        0.5,
        (Math.random() - 0.5) * 90
      );

      const mat = new StandardMaterial(`rockMat${i}`, this.scene);
      mat.diffuseColor = new Color3(0.5, 0.5, 0.4);
      rock.material = mat;
    }
  }

  updateRemotePlayers(players: any[]) {
    players.forEach(playerData => {
      if (playerData.userId === 'localUserId') return; // Skip local player

      let mesh = this.remotePlayers.get(playerData.userId);

      if (!mesh && playerData.isAlive) {
        // Create new remote player mesh
        mesh = MeshBuilder.CreateCylinder(`player_${playerData.userId}`, { height: 1.8, diameter: 0.8 }, this.scene);
        const mat = new StandardMaterial(`playerMat_${playerData.userId}`, this.scene);
        mat.diffuseColor = playerData.team === 'red' ? new Color3(1, 0.2, 0.2) : new Color3(0.2, 0.2, 1);
        mesh.material = mat;
        this.remotePlayers.set(playerData.userId, mesh);
      }

      if (mesh) {
        if (playerData.isAlive) {
          mesh.position = new Vector3(playerData.position.x, playerData.position.y + 0.9, playerData.position.z);
          mesh.isVisible = true;
        } else {
          mesh.isVisible = false;
        }
      }
    });
  }

  handlePlayerKilled(data: any) {
    console.log('Player killed:', data);
    // Visual effects could be added here
  }

  handlePlayerRespawned(data: any) {
    console.log('Player respawned:', data);
  }

  spawnGrenade(data: any) {
    // Create grenade mesh
    const grenade = MeshBuilder.CreateSphere(data.grenadeId, { diameter: 0.3 }, this.scene);
    const mat = new StandardMaterial('grenadeMat', this.scene);
    mat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    grenade.material = mat;
    grenade.position = new Vector3(data.position.x, data.position.y, data.position.z);
  }

  handleGrenadeExplosion(data: any) {
    // Remove grenade mesh
    const grenade = this.scene.getMeshByName(data.grenadeId);
    if (grenade) {
      grenade.dispose();
    }

    // Create explosion effect (simple sphere that expands and fades)
    const explosion = MeshBuilder.CreateSphere('explosion', { diameter: 1 }, this.scene);
    explosion.position = new Vector3(data.position.x, data.position.y, data.position.z);

    const mat = new StandardMaterial('explosionMat', this.scene);
    mat.diffuseColor = new Color3(1, 0.5, 0);
    mat.alpha = 0.6;
    explosion.material = mat;

    // Animate explosion
    let scale = 1;
    const interval = setInterval(() => {
      scale += 0.5;
      explosion.scaling = new Vector3(scale, scale, scale);
      mat.alpha -= 0.1;

      if (mat.alpha <= 0) {
        clearInterval(interval);
        explosion.dispose();
      }
    }, 50);
  }

  dispose() {
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
