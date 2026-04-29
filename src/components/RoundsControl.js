import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../utils/theme';

const ROUND_INCREMENTS = [1, 3, 5, 10];

export default function RoundsControl({ value, onChange }) {
  const handleChange = (delta) => {
    const next = value + delta;
    if (next >= 1) onChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>ROUNDS</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.pmBtn}
          onPress={() => handleChange(-1)}
          activeOpacity={0.7}
          disabled={value <= 1}
        >
          <Text style={[styles.pmText, value <= 1 && styles.disabled]}>−</Text>
        </TouchableOpacity>

        <View style={styles.incRow}>
          {ROUND_INCREMENTS.map((inc) => (
            <TouchableOpacity
              key={inc}
              style={styles.incBtn}
              onPress={() => handleChange(inc)}
              activeOpacity={0.7}
            >
              <Text style={styles.incText}>+{inc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.pmBtn, styles.pmBtnAdd]}
          onPress={() => handleChange(1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pmText, { color: '#fff' }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pmBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmBtnAdd: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pmText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  disabled: {
    color: COLORS.textTertiary,
  },
  incRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  incBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
