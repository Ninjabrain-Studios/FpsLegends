import React, { useState, useEffect } from 'react';
import { networkManager } from '../game/NetworkManager';

export const Lobby: React.FC<{ lobbyData: any; onGameStart: () => void }> = ({ lobbyData, onGameStart }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    networkManager.on('lobby:countdown', (data: { seconds: number }) => {
      setCountdown(data.seconds);
    });

    networkManager.on('game:start', () => {
      onGameStart();
    });

    return () => {
      networkManager.off('lobby:countdown');
      networkManager.off('game:start');
    };
  }, [onGameStart]);

  const redTeam = lobbyData.players.filter((p: any) => p.team === 'red');
  const blueTeam = lobbyData.players.filter((p: any) => p.team === 'blue');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Match Found!</h1>
        <h2>Map: {lobbyData.mapName}</h2>
        <h3>Starting in: {countdown}s</h3>

        <div style={styles.teamsContainer}>
          <div style={{...styles.team, ...styles.redTeam}}>
            <h3>Red Team</h3>
            {redTeam.map((player: any) => (
              <div key={player.userId} style={styles.player}>
                {player.discordAvatar && <img src={player.discordAvatar} alt="" style={styles.playerAvatar} />}
                <span>{player.discordUsername}</span>
              </div>
            ))}
          </div>

          <div style={{...styles.team, ...styles.blueTeam}}>
            <h3>Blue Team</h3>
            {blueTeam.map((player: any) => (
              <div key={player.userId} style={styles.player}>
                {player.discordAvatar && <img src={player.discordAvatar} alt="" style={styles.playerAvatar} />}
                <span>{player.discordUsername}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
  },
  card: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center' as const,
    minWidth: '600px'
  },
  teamsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginTop: '30px'
  },
  team: {
    padding: '20px',
    borderRadius: '8px'
  },
  redTeam: {
    background: 'rgba(255, 68, 68, 0.2)',
    border: '2px solid rgba(255, 68, 68, 0.5)'
  },
  blueTeam: {
    background: 'rgba(68, 68, 255, 0.2)',
    border: '2px solid rgba(68, 68, 255, 0.5)'
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    padding: '10px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '6px'
  },
  playerAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%'
  }
};
