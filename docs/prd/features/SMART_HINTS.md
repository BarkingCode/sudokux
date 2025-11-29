# Smart Hints - Sudoku Technique Explanations

## Overview

Implement an intelligent hint system that not only reveals answers but teaches users the solving techniques used to find them.

## Requirements

### Hint Levels

1. **Basic Hint** (Free/Ad-supported)
   - Highlights the cell with the next logical move
   - No explanation provided

2. **Smart Hint** (Premium/Ad-supported)
   - Identifies the solving technique
   - Explains why the move works
   - Highlights relevant cells/regions

### Supported Techniques

| Technique | Difficulty | Description |
|-----------|------------|-------------|
| Naked Single | Easy | Only one number possible in cell |
| Hidden Single | Easy-Medium | Number only fits one cell in row/column/box |
| Pointing Pair | Medium | Candidates in box point to row/column |
| Box/Line Reduction | Medium | Row/column restricts box candidates |
| Naked Pair | Hard | Two cells share same two candidates |
| Hidden Pair | Hard | Two candidates only appear in two cells |
| Naked Triple | Hard | Three cells share three candidates |
| X-Wing | Extreme | Pattern across two rows and columns |
| Swordfish | Insane | Pattern across three rows and columns |

### Smart Hint UI

```
┌─────────────────────────────────────────┐
│  SMART HINT                             │
├─────────────────────────────────────────┤
│                                         │
│  Technique: HIDDEN SINGLE               │
│                                         │
│  The number 7 can only go in one        │
│  cell in Row 3.                         │
│                                         │
│  Look at Row 3: cells with 7 as a       │
│  candidate are highlighted.             │
│                                         │
│  Only R3C5 can contain 7!               │
│                                         │
│  ┌───────────────────────────────┐      │
│  │ [Highlighted board section]   │      │
│  └───────────────────────────────┘      │
│                                         │
│  [Got it!]              [Show Answer]   │
└─────────────────────────────────────────┘
```

### Implementation

```typescript
interface SmartHint {
  technique: TechniqueType;
  cell: { row: number; col: number };
  value: number;
  explanation: string;
  highlightCells: { row: number; col: number; type: 'primary' | 'secondary' }[];
  highlightRegions: ('row' | 'column' | 'box')[];
}

const analyzeBoard = (grid: number[][], notes: number[][][]): SmartHint | null => {
  // Try techniques in order of difficulty
  const techniques = [
    findNakedSingle,
    findHiddenSingle,
    findPointingPair,
    findBoxLineReduction,
    findNakedPair,
    findHiddenPair,
    findXWing,
  ];

  for (const technique of techniques) {
    const hint = technique(grid, notes);
    if (hint) return hint;
  }

  return null;
};
```

### Technique Explanations

```typescript
const TECHNIQUE_EXPLANATIONS: Record<TechniqueType, (hint: SmartHint) => string> = {
  naked_single: (hint) =>
    `Cell R${hint.cell.row + 1}C${hint.cell.col + 1} can only contain ${hint.value}. ` +
    `All other numbers are already in its row, column, or box.`,

  hidden_single: (hint) =>
    `The number ${hint.value} can only go in one cell in this ${hint.highlightRegions[0]}. ` +
    `Check where else ${hint.value} could go - there's only one option!`,

  pointing_pair: (hint) =>
    `In box ${getBoxNumber(hint.cell)}, the number ${hint.value} only appears in ` +
    `${hint.highlightRegions[0]} ${getRegionNumber(hint)}. This eliminates ${hint.value} ` +
    `from other cells in that ${hint.highlightRegions[0]}.`,

  // ... more explanations
};
```

### Visual Highlighting

When showing a smart hint:
1. Dim all non-relevant cells
2. Highlight primary cells (where answer goes) in accent color
3. Highlight secondary cells (part of pattern) in lighter shade
4. Show arrows or lines for X-Wing/Swordfish patterns

### Hint History

Track hints for learning:

```typescript
interface HintHistory {
  date: string;
  puzzleId: string;
  technique: TechniqueType;
  wasHelpful: boolean; // User feedback
}

// Store to show "Techniques Learned" in stats
```

### Monetization Integration

- Basic hints: 3 free per puzzle, then watch ad
- Smart hints: Premium feature or watch ad for each
- Ad-free subscribers: Unlimited of both

## Acceptance Criteria

- [ ] Detect at least 6 solving techniques
- [ ] Show technique name and explanation
- [ ] Highlight relevant cells on board
- [ ] "Got it" dismisses without revealing answer
- [ ] "Show Answer" fills the cell
- [ ] Track techniques learned for stats
- [ ] Works offline (analysis is local)
- [ ] Brutalist modal design
