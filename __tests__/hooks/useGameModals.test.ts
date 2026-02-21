/**
 * Tests for src/hooks/useGameModals.ts
 * Modal visibility state management.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useGameModals } from '../../src/hooks/useGameModals';

describe('useGameModals', () => {
  // ============ Initial State ============

  it('should initialize with all modals closed', () => {
    const { result } = renderHook(() => useGameModals());
    expect(result.current.showDailyModal).toBe(false);
    expect(result.current.showChapterModal).toBe(false);
    expect(result.current.showFreeRunModal).toBe(false);
    expect(result.current.showPointSystemModal).toBe(false);
  });

  it('should initialize refs as false', () => {
    const { result } = renderHook(() => useGameModals());
    expect(result.current.hasShownDailyModal.current).toBe(false);
    expect(result.current.hasShownChapterModal.current).toBe(false);
    expect(result.current.hasShownFreeRunModal.current).toBe(false);
    expect(result.current.hasShownCompletionAd.current).toBe(false);
  });

  // ============ Daily Modal ============

  it('should open and close daily modal', () => {
    const { result } = renderHook(() => useGameModals());
    act(() => result.current.openDailyModal());
    expect(result.current.showDailyModal).toBe(true);
    act(() => result.current.closeDailyModal());
    expect(result.current.showDailyModal).toBe(false);
  });

  // ============ Chapter Modal ============

  it('should open and close chapter modal', () => {
    const { result } = renderHook(() => useGameModals());
    act(() => result.current.openChapterModal());
    expect(result.current.showChapterModal).toBe(true);
    act(() => result.current.closeChapterModal());
    expect(result.current.showChapterModal).toBe(false);
  });

  // ============ Free Run Modal ============

  it('should open and close free run modal', () => {
    const { result } = renderHook(() => useGameModals());
    act(() => result.current.openFreeRunModal());
    expect(result.current.showFreeRunModal).toBe(true);
    act(() => result.current.closeFreeRunModal());
    expect(result.current.showFreeRunModal).toBe(false);
  });

  // ============ Point System Modal ============

  it('should open and close point system modal', () => {
    const { result } = renderHook(() => useGameModals());
    act(() => result.current.openPointSystemModal());
    expect(result.current.showPointSystemModal).toBe(true);
    act(() => result.current.closePointSystemModal());
    expect(result.current.showPointSystemModal).toBe(false);
  });

  // ============ Multiple Modals ============

  it('should allow multiple modals open simultaneously', () => {
    const { result } = renderHook(() => useGameModals());
    act(() => {
      result.current.openDailyModal();
      result.current.openPointSystemModal();
    });
    expect(result.current.showDailyModal).toBe(true);
    expect(result.current.showPointSystemModal).toBe(true);
  });

  // ============ Reset All ============

  it('should reset all ref flags', () => {
    const { result } = renderHook(() => useGameModals());

    // Set refs to true
    result.current.hasShownDailyModal.current = true;
    result.current.hasShownChapterModal.current = true;
    result.current.hasShownFreeRunModal.current = true;
    result.current.hasShownCompletionAd.current = true;

    act(() => result.current.resetAllModals());

    expect(result.current.hasShownDailyModal.current).toBe(false);
    expect(result.current.hasShownChapterModal.current).toBe(false);
    expect(result.current.hasShownFreeRunModal.current).toBe(false);
    expect(result.current.hasShownCompletionAd.current).toBe(false);
  });
});
