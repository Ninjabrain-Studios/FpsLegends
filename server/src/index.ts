import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupSocketIO } from './socket';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
});

// Setup Socket.IO event handlers
setupSocketIO(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                  FPS LEGENDS SERVER                   ║
╠═══════════════════════════════════════════════════════╣
║  Status: Running                                      ║
║  Port: ${PORT.toString().padEnd(45)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(38)}║
╠═══════════════════════════════════════════════════════╣
║  API: http://localhost:${PORT}/api                      ║
║  WebSocket: ws://localhost:${PORT}                      ║
╚═══════════════════════════════════════════════════════╝
  `);

  console.log('✓ Express app initialized');
  console.log('✓ Socket.IO initialized');
  console.log('✓ Ready to accept connections\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
