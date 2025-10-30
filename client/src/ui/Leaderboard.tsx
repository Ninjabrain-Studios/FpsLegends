import React, { useState, useEffect } from 'react';

export const Leaderboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'kills' | 'wins' | 'kd'>('kills');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/stats/leaderboard?sortBy=${sortBy}`);
      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setLoading(false);
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Loading Leaderboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{...styles.card, ...styles.wideCard}}>
        <h1>Leaderboard</h1>

        <div style={styles.sortButtons}>
          <button style={{...styles.sortButton, ...(sortBy === 'kills' ? styles.sortButtonActive : {})}} onClick={() => setSortBy('kills')}>
            Top Kills
          </button>
          <button style={{...styles.sortButton, ...(sortBy === 'wins' ? styles.sortButtonActive : {})}} onClick={() => setSortBy('wins')}>
            Top Wins
          </button>
          <button style={{...styles.sortButton, ...(sortBy === 'kd' ? styles.sortButtonActive : {})}} onClick={() => setSortBy('kd')}>
            Top K/D
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Kills</th>
              <th style={styles.th}>Deaths</th>
              <th style={styles.th}>K/D</th>
              <th style={styles.th}>Wins</th>
              <th style={styles.th}>Matches</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(player => (
              <tr key={player.userId} style={styles.row}>
                <td style={styles.td}>{player.rank}</td>
                <td style={{...styles.td, ...styles.playerCell}}>
                  {player.discordAvatar && <img src={player.discordAvatar} alt="" style={styles.avatar} />}
                  {player.discordUsername}
                </td>
                <td style={styles.td}>{player.totalKills}</td>
                <td style={styles.td}>{player.totalDeaths}</td>
                <td style={styles.td}>{player.kdRatio.toFixed(2)}</td>
                <td style={styles.td}>{player.totalWins}</td>
                <td style={styles.td}>{player.totalMatches}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button style={styles.backButton} onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    padding: '20px'
  },
  card: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center' as const
  },
  wideCard: {
    maxWidth: '900px',
    width: '100%'
  },
  sortButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    margin: '20px 0'
  },
  sortButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  sortButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '20px'
  },
  th: {
    padding: '15px',
    textAlign: 'left' as const,
    borderBottom: '2px solid rgba(255,255,255,0.3)',
    fontWeight: 'bold' as const
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  row: {
    transition: 'background 0.2s'
  },
  playerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%'
  },
  backButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '30px'
  }
};
