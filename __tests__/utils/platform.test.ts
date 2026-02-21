import { Platform } from 'react-native';
import { isWeb, isIOS, isAndroid, isNative, getPlatformName } from '../../src/utils/platform';

describe('platform', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    (Platform as any).OS = originalOS;
  });

  describe('isWeb', () => {
    it('returns true when Platform.OS is web', () => {
      (Platform as any).OS = 'web';
      expect(isWeb()).toBe(true);
    });

    it('returns false when Platform.OS is ios', () => {
      (Platform as any).OS = 'ios';
      expect(isWeb()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('returns true on ios', () => {
      (Platform as any).OS = 'ios';
      expect(isIOS()).toBe(true);
    });

    it('returns false on android', () => {
      (Platform as any).OS = 'android';
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('returns true on android', () => {
      (Platform as any).OS = 'android';
      expect(isAndroid()).toBe(true);
    });

    it('returns false on ios', () => {
      (Platform as any).OS = 'ios';
      expect(isAndroid()).toBe(false);
    });
  });

  describe('isNative', () => {
    it('returns true on ios', () => {
      (Platform as any).OS = 'ios';
      expect(isNative()).toBe(true);
    });

    it('returns true on android', () => {
      (Platform as any).OS = 'android';
      expect(isNative()).toBe(true);
    });

    it('returns false on web', () => {
      (Platform as any).OS = 'web';
      expect(isNative()).toBe(false);
    });
  });

  describe('getPlatformName', () => {
    it('returns ios', () => {
      (Platform as any).OS = 'ios';
      expect(getPlatformName()).toBe('ios');
    });

    it('returns android', () => {
      (Platform as any).OS = 'android';
      expect(getPlatformName()).toBe('android');
    });

    it('returns web', () => {
      (Platform as any).OS = 'web';
      expect(getPlatformName()).toBe('web');
    });
  });
});
