import { Router, Request, Response } from 'express';
import authService from '../services/authService';

const router = Router();

// GET /api/auth/discord - Initiate Discord OAuth flow
router.get('/discord', (req: Request, res: Response) => {
  const authUrl = authService.getAuthorizationUrl();
  res.redirect(authUrl);
});

// GET /api/auth/discord/callback - Handle Discord OAuth callback
router.get('/discord/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid authorization code' });
  }

  try {
    const token = await authService.exchangeCode(code);

    // Get user data to send with token
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET) as { userId: string };
    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    res.json({
      token,
      user: {
        id: user.id,
        discordUsername: user.discordUsername,
        discordAvatar: user.discordAvatar,
        selectedSkin: user.selectedSkin
      }
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

export default router;
