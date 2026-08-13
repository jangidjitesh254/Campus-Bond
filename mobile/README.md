# Campus Bond — Mobile App (Expo)

React Native (Expo SDK 54) app for Campus Bond.
Pinned to SDK 54 to match Expo Go on the Play Store — don't bump the SDK unless your Expo Go supports it.

## Prerequisites

- The **backend** running first: `cd ../server && npm run dev`
- **Expo Go** installed on your phone (Android/iOS), OR an Android emulator
- Your **phone and computer on the same Wi-Fi network**

## Run

```bash
cd mobile
npm install        # first time only
npx expo start
```

Then scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

### How the app finds your backend

The app auto-detects your computer's LAN IP from the Expo dev server and calls the
backend on **port 5000** there — so it works on a real phone with no config.

If it can't connect:
1. Make sure the backend is running (`npm run dev` in `server/`).
2. Allow **Node.js through Windows Firewall** for port 5000 (private networks), or run once:
   ```powershell
   New-NetFirewallRule -DisplayName "Campus Bond API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   ```
3. To point at a specific/deployed server, create `mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
   ```

> In development, OTP codes are printed in the **backend server console** (no email setup needed).

## What's built (Phase 1)

- **Auth flow:** Sign up → email OTP verify → auto login. Session persists via secure storage.
- **Home:** Sunstone-style Explore grid + campus-score card.
- **Teams (Events):** feed with category filters, create post, detail view, apply, and an
  owner **approve/reject inbox** (`My Posts` / `Applied` tabs).
- **Menu:** profile, verified badge, log out.
- Community & Jobs tabs are placeholders for upcoming phases.

## Structure

```
mobile/
  App.js                     # providers + root navigator
  src/
    theme/                   # colors, spacing, typography (design tokens)
    api/                     # axios client (auto LAN-IP), events API
    context/AuthContext.js   # login/register/verify/logout + token storage
    components/              # Button, Field, Card, Chip, EventCard, ApplicantRow …
    navigation/              # RootNavigator, AppTabs, EventsStack
    screens/
      auth/                  # Login, Register, Otp
      events/                # Feed, Create, Detail, MyPosts
      HomeScreen, MenuScreen, PlaceholderScreen
```
