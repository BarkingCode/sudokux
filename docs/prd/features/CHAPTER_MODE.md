# Chapter Mode UI with Node-Based Progression

## Overview

Implement a visual chapter map showing the user's progression through chapters, displayed as connected nodes in a brutalist style.

## Requirements

### Chapter Structure

Each chapter contains 5 puzzles:
1. Easy
2. Easy
3. Medium
4. Medium
5. Hard (Chapter Finale)

### Node Map Design

```
CHAPTER 1        CHAPTER 2        CHAPTER 3
   ●                ●                ○
   │                │                │
   ●                ●                ○
   │                │                │
   ●                ◐                ○
   │                │                │
   ●                ○                ○
   │                │                │
   ★                ○                ○

● Completed  ◐ Current  ○ Locked  ★ Chapter Complete
```

### Visual Style (Brutalist)

- **Nodes:** Heavy black circles with thick borders
- **Lines:** 4-6px thick connecting lines
- **Labels:** Bold chapter numbers
- **Icons:** Minimalist difficulty indicators

```typescript
interface ChapterNode {
  chapter: number;
  puzzle: number; // 1-5
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'completed' | 'current' | 'locked';
  timeSeconds?: number;
  mistakes?: number;
}
```

### Implementation with Skia

```typescript
import { Canvas, Circle, Line, Text, Group } from '@shopify/react-native-skia';

const NODE_SIZE = 40;
const LINE_WIDTH = 4;
const VERTICAL_GAP = 60;

const ChapterMap: React.FC<{ chapters: Chapter[] }> = ({ chapters }) => {
  return (
    <ScrollView horizontal>
      <Canvas style={{ width: chapters.length * 120, height: 5 * VERTICAL_GAP + 100 }}>
        {chapters.map((chapter, chapterIndex) => (
          <Group key={chapter.id} transform={[{ translateX: chapterIndex * 120 + 60 }]}>
            {/* Chapter title */}
            <Text
              x={0}
              y={20}
              text={`CH ${chapter.number}`}
              font={boldFont}
              color={colors.text}
            />

            {/* Nodes and connecting lines */}
            {chapter.puzzles.map((puzzle, puzzleIndex) => (
              <Group key={puzzleIndex}>
                {/* Connecting line (except for first) */}
                {puzzleIndex > 0 && (
                  <Line
                    p1={{ x: 0, y: 40 + (puzzleIndex - 1) * VERTICAL_GAP + NODE_SIZE }}
                    p2={{ x: 0, y: 40 + puzzleIndex * VERTICAL_GAP }}
                    color={getLineColor(puzzle.status)}
                    strokeWidth={LINE_WIDTH}
                  />
                )}

                {/* Node */}
                <Circle
                  cx={0}
                  cy={40 + puzzleIndex * VERTICAL_GAP + NODE_SIZE / 2}
                  r={NODE_SIZE / 2}
                  color={getNodeColor(puzzle.status)}
                  style={puzzle.status === 'locked' ? 'stroke' : 'fill'}
                  strokeWidth={3}
                />
              </Group>
            ))}
          </Group>
        ))}
      </Canvas>
    </ScrollView>
  );
};
```

### Node States

| Status | Fill | Border | Icon |
|--------|------|--------|------|
| Completed | Black | Black | White checkmark |
| Current | White | Black | Pulsing dot |
| Locked | Transparent | Gray | Lock icon |
| Chapter Complete | Black | Black | Star |

### Interactions

- **Tap completed node:** View puzzle stats
- **Tap current node:** Start/resume puzzle
- **Tap locked node:** Show "Complete previous puzzles"
- **Swipe:** Navigate between chapters

### Progress Persistence

```typescript
interface ChapterProgress {
  chapterId: number;
  currentPuzzle: number; // 1-5
  completed: boolean;
  puzzles: {
    puzzle: number;
    completed: boolean;
    timeSeconds?: number;
    mistakes?: number;
    hintsUsed?: number;
  }[];
}

// Store in AsyncStorage
const STORAGE_KEY = 'chapter_progress';
```

### Chapter Completion

When chapter finale (puzzle 5) is completed:
1. Show completion animation
2. Award XP bonus
3. Unlock next chapter
4. Display summary modal
5. Trigger `chapter_complete` achievement

### Navigation

- Chapter map accessible from home screen
- "Continue Chapter" quick action
- Back button returns to map (not home)

## Acceptance Criteria

- [ ] Vertical node layout per chapter
- [ ] Horizontal scroll between chapters
- [ ] Node states reflect progress
- [ ] Tap to start/view puzzle
- [ ] Connecting lines between nodes
- [ ] Chapter completion animation
- [ ] Progress persists across sessions
- [ ] Brutalist visual style
