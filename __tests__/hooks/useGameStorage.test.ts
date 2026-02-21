/**
 * Tests for src/hooks/useGameStorage.ts
 * Game state persistence with AsyncStorage.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGameStorage, useAutoSaveGameState } from '../../src/hooks/useGameStorage';
import { loadData, saveData, STORAGE_KEYS } from '../../src/utils/storage';
import type { GameState } from '../../src/context/GameContext';

jest.mock('../../src/utils/storage');

const mockLoadData = loadData as jest.MockedFunction<typeof loadData>;
const mockSaveData = saveData as jest.MockedFunction<typeof saveData>;

describe('useGameStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadData.mockResolvedValue(null);
    mockSaveData.mockResolvedValue(undefined as any);
  });

  // ============ Load on Mount ============

  it('should call onLoadComplete with null when no saved state', async () => {
    const onLoadComplete = jest.fn();
    renderHook(() => useGameStorage({ onLoadComplete }));

    await waitFor(() => {
      expect(onLoadComplete).toHaveBeenCalledWith(null);
    });
  });

  it('should load and patch saved state with defaults', async () => {
    const savedState = { isComplete: false } as GameState;
    mockLoadData.mockResolvedValue(savedState);

    const onLoadComplete = jest.fn();
    renderHook(() => useGameStorage({ onLoadComplete }));

    await waitFor(() => {
      expect(onLoadComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          gridType: '9x9',
          isLoading: false,
          conflictCells: [],
          helperUsed: 0,
          isPaused: true,
        })
      );
    });
  });

  it('should not overwrite existing fields', async () => {
    const savedState = {
      gridType: '6x6',
      isLoading: false,
      conflictCells: [[1, 2]],
      helperUsed: 3,
    } as unknown as GameState;
    mockLoadData.mockResolvedValue(savedState);

    const onLoadComplete = jest.fn();
    renderHook(() => useGameStorage({ onLoadComplete }));

    await waitFor(() => {
      const loaded = onLoadComplete.mock.calls[0][0];
      expect(loaded.gridType).toBe('6x6');
      expect(loaded.helperUsed).toBe(3);
      expect(loaded.isPaused).toBe(true); // always forced
    });
  });

  // ============ Save ============

  it('should save game state when not loading', () => {
    const onLoadComplete = jest.fn();
    const { result } = renderHook(() => useGameStorage({ onLoadComplete }));

    const gameState = { isLoading: false, isComplete: false } as GameState;
    act(() => result.current.saveGameState(gameState));

    expect(mockSaveData).toHaveBeenCalledWith(STORAGE_KEYS.GAME_STATE, gameState);
  });

  it('should not save when isLoading is true', () => {
    const onLoadComplete = jest.fn();
    const { result } = renderHook(() => useGameStorage({ onLoadComplete }));

    act(() => result.current.saveGameState({ isLoading: true } as GameState));
    expect(mockSaveData).not.toHaveBeenCalled();
  });

  it('should not save null state', () => {
    const onLoadComplete = jest.fn();
    const { result } = renderHook(() => useGameStorage({ onLoadComplete }));

    act(() => result.current.saveGameState(null));
    expect(mockSaveData).not.toHaveBeenCalled();
  });
});

// ============ useAutoSaveGameState ============

describe('useAutoSaveGameState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveData.mockResolvedValue(undefined as any);
  });

  it('should auto-save when gameState changes', () => {
    const state = { isLoading: false } as GameState;
    renderHook(() => useAutoSaveGameState(state));
    expect(mockSaveData).toHaveBeenCalledWith(STORAGE_KEYS.GAME_STATE, state);
  });

  it('should not save when gameState is null', () => {
    renderHook(() => useAutoSaveGameState(null));
    expect(mockSaveData).not.toHaveBeenCalled();
  });

  it('should not save when isLoading', () => {
    renderHook(() => useAutoSaveGameState({ isLoading: true } as GameState));
    expect(mockSaveData).not.toHaveBeenCalled();
  });
});
