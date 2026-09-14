import React, { createContext, useContext, useEffect, useState } from 'react';
import * as storage from '../utils/storage';
import api, { TOKEN_KEY } from '../api/client';

const ONBOARDED_KEY = 'campusbond_onboarded';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // restoring session on app start
  const [onboarded, setOnboarded] = useState(true); // has the intro been seen?
  // Root-level success overlay: { title, subtitle, finish } while it's showing.
  const [celebration, setCelebration] = useState(null);

  // On launch, restore any saved token and fetch the profile.
  useEffect(() => {
    (async () => {
      try {
        const [token, seenIntro] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(ONBOARDED_KEY),
        ]);
        setOnboarded(seenIntro === '1');
        if (token) {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        }
      } catch {
        await storage.deleteItem(TOKEN_KEY);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function saveSession(token, userData) {
    await storage.setItem(TOKEN_KEY, token);
    setUser(userData);
  }

  // Step 1 of signup: sends an OTP to the college email.
  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data; // { message, email }
  }

  // Step 2 of signup: verify the OTP and log in.
  // Pass { autoLogin: false } to keep the auth screens mounted (e.g. to play a
  // success animation) — the returned `finish()` then activates the session.
  async function verifyOtp(email, code, { autoLogin = true } = {}) {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    await storage.setItem(TOKEN_KEY, data.token);
    const finish = () => setUser(data.user);
    if (autoLogin) finish();
    return { user: data.user, finish };
  }

  async function resendOtp(email) {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  }

  // Same `autoLogin` option as verifyOtp, so the login screen can play its
  // success animation before the app switches to the main tabs.
  async function login(email, password, { autoLogin = true } = {}) {
    const { data } = await api.post('/auth/login', { email, password });
    await storage.setItem(TOKEN_KEY, data.token);
    const finish = () => setUser(data.user);
    if (autoLogin) finish();
    return { user: data.user, finish };
  }

  async function logout() {
    await storage.deleteItem(TOKEN_KEY);
    setUser(null);
  }

  // Mark the intro slides as seen so they don't show again.
  async function completeOnboarding() {
    setOnboarded(true);
    await storage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  }

  /**
   * Show the check-mark celebration above everything, then activate the
   * session. Auth screens call this with the `finish` returned by
   * login()/verifyOtp({ autoLogin: false }).
   */
  function celebrate({ title, subtitle, finish }) {
    setCelebration({ title, subtitle, finish });
  }
  const endCelebration = () => setCelebration(null);

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
    onboarded,
    isLoggedIn: !!user,
    completeOnboarding,
    celebration,
    celebrate,
    endCelebration,
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
