# Subscription Model: Ad-Free Plan ($5/month) – RevenueCat Integration

## Overview

The game will offer a single optional subscription:

**Ad-Free Mode — $4.99/month**

Removes:

* Rewarded ads (replaced with free boosts)
* Interstitial ads
* Banner ads
* **5-game limit** (unlimited games)

The subscription does NOT affect:

* Gameplay difficulty
* Puzzle access
* XP or progression
* Daily challenge

This ensures a clean, ethical monetization model.

## RevenueCat Integration Requirements

### Products

RevenueCat entitlements and offerings:

* Offering ID: default
* Package ID: monthly
* Product ID (App Store): com.yourapp.adfree.monthly
* Entitlement ID: adfree

### Subscription Logic

When user purchases subscription:

* Activate entitlement adfree
* Hide all ads immediately
* Remove 5-game limit
* Convert all rewarded ad features to:
  * Free unlimited hints per day OR
  * Free game unlocks

User must never see ads again as long as entitlement is active.

### Offline Behavior

Subscription status cached by RevenueCat SDK

If offline:

* Use cached entitlements
* Continue honoring ad-free mode

When online:

* Sync with RevenueCat backend

## Ad-Free Feature Behavior

### Remove All Ads

When entitlement active:

* Remove interstitial ads after puzzles
* Remove banners from Home/Stats/Settings
* Remove rewarded ads from hint/puzzle unlock flows
* Remove 5-game session limit

### Replace Rewarded Ads With Free Actions

When user taps:

* "Watch Ad to get +1 hint" → becomes "Get Hint"
* "Watch Ad to unlock +5 games" → becomes hidden (unlimited)

No ad shown.

### Visual Indicators

Add a small "Ad-Free Mode" tag:

* In settings
* On puzzle screen (optional)
* On bottom of Home screen (optional)

## Subscription UX Flow

### Entry Points

User can purchase subscription from:

* Settings screen → "Remove Ads"
* After finishing puzzle (small upsell card)
* When hitting 5-game limit
* Chapter completion reward screen (small upsell)

### Paywall Design

A brutalist-style paywall:

* Black & white design
* Large header: Remove Ads
* Simple description: "Play distraction-free. No ads. Just pure Sudoku."
* Big price block: $4.99/month
* Benefits list:
  * No interstitial ads
  * No banner ads
  * Unlimited games
  * All rewarded boosts unlocked automatically
* "Start Free Trial" optional (if you want later)
* Restore Purchases button at bottom

## Entitlement Handling

### States:

**Active Entitlement**

* Remove ads
* Unlimited games
* Unlock free boosts
* Show "Ad-Free Mode Active" in settings

**Expired Entitlement**

* Re-enable ads
* Restore 5-game limit
* Boosts return to rewarded ad requirements

**Uncertain State (offline/no cached entitlement)**

* Use last known cached value
* Do not penalize user if uncertain
* Always fail safe in user's favor

## Settings Screen Updates

Add a Subscription section:

* Subscription Status: Active / Not Active / Expired
* Manage Subscription → Opens App Store subscription page
* Restore Purchases (mandatory per Apple)

## Analytics & Tracking

Track:

* Subscription conversion
* Subscription cancellation
* Times user opens paywall
* Which screen initiated a subscription attempt
* Boost usage before/after subscription

(Handled through RevenueCat + your analytics)

## Compliance

### Apple Requirements:

* "Restore Purchases" must be visible
* Paywall must be clear and honest
* No gated gameplay behind subscription
* Subscription must only remove ads / unlock convenience

### GDPR / Privacy:

* Subscription data tracked by RevenueCat, not stored by you
