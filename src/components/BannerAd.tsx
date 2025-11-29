/**
 * Banner ad component.
 * Displays a banner ad at the bottom of screens (Home, Stats, Settings).
 * Hidden for ad-free subscribers and on web platform.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAds } from '../context/AdContext';
import { AD_UNIT_IDS } from '../config/ads';

interface BannerAdProps {
  size?: BannerAdSize;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {
  const { isAdFree } = useAds();

  // Don't show ads for ad-free users or on web
  if (isAdFree || Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={AD_UNIT_IDS.BANNER}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});
