/**
 * ResponsiveContainer.js
 *
 * Centres and constrains content width on large screens (tablets, iPads).
 * On phones it fills the full width as normal.
 * On tablets/iPads it caps at MAX_CONTENT_WIDTH and centres.
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { MAX_CONTENT_WIDTH } from '../utils/theme';

export default function ResponsiveContainer({ children, style }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.outer, style]}>
      <View style={[
        styles.inner,
        isTablet && {
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
          width: '100%',
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