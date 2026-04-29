import React, { useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useBoxingTimer, PHASE } from '../hooks/useBoxingTimer';
import ProgressRing from '../components/ProgressRing';
import { COLORS } from '../utils/theme';
import { formatTime, formatDuration, formatElapsed } from '../utils/format';

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.70, 290);

const PHASE_COLOR = {
  [PHASE.WARMUP]: COLORS.warning,
  [PHASE.ROUND]:  COLORS.primary,
  [PHASE.REST]:   COLORS.rest,
  [PHASE.DONE]:   COLORS.success,
  [PHASE.IDLE]:   COLORS.textSecondary,
};

const PHASE_LABEL = {
  [PHASE.WARMUP]: 'WARM-UP',
  [PHASE.ROUND]:  'FIGHT',
  [PHASE.REST]:   'REST',
  [PHASE.DONE]:   'DONE',
  [PHASE.IDLE]:   'READY',
};

const PHASE_DIM = {
  [PHASE.WARMUP]: 'rgba(243,156,18,0.09)',
  [PHASE.ROUND]:  'rgba(230,57,70,0.09)',
  [PHASE.REST]:   'rgba(58,134,255,0.09)',
  [PHASE.DONE]:   'rgba(46,204,113,0.09)',
  [PHASE.IDLE]:   'transparent',
};

