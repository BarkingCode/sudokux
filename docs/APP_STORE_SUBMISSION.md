# X-Sudoku App Store Submission Guide

**App**: X-Sudoku | **Bundle ID**: com.artticfox.sudokux

---

## App Store Descriptions

### iOS Subtitle (max 30 characters)
```
9x9 & 6x6 Puzzles Offline
```

### Short Description - Google Play (max 80 characters)
```
Sudoku with 9x9 and 6x6 grids, 6 difficulty levels, daily challenges, and stats.
```

### Full Description (Both Stores)
```
X-Sudoku is a Sudoku puzzle game with a black-and-white interface.

GRID SIZES
• 9x9 Standard (81 cells)
• 6x6 Mini (36 cells)

DIFFICULTY LEVELS
• Easy
• Medium
• Hard
• Extreme
• Insane
• Inhuman

GAME MODES
• Chapters — Sequential puzzle sets
• Free Run — Select any difficulty
• Daily Challenge — One puzzle per day

FEATURES
• Notes mode
• Undo/redo
• Mistake highlighting (optional)
• Auto-save
• Offline play

PROGRESS TRACKING
• Daily leaderboards
• Achievements
• Statistics (games played, win rate, times)

No account required. No ads during daily challenges.
```

### iOS Keywords (max 100 characters)
```
sudoku,puzzle,logic,brain,9x9,6x6,daily,challenge,minimal,classic,numbers,grid,offline,free
```

---

## Part 1: Apple App Store Connect Setup

### Step 0: Register App ID (Apple Developer Portal)

Before creating the App Store Connect record, register your App ID:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Click **Certificates, Identifiers & Profiles** → **Identifiers** → **+**
3. Select **App IDs** → Click **Continue**
4. Select **App** (not App Clip) → Click **Continue**
5. Fill in:
   - **Description**: X-Sudoku
   - **Bundle ID**: Select **Explicit** → Enter `com.artticfox.sudokux`
6. Under **Capabilities**, enable:
   - ✅ **Game Center** (for leaderboards and achievements)
   - ✅ **Push Notifications** (for daily challenge reminders)
7. Click **Continue** → **Register**

### Step 1: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: X-Sudoku
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.artticfox.sudokux
   - **SKU**: sudokux-ios (any unique identifier)
   - **User Access**: Full Access

### Step 2: App Information

1. Navigate to **App Information** in the sidebar
2. Fill in:
   - **Subtitle**: `9x9 & 6x6 Puzzles Offline`
   - **Category**: Games → Puzzle
   - **Content Rights**: Check "This app does not contain..."
   - **Age Rating**: Click **Set Age Rating** (see Step 3)

### Step 3: Age Rating Questionnaire

Answer the following for X-Sudoku:

| Question | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic Violence | None |
| Sexual Content | None |
| Graphic Sexual Content | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Alcohol, Tobacco, Drugs | None |
| Simulated Gambling | None |
| Horror/Fear Themes | None |
| Medical/Treatment Info | None |
| Unrestricted Web Access | No |
| Gambling & Contests | No |

**Expected Rating**: 4+ (suitable for all ages)

### Step 4: Pricing and Availability

1. Navigate to **Pricing and Availability**
2. Set **Price**: Free
3. **Availability**: Select countries (All or specific)
4. **Pre-Orders**: Optional

### Step 5: App Privacy

1. Navigate to **App Privacy**
2. Click **Get Started**
3. Select data types collected:

#### Data Linked to User
| Data Type | Purpose |
|-----------|---------|
| Identifiers (Device ID) | App Functionality, Analytics |
| Usage Data (Game Statistics) | App Functionality |

#### Data Not Linked to User
| Data Type | Purpose |
|-----------|---------|
| Diagnostics (Crash Data) | App Functionality |

#### Data Used for Tracking
| Data Type | Purpose |
|-----------|---------|
| Identifiers (Advertising ID) | Third-Party Advertising (AdMob) |

4. Click **Publish** when complete

### Step 6: Prepare Submission

1. Navigate to **iOS App** → **1.0 Prepare for Submission**
2. Add screenshots (see Screenshot Requirements below)
3. Fill in:
   - **Description**: Use full description above
   - **Keywords**: Use keywords above
   - **Support URL**: https://www.barkingcode.com/sudokux
   - **Marketing URL**: (optional)
   - **Privacy Policy URL**: https://www.barkingcode.com/sudokux/privacy-policy

### Step 7: Build Upload

