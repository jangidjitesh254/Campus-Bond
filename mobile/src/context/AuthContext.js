import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // restoring session on app start

  // On launch, restore any saved token and fetch the profile.
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function saveSession(token, userData) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setUser(userData);
  }

  // Step 1 of signup: sends an OTP to the college email.
  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data; // { message, email }
  }

  // Step 2 of signup: verify the OTP and log in.
  async function verifyOtp(email, code) {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    await saveSession(data.token, data.user);
    return data.user;
  }

  async function resendOtp(email) {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    await saveSession(data.token, data.user);
    return data.user;
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  }

  // Let screens refresh the cached user (e.g. after profile edits).
  async function refreshUser() {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }

  const value = {
    user,
    booting,
    isLoggedIn: !!user,
    register,
    verifyOtp,
    resendOtp,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
