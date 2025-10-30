import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { LEADERBOARD_DEFAULT_LIMIT, LEADERBOARD_MAX_LIMIT } from '../../../shared/constants';

const router = Router();
const prisma = new PrismaClient();

// GET /api/stats/leaderboard - Get leaderboard rankings
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const sortBy = req.query.sortBy as string || 'kills';
    const limitParam = parseInt(req.query.limit as string) || LEADERBOARD_DEFAULT_LIMIT;
    const limit = Math.min(limitParam, LEADERBOARD_MAX_LIMIT);

    let users;

    if (sortBy === 'wins') {
      users = await prisma.user.findMany({
        include: {
          stats: true
        },
        orderBy: {
          stats: {
            totalWins: 'desc'
          }
        },
        take: limit
      });
    } else if (sortBy === 'kills') {
      users = await prisma.user.findMany({
        include: {
          stats: true
        },
        orderBy: {
          stats: {
            totalKills: 'desc'
          }
        },
        take: limit
      });
    } else if (sortBy === 'kd') {
      // For K/D ratio, we need to fetch all users and sort in memory
      users = await prisma.user.findMany({
        include: {
          stats: true
        }
      });

      // Sort by K/D ratio (kills / deaths, handle division by zero)
      users.sort((a, b) => {
        const kdA = a.stats ? (a.stats.totalDeaths > 0 ? a.stats.totalKills / a.stats.totalDeaths : a.stats.totalKills) : 0;
        const kdB = b.stats ? (b.stats.totalDeaths > 0 ? b.stats.totalKills / b.stats.totalDeaths : b.stats.totalKills) : 0;
        return kdB - kdA;
      });

      users = users.slice(0, limit);
    } else {
      return res.status(400).json({ error: 'Invalid sortBy parameter' });
    }

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
      totalKills: user.stats?.totalKills || 0,
      totalDeaths: user.stats?.totalDeaths || 0,
      totalWins: user.stats?.totalWins || 0,
      totalMatches: user.stats?.totalMatches || 0,
      kdRatio: user.stats && user.stats.totalDeaths > 0
        ? parseFloat((user.stats.totalKills / user.stats.totalDeaths).toFixed(2))
        : (user.stats?.totalKills || 0)
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/match/:matchId - Get detailed match results
router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const players = match.players.map(mp => ({
      userId: mp.user.id,
      discordUsername: mp.user.discordUsername,
      discordAvatar: mp.user.discordAvatar,
      team: mp.team,
      kills: mp.kills,
      deaths: mp.deaths
    }));

    res.json({
      id: match.id,
      mapName: match.mapName,
      winningTeam: match.winningTeam,
      redTeamKills: match.redTeamKills,
      blueTeamKills: match.blueTeamKills,
      duration: match.duration,
      startedAt: match.startedAt.toISOString(),
      endedAt: match.endedAt?.toISOString() || null,
      players
    });
  } catch (error) {
    console.error('Match details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
