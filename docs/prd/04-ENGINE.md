# Game Engine Requirements

## Must Support:

* Board validation for both 6×6 and 9×9
* Real-time validation toggle
* Pencil mode (multinumber notes)
* Undo stack
* Mistake tracking
* Highlighting:
  * Row, column, block (dynamic block size)
  * Same numbers
  * Illegal move overlay

## Puzzle Generation:

* Parameterized generator supporting multiple grid sizes
* Uniqueness validation (stops after finding 2 solutions)
* Difficulty-based clue removal

## Completion Rules:

* Timer stops when solved
* Mistakes and hints affect XP
* Show completion summary
