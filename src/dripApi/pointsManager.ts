import axios, { AxiosInstance } from 'axios';
import { DRIP_API_KEY, DRIP_REALM_ID } from '../config/config';

class PointsManagerSingleton {
  private static instance: PointsManagerSingleton;
  private apiClient: AxiosInstance;

  private constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://api.drip.re/api/v4',
      headers: {
        Authorization: `Bearer ${DRIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  static getInstance(): PointsManagerSingleton {
    if (!PointsManagerSingleton.instance) {
      PointsManagerSingleton.instance = new PointsManagerSingleton();
    }
    return PointsManagerSingleton.instance;
  }

  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.apiClient.get(`/realms/${DRIP_REALM_ID}/members/${userId}`);
      const balances = response.data.balances;
      const realmPointIds = Object.keys(balances || {});
      return balances ? balances[realmPointIds[0]] || 0 : 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async addPoints(userId: string, amount: number): Promise<boolean> {
    try {
      const response = await this.apiClient.patch(
        `/realms/${DRIP_REALM_ID}/members/${userId}/tokenBalance`,
        { tokens: amount }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Error adding points:', error);
      return false;
    }
  }

  async transferPoints(fromUserId: string, toUserId: string, amount: number): Promise<boolean> {
    try {
      const response = await this.apiClient.patch(
        `/realms/${DRIP_REALM_ID}/members/${fromUserId}/transfer`,
        {
          recipientId: toUserId,
          tokens: amount,
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Error transferring points:', error);
      return false;
    }
  }
}

export const pointsManager = PointsManagerSingleton.getInstance();
