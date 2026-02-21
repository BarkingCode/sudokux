import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SudokuBoard } from '../../src/components/board/SudokuBoard';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      highlight: '#F0F0F0',
      highlightStrong: '#E0E0E0',
      mistake: '#E53935',
      success: '#43A047',
      surface: '#FFFFFF',
      muted: '#757575',
      accent: '#1565C0',
    },
  }),
}));

const mockGameState = {
  grid: Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => (r === 0 ? c + 1 : 0))
  ),
  initialGrid: Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => (r === 0 ? c + 1 : 0))
  ),
  conflictCells: [],
  notes: {},
  gridType: '9x9' as const,
};

jest.mock('../../src/context/GameContext', () => ({
  useGame: () => ({ gameState: mockGameState }),
}));

jest.mock('../../src/game/types', () => ({
  GRID_CONFIGS: {
    '9x9': { gridSize: 9, boxRows: 3, boxCols: 3 },
    '6x6': { gridSize: 6, boxRows: 2, boxCols: 3 },
  },
}));

describe('SudokuBoard', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <SudokuBoard selectedCell={null} onCellPress={jest.fn()} />
    );
    // First row has values 1-9
    expect(getByText('1')).toBeTruthy();
    expect(getByText('9')).toBeTruthy();
  });

  it('renders with a non-null gameState', () => {
    // The mock always provides a gameState, so we just verify rendering works
    const { getByText } = render(
      <SudokuBoard selectedCell={null} onCellPress={jest.fn()} />
    );
    expect(getByText('5')).toBeTruthy();
  });

  it('renders with a selected cell', () => {
    const { getByText } = render(
      <SudokuBoard selectedCell={{ row: 0, col: 0 }} onCellPress={jest.fn()} />
    );
    expect(getByText('1')).toBeTruthy();
  });
});
