import React, { useState, useEffect } from 'react';
import { networkManager } from '../game/NetworkManager';
import { Lobby } from './Lobby';
import { HUD } from './HUD';
import { Leaderboard } from './Leaderboard';
import { ProfileMenu } from './ProfileMenu';
import { WeaponType, UserProfile } from '../types';

type View = 'menu' | 'weaponSelect' | 'matchmaking' | 'lobby' | 'leaderboard' | 'profile' | 'game';

export const MainMenu: React.FC = () => {
  const [view, setView] = useState<View>('menu');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('AssaultRifle');
  const [lobbyData, setLobbyData] = useState<any>(null);

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !token) {
      handleOAuthCallback(code);
    } else if (token) {
      fetchUserProfile();
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/auth/discord/callback?code=${code}`);
      const data = await response.json();

      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        window.history.replaceState({}, '', '/');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/discord`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('menu');
  };

  const handleFindMatch = async () => {
    if (!token) return;

    try {
      await networkManager.connect(token);
      networkManager.joinMatchmaking(selectedWeapon);
      setView('matchmaking');

      networkManager.on('matchmaking:found', (data: any) => {
        setLobbyData(data);
        setView('lobby');
      });
    } catch (error) {
      console.error('Matchmaking error:', error);
    }
  };

  const handleGameStart = () => {
    setView('game');
  };

  // Not logged in - show login
  if (!token || !user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>FPS LEGENDS</h1>
          <p style={styles.subtitle}>A multiplayer first-person shooter</p>
          <button style={styles.button} onClick={handleLogin}>
            Login with Discord
          </button>
        </div>
      </div>
    );
  }

  // Weapon selection
  if (view === 'weaponSelect') {
    const weapons: WeaponType[] = ['AssaultRifle', 'SMG', 'Sniper', 'Shotgun'];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Select Your Weapon</h2>
          <div style={styles.weaponGrid}>
            {weapons.map(weapon => (
              <button
                key={weapon}
                style={{
                  ...styles.weaponButton,
                  ...(selectedWeapon === weapon ? styles.weaponButtonSelected : {})
                }}
                onClick={() => setSelectedWeapon(weapon)}
              >
                {weapon}
              </button>
            ))}
          </div>
          <button style={styles.button} onClick={handleFindMatch}>
            Find Match
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={() => setView('menu')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Matchmaking
  if (view === 'matchmaking') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Finding Match...</h2>
          <div style={styles.spinner}></div>
          <p>Searching for players...</p>
          <button style={styles.button} onClick={() => {
            networkManager.leaveMatchmaking();
            setView('menu');
          }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Lobby
  if (view === 'lobby' && lobbyData) {
    return <Lobby lobbyData={lobbyData} onGameStart={handleGameStart} />;
  }

  // Leaderboard
  if (view === 'leaderboard') {
    return <Leaderboard onBack={() => setView('menu')} />;
  }

  // Profile
  if (view === 'profile') {
    return <ProfileMenu user={user} onBack={() => setView('menu')} />;
  }

  // Game
  if (view === 'game') {
    return <HUD />;
  }

  // Main menu
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>FPS LEGENDS</h1>
        <div style={styles.userInfo}>
          {user.discordAvatar && <img src={user.discordAvatar} alt="Avatar" style={styles.avatar} />}
          <span>{user.discordUsername}</span>
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={() => setView('weaponSelect')}>
            Play
          </button>
          <button style={styles.button} onClick={() => setView('leaderboard')}>
            Leaderboard
          </button>
          <button style={styles.button} onClick={() => setView('profile')}>
            Profile
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={handleLogout}>
            Logout
          </button>
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
    minWidth: '400px',
    textAlign: 'center' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  },
  title: {
    fontSize: '3rem',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  subtitle: {
    marginBottom: '30px',
    opacity: 0.8
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '10px',
    width: '80%',
    transition: 'transform 0.2s'
  },
  secondaryButton: {
    background: 'rgba(255,255,255,0.2)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    alignItems: 'center'
  },
  weaponGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    margin: '20px 0'
  },
  weaponButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '2px solid transparent',
    padding: '20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  weaponButtonSelected: {
    borderColor: '#667eea',
    background: 'rgba(102, 126, 234, 0.3)'
  },
  spinner: {
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    margin: '20px auto'
  }
};
