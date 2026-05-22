import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, useWindowDimensions, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import ProgressRing from '../components/ProgressRing';
import TimeControl from '../components/TimeControl';
import AdBanner from '../components/AdBanner';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { COLORS } from '../utils/theme';
import { formatTime } from '../utils/format';
import { SoundManager } from '../utils/SoundManager';

const COUNTDOWN_SECS = [5, 4, 3, 2, 1];

export default function WarmUpScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const [duration,  setDuration ] = useState(30);
  const [timeLeft,  setTimeLeft ] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone,    setIsDone   ] = useState(false);

  useKeepAwake();

  const intervalRef  = useRef(null);
  const lastTickRef  = useRef(null);
  const tenSecRef    = useRef(false);
  const endBellRef   = useRef(false);
  const countdownRef = useRef(new Set());

  useEffect(() => { SoundManager.init(); }, []);

  const resetFlags = () => {
    tenSecRef.current    = false;
    endBellRef.current   = false;
    countdownRef.current = new Set();
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
          SoundManager.playDoubleTap();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }

        for (const sec of COUNTDOWN_SECS) {
          if (prev > sec && next <= sec && !countdownRef.current.has(sec)) {
            countdownRef.current.add(sec);
            SoundManager.playTap();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
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
  const ringSize  = isLandscape
    ? Math.min(height * 0.55, 200)
    : Math.min(width * 0.60, 240);

  // ── Inline JSX variables — NOT inner components (avoids remount/onPress bug) ──

  const ringContent = isDone ? (
    <View style={s.center}>
      <Text style={s.doneEmoji}>✅</Text>
      <Text style={[s.doneLabel, { color: COLORS.success }]}>DONE</Text>
    </View>
  ) : (
    <View style={s.center}>
      <Text style={[s.digits, { color: isRunning ? ringColor : COLORS.textSecondary, fontSize: ringSize * 0.22 }]}>
        {formatTime(Math.ceil(timeLeft))}
      </Text>
      {!isRunning && !isDone && <Text style={s.readyLabel}>READY</Text>}
      {isRunning && timeLeft <= 10 && (
        <Text style={[s.warningLabel, { color: COLORS.warning }]}>ALMOST DONE</Text>
      )}
    </View>
  );

  const actionButton = !isRunning && !isDone ? (
    <TouchableOpacity
      style={[s.btn, s.startBtn, duration === 0 && s.btnDisabled]}
      onPress={handleStart}
      disabled={duration === 0}
      activeOpacity={0.85}
    >
      <Text style={s.startBtnText}>🔔  START WARM-UP</Text>
    </TouchableOpacity>
  ) : isRunning ? (
    <TouchableOpacity style={[s.btn, s.stopBtn]} onPress={handleReset} activeOpacity={0.85}>
      <Text style={s.stopBtnText}>STOP</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={[s.btn, s.resetBtn]} onPress={handleReset} activeOpacity={0.85}>
      <Text style={s.resetBtnText}>RESET</Text>
    </TouchableOpacity>
  );

  const soundBadge = (
    <View style={s.soundBadge}>
      <Text style={s.soundBadgeText}>🔔 Bell on start & end  ·  🥊🥊 Double tap at 10s  ·  🥊 Tap 5–1s</Text>
    </View>
  );

  // ── Landscape ──────────────────────────────────────────────────────────────
  if (isLandscape) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={[s.landscapeContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.landscapeLeft}>
            <ProgressRing size={ringSize} strokeWidth={8} progress={progress} color={ringColor} trackColor={COLORS.surface}>
              {ringContent}
            </ProgressRing>
          </View>
          <ScrollView
            style={s.landscapeRight}
            contentContainerStyle={[s.landscapeRightContent, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={s.headingSmall}>Warm-up Timer</Text>
            {!isRunning && !isDone && (
              <TimeControl label="DURATION (max 60s)" value={duration} onChange={handleDurationChange} min={0} max={60} step={5} />
            )}
            {soundBadge}
            {actionButton}
            <AdBanner />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ── Portrait ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ResponsiveContainer>
      <ScrollView
        contentContainerStyle={[s.portraitContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.heading}>Warm-up Timer</Text>
        <Text style={s.subheading}>{isRunning ? 'Get your blood pumping 🔥' : 'Max 60 seconds'}</Text>
        <View style={s.ringArea}>
          <ProgressRing size={ringSize} strokeWidth={10} progress={progress} color={ringColor} trackColor={COLORS.surface}>
            {ringContent}
          </ProgressRing>
        </View>
        {!isRunning && !isDone && (
          <TimeControl label="DURATION (max 60s)" value={duration} onChange={handleDurationChange} min={0} max={60} step={5} />
        )}
        {soundBadge}
        {actionButton}
        {duration === 0 && !isRunning && (
          <Text style={s.hint}>Set a duration above to enable the warm-up timer</Text>
        )}
        <AdBanner />
      </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.bg },
  portraitContent: { paddingHorizontal: 20, paddingTop: 16 },
  heading:         { color: COLORS.textPrimary, fontSize: 20, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  headingSmall:    { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 10 },
  subheading:      { color: COLORS.textSecondary, fontSize: 12, marginBottom: 20, letterSpacing: 0.3, textAlign: 'center' },
  ringArea:        { marginBottom: 20, alignItems: 'center' },
  center:          { alignItems: 'center' },
  digits:          { fontWeight: '200', letterSpacing: -2 },
  readyLabel:      { color: COLORS.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 3, marginTop: 4 },
  warningLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  doneEmoji:       { fontSize: 32, marginBottom: 4 },
  doneLabel:       { fontSize: 15, fontWeight: '700', letterSpacing: 3 },
  soundBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
    alignSelf: 'center',
  },
  soundBadgeText: { color: COLORS.textSecondary, fontSize: 10, letterSpacing: 0.3, textAlign: 'center' },
  btn:          { width: '100%', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  startBtn:     { backgroundColor: COLORS.warning },
  startBtnText: { color: '#28305E', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  stopBtn:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary },
  stopBtnText:  { color: COLORS.primary, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  btnDisabled:  { opacity: 0.4 },
  resetBtn:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.success },
  resetBtnText: { color: COLORS.success, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  hint:         { color: COLORS.textTertiary, fontSize: 11, textAlign: 'center', marginBottom: 12 },
  landscapeContainer:    { flex: 1, flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  landscapeLeft:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  landscapeRight:        { flex: 1.2 },
  landscapeRightContent: { paddingTop: 10, justifyContent: 'flex-start' },
});