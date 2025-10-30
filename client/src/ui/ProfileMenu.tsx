import React, { useState } from 'react';
import { UserProfile, PlayerSkin } from '../types';

export const ProfileMenu: React.FC<{ user: UserProfile; onBack: () => void }> = ({ user, onBack }) => {
  const [selectedSkin, setSelectedSkin] = useState<PlayerSkin>(user.selectedSkin);
  const [saving, setSaving] = useState(false);

  const skins: PlayerSkin[] = ['Urban Assault', 'Desert Ranger', 'Heavy Armor', 'Stealth Ops', 'Engineer'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');

      await fetch(`${apiUrl}/api/users/me/skin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skin: selectedSkin })
      });

      alert('Skin saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save skin');
    }
    setSaving(false);
  };

  const stats = user.stats || {
    totalKills: 0,
    totalDeaths: 0,
    totalWins: 0,
    totalLosses: 0,
    totalMatches: 0
  };

  const kdRatio = stats.totalDeaths > 0 ? (stats.totalKills / stats.totalDeaths).toFixed(2) : stats.totalKills.toFixed(2);

  return (
    <div style={styles.container}>
      <div style={{...styles.card, ...styles.wideCard}}>
        <h1>Profile</h1>

        <div style={styles.profileHeader}>
          {user.discordAvatar && <img src={user.discordAvatar} alt="Avatar" style={styles.profileAvatar} />}
          <div>
            <h2>{user.discordUsername}</h2>
            <p style={styles.subtitle}>Level {Math.floor(stats.totalKills / 10) + 1}</p>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>{stats.totalKills}</h3>
            <p>Total Kills</p>
          </div>
          <div style={styles.statCard}>
            <h3>{stats.totalDeaths}</h3>
            <p>Total Deaths</p>
          </div>
          <div style={styles.statCard}>
            <h3>{kdRatio}</h3>
            <p>K/D Ratio</p>
          </div>
          <div style={styles.statCard}>
            <h3>{stats.totalWins}</h3>
            <p>Wins</p>
          </div>
          <div style={styles.statCard}>
            <h3>{stats.totalMatches}</h3>
            <p>Matches Played</p>
          </div>
          <div style={styles.statCard}>
            <h3>{stats.totalMatches > 0 ? ((stats.totalWins / stats.totalMatches) * 100).toFixed(1) : 0}%</h3>
            <p>Win Rate</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2>Select Operator Skin</h2>
          <div style={styles.skinsGrid}>
            {skins.map(skin => (
              <button
                key={skin}
                style={{
                  ...styles.skinButton,
                  ...(selectedSkin === skin ? styles.skinButtonSelected : {})
                }}
                onClick={() => setSelectedSkin(skin)}
              >
                {skin}
              </button>
            ))}
          </div>
          <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Skin'}
          </button>
        </div>

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
    maxWidth: '800px',
    width: '100%'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    justifyContent: 'center',
    marginBottom: '30px'
  },
  profileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%'
  },
  subtitle: {
    opacity: 0.7,
    marginTop: '5px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    background: 'rgba(255,255,255,0.1)',
    padding: '20px',
    borderRadius: '8px'
  },
  section: {
    marginTop: '30px'
  },
  skinsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    margin: '20px 0'
  },
  skinButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '2px solid transparent',
    padding: '20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '1rem'
  },
  skinButtonSelected: {
    borderColor: '#667eea',
    background: 'rgba(102, 126, 234, 0.3)'
  },
  saveButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px'
  },
  backButton: {
    background: 'rgba(255,255,255,0.2)',
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
