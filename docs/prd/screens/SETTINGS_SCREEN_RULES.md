# Settings Screen Rules

## Overview

Route: `app/settings.tsx`

The Settings screen provides user preferences, subscription management, and account controls.

---

## Layout Components

| Section | Components |
|---------|------------|
| Appearance | Theme toggle (Light/Dark/System) |
| Gameplay | Sound toggle, Haptics toggle |
| Notifications | Daily reminder toggle, time picker |
| Subscription | Status, Manage, Restore Purchases |
| Account | User info, Sign out, Delete account |
| About | Version, Privacy Policy, Terms |

---

## Ad Rules

### Banner Ads
| Location | Allowed |
|----------|---------|
| Settings Screen | ✅ **YES** |
| Bottom of screen | ✅ **YES** |

### Interstitial Ads
- ❌ **NO** interstitial ads on Settings

### Rewarded Ads
- ❌ **NO** rewarded ads on Settings

### Ad-Free Subscribers
- No banner ads
- Shows "Ad-Free Mode Active" status

---

## Theme Settings

### Options
| Theme | Behavior |
|-------|----------|
| Light | White background, black text |
| Dark | Black background, white text |
| System | Follows device setting |

### Storage
- Persisted in AsyncStorage
- Key: `THEME_PREFERENCE`

### Color Definitions
| Element | Light | Dark |
|---------|-------|------|
| Background | `#FFFFFF` | `#000000` |
| Text | `#000000` | `#FFFFFF` |
| Borders | `#000000` | `#FFFFFF` |
| Mistake | `#FF0000` | `#FF0000` |

---

## Sound & Haptics

### Sound Toggle
| State | Behavior |
|-------|----------|
| ON | Play sounds for actions |
| OFF | Silent mode |

### Haptic Toggle
| State | Behavior |
|-------|----------|
| ON | Haptic feedback on interactions |
| OFF | No haptic feedback |

### Haptic Types Used
| Action | Haptic Style |
|--------|--------------|
| Number placement | `ImpactFeedbackStyle.Light` |
| Mistake | `NotificationFeedbackType.Error` |
| Correct move | `ImpactFeedbackStyle.Medium` |
| Puzzle complete | `NotificationFeedbackType.Success` |
| Achievement unlock | `ImpactFeedbackStyle.Heavy` + Success |

### Respect System Settings
- Check device haptic settings
- Disable if system vibration off

---

## Notification Settings

### Daily Reminder
| Setting | Default |
|---------|---------|
| Enabled | OFF |
| Time | 9:00 AM local |

### Notification Content
- Message: "Your daily Sudoku challenge is waiting!"
- Only sent if daily puzzle incomplete

### Implementation
- Uses Expo Push Notifications
- Stores preference in Supabase
- Cron checks every 15 minutes

---

## Subscription Section

### Display States

#### Not Subscribed
| Element | Value |
|---------|-------|
| Status | "Free Plan" |
| CTA | "Remove Ads - $4.99/month" |

#### Active Subscription
| Element | Value |
|---------|-------|
| Status | "Ad-Free Mode Active" |
| Badge | "Ad-Free Mode" tag |
| Action | "Manage Subscription" |

#### Expired
| Element | Value |
|---------|-------|
| Status | "Subscription Expired" |
| CTA | "Renew - $4.99/month" |

### Subscription Benefits
| Benefit | Description |
|---------|-------------|
| No interstitial ads | Removes between-game ads |
| No banner ads | Removes screen banners |
| Unlimited games | No Free Run limit |
| Free boosts | Helper unlocked automatically |

### Paywall Design (Brutalist)
- Black & white design
- Large header: "Remove Ads"
- Description: "Play distraction-free. No ads. Just pure Sudoku."
- Price block: $4.99/month
- Benefits list
- "Start Free Trial" (optional)
- "Restore Purchases" at bottom

### Required Buttons
| Button | Action |
|--------|--------|
| Restore Purchases | RevenueCat restore (Apple required) |
| Manage Subscription | Opens App Store subscription page |

---

## Account Section

### User Info Display
| Field | Source |
|-------|--------|
| Username | Game Center alias or email |
| Email | If signed in with email |
| User ID | Supabase user ID (hidden/debug) |

### Sign Out
- Clears local session
- Clears cached stats
- Returns to unauthenticated state

### Delete Account
- Confirmation modal required
- Deletes from Supabase
- Clears all local data
- Signs out user
- GDPR compliant

---

## About Section

| Link | Destination |
|------|-------------|
| Version | App version display |
| Privacy Policy | Opens web link |
| Terms of Service | Opens web link |
| Contact Support | Email link |

---

## Entry Points to Paywall

Users can access subscription from:
1. Settings screen → "Remove Ads"
2. After puzzle completion (upsell card)
3. When hitting Free Run game limit
4. Chapter completion reward screen

---

## UI/UX Highlights

### Toggle Design
- Brutalist ON/OFF style
- High contrast
- Clear state indication

### Section Headers
- Bold, uppercase text
- Thick underline separator

### List Items
- Full-width tap targets
- Chevron for navigation items
- Switch for toggles

---

## RevenueCat Integration

### Products
| Field | Value |
|-------|-------|
| Offering ID | `default` |
| Package ID | `monthly` |
| Product ID | `com.yourapp.adfree.monthly` |
| Entitlement ID | `adfree` |

### Offline Behavior
- Use cached entitlements
- Continue honoring ad-free mode
- Sync when online

### Fail-Safe
- Always favor user if uncertain
- Don't penalize on network issues

---

## Compliance

### Apple Requirements
- "Restore Purchases" must be visible
- Paywall must be clear and honest
- No gated gameplay behind subscription
- Subscription only removes ads/convenience

### GDPR / Privacy
- Subscription data tracked by RevenueCat
- Delete account removes all user data
- Privacy policy link accessible

---

## Technical Files

| File | Purpose |
|------|---------|
| `app/settings.tsx` | Settings screen UI |
| `src/context/ThemeContext.tsx` | Theme state |
| `src/context/SubscriptionContext.tsx` | RevenueCat integration |
| `src/utils/storage.ts` | AsyncStorage wrapper |
| `src/services/userService.ts` | Account management |

---

## Acceptance Criteria

- [ ] Theme toggle works (Light/Dark/System)
- [ ] Sound toggle persists
- [ ] Haptics toggle persists and respects system
- [ ] Notification time picker works
- [ ] Subscription status displays correctly
- [ ] "Restore Purchases" restores entitlement
- [ ] "Manage Subscription" opens App Store
- [ ] Sign out clears session
- [ ] Delete account removes all data
- [ ] Banner ads display (non-subscribers)
- [ ] Ad-free badge shows for subscribers
- [ ] Privacy Policy link works
- [ ] Version number displays correctly
