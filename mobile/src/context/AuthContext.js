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

  // Update profile (name / branch / semester / avatar image / skills).
  async function updateProfile({ name, branch, semester, avatar, skills, learning }) {
    const form = new FormData();
    if (name != null) form.append('name', name);
    if (branch != null) form.append('branch', branch);
    if (semester != null && semester !== '') form.append('semester', String(semester));
    // Arrays go over multipart as JSON strings; the server parses them back.
    if (Array.isArray(skills)) form.append('skills', JSON.stringify(skills));
    if (Array.isArray(learning)) form.append('learning', JSON.stringify(learning));
    if (avatar?.uri) {
      const n = avatar.fileName || avatar.uri.split('/').pop() || 'avatar.jpg';
      const ext = (n.split('.').pop() || 'jpg').toLowerCase();
      form.append('avatar', { uri: avatar.uri, name: n, type: avatar.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
    }
    const { data } = await api.patch('/auth/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
