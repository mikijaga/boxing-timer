import React, { useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useBoxingTimer, PHASE } from '../hooks/useBoxingTimer';
import ProgressRing from '../components/ProgressRing';
import { COLORS } from '../utils/theme';
import { formatTime, formatDuration, formatElapsed } from '../utils/format';
import AdBanner from '../components/AdBanner';

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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const insets = useSafeAreaInsets();

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

  const color  = PHASE_COLOR[phase] || COLORS.primary;
  const dimBg  = PHASE_DIM[phase]   || 'transparent';

  const nextText = (() => {
    const r1Name = roundConfigs[0]?.name ?? '';
    if (phase === PHASE.WARMUP) {
      return r1Name
        ? `Round 1 · ${r1Name} · ${formatDuration(roundConfigs[0]?.roundDuration ?? 0)}`
        : `Round 1 · ${formatDuration(roundConfigs[0]?.roundDuration ?? 0)}`;
    }
    if (phase === PHASE.ROUND) {
      if (currentRound >= totalRounds) return 'Last round — finish strong!';
      return `Rest · ${formatDuration(currentConfig?.restDuration ?? 0)}`;
    }
    if (phase === PHASE.REST && nextConfig) {
      const nextName = nextConfig.name ?? '';
      return nextName
        ? `Round ${currentRound + 1} · ${nextName} · ${formatDuration(nextConfig.roundDuration)}`
        : `Round ${currentRound + 1} · ${formatDuration(nextConfig.roundDuration)}`;
    }
    return '';
  })();

  const handleStop = () => {
    Alert.alert('Stop session?', 'This will end your current session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => { stop(); navigation.goBack(); } },
    ]);
  };

  const handleBack = () => { stop(); navigation.goBack(); };

  // Ring size adapts to orientation and whether a workout name is shown
  const hasWorkoutName = phase === PHASE.ROUND && typeof workoutName === 'string' && workoutName.length > 0;
  const ringSize = isLandscape
    ? Math.min(height * 0.65, 240)
    : hasWorkoutName
      ? Math.min(width * 0.62, 260)
      : Math.min(width * 0.70, 290);

  // ── Inline render helpers (NOT components — avoids remount bug) ─────────────

  const workoutName = (currentConfig?.name ?? '').trim();

  const phaseBanner = (
    <View style={[styles.phaseBanner, { backgroundColor: dimBg }]}>
      <View style={[styles.phaseDot, { backgroundColor: color }]} />
      <Text style={[styles.phaseLabel, { color }]}>{PHASE_LABEL[phase]}</Text>
      {phase === PHASE.ROUND && (
        <View style={[styles.roundPill, { borderColor: color }]}>
          <Text style={[styles.roundPillText, { color }]}>{currentRound} / {totalRounds}</Text>
        </View>
      )}
      {phase === PHASE.REST && (
        <Text style={[styles.phaseSubtext, { color }]}>After round {currentRound}</Text>
      )}
    </View>
  );

  const ringCenter = phase === PHASE.DONE ? (
    <View style={styles.centerContent}>
      <Text style={styles.trophyEmoji}>🏆</Text>
      <Text style={[styles.doneWord, { color: COLORS.success }]}>SESSION</Text>
      <Text style={[styles.doneWord, { color: COLORS.success }]}>COMPLETE</Text>
    </View>
  ) : (
    <View style={styles.centerContent}>
      <Text style={[styles.timerDigits, { color, fontSize: ringSize * 0.21 }]}>
        {formatTime(timeRemaining)}
      </Text>
      {!isRunning && phase !== PHASE.DONE && (
        <Text style={styles.pausedTag}>PAUSED</Text>
      )}
      {phase === PHASE.ROUND && currentConfig && (
        <Text style={styles.durationHint}>of {formatDuration(currentConfig.roundDuration)}</Text>
      )}
      {phase === PHASE.REST && currentConfig && (
        <Text style={styles.durationHint}>of {formatDuration(currentConfig.restDuration)}</Text>
      )}
    </View>
  );

  const roundDots = (phase !== PHASE.DONE && totalRounds <= 24) ? (
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
  ) : null;

  const nextRow = nextText !== '' ? (
    <View style={styles.nextRow}>
      <Text style={styles.nextLabel}>NEXT</Text>
      <Text style={styles.nextValue}>{nextText}</Text>
    </View>
  ) : null;

  const controlBtn = phase === PHASE.DONE ? (
    <TouchableOpacity
      style={[styles.ctrlBtn, styles.ctrlBtnSuccess]}
      onPress={handleBack}
      activeOpacity={0.85}
    >
      <Text style={[styles.ctrlBtnTxt, { color: '#fff' }]}>BACK TO SETUP</Text>
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
  );

  const adSlot = (!isRunning || phase === PHASE.REST || phase === PHASE.DONE)
    ? <AdBanner />
    : null;

  // ── Landscape layout ────────────────────────────────────────────────────────
  if (isLandscape) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={styles.landscapeContainer}>

          {/* Left — ring */}
          <View style={styles.landscapeLeft}>
            <ProgressRing
              size={ringSize}
              strokeWidth={8}
              progress={progress}
              color={color}
              trackColor={COLORS.surface}
            >
              {ringCenter}
            </ProgressRing>
          </View>

          {/* Right — info + controls */}
          <View style={styles.landscapeRight}>
            {/* Top bar */}
            <View style={styles.topBarLandscape}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={phase === PHASE.DONE ? handleBack : handleStop}
              >
                <Text style={styles.backBtnText}>
                  {phase === PHASE.DONE ? '← Back' : '✕ Stop'}
                </Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.elapsedLabel}>ELAPSED</Text>
                <Text style={styles.elapsedValue}>{formatElapsed(elapsedTotal)}</Text>
              </View>
            </View>

            {phaseBanner}
            {phase === PHASE.ROUND && workoutName.length > 0 && (
              <View style={[styles.workoutNameBannerLandscape, { borderColor: `${color}40` }]}>
                <Text style={[styles.workoutNameLandscape, { color }]} numberOfLines={1} adjustsFontSizeToFit>
                  {workoutName}
                </Text>
              </View>
            )}
            {roundDots}
            {nextRow}
            {controlBtn}
            {adSlot}
          </View>

        </View>
      </SafeAreaView>
    );
  }

  // ── Portrait layout ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={phase === PHASE.DONE ? handleBack : handleStop}
        >
          <Text style={styles.backBtnText}>{phase === PHASE.DONE ? '← Back' : '✕ Stop'}</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.elapsedLabel}>ELAPSED</Text>
          <Text style={styles.elapsedValue}>{formatElapsed(elapsedTotal)}</Text>
        </View>
      </View>

      {phaseBanner}

      {/* Workout name — large, prominent, below phase banner */}
      {phase === PHASE.ROUND && workoutName.length > 0 && (
        <View style={[styles.workoutNameBanner, { borderColor: `${color}40` }]}>
          <Text style={[styles.workoutNameLarge, { color }]} numberOfLines={2} adjustsFontSizeToFit>
            {workoutName}
          </Text>
        </View>
      )}

      {/* Ring */}
      <View style={styles.ringWrap}>
        <ProgressRing
          size={ringSize}
          strokeWidth={10}
          progress={progress}
          color={color}
          trackColor={COLORS.surface}
        >
          {ringCenter}
        </ProgressRing>
      </View>

      {roundDots}

      {totalRounds > 24 && phase !== PHASE.DONE && (
        <Text style={styles.roundCounter}>Round {currentRound} of {totalRounds}</Text>
      )}

      {nextRow}

      <View style={[styles.ctrlRow]}>
        {controlBtn}
      </View>

      <View style={{ paddingBottom: Math.max(insets.bottom + 4, 10) }}>
        {adSlot}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Top bar (portrait)
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  topBarLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  backBtnText:   { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  elapsedLabel:  { color: COLORS.textTertiary, fontSize: 9, fontWeight: '600', letterSpacing: 1.5, textAlign: 'right' },
  elapsedValue:  { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500', letterSpacing: 0.5, textAlign: 'right' },

  // Phase banner
  phaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 7,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  phaseDot:       { width: 7, height: 7, borderRadius: 4 },
  phaseLabel:     { fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  roundPill:      { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  roundPillText:  { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  phaseSubtext:   { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  workoutNamePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    maxWidth: 160,
  },
  workoutNameText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Large workout name banner — shown below phase banner during a round
  workoutNameBanner: {
    marginHorizontal: 20,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  workoutNameLarge: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Landscape variant — more compact
  workoutNameBannerLandscape: {
    marginBottom: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  workoutNameLandscape: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Ring
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerContent: { alignItems: 'center' },
  timerDigits: {
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
  trophyEmoji: { fontSize: 32, marginBottom: 4 },
  doneWord:    { fontSize: 14, fontWeight: '700', letterSpacing: 3, lineHeight: 20 },

  // Round dots
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 5,
    marginBottom: 8,
  },
  dot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.surface, borderWidth: 0.5, borderColor: COLORS.border },
  dotDone:    { backgroundColor: COLORS.textTertiary, borderColor: COLORS.textTertiary },
  dotCurrent: { width: 12, height: 12, borderRadius: 6 },
  roundCounter: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Next
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  nextLabel: { color: COLORS.textTertiary, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  nextValue: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },

  // Controls
  ctrlRow: { paddingHorizontal: 20, marginBottom: 10 },
  ctrlBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctrlBtnSuccess: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  ctrlBtnTxt:     { fontSize: 15, fontWeight: '700', letterSpacing: 2 },

  // Ad
  adBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adText: { color: COLORS.textTertiary, fontSize: 11, letterSpacing: 1 },

  // Landscape
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 1.3,
    justifyContent: 'center',
  },
});