# Offline-First Requirements

## Puzzle Source Logic

The app must be fully playable offline:

**Offline = JSON + Runtime Generation**

* Load puzzles from bundled JSON files (9×9 easy/medium/hard only)
* Generate puzzles at runtime for:
  * All 6×6 puzzles
  * 9×9 extreme/insane/inhuman difficulties
  * When bundled puzzles exhausted

**Runtime Generation Features:**
* Backtracking algorithm with randomization
* **Guaranteed unique solutions** via solution counting
* Generation time: <1s for 6×6, <3s for hardest 9×9

**Under no circumstance does offline rely on an internet call.**

## Puzzle Rotation Rules

* No repeated puzzles until pool is exhausted
* Track used puzzle IDs locally
* Reset pool when fully used
