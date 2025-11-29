# SudokuX Product Requirements Documentation

This directory contains the modular product requirements documentation for SudokuX.

## Quick Summary

| Feature | Details |
|---------|---------|
| Grid Types | 9×9 Standard, 6×6 Mini |
| Difficulties | Easy, Medium, Hard, Extreme, Insane, Inhuman |
| Daily Challenge | Same puzzle for all users, stored in DB |
| Game Limit | 5 games free, watch ad for 5 more |
| Subscription | $4.99/month removes all ads + unlimited games |
| Notifications | Daily reminder via cron job |
| Offline | Fully functional with bundled + generated puzzles |

---

## Core Documentation

| # | Document | Description |
|---|----------|-------------|
| 00 | [Overview](./00-OVERVIEW.md) | Product vision and high-level specs |
| 01 | [Gameplay](./01-GAMEPLAY.md) | Core gameplay features |
| 02 | [Grid & Difficulty](./02-GRID-DIFFICULTY.md) | Grid types and difficulty levels |
| 03 | [Offline](./03-OFFLINE.md) | Offline-first requirements |
| 04 | [Engine](./04-ENGINE.md) | Game engine requirements |
| 05 | [Identity](./05-IDENTITY.md) | User identity and Game Center |
| 06 | [Chapters](./06-CHAPTERS.md) | Chapter mode and progression |
| 07 | [Monetization](./07-MONETIZATION.md) | AdMob integration |
| 08 | [Daily Challenge](./08-DAILY-CHALLENGE.md) | Daily challenge system |
| 09 | [Controls](./09-CONTROLS.md) | Input and controls |
| 10 | [Graphics](./10-GRAPHICS.md) | Skia-based board rendering |
| 11 | [iPad](./11-IPAD.md) | iPad layout requirements |
| 12 | [Dark Mode](./12-DARK-MODE.md) | Dark mode theming |
| 13 | [Design](./13-DESIGN.md) | Brutalist visual style |
| 14 | [Stats](./14-STATS.md) | Stats and analytics |
| 15 | [Leaderboards](./15-LEADERBOARDS.md) | Leaderboards and achievements |
| 16 | [Screens](./16-SCREENS.md) | Screens and UX flow |
| 17 | [Technical](./17-TECHNICAL.md) | Technical requirements |
| 18 | [Database](./18-DATABASE.md) | Supabase database schema |
| 19 | [Testing](./19-TESTING.md) | Testing requirements |
| 20 | [Roadmap](./20-ROADMAP.md) | Release roadmap |
| 21 | [Subscription](./21-SUBSCRIPTION.md) | RevenueCat subscription model |
| 22 | [Future](./22-FUTURE.md) | Future ideas and enhancements |

---

## Feature Specifications

Detailed specifications for upcoming features:

| Feature | Document | Status |
|---------|----------|--------|
| Pull to Refresh | [PULL_TO_REFRESH.md](./features/PULL_TO_REFRESH.md) | Planned |
| Haptic Feedback | [HAPTIC_FEEDBACK.md](./features/HAPTIC_FEEDBACK.md) | Planned |
| App Badge | [APP_BADGE.md](./features/APP_BADGE.md) | Planned |
| Confetti Animation | [CONFETTI_ANIMATION.md](./features/CONFETTI_ANIMATION.md) | Planned |
| Stats Charts | [STATS_CHARTS.md](./features/STATS_CHARTS.md) | Planned |
| Heatmap Calendar | [HEATMAP_CALENDAR.md](./features/HEATMAP_CALENDAR.md) | Planned |
| Solve Time Trends | [SOLVE_TIME_TRENDS.md](./features/SOLVE_TIME_TRENDS.md) | Planned |
| Chapter Mode UI | [CHAPTER_MODE.md](./features/CHAPTER_MODE.md) | Planned |
| Smart Hints | [SMART_HINTS.md](./features/SMART_HINTS.md) | Planned |

---

## Related Documentation

- [Setup Guide](../SETUP_GUIDE.md) - Development environment setup
- [Database Schema](../database-schema.sql) - Full SQL schema
