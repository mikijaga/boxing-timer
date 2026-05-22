import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../utils/theme';

let BannerAd, BannerAdSize, TestIds;
let adsAvailable = false;

try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd     = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds      = ads.TestIds;
  adsAvailable = true;
} catch {
  adsAvailable = false;
}

const ANDROID_AD_UNIT_ID = 'ca-app-pub-9909776849077501~4950843888';
const IOS_AD_UNIT_ID     = 'ca-app-pub-9909776849077501~4950843888';

const adUnitId = __DEV__
  ? (adsAvailable ? TestIds?.BANNER : null)
  : Platform.OS === 'android' ? ANDROID_AD_UNIT_ID : IOS_AD_UNIT_ID;

export default function AdBanner() {
  if (!adsAvailable || !adUnitId) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Advertisement</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  placeholder: {
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    color: COLORS.textTertiary,
    fontSize: 11,
    letterSpacing: 1,
  },
});