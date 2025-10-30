import { Scene, UniversalCamera, Vector3, Ray } from '@babylonjs/core';
import { networkManager } from './NetworkManager';
import { Team, WeaponType } from '../types';

export class Player {
  private scene: Scene;
  private camera: UniversalCamera;
  private team: Team;
  private movementVector: Vector3 = Vector3.Zero();
  private lastMoveUpdate: number = 0;
  private moveUpdateInterval: number = 50; // Send movement every 50ms

  constructor(scene: Scene, camera: UniversalCamera, team: Team) {
    this.scene = scene;
    this.camera = camera;
    this.team = team;

    this.setupControls();
  }

  private setupControls() {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    // Mouse controls (already handled by camera.attachControl)

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};

    canvas.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;

      // Shoot on left click / space
      if (e.key === ' ' || e.button === 0) {
        this.shoot();
      }

      // Grenade on 'g'
      if (e.key.toLowerCase() === 'g') {
        this.throwGrenade();
      }
    });

    canvas.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.shoot();
      }
    });

    // Store keys reference
    (this as any).keys = keys;
  }

  update() {
    const keys = (this as any).keys as { [key: string]: boolean };

    // Movement
    let moved = false;
    const moveSpeed = 0.5;

    if (keys['w']) {
      this.camera.position.addInPlace(this.camera.getDirection(Vector3.Forward()).scale(moveSpeed));
      moved = true;
    }
    if (keys['s']) {
      this.camera.position.addInPlace(this.camera.getDirection(Vector3.Backward()).scale(moveSpeed));
      moved = true;
    }
    if (keys['a']) {
      this.camera.position.addInPlace(this.camera.getDirection(Vector3.Left()).scale(moveSpeed));
      moved = true;
    }
    if (keys['d']) {
      this.camera.position.addInPlace(this.camera.getDirection(Vector3.Right()).scale(moveSpeed));
      moved = true;
    }

    // Keep player above ground
    if (this.camera.position.y < 1.8) {
      this.camera.position.y = 1.8;
    }

    // Send movement to server (throttled)
    if (moved && Date.now() - this.lastMoveUpdate > this.moveUpdateInterval) {
      this.sendMovement();
      this.lastMoveUpdate = Date.now();
    }
  }

  private sendMovement() {
    const pos = this.camera.position;
    const rot = this.camera.rotation;
    const vel = Vector3.Zero(); // Simplified

    networkManager.sendPlayerMove({
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: rot.x, y: rot.y, z: rot.z },
      velocity: { x: vel.x, y: vel.y, z: vel.z }
    });
  }

  private shoot() {
    // Create ray from camera
    const origin = this.camera.position;
    const direction = this.camera.getDirection(Vector3.Forward());

    const ray = new Ray(origin, direction, 100);

    // Check for hits
    const hit = this.scene.pickWithRay(ray);

    let hitPlayerId = null;
    let hitPosition = null;
    let isHeadshot = false;

    if (hit && hit.pickedMesh) {
      // Check if hit a player mesh
      if (hit.pickedMesh.name.startsWith('player_')) {
        hitPlayerId = hit.pickedMesh.name.replace('player_', '');
        hitPosition = hit.pickedPoint ? { x: hit.pickedPoint.x, y: hit.pickedPoint.y, z: hit.pickedPoint.z } : null;

        // Simple headshot detection (if hit upper half of cylinder)
        if (hitPosition && hitPosition.y > hit.pickedMesh.position.y) {
          isHeadshot = true;
        }
      }
    }

    // Send shoot event to server
    networkManager.sendPlayerShoot({
      weapon: 'AssaultRifle' as WeaponType, // Simplified - would track current weapon
      origin: { x: origin.x, y: origin.y, z: origin.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      hitPlayerId,
      hitPosition,
      isHeadshot
    });
  }

  private throwGrenade() {
    const origin = this.camera.position;
    const direction = this.camera.getDirection(Vector3.Forward());

    networkManager.throwGrenade({
      position: { x: origin.x, y: origin.y, z: origin.z },
      velocity: { x: direction.x * 20, y: direction.y * 20 + 5, z: direction.z * 20 }
    });
  }
}
