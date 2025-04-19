/**
 * This file contains environment variables for development
 */
import { Environment } from './environment';

export const environment: Environment = {
  production: false,
  apiUrl: '/api', // Use the relative path that the proxy listens for
  websocketUrl: 'ws://localhost:8080/ws', // WebSocket URL usually doesn't go through the standard proxy
  defaultAvatarUrl: 'https://placehold.co/100x100/e0e0e0/757575?text=??'
};
