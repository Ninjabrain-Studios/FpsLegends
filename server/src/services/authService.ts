import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export class AuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private jwtSecret: string;

  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || '';
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    this.redirectUri = process.env.DISCORD_REDIRECT_URI || '';
    this.jwtSecret = process.env.JWT_SECRET || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri || !this.jwtSecret) {
      throw new Error('Discord OAuth credentials not configured');
    }
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify'
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<string> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post<DiscordTokenResponse>(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Fetch user data from Discord
      const userResponse = await axios.get<DiscordUser>(
        'https://discord.com/api/users/@me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const discordUser = userResponse.data;

      // Check if user exists in database
      let user = await prisma.user.findUnique({
        where: { discordId: discordUser.id },
        include: { stats: true }
      });

      if (user) {
        // Update existing user
        user = await prisma.user.update({
          where: { discordId: discordUser.id },
          data: {
            discordUsername: discordUser.username,
            discordAvatar: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null
          },
          include: { stats: true }
        });
      } else {
        // Create new user with stats
        user = await prisma.user.create({
          data: {
            discordId: discordUser.id,
            discordUsername: discordUser.username,
            discordAvatar: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            selectedSkin: 'Urban Assault',
            stats: {
              create: {
                totalKills: 0,
                totalDeaths: 0,
                totalWins: 0,
                totalLosses: 0,
                totalMatches: 0
              }
            }
          },
          include: { stats: true }
        });
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user.id },
        this.jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return jwtToken;
    } catch (error) {
      console.error('Discord OAuth error:', error);
      throw new Error('Authentication failed');
    }
  }

  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true }
    });
  }
}

export default new AuthService();