1. Build production app:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```

3. Or upload manually via Transporter app

### Step 8: Review Information

1. **Sign-in Required**: No (app works without login)
2. **Contact Information**: Add your details
3. **Notes for Reviewer**:
   ```
   X-Sudoku is a Sudoku puzzle game. No login is required to play.
   The app works fully offline. Google Sign-In is optional and only
   used for account recovery/sync across devices.
   ```

### Step 9: Submit for Review

1. Click **Add for Review**
2. Click **Submit to App Review**
3. Wait 24-48 hours for review

---

## Part 2: Google Play Console Setup

### Step 1: Create App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - **App name**: X-Sudoku
   - **Default language**: English (United States)
   - **App or game**: Game
   - **Free or paid**: Free
4. Accept declarations and click **Create app**

### Step 2: Store Listing

Navigate to **Grow** → **Store presence** → **Main store listing**

1. **App details**:
   - **App name**: X-Sudoku
   - **Short description**: Use short description above
   - **Full description**: Use full description above

2. **Graphics**:
   - **App icon**: 512x512 PNG (use assets/icon.png, resize)
   - **Feature graphic**: 1024x500 PNG (required - create this)
   - **Screenshots**: Add phone screenshots (see requirements below)

### Step 3: Content Rating

Navigate to **Policy** → **App content** → **Content rating**

1. Click **Start questionnaire**
2. Select **Game** category
3. Answer questions:

| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual Content | No |
| Language | No |
| Controlled Substance | No |
| User Interaction | Yes (leaderboards) |
| Shares Location | No |
| Simulated Gambling | No |
| Ads | Yes |
| Can purchase items | No (currently) |

**Expected Rating**: PEGI 3 / Everyone

### Step 4: Target Audience

Navigate to **Policy** → **App content** → **Target audience**

1. Select age groups: **13 and above** or **All ages**
2. Confirm app is NOT designed for children

### Step 5: Data Safety

Navigate to **Policy** → **App content** → **Data safety**

Click **Start** and fill in:

#### Data Collection Overview
- Does app collect or share data? **Yes**
- Is all data encrypted in transit? **Yes**
- Do you provide a way to delete data? **Yes** (via Settings)

#### Data Types

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Device ID | Yes | Yes (AdMob) | Advertising, Analytics |
| Game progress | Yes | No | App functionality |
| App interactions | Yes | No | Analytics |
| Crash logs | Yes | Yes (Sentry) | App functionality |

#### Data Handling
- **Data deletion**: Users can delete their data via app Settings
- **Privacy policy**: https://www.barkingcode.com/sudokux/privacy-policy

### Step 6: Ads Declaration

Navigate to **Policy** → **App content** → **Ads**

1. Select **Yes, my app contains ads**
2. AdMob is used for banner, interstitial, and rewarded ads

### Step 7: App Access

Navigate to **Policy** → **App content** → **App access**

1. Select **All functionality is available without restrictions**
2. No login required to test the app

### Step 8: App Category

Navigate to **Grow** → **Store presence** → **Store settings**

1. **App category**: Game → Puzzle
2. **Tags**: Sudoku, Puzzle, Logic, Brain Games

### Step 9: Pricing

Navigate to **Monetize** → **App pricing**

1. Set as **Free**
2. Acknowledge you cannot change to paid later

### Step 10: Countries/Regions

Navigate to **Release** → **Production** → **Countries/regions**

1. Click **Add countries/regions**
2. Select all or specific countries

### Step 11: Build Upload

1. Build production app:
   ```bash
   eas build --platform android --profile production
   ```

2. Submit to Play Store:
   ```bash
   eas submit --platform android
   ```

3. Or manually upload the .aab file from EAS

### Step 12: Create Release

1. Navigate to **Release** → **Production**
2. Click **Create new release**
3. Upload your .aab file
4. Add release notes:
   ```
   Initial release.

   • 9x9 and 6x6 grid sizes
   • 6 difficulty levels (Easy to Inhuman)
   • Daily challenges with leaderboards
   • Chapters and Free Run modes
   • Stats and achievements
   • Offline support
   ```
5. Click **Review release** → **Start rollout to Production**

### Step 13: Review

Google Play review typically takes 1-3 days for new apps.

---

## Screenshot Requirements

### iOS Screenshots

| Device | Resolution | Required |
|--------|------------|----------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | Yes |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | Alternative |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | Yes |
| iPad Pro 12.9" | 2048 x 2732 | If supporting iPad |

**Minimum**: 3 screenshots per device, **Maximum**: 10

### Android Screenshots

| Device | Resolution | Required |
|--------|------------|----------|
| Phone | 1080 x 1920 (min) | Yes, 2-8 screenshots |
| 7" Tablet | 1200 x 1920 | Optional |
| 10" Tablet | 1920 x 1200 | Optional |

### Suggested Screenshots

1. **Home screen** - Show chapters/modes
2. **Gameplay 9x9** - Active game with some filled cells
3. **Gameplay 6x6** - Mini grid variant
4. **Difficulty selection** - Show all 6 levels
5. **Daily challenge** - Calendar or daily screen
6. **Stats/Achievements** - Progress tracking
7. **Leaderboards** - Competitive element

### Feature Graphic (Android Only)

- **Size**: 1024 x 500 PNG
- **Content**: App name, tagline, representative imagery
- **Style**: Match brutalist black-and-white aesthetic
- **Text**: Keep minimal, must be readable at small sizes

---

## Pre-Submission Checklist

### Both Platforms
- [ ] Privacy policy URL configured
- [ ] App icon finalized (1024x1024 for iOS, 512x512 for Android)
- [ ] Screenshots captured for all required sizes
- [ ] Descriptions written and proofread
- [ ] Test production build thoroughly
- [ ] Verify ads work in production mode
- [ ] Test Game Center/leaderboards

### iOS Specific
- [ ] App Store Connect record created
- [ ] Age rating questionnaire completed
- [ ] App Privacy labels configured
- [ ] Keywords added (max 100 chars)
- [ ] Subtitle added (max 30 chars)
- [ ] Support URL added
- [ ] Build uploaded via EAS or Transporter

### Android Specific
- [ ] Google Play Console app created
- [ ] Feature graphic created (1024x500)
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] Target audience configured
- [ ] Ads declaration completed
- [ ] .aab uploaded and release created

---

## Useful Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

---

## Support URLs

| URL | Purpose |
|-----|---------|
| https://www.barkingcode.com/sudokux/privacy-policy | Privacy Policy |
| https://www.barkingcode.com/sudokux/terms-of-use | Terms of Use |
| https://www.barkingcode.com/sudokux/data-safety | Data Safety Info |

---

*Last updated: 2024-11-29*
