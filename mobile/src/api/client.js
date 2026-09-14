import axios from 'axios';
import Constants from 'expo-constants';
import * as storage from '../utils/storage';

/**
 * Work out the backend URL.
 *
 * When you run the app in Expo Go on your phone, "localhost" points to the
 * PHONE, not your computer. So we grab the computer's LAN IP from the Expo
 * dev-server host and talk to the backend on port 5000 there.
 *
 * To override (e.g. a deployed server), set EXPO_PUBLIC_API_URL in an .env
 * file or app config extra.
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
  const host = hostUri.split(':')[0] || 'localhost';
  return `http://${host}:5000`;
}

export const BASE_URL = resolveBaseUrl();
export const API_URL = `${BASE_URL}/api`;

export const TOKEN_KEY = 'campusbond_token';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach the saved JWT to every request.
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages so screens can show a friendly string.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.request ? 'Cannot reach the server. Is the backend running?' : error.message);
    return Promise.reject(new Error(message));
  }
);

export default api;
