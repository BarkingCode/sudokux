# SudokuX - Complete Setup & Publishing Guide

This guide covers everything you need to publish SudokuX to the App Store and Play Store.

---

## Table of Contents

1. [Prerequisites & Accounts](#1-prerequisites--accounts)
2. [GitHub Repository](#2-github-repository)
3. [Apple Developer Setup](#3-apple-developer-setup)
4. [Google Play Developer Setup](#4-google-play-developer-setup)
5. [Google Cloud Console (Google Sign-In)](#5-google-cloud-console-google-sign-in)
6. [Supabase Backend](#6-supabase-backend)
7. [AdMob Setup](#7-admob-setup)
8. [EAS Build Configuration](#8-eas-build-configuration)
9. [Building & Submitting](#9-building--submitting)
10. [Post-Launch Checklist](#10-post-launch-checklist)

---

## 1. Prerequisites & Accounts

You'll need to create these accounts:

| Account | Cost | URL |
|---------|------|-----|
| Apple Developer Program | $99/year | https://developer.apple.com/programs/ |
| Google Play Developer | $25 one-time | https://play.google.com/console |
| Google Cloud Console | Free | https://console.cloud.google.com |
| AdMob | Free | https://admob.google.com |
| Supabase | Free tier | https://supabase.com |
| GitHub | Free | https://github.com |
| Expo | Free | https://expo.dev |

**Time to set up:** Allow 1-2 days for Apple account approval.

---

## 2. GitHub Repository

### Step 1: Create Repository

```bash
# Navigate to your project
cd /Users/artticfox/Desktop/Work/sudokux

# Initialize git (if not already)
git init

# Create .gitignore (already exists, but verify these are included)
cat >> .gitignore << 'EOF'
# Environment
.env
.env.local

# Native builds
ios/
android/

# Expo
.expo/

# Node
node_modules/

# Secrets
*.p8
*.mobileprovision
*.keystore
google-services.json
GoogleService-Info.plist
EOF

# Add all files
git add .

# Initial commit
git commit -m "Initial commit - SudokuX Sudoku game"
```

### Step 2: Push to GitHub

```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/sudokux.git
git branch -M main
git push -u origin main
```

### Step 3: Protect Secrets

Never commit these files:
- `.env` (contains Supabase keys)
- `*.keystore` (Android signing)
- `*.p8` (Apple auth keys)
- `google-services.json` (Firebase/Google)

---

## 3. Apple Developer Setup

### Step 1: Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID
4. Pay $99/year fee
5. Wait for approval (usually 24-48 hours)

### Step 2: Create App ID

1. Go to https://developer.apple.com/account/resources/identifiers
2. Click "+" to create new identifier
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Fill in:
   - Description: `SudokuX`
   - Bundle ID: `com.boraalap.sudokux` (Explicit)
6. Enable Capabilities:
   - [x] Game Center
   - [x] Push Notifications
7. Click "Continue" → "Register"

### Step 3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: `SudokuX - Sudoku Puzzles`
   - Primary Language: English (U.S.)
   - Bundle ID: Select `com.boraalap.sudokux`
   - SKU: `sudokux-ios-001`
   - User Access: Full Access

### Step 4: Configure Game Center

1. In App Store Connect, select your app
2. Go to **Features** → **Game Center**
3. Enable Game Center

**Create Leaderboards:**

| Leaderboard ID | Name | Score Format |
|----------------|------|--------------|
| `com.boraalap.sudokux.leaderboard.easy` | Best Time - Easy | Time (seconds), Low to High |
| `com.boraalap.sudokux.leaderboard.medium` | Best Time - Medium | Time (seconds), Low to High |
| `com.boraalap.sudokux.leaderboard.hard` | Best Time - Hard | Time (seconds), Low to High |

**Create Achievements:**

| Achievement ID | Name | Points |
|----------------|------|--------|
| `com.boraalap.sudokux.achievement.first_puzzle` | First Victory | 10 |
| `com.boraalap.sudokux.achievement.speed_demon` | Speed Demon | 25 |
| `com.boraalap.sudokux.achievement.perfectionist` | Perfectionist | 25 |
| `com.boraalap.sudokux.achievement.no_hints` | No Hints Needed | 15 |
| `com.boraalap.sudokux.achievement.streak_7` | Week Warrior | 25 |
| `com.boraalap.sudokux.achievement.streak_30` | Monthly Master | 50 |
| `com.boraalap.sudokux.achievement.games_10` | Getting Started | 10 |
| `com.boraalap.sudokux.achievement.games_50` | Dedicated Player | 25 |
| `com.boraalap.sudokux.achievement.games_100` | Sudoku Addict | 50 |

### Step 5: Create Sandbox Testers

1. Go to **Users and Access** → **Sandbox** → **Testers**
2. Click "+" to add a sandbox tester
3. Use this account to test Game Center & In-App Purchases

---

## 4. Google Play Developer Setup

### Step 1: Create Developer Account

1. Go to https://play.google.com/console
2. Sign in with Google account
3. Pay $25 one-time registration fee
4. Complete developer profile
5. Verify identity (may take 48 hours)

### Step 2: Create App

1. Click "Create app"
2. Fill in:
   - App name: `SudokuX - Sudoku Puzzles`
   - Default language: English (United States)
   - App type: Game
   - Free or paid: Free
3. Accept policies and create

### Step 3: Complete Store Listing

1. Go to **Grow** → **Store presence** → **Main store listing**
2. Fill in:
   - Short description (80 chars): `Beautiful brutalist Sudoku with daily challenges`
   - Full description (4000 chars): Describe features
   - App icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: Phone (2+), Tablet (optional)

### Step 4: Content Rating

1. Go to **Policy** → **App content** → **Content ratings**
2. Complete IARC questionnaire
3. Your app should get "Everyone" rating

### Step 5: Set Up App Signing

1. Go to **Setup** → **App signing**
2. Choose "Let Google manage and protect your app signing key"
3. Download the upload key certificate (you'll need SHA-1 for Google Sign-In)

**Get SHA-1 fingerprint:**
```bash
# For debug builds
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1

# For release builds (after EAS generates keystore)
eas credentials --platform android
```

---

## 5. Google Cloud Console (Google Sign-In)

This enables Google Sign-In for Android users (equivalent to Game Center on iOS).

### Step 1: Create Project

1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: `SudokuX`
4. Create

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select "External" → Create
3. Fill in:
   - App name: `SudokuX`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email) during testing phase
6. Save

### Step 3: Create OAuth Credentials

**Create Web Client ID (required for React Native):**

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `SudokuX Web Client`
5. No URIs needed
6. Create and copy the Client ID

**Create Android Client ID:**

1. Click "Create Credentials" → "OAuth client ID"
2. Application type: **Android**
3. Name: `SudokuX Android`
4. Package name: `com.boraalap.sudokux`
5. SHA-1 certificate fingerprint: (from Step 4.5 above)
6. Create

### Step 4: Update Environment Variables

Add to your `.env` file:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

---

## 6. Supabase Backend

### Current Status: Already Configured ✓

Your Supabase project is set up with these tables:
- `users` - User profiles with Game Center & Google IDs
- `game_sessions` - Completed game history
- `user_stats` - Stats, streaks, best times
- `achievements` - Unlocked achievements
- `daily_challenges` - Daily puzzles (generated by cron)
- `daily_completions` - Daily challenge results

### Environment Variables

Your `.env` file should contain:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Row Level Security (RLS)

Verify RLS is enabled on all tables:
1. Go to Supabase Dashboard → Table Editor
2. Each table should show "RLS Enabled"
3. Policies should allow users to only access their own data

---

## 7. AdMob Setup

### Step 1: Create AdMob Account

1. Go to https://admob.google.com
2. Sign in with Google account
3. Accept terms

### Step 2: Create Apps

**iOS App:**
1. Click "Apps" → "Add App"
2. Platform: iOS
3. "Is this app listed?" → No (for now)
4. App name: `SudokuX`
5. Note the **App ID**: `ca-app-pub-XXXXXXXX~XXXXXXXX`

**Android App:**
1. Click "Apps" → "Add App"
2. Platform: Android
3. "Is this app listed?" → No (for now)
4. App name: `SudokuX`
5. Note the **App ID**: `ca-app-pub-XXXXXXXX~XXXXXXXX`

### Step 3: Create Ad Units

For each platform, create these ad units:

| Type | Name | Usage |
|------|------|-------|
| Banner | `SudokuX Banner` | Home, Stats, Settings screens |
| Interstitial | `SudokuX Interstitial` | After completing chapter puzzles |
| Rewarded | `SudokuX Rewarded` | Unlock more games in Free Run |

Note the Ad Unit IDs for each.

### Step 4: Update app.json

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXX~XXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXX~XXXXXXXX"
        }
      ]
    ]
  }
}
```

### Step 5: Update Ad Config

Update `src/config/ads.ts` with your production Ad Unit IDs:

```typescript
export const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: 'ca-app-pub-XXXXX/XXXXX',
    android: 'ca-app-pub-XXXXX/XXXXX',
  }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-XXXXX/XXXXX',
    android: 'ca-app-pub-XXXXX/XXXXX',
  }),
  rewarded: Platform.select({
    ios: 'ca-app-pub-XXXXX/XXXXX',
    android: 'ca-app-pub-XXXXX/XXXXX',
  }),
};
```

**Important:** Use test IDs during development! See `src/config/ads.ts` for test IDs.

---

## 8. EAS Build Configuration

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure EAS

```bash
eas build:configure
```

This creates `eas.json`. Update it:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Step 3: Set Up Secrets

```bash
# Set environment variables for builds
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-client-id.apps.googleusercontent.com"
```

### Step 4: iOS Credentials

EAS can manage credentials automatically:

```bash
eas credentials --platform ios
```

Or manually:
1. Create App Store Connect API Key in App Store Connect → Users → Keys
2. Download the `.p8` file
3. Add to EAS: `eas credentials --platform ios`

### Step 5: Android Credentials

For first build, EAS generates a keystore automatically. For Play Store:

1. Create a Google Cloud Service Account for Play Console
2. Download the JSON key file
3. Add to Play Console: Setup → API access
4. Save as `google-service-account.json` (don't commit!)

---

## 9. Building & Submitting

### Development Build (Testing)

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Physical device (internal distribution)
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build

```bash
# Build for App Store
eas build --profile production --platform ios

# Build for Play Store
eas build --profile production --platform android
```

### Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

Or submit manually:
- **iOS:** Download .ipa from Expo, upload via Transporter app
- **Android:** Download .aab from Expo, upload in Play Console

---

## 10. Post-Launch Checklist

### Before First Submission

- [ ] GitHub repository created and code pushed
- [ ] Apple Developer account approved
- [ ] Google Play Developer account verified
- [ ] App Store Connect app created
- [ ] Play Console app created
- [ ] Game Center leaderboards & achievements configured
- [ ] Google Sign-In configured
- [ ] AdMob apps & ad units created
- [ ] Production ad unit IDs in code
- [ ] App icons and screenshots ready
- [ ] Privacy policy URL (required for both stores)
- [ ] Terms of service URL (optional but recommended)
- [ ] Test on real devices (iOS & Android)

### Store Listing Assets Needed

**App Store (iOS):**
- App icon: 1024x1024 PNG (no alpha)
- Screenshots: 6.5" (1284x2778), 5.5" (1242x2208)
- App Preview video (optional): 15-30 seconds

**Play Store (Android):**
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: Phone (1080x1920 min), Tablet (optional)
- Promo video (optional): YouTube URL

### Privacy & Legal

Create these pages (can be simple GitHub Pages or Notion):
- Privacy Policy (required) - What data you collect
- Terms of Service (recommended)

**Required disclosures:**
- AdMob collects advertising identifiers
- Supabase stores user game data
- Game Center/Google Sign-In for account linking

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        SudokuX App                           │
├──────────────────────────────────────────────────────────────┤
│  src/utils/identity.ts                                       │
│  ├── Local UUID (canonical identity)                         │
│  ├── Syncs to Supabase                                       │
│  ├── Links to Game Center (iOS)                              │
│  └── Links to Google Sign-In (Android)                       │
├──────────────────────────────────────────────────────────────┤
│  src/services/                                               │
│  ├── gameCenter.ts       ←→  iOS Game Center                 │
│  ├── googleSignIn.ts     ←→  Android Google Sign-In          │
│  ├── userService.ts      ←→  Supabase users table            │
│  ├── statsService.ts     ←→  Supabase game_sessions/stats    │
│  ├── dailyChallengeService.ts ←→ Supabase daily_challenges   │
│  └── leaderboardService.ts ←→ Supabase leaderboards          │
├──────────────────────────────────────────────────────────────┤
│                     External Services                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐ │
│  │  Supabase  │  │Game Center │  │  Google    │  │ AdMob  │ │
│  │ (Database) │  │   (iOS)    │  │  Sign-In   │  │ (Ads)  │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Useful Commands

```bash
# Development
npm start                    # Start Metro bundler
npx expo run:ios            # Run on iOS simulator
npx expo run:android        # Run on Android emulator

# Building
eas build --platform ios --profile development
eas build --platform android --profile development
eas build --platform all --profile production

# Submitting
eas submit --platform ios
eas submit --platform android

# Credentials
eas credentials --platform ios
eas credentials --platform android

# Secrets
eas secret:list
eas secret:create --name KEY --value "value"

# Logs
eas build:list
eas build:view [BUILD_ID]
```

---

## Troubleshooting

### iOS Build Fails

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean and rebuild
cd ios && pod deintegrate && pod install && cd ..
npx expo run:ios
```

### Android Build Fails

```bash
# Clean Gradle
cd android && ./gradlew clean && cd ..
npx expo run:android
```

### Game Center Not Working

1. Verify entitlements in `app.json`
2. Check App Store Connect has Game Center enabled
3. Use Sandbox tester account
4. Build with EAS (not Expo Go)

### Google Sign-In Not Working

1. Verify SHA-1 fingerprint matches
2. Check Web Client ID in `.env`
3. OAuth consent screen must be published (or use test users)
4. Build with EAS (not Expo Go)

---

## Support

- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev
- Supabase Docs: https://supabase.com/docs
- AdMob: https://developers.google.com/admob
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store Policies: https://play.google.com/console/about/guides/
