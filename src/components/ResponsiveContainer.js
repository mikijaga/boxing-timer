/**
 * ResponsiveContainer.js
 *
 * Handles responsive layout for all screen sizes:
 * - Phones:  full width, normal padding
 * - Tablets: caps at MAX_CONTENT_WIDTH and centres
 * - All:     respects safe area insets bottom so nav bar never covers content
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_CONTENT_WIDTH } from '../utils/theme';

export default function ResponsiveContainer({ children, style, padBottom = false }) {
  const { width }  = useWindowDimensions();
  const insets     = useSafeAreaInsets();
  const isTablet   = width >= 768;

  return (
    <View style={[styles.outer, style]}>
      <View style={[
        styles.inner,
        isTablet && {
          maxWidth:  MAX_CONTENT_WIDTH,
          alignSelf: 'center',
          width:     '100%',
        },
        padBottom && {
          paddingBottom: Math.max(insets.bottom + 8, 16),
        },
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  inner: { flex: 1 },
});