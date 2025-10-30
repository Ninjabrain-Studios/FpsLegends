import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { PLAYER_SKINS } from '../../../shared/constants';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/me - Get current user profile
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
      selectedSkin: user.selectedSkin,
      stats: user.stats ? {
        totalKills: user.stats.totalKills,
        totalDeaths: user.stats.totalDeaths,
        totalWins: user.stats.totalWins,
        totalLosses: user.stats.totalLosses,
        totalMatches: user.stats.totalMatches
      } : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/me/skin - Update selected player skin
router.patch('/me/skin', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { skin } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate skin selection
    if (!skin || !PLAYER_SKINS.includes(skin as any)) {
      return res.status(400).json({ error: 'Invalid skin selection' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { selectedSkin: skin }
    });

    res.json({
      selectedSkin: user.selectedSkin
    });
  } catch (error) {
    console.error('Update skin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
