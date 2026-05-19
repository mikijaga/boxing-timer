import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { SoundManager } from '../utils/SoundManager';

export const PHASE = {
  IDLE:   'idle',
  WARMUP: 'warmup',
  ROUND:  'round',
  REST:   'rest',
  DONE:   'done',
};

const COUNTDOWN_SECS = [5, 4, 3, 2, 1]; // tap on each of these

export function useBoxingTimer(config) {
  const { roundConfigs = [], warmupDuration = 0 } = config || {};

  const [phase,         setPhase        ] = useState(PHASE.IDLE);
  const [currentRound,  setCurrentRound ] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning,     setIsRunning    ] = useState(false);
  const [elapsedTotal,  setElapsedTotal ] = useState(0);

  const intervalRef    = useRef(null);
  const lastTickRef    = useRef(null);
  const phaseRef       = useRef(PHASE.IDLE);
  const roundRef       = useRef(1);
  const configsRef     = useRef(roundConfigs);
  const tenSecRef      = useRef(false);  // double tap at 10s
  const endBellRef     = useRef(false);  // end bell
  const countdownRef   = useRef(new Set()); // tracks 5,4,3,2,1 taps

  phaseRef.current   = phase;
  roundRef.current   = currentRound;
  configsRef.current = roundConfigs;

  // Reset per-phase flags whenever phase changes
  useEffect(() => {
    tenSecRef.current    = false;
    endBellRef.current   = false;
    countdownRef.current = new Set();
  }, [phase]);

  const haptic = useCallback(async (type = 'light') => {
    try {
      if      (type === 'heavy')   await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      else if (type === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else                         await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }, []);

  const advancePhase = useCallback((currentPhase, roundIdx) => {
    const configs = configsRef.current;
    const total   = configs.length;

    if (currentPhase === PHASE.WARMUP) {
      setPhase(PHASE.ROUND);
      setCurrentRound(1);
      setTimeRemaining(configs[0].roundDuration);
      SoundManager.playBell();
      haptic('heavy');
      return;
    }
    if (currentPhase === PHASE.ROUND) {
      if (roundIdx >= total) {
        setPhase(PHASE.DONE);
        setIsRunning(false);
        clearInterval(intervalRef.current);
        SoundManager.playDoubleBell();
        haptic('success');
        return;
      }
      setPhase(PHASE.REST);
      setTimeRemaining(configs[roundIdx - 1].restDuration);
      SoundManager.playBell();
      haptic('heavy');
      return;
    }
    if (currentPhase === PHASE.REST) {
      const next = roundIdx + 1;
      setCurrentRound(next);
      setPhase(PHASE.ROUND);
      setTimeRemaining(configs[next - 1].roundDuration);
      SoundManager.playBell();
      haptic('heavy');
      return;
    }
  }, [haptic]);

  useEffect(() => {
    if (!isRunning || phase === PHASE.IDLE || phase === PHASE.DONE) return;

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now   = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setElapsedTotal(prev => prev + delta);

      setTimeRemaining(prev => {
        const next = prev - delta;

        // 🔔🔔 Double tap at 10 seconds
        if (prev > 10 && next <= 10 && !tenSecRef.current) {
          tenSecRef.current = true;
          SoundManager.playDoubleTap();
          haptic('light');
        }

        // 🔔 Single tap at each of 5, 4, 3, 2, 1 seconds
        for (const sec of COUNTDOWN_SECS) {
          if (prev > sec && next <= sec && !countdownRef.current.has(sec)) {
            countdownRef.current.add(sec);
            SoundManager.playTap();
            haptic('light');
          }
        }

        // 🔔 End bell
        if (next <= 0 && !endBellRef.current) {
          endBellRef.current = true;
          SoundManager.playBell();
          setTimeout(() => advancePhase(phaseRef.current, roundRef.current), 50);
          return 0;
        }

        return next > 0 ? next : 0;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, advancePhase, haptic]);

  const start = useCallback(() => {
    if (!roundConfigs.length) return;
    const first      = roundConfigs[0];
    const startPhase = warmupDuration > 0 ? PHASE.WARMUP : PHASE.ROUND;
    const startTime  = warmupDuration > 0 ? warmupDuration : first.roundDuration;
    setPhase(startPhase);
    setCurrentRound(1);
    setTimeRemaining(startTime);
    setElapsedTotal(0);
    setIsRunning(true);
    SoundManager.playBell();
    haptic('heavy');
  }, [roundConfigs, warmupDuration, haptic]);

  const pause  = useCallback(() => { setIsRunning(false); haptic('light'); }, [haptic]);
  const resume = useCallback(() => { setIsRunning(true);  haptic('light'); }, [haptic]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setPhase(PHASE.IDLE);
    setCurrentRound(1);
    setTimeRemaining(roundConfigs[0]?.roundDuration ?? 0);
    setElapsedTotal(0);
    haptic('light');
  }, [roundConfigs, haptic]);

  const getPhaseDuration = () => {
    const cfg = roundConfigs[currentRound - 1] || roundConfigs[0] || {};
    if (phase === PHASE.WARMUP) return warmupDuration;
    if (phase === PHASE.ROUND)  return cfg.roundDuration ?? 1;
    if (phase === PHASE.REST)   return cfg.restDuration  ?? 1;
    return 1;
  };

  const progress =
    phase !== PHASE.IDLE && phase !== PHASE.DONE
      ? Math.max(0, Math.min(1, timeRemaining / getPhaseDuration()))
      : 1;

  return {
    phase,
    currentRound,
    totalRounds: roundConfigs.length,
    timeRemaining: Math.ceil(timeRemaining),
    elapsedTotal,
    isRunning,
    progress,
    currentConfig: roundConfigs[currentRound - 1] || null,
    nextConfig:    roundConfigs[currentRound]     || null,
    start,
    pause,
    resume,
    stop,
  };
}