import React, { useState, useEffect } from 'react';
import { networkManager } from '../game/NetworkManager';

export const HUD: React.FC = () => {
  const [health, setHealth] = useState(100);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [killFeed, setKillFeed] = useState<any[]>([]);
  const [isAlive, setIsAlive] = useState(true);
  const [respawnTimer, setRespawnTimer] = useState(0);

  useEffect(() => {
    networkManager.on('game:state_sync', (data: any) => {
      setRedScore(data.scores.red);
      setBlueScore(data.scores.blue);
      setTimeRemaining(data.timeRemaining);

      // Update local player health
      const localPlayer = data.players.find((p: any) => p.userId === 'localUserId');
      if (localPlayer) {
        setHealth(localPlayer.health);
        setIsAlive(localPlayer.isAlive);
      }
    });

    networkManager.on('player:killed', (data: any) => {
      setKillFeed(prev => [...prev.slice(-4), data]);

      // If we died, start respawn timer
      if (data.victimId === 'localUserId') {
        setIsAlive(false);
        setRespawnTimer(3);
      }
    });

    networkManager.on('player:hit', (data: any) => {
      setHealth(data.newHealth);
    });

    return () => {
      networkManager.off('game:state_sync');
      networkManager.off('player:killed');
      networkManager.off('player:hit');
    };
  }, []);

  useEffect(() => {
    if (respawnTimer > 0) {
      const timer = setTimeout(() => setRespawnTimer(respawnTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isAlive && respawnTimer === 0) {
      networkManager.requestRespawn();
      setIsAlive(true);
    }
  }, [respawnTimer, isAlive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.hud}>
      {/* Scoreboard */}
      <div style={styles.scoreboard}>
        <span style={{...styles.score, color: '#ff4444'}}>Red: {redScore}</span>
        <span style={styles.timer}>{formatTime(timeRemaining)}</span>
        <span style={{...styles.score, color: '#4444ff'}}>Blue: {blueScore}</span>
      </div>

      {/* Kill Feed */}
      <div style={styles.killFeed}>
        {killFeed.map((kill, i) => (
          <div key={i} style={styles.killItem}>
            <span>{kill.killerTeam === 'red' ? '🔴' : '🔵'} {kill.killerId}</span>
            <span style={styles.killWeapon}>[{kill.weapon}]</span>
            <span>{kill.victimId}</span>
          </div>
        ))}
      </div>

      {/* Health Bar */}
      <div style={styles.healthContainer}>
        <div style={{...styles.healthBar, width: `${health}%`}} />
        <span style={styles.healthText}>{health} HP</span>
      </div>

      {/* Crosshair */}
      {isAlive && <div style={styles.crosshair} />}

      {/* Death Screen */}
      {!isAlive && respawnTimer > 0 && (
        <div style={styles.deathScreen}>
          <h1>YOU DIED</h1>
          <p>Respawning in {respawnTimer}s</p>
        </div>
      )}

      {/* Instructions */}
      <div style={styles.instructions}>
        WASD: Move | Mouse: Look | Left Click: Shoot | R: Reload | G: Grenade
      </div>
    </div>
  );
};

const styles = {
  hud: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    color: 'white',
    fontFamily: 'monospace'
  },
  scoreboard: {
    position: 'absolute' as const,
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '40px',
    background: 'rgba(0,0,0,0.5)',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '1.2rem',
    fontWeight: 'bold' as const
  },
  score: {
    minWidth: '100px'
  },
  timer: {
    fontSize: '1.5rem'
  },
  killFeed: {
    position: 'absolute' as const,
    top: '80px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px'
  },
  killItem: {
    background: 'rgba(0,0,0,0.6)',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    display: 'flex',
    gap: '10px'
  },
  killWeapon: {
    color: '#ffaa00'
  },
  healthContainer: {
    position: 'absolute' as const,
    bottom: '40px',
    left: '20px',
    width: '300px',
    height: '30px',
    background: 'rgba(0,0,0,0.5)',
    borderRadius: '4px',
    overflow: 'hidden' as const,
    border: '2px solid rgba(255,255,255,0.3)'
  },
  healthBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff4444 0%, #ff8844 100%)',
    transition: 'width 0.3s'
  },
  healthText: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold' as const,
    textShadow: '1px 1px 2px black'
  },
  crosshair: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '20px',
    height: '20px',
    '::before': {
      content: '""',
      position: 'absolute' as const,
      width: '2px',
      height: '20px',
      background: 'white',
      left: '9px'
    },
    '::after': {
      content: '""',
      position: 'absolute' as const,
      width: '20px',
      height: '2px',
      background: 'white',
      top: '9px'
    }
  },
  deathScreen: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
    background: 'rgba(0,0,0,0.8)',
    padding: '40px 80px',
    borderRadius: '12px'
  },
  instructions: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.5)',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '0.9rem'
  }
};
