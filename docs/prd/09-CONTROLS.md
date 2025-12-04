# Input & Controls (Keyboard-Free)

## Custom Number Pad

* Brutalist rectangular tiles
* Bold numbers
* High contrast black-white
* Animations: punch-in effect
* Number pad replaces OS keyboard entirely
* **Dynamic grid arrangement:**
  * 1–9 for Standard Sudoku (single row)
  * 1–6 for Mini Sudoku (two rows of 3)

## Notes Toggle

* Brutalist ON/OFF toggle
* Pencil icon
* Notes drawn in Skia inside cells
* Notes are small, sharp numbers (crisp at any size)

## Erase Tool

* Removes notes or numbers from selected cell

## Undo Tool

* Stack-based
* Disabled state visible

## Smart Possibility Helper

A toggle feature that assists players by highlighting only valid numbers for the selected cell.

### Behavior

* **Toggle OFF (default):** Normal gameplay, no assistance
* **Toggle ON:** Number pad dynamically shows only valid possibilities for selected cell
  * Valid numbers: normal appearance
  * Invalid numbers: dimmed (opacity 0.3), disabled
* Works with both 6×6 and 9×9 grids
* Notes mode remains fully functional when helper is active

### Monetization

* Helper is **locked by default** for every new puzzle
* Turning toggle ON triggers a **rewarded ad**
* After watching ad, helper becomes active for current game only
* Starting a new game resets helper to locked state
* Toggle button displays small "AD" badge when locked

### UI/UX

* HELPER button appears in game toolbar (replaces HINT button)
* Visual states:
  * Locked: Ghost variant with "AD" badge
  * Unlocked: Primary variant (filled)
* Clear visual distinction between invalid (dimmed) vs completed numbers

### Technical Details

* Possibility calculation is instant using `isValidMove()` validation
* Checks row, column, and box constraints for each number
* `isHelperUnlocked` state stored in GameContext, resets on new game
* Graceful degradation if rewarded ads cannot load
