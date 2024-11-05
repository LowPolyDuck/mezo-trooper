import axios from 'axios';
import { DRIP_API_KEY, DRIP_REALM_ID } from '../config/config'

const DRIP_API_BASE = 'https://api.drip.re/api/v4';

// Axios instance to set up headers for authentication
const dripApi = axios.create({
    baseURL: DRIP_API_BASE,
    headers: {
        Authorization: `Bearer ${DRIP_API_KEY}`,
    },
});

// Function to get mats balance for a specific user
export const getUserMatsBalance = async (userId: string): Promise<number | null> => {
    try {
        const response = await dripApi.get(`/realms/${DRIP_REALM_ID}/members/${userId}`);
        return response.data.points || 0;
    } catch (error) {
        console.error('Error fetching mats balance:', error);
        return null;
    }
};

// Function to transfer mats to a user
export const transferMats = async (userId: string, amount: number): Promise<boolean> => {
    try {
        const response = await dripApi.patch(`/realms/${DRIP_REALM_ID}/members/${userId}/transfer`, {
            amount,
        });
        return response.status === 200;
    } catch (error) {
        console.error('Error transferring mats:', error);
        return false;
    }
};
