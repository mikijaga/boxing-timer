import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import ProgressRing from '../components/ProgressRing';
import TimeControl from '../components/TimeControl';
import { COLORS } from '../utils/theme';
import { formatTime } from '../utils/format';
import { SoundManager } from '../utils/SoundManager';

const { width } = Dimensions.get('window');
const RING_SIZE  = Math.min(width * 0.60, 240);

export default function WarmUpScreen() {
  const [duration,  setDuration ] = useState(30);
  const [timeLeft,  setTimeLeft ] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone,    setIsDone   ] = useState(false);

  useKeepAwake();

  const intervalRef  = useRef(null);
  const lastTickRef  = useRef(null);
  const tenSecRef    = useRef(false); // tap fires once per session
  const endBellRef   = useRef(false);

  // Initialise sounds when this tab is first mounted
  useEffect(() => {
    SoundManager.init();
  }, []);

  // Reset per-session flags when a new session starts
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

        // 🥊 Tap at 10-second warning
        if (prev > 10 && next <= 10 && !tenSecRef.current) {
          tenSecRef.current = true;
          SoundManager.playTap();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }

        // 🔔 End bell + done state
        if (next <= 0 && !endBellRef.current) {
          endBellRef.current = true;
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsDone(true);
          SoundManager.playBell();        // 🔔 Warmup end bell
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
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
    SoundManager.playBell();              // 🔔 Warmup start bell
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

  const progress   = duration > 0 ? timeLeft / duration : 0;
  const ringColor  = isDone ? COLORS.success : COLORS.warning;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>
        <Text style={styles.heading}>Warm-up Timer</Text>
        <Text style={styles.subheading}>
          {isRunning ? 'Get your blood pumping 🔥' : 'Max 60 seconds'}
        </Text>

        {/* ── Ring ── */}
        <View style={styles.ringArea}>
          <ProgressRing
            size={RING_SIZE}
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
                <Text style={[styles.digits, { color: isRunning ? ringColor : COLORS.textSecondary }]}>
                  {formatTime(Math.ceil(timeLeft))}
                </Text>
                {!isRunning && !isDone && (
                  <Text style={styles.readyLabel}>READY</Text>
                )}
                {isRunning && timeLeft <= 10 && (
                  <Text style={[styles.warningLabel, { color: COLORS.warning }]}>
                    ALMOST DONE
                  </Text>
                )}
              </View>
            )}
          </ProgressRing>
        </View>

        {/* ── Duration control (only when idle) ── */}
        {!isRunning && !isDone && (
          <View style={styles.controlArea}>
            <TimeControl
              label="DURATION (max 60s)"
              value={duration}
              onChange={handleDurationChange}
              min={0}
              max={60}
              step={5}
            />
          </View>
        )}

        {/* ── Sound reminder badge ── */}
        <View style={styles.soundBadge}>
          <Text style={styles.soundBadgeText}>
            🔔 Bell on start & end  ·  🥊 Tap at 10 s
          </Text>
        </View>

        {/* ── Buttons ── */}
        <View style={styles.btnRow}>
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
            <TouchableOpacity
              style={[styles.btn, styles.stopBtn]}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.stopBtnText}>STOP</Text>
            </TouchableOpacity>
          )}

          {isDone && (
            <TouchableOpacity
              style={[styles.btn, styles.resetBtn]}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.resetBtnText}>RESET</Text>
            </TouchableOpacity>
          )}
        </View>

        {duration === 0 && !isRunning && (
          <Text style={styles.hint}>Set a duration above to enable the warm-up timer</Text>
        )}

        {/* ── Ad banner ── */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Advertisement</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  ringArea:     { marginBottom: 20 },
  center:       { alignItems: 'center' },
  digits: {
    fontSize: RING_SIZE * 0.22,
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
  doneEmoji:  { fontSize: 36, marginBottom: 4 },
  doneLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
  },
  controlArea: {
    width: '100%',
    marginBottom: 4,
  },
  soundBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  soundBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  btnRow:     { width: '100%', marginBottom: 12 },
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startBtn:   { backgroundColor: COLORS.warning },
  startBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  stopBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  stopBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  btnDisabled: { opacity: 0.4 },
  resetBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  resetBtnText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hint: {
    color: COLORS.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },
  adBanner: {
    width: '100%',
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 8,
  },
  adText: { color: COLORS.textTertiary, fontSize: 11, letterSpacing: 1 },
});