export default function TimerScreen({ navigation, route }) {
  const { roundConfigs, warmupDuration } = route.params;
  useKeepAwake();

  const {
    phase,
    currentRound,
    totalRounds,
    timeRemaining,
    elapsedTotal,
    isRunning,
    progress,
    currentConfig,
    nextConfig,
    start,
    pause,
    resume,
    stop,
  } = useBoxingTimer({ roundConfigs, warmupDuration });

  useEffect(() => { start(); }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const color = PHASE_COLOR[phase] || COLORS.primary;
  const dimBg = PHASE_DIM[phase] || 'transparent';

  // "Next up" text
  const nextText = (() => {
    if (phase === PHASE.WARMUP)
      return `Round 1 · ${formatDuration(roundConfigs[0]?.roundDuration ?? 0)}`;
    if (phase === PHASE.ROUND) {
      if (currentRound >= totalRounds) return 'Last round — finish strong!';
      return `Rest · ${formatDuration(currentConfig?.restDuration ?? 0)}`;
    }
    if (phase === PHASE.REST && nextConfig)
      return `Round ${currentRound + 1} · ${formatDuration(nextConfig.roundDuration)}`;
    return '';
  })();

  const handleStop = () => {
    Alert.alert('Stop session?', 'This will end your current session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => { stop(); navigation.goBack(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={phase === PHASE.DONE ? () => { stop(); navigation.goBack(); } : handleStop}
        >
          <Text style={styles.backBtnText}>{phase === PHASE.DONE ? '← Back' : '✕ Stop'}</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.elapsedLabel}>ELAPSED</Text>
          <Text style={styles.elapsedValue}>{formatElapsed(elapsedTotal)}</Text>
        </View>
      </View>

      {/* ── Phase banner ── */}
      <View style={[styles.phaseBanner, { backgroundColor: dimBg }]}>
        <View style={[styles.phaseDot, { backgroundColor: color }]} />
        <Text style={[styles.phaseLabel, { color }]}>{PHASE_LABEL[phase]}</Text>
        {phase === PHASE.ROUND && (
          <View style={[styles.roundPill, { borderColor: color }]}>
            <Text style={[styles.roundPillText, { color }]}>
              {currentRound} / {totalRounds}
            </Text>
          </View>
        )}
        {phase === PHASE.REST && (
          <Text style={[styles.phaseSubtext, { color }]}>
            After round {currentRound}
          </Text>
        )}
      </View>

      {/* ── Ring ── */}
      <View style={styles.ringWrap}>
        <ProgressRing
          size={RING_SIZE}
          strokeWidth={10}
          progress={progress}
          color={color}
          trackColor={COLORS.surface}
        >
          {phase === PHASE.DONE ? (
            <View style={styles.centerContent}>
              <Text style={styles.trophyEmoji}>🏆</Text>
              <Text style={[styles.doneWord, { color: COLORS.success }]}>SESSION</Text>
              <Text style={[styles.doneWord, { color: COLORS.success }]}>COMPLETE</Text>
            </View>
          ) : (
            <View style={styles.centerContent}>
              <Text style={[styles.timerDigits, { color }]}>{formatTime(timeRemaining)}</Text>
              {!isRunning && phase !== PHASE.DONE && (
                <Text style={styles.pausedTag}>PAUSED</Text>
              )}
              {/* Current round duration hint */}
              {phase === PHASE.ROUND && currentConfig && (
                <Text style={styles.durationHint}>
                  of {formatDuration(currentConfig.roundDuration)}
                </Text>
              )}
              {phase === PHASE.REST && currentConfig && (
                <Text style={styles.durationHint}>
                  of {formatDuration(currentConfig.restDuration)}
                </Text>
              )}
            </View>
          )}
        </ProgressRing>
      </View>

      {/* ── Round dots ── */}
      {phase !== PHASE.DONE && totalRounds <= 24 && (
        <View style={styles.dotsRow}>
          {Array.from({ length: totalRounds }, (_, i) => {
            const done    = i + 1 < currentRound;
            const current = i + 1 === currentRound;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  done    && styles.dotDone,
                  current && [styles.dotCurrent, { backgroundColor: color }],
                ]}
              />
            );
          })}
        </View>
      )}
      {totalRounds > 24 && phase !== PHASE.DONE && (
        <Text style={styles.roundCounter}>
          Round {currentRound} of {totalRounds}
        </Text>
      )}

      {/* ── Next up ── */}
      {nextText !== '' && (
        <View style={styles.nextRow}>
          <Text style={styles.nextLabel}>NEXT</Text>
          <Text style={styles.nextValue}>{nextText}</Text>
        </View>
      )}

      {/* ── Controls ── */}
      <View style={styles.ctrlRow}>
        {phase === PHASE.DONE ? (
          <TouchableOpacity
            style={[styles.ctrlBtn, styles.ctrlBtnSuccess]}
            onPress={() => { stop(); navigation.goBack(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.ctrlBtnTxt}>BACK TO SETUP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctrlBtn, { borderColor: color }]}
            onPress={isRunning ? pause : resume}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctrlBtnTxt, { color }]}>
              {isRunning ? '⏸  PAUSE' : '▶  RESUME'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Ad — hidden while fighting ── */}
      {(!isRunning || phase === PHASE.REST || phase === PHASE.DONE) && (
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Advertisement</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  backBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  elapsedLabel: {
    color: COLORS.textTertiary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  elapsedValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'right',
  },

  // Phase banner
  phaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 7,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 14,
  },
  phaseDot: { width: 7, height: 7, borderRadius: 4 },
  phaseLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  roundPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  roundPillText: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  phaseSubtext: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },

  // Ring
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxHeight: RING_SIZE + 30,
  },
  centerContent: { alignItems: 'center' },
  timerDigits: {
    fontSize: RING_SIZE * 0.21,
    fontWeight: '200',
    letterSpacing: -2,
    includeFontPadding: false,
  },
  pausedTag: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  durationHint: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  trophyEmoji: { fontSize: 36, marginBottom: 4 },
  doneWord: { fontSize: 15, fontWeight: '700', letterSpacing: 3, lineHeight: 22 },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 10,
    maxWidth: width - 40,
    alignSelf: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  dotDone:    { backgroundColor: COLORS.textTertiary, borderColor: COLORS.textTertiary },
  dotCurrent: { width: 12, height: 12, borderRadius: 6 },
  roundCounter: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },

  // Next
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  nextLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  nextValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Controls
  ctrlRow: { paddingHorizontal: 24, marginBottom: 12 },
  ctrlBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctrlBtnSuccess: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  ctrlBtnTxt: { fontSize: 15, fontWeight: '700', letterSpacing: 2, color: '#fff' },

  // Ad
  adBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adText: { color: COLORS.textTertiary, fontSize: 11, letterSpacing: 1 },
});
