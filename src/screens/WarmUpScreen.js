import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import ProgressRing from '../components/ProgressRing';
import TimeControl from '../components/TimeControl';
import { COLORS } from '../utils/theme';
import { formatTime } from '../utils/format';
import { SoundManager } from '../utils/SoundManager';
import AdBanner from '../components/AdBanner';

export default function WarmUpScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [duration,  setDuration ] = useState(30);
  const [timeLeft,  setTimeLeft ] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone,    setIsDone   ] = useState(false);

  useKeepAwake();

  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);
  const tenSecRef   = useRef(false);
  const endBellRef  = useRef(false);

  useEffect(() => { SoundManager.init(); }, []);

  const resetFlags = () => {
    tenSecRef.current  = false;
    endBellRef.current = false;
  };

  useEffect(() => {
    if (!isRunning) return;
    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now   = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setTimeLeft(prev => {
        const next = prev - delta;
        if (prev > 10 && next <= 10 && !tenSecRef.current) {
          tenSecRef.current = true;
          SoundManager.playTap();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        if (next <= 0 && !endBellRef.current) {
          endBellRef.current = true;
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsDone(true);
          SoundManager.playBell();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return 0;
        }
        return next > 0 ? next : 0;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = () => {
    resetFlags();
    setTimeLeft(duration);
    setIsDone(false);
    setIsRunning(true);
    SoundManager.playBell();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsDone(false);
    setTimeLeft(duration);
    resetFlags();
  };

  const handleDurationChange = (val) => {
    const clamped = Math.min(60, Math.max(0, val));
    setDuration(clamped);
    if (!isRunning) setTimeLeft(clamped);
  };

  const progress  = duration > 0 ? timeLeft / duration : 0;
  const ringColor = isDone ? COLORS.success : COLORS.warning;

  // Ring size adapts to orientation
  const ringSize = isLandscape
    ? Math.min(height * 0.55, 200)
    : Math.min(width * 0.60, 240);

  // ── Landscape layout ──────────────────────────────────────────────────────
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
              color={ringColor}
              trackColor={COLORS.surface}
            >
              {isDone ? (
                <View style={styles.center}>
                  <Text style={styles.doneEmoji}>✅</Text>
                  <Text style={[styles.doneLabel, { color: COLORS.success }]}>DONE</Text>
                </View>
              ) : (
                <View style={styles.center}>
                  <Text style={[styles.digits, { color: isRunning ? ringColor : COLORS.textSecondary, fontSize: ringSize * 0.22 }]}>
                    {formatTime(Math.ceil(timeLeft))}
                  </Text>
                  {!isRunning && !isDone && (
                    <Text style={styles.readyLabel}>READY</Text>
                  )}
                  {isRunning && timeLeft <= 10 && (
                    <Text style={[styles.warningLabel, { color: COLORS.warning }]}>ALMOST DONE</Text>
                  )}
                </View>
              )}
            </ProgressRing>
          </View>

          {/* Right — controls */}
          <ScrollView
            style={styles.landscapeRight}
            contentContainerStyle={styles.landscapeRightContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.headingSmall}>Warm-up Timer</Text>

            {!isRunning && !isDone && (
              <TimeControl
                label="DURATION (max 60s)"
                value={duration}
                onChange={handleDurationChange}
                min={0}
                max={60}
                step={5}
              />
            )}

            <View style={styles.soundBadge}>
              <Text style={styles.soundBadgeText}>🔔 Bell on start & end  ·  🥊 Tap at 10s</Text>
            </View>

            {!isRunning && !isDone && (
              <TouchableOpacity
                style={[styles.btn, styles.startBtn, duration === 0 && styles.btnDisabled]}
                onPress={handleStart}
                disabled={duration === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>🔔  START WARM-UP</Text>
              </TouchableOpacity>
            )}
            {isRunning && (
              <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={handleReset} activeOpacity={0.85}>
                <Text style={styles.stopBtnText}>STOP</Text>
              </TouchableOpacity>
            )}
            {isDone && (
              <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={handleReset} activeOpacity={0.85}>
                <Text style={styles.resetBtnText}>RESET</Text>
              </TouchableOpacity>
            )}

            {/* Ad banner */}
            <AdBanner />
          </ScrollView>

        </View>
      </SafeAreaView>
    );
  }

  // ── Portrait layout ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.portraitContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Warm-up Timer</Text>
        <Text style={styles.subheading}>
          {isRunning ? 'Get your blood pumping 🔥' : 'Max 60 seconds'}
        </Text>

        {/* Ring */}
        <View style={styles.ringArea}>
          <ProgressRing
            size={ringSize}
            strokeWidth={10}
            progress={progress}
            color={ringColor}
            trackColor={COLORS.surface}
          >
            {isDone ? (
              <View style={styles.center}>
                <Text style={styles.doneEmoji}>✅</Text>
                <Text style={[styles.doneLabel, { color: COLORS.success }]}>DONE</Text>
              </View>
            ) : (
              <View style={styles.center}>
                <Text style={[styles.digits, { color: isRunning ? ringColor : COLORS.textSecondary, fontSize: ringSize * 0.22 }]}>
                  {formatTime(Math.ceil(timeLeft))}
                </Text>
                {!isRunning && !isDone && <Text style={styles.readyLabel}>READY</Text>}
                {isRunning && timeLeft <= 10 && (
                  <Text style={[styles.warningLabel, { color: COLORS.warning }]}>ALMOST DONE</Text>
                )}
              </View>
            )}
          </ProgressRing>
        </View>

        {/* Duration control */}
        {!isRunning && !isDone && (
          <TimeControl
            label="DURATION (max 60s)"
            value={duration}
            onChange={handleDurationChange}
            min={0}
            max={60}
            step={5}
          />
        )}

        {/* Sound badge */}
        <View style={styles.soundBadge}>
          <Text style={styles.soundBadgeText}>🔔 Bell on start & end  ·  🥊 Tap at 10s</Text>
        </View>

        {/* Buttons */}
        {!isRunning && !isDone && (
          <TouchableOpacity
            style={[styles.btn, styles.startBtn, duration === 0 && styles.btnDisabled]}
            onPress={handleStart}
            disabled={duration === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>🔔  START WARM-UP</Text>
          </TouchableOpacity>
        )}
        {isRunning && (
          <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={handleReset} activeOpacity={0.85}>
            <Text style={styles.stopBtnText}>STOP</Text>
          </TouchableOpacity>
        )}
        {isDone && (
          <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={handleReset} activeOpacity={0.85}>
            <Text style={styles.resetBtnText}>RESET</Text>
          </TouchableOpacity>
        )}

        {duration === 0 && !isRunning && (
          <Text style={styles.hint}>Set a duration above to enable the warm-up timer</Text>
        )}

        {/* Ad banner — full width, clearly visible */}
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Portrait
  portraitContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    // NO alignItems: 'center' — it squeezes full-width children like TimeControl and AdBanner
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',   // ← centre text without squeezing block width
  },
  headingSmall: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  ringArea: { marginBottom: 20, alignItems: 'center' },
  center:   { alignItems: 'center' },
  digits: {
    fontWeight: '200',
    letterSpacing: -2,
  },
  readyLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  warningLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  doneEmoji:  { fontSize: 32, marginBottom: 4 },
  doneLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 3,
  },

  // Sound badge
  soundBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
    alignSelf: 'center',
  },
  soundBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Buttons
  btn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  startBtn:     { backgroundColor: COLORS.warning },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  stopBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  stopBtnText:  { color: COLORS.primary, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  btnDisabled:  { opacity: 0.4 },
  resetBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  resetBtnText: { color: COLORS.success, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  hint: {
    color: COLORS.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Ad banners
  adBannerPortrait: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  adBannerLandscape: {
    width: '100%',
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,   // ← enough clearance to sit above the nav bar
  },
  adText: { color: COLORS.textTertiary, fontSize: 11, letterSpacing: 1 },

  // Landscape layout
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,   // ← generous bottom so ad fully clears nav bar
    gap: 16,
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 1.2,
  },
  landscapeRightContent: {
    paddingTop: 10,
    paddingBottom: 40,   // clears nav bar
    justifyContent: 'flex-start',
  },
  adWrapLandscape: {
    marginTop: 8,
    marginBottom: 32,   // clears the bottom navigation bar in landscape
  },
});