# FPS Legends

A full-featured, browser-based multiplayer first-person shooter game built with Babylon.js, React, Node.js, and Socket.io.

## Features

- **Multiplayer Team Deathmatch**: 8-player matches (4v4)
- **3 Unique Maps**: Downtown (Urban), Warehouse (Industrial), Sandstorm (Desert)
- **7 Weapons**: Assault Rifle, SMG, Sniper, Shotgun, Pistol, Knife, Grenades
- **5 Player Skins**: Tactical operator models with team color overlays
- **Discord Authentication**: OAuth-based user authentication
- **Leaderboard System**: Track kills, deaths, K/D ratio, and wins
- **Real-time Multiplayer**: Server-authoritative game logic with WebSocket communication

## Technology Stack

### Frontend
- **Engine**: Babylon.js 6.x (3D rendering and physics)
- **UI**: React 18 with TypeScript
- **Build Tool**: Vite
- **Networking**: Socket.io-client

### Backend
- **Runtime**: Node.js 20.x with TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.io (WebSockets)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Discord OAuth 2.0 with JWT

## Project Structure

```
FpsLegends/
├── client/                 # Frontend Babylon.js game
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── main.tsx        # Entry point
│   │   ├── game/           # Game engine
│   │   │   ├── GameManager.ts
│   │   │   ├── SceneManager.ts
│   │   │   ├── Player.ts
│   │   │   └── NetworkManager.ts
│   │   ├── ui/             # React components
│   │   │   ├── MainMenu.tsx
│   │   │   ├── Lobby.tsx
│   │   │   ├── HUD.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── ProfileMenu.tsx
│   │   └── types/
│   └── package.json
│
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── index.ts        # Server entry
│   │   ├── app.ts          # Express setup
│   │   ├── socket.ts       # Socket.io handlers
│   │   ├── routes/         # REST API
│   │   ├── services/       # Business logic
│   │   ├── game/           # Game logic
│   │   └── db/
│   │       └── schema.prisma
│   └── package.json
│
├── shared/                 # Shared types
│   ├── types.ts
│   └── constants.ts
│
└── package.json            # Root monorepo
```

## Setup Instructions

### Prerequisites

- **Node.js**: v20.x or higher
- **PostgreSQL**: v14 or higher
- **Discord Application**: For OAuth authentication

### 1. Database Setup

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE fpslegends;
CREATE USER fpsuser WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE fpslegends TO fpsuser;
\q
```

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to OAuth2 settings
4. Add redirect URL: `http://localhost:3000/api/auth/discord/callback`
5. Copy your **Client ID** and **Client Secret**

### 3. Environment Configuration

#### Server Configuration

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://fpsuser:yourpassword@localhost:5432/fpslegends

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

JWT_SECRET=your_secure_random_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:5173
```

#### Client Configuration

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 5. Database Migration

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

### 6. Start Development

```bash
# From root directory (starts both server and client)
npm run dev
```

Access the game at: **http://localhost:5173**

## How to Play

### Getting Started

1. **Login**: Click "Login with Discord" and authorize
2. **Main Menu**: Select "Play" to enter matchmaking
3. **Weapon Selection**: Choose your primary weapon
4. **Find Match**: Join the queue (match starts when 8 players found)
5. **Game**: Fight to 50 kills or highest score when time expires

### Controls

- **W/A/S/D**: Movement
- **Mouse**: Look around
- **Left Click**: Shoot
- **R**: Reload
- **G**: Throw grenade

### Game Rules

- **Teams**: 4v4 (Red Team vs Blue Team)
- **Objective**: First team to 50 kills wins
- **Match Duration**: 10 minutes maximum
- **Respawn**: 3 second delay after death
- **Health**: 100 HP (no regeneration)
- **Headshots**: 2x damage

## Development

### Available Scripts

```bash
# Root
npm run dev              # Start both servers
npm run build           # Build both projects
npm run prisma:migrate  # Run database migrations

# Server
cd server
npm run dev             # Start with nodemon
npm run build           # Compile TypeScript

# Client
cd client
npm run dev             # Start Vite dev server
npm run build           # Build for production
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database (WARNING: deletes all data)
cd server
npx prisma migrate reset
```

## Architecture

- **Server-Authoritative**: All game logic validated server-side
- **Real-time Communication**: Socket.io for low-latency multiplayer
- **State Synchronization**: 10 updates per second
- **Client Prediction**: Smooth local movement with server reconciliation

## License

This project is for educational purposes.

---

**Enjoy playing FPS Legends!**