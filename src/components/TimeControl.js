import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { formatDuration, clamp } from '../utils/format';

const NEG_INC = [-5, -10, -15, -20, -25, -30];
const POS_INC = [5, 10, 15, 20, 25, 30];

export default function TimeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 600,
  step = 5,
  suffix = '',
}) {
  const apply = (delta) => onChange(clamp(value + delta, min, max));

  const display = suffix ? `${value}${suffix}` : formatDuration(value);

  return (
    <View style={styles.wrap}>
      {/* Label + value + step +/- */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.stepRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => apply(-step)} activeOpacity={0.7}>
            <Text style={styles.stepTxt}>−</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>{display}</Text>
          <TouchableOpacity style={[styles.stepBtn, styles.stepBtnPos]} onPress={() => apply(step)} activeOpacity={0.7}>
            <Text style={[styles.stepTxt, { color: '#fff' }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Negative row */}
      <Text style={styles.rowLabel}>Quick reduce</Text>
      <View style={styles.incRow}>
        {NEG_INC.map((n) => {
          const off = value + n < min;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.incBtn, styles.negBtn, off && styles.disabled]}
              onPress={() => apply(n)}
              disabled={off}
              activeOpacity={0.75}
            >
              <Text style={[styles.incTxt, styles.negTxt, off && styles.disabledTxt]}>{n}s</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Positive row */}
      <Text style={[styles.rowLabel, { marginTop: 7 }]}>Quick add</Text>
      <View style={styles.incRow}>
        {POS_INC.map((n) => {
          const off = value + n > max;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.incBtn, styles.posBtn, off && styles.disabled]}
              onPress={() => apply(n)}
              disabled={off}
              activeOpacity={0.75}
            >
              <Text style={[styles.incTxt, styles.posTxt, off && styles.disabledTxt]}>+{n}s</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPos: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepTxt: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '300',
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: -0.5,
    minWidth: 60,
    textAlign: 'center',
  },
  rowLabel: {
    color: COLORS.textTertiary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  incRow: {
    flexDirection: 'row',
    gap: 4,
  },
  incBtn: {
    flex: 1,
    height: 29,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  negBtn: {
    backgroundColor: 'rgba(230,57,70,0.09)',
    borderColor: 'rgba(230,57,70,0.3)',
  },
  posBtn: {
    backgroundColor: 'rgba(46,204,113,0.09)',
    borderColor: 'rgba(46,204,113,0.3)',
  },
  disabled: { opacity: 0.22 },
  incTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  negTxt: { color: '#E63946' },
  posTxt: { color: '#2ECC71' },
  disabledTxt: { opacity: 0.5 },
});
