/**
 * This file contains environment variables for production
 */
export interface Environment {
  production: boolean;
  apiUrl: string;
  websocketUrl: string;
  defaultAvatarUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  websocketUrl: 'wss://[YOUR_DOMAIN]/ws',
  defaultAvatarUrl: 'https://placehold.co/100x100/e0e0e0/757575?text=??'
};
