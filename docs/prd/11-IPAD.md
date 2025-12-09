# iPad Layout Requirements

## Device Detection

iPad detected using:
- Screen width >= 768px, OR
- Aspect ratio > 0.65 (closer to square)

```typescript
const isTablet = Platform.OS === 'ios' &&
  (width >= 768 || (Math.min(width, height) / Math.max(width, height)) > 0.65);
```

## Game Screen Layout (Portrait)

### Board
- **Max size**: 580px (comfortable viewing size)
- Centered horizontally and vertically on screen
- No flex expansion (fixed size based on content)
- Game area (board + controls) centered above ad banner

### Number Pad
- **Single row** for all 9 numbers (vs 2 rows on phone)
- Button size: 10-14px cells, max height 60px
- Horizontal padding: 40px
- Gap between buttons: 8px
- Positioned close to board (8px margin)

### Tool Buttons (Undo, Reset, Notes, Hint)
- Horizontal padding: 60px
- Bottom padding: 24px (room for ad banner)
- Top padding: 16px

## Board Screen

### HeatmapCalendar (Play History)
- **Responsive width**: Fills available container
- **Dynamic weeks**: Shows 12-26 weeks based on screen width
- **Cell size**: 10-14px (larger on iPad)
- No horizontal scroll needed - fits container
- More historical data visible on larger screens

### WeeklyChart / StatCards
- Use full available width
- Consistent padding across sections

## Crisp Scaling

Skia re-renders at native resolution:
- Grid lines
- Numbers
- Notes
- Selection highlights

No blurry bitmap scaling.

## Landscape Support (Future)

Planned for future release:
- Board on left
- Tools & stats on right panel
- Smart spacing
