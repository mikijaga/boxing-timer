import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';
import { formatDuration } from '../utils/format';
import TimeControl from '../components/TimeControl';

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_ROUND   = { roundDuration: 180, restDuration: 60, name: '' };
const DEFAULT_WARMUP  = 0;

let _id = 0;
const makeRound = (base = DEFAULT_ROUND) => ({ ...base, name: base.name ?? '', id: ++_id });

// ─── Root screen ─────────────────────────────────────────────────────────────
export default function SetupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rounds, setRounds] = useState([
    makeRound({ roundDuration: 180, restDuration: 60 }),
    makeRound({ roundDuration: 180, restDuration: 60 }),
    makeRound({ roundDuration: 180, restDuration: 60 }),
  ]);
  const [warmupDuration, setWarmupDuration] = useState(DEFAULT_WARMUP);
  const [expandedId, setExpandedId]         = useState(null);

  // ── Mutators ────────────────────────────────────────────────────────────────
  const addRound = () => {
    const last = rounds[rounds.length - 1];
    setRounds(prev => [...prev, makeRound(last)]);
  };

  const removeRound = (id) => {
    if (rounds.length <= 1) {
      Alert.alert('Cannot remove', 'You need at least 1 round.');
      return;
    }
    setRounds(prev => prev.filter(r => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateRound = useCallback((id, key, value) => {
    setRounds(prev =>
      prev.map(r => r.id === id ? { ...r, [key]: value } : r)
    );
  }, []);

  const applyToAll = (id) => {
    const src = rounds.find(r => r.id === id);
    if (!src) return;
    setRounds(prev =>
      prev.map(r => ({ ...r, roundDuration: src.roundDuration, restDuration: src.restDuration }))
    );
    Alert.alert('Done', `Round ${rounds.findIndex(r => r.id === id) + 1} settings applied to all rounds.`);
  };

  const handleStart = () => {
    navigation.navigate('Timer', { roundConfigs: rounds, warmupDuration });
  };

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalSeconds =
    warmupDuration +
    rounds.reduce((acc, r) => acc + r.roundDuration, 0) +
    rounds.slice(0, -1).reduce((acc, r) => acc + r.restDuration, 0);

  const allSame =
    rounds.every(r =>
      r.roundDuration === rounds[0].roundDuration &&
      r.restDuration === rounds[0].restDuration
    );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.topRow}>
          <Text style={styles.appTitle}>🥊 Boxing Timer</Text>
          <View style={styles.totalChip}>
            <Text style={styles.totalChipLabel}>TOTAL</Text>
            <Text style={styles.totalChipValue}>{formatDuration(totalSeconds)}</Text>
          </View>
        </View>

        {/* ── Quick summary bar ── */}
        <View style={styles.summaryBar}>
          <SummaryPill emoji="🔄" label={`${rounds.length} rounds`} />
          <SummaryPill emoji="⚡" label={allSame ? formatDuration(rounds[0].roundDuration) + '/round' : 'Mixed durations'} />
          <SummaryPill emoji="💤" label={allSame ? formatDuration(rounds[0].restDuration) + ' rest' : 'Mixed rest'} />
          {warmupDuration > 0 && <SummaryPill emoji="🔥" label={formatDuration(warmupDuration) + ' warm-up'} />}
        </View>

        {/* ── Warm-up ── */}
        <SectionTitle title="Warm-up" subtitle="optional · max 60s" />
        <TimeControl
          label="Warm-up duration"
          value={warmupDuration}
          onChange={(v) => setWarmupDuration(Math.min(60, Math.max(0, v)))}
          min={0}
          max={60}
          step={5}
        />
        {warmupDuration === 0 && (
          <Text style={styles.hint}>Disabled — session starts immediately with round 1</Text>
        )}

        {/* ── Rounds ── */}
        <SectionTitle
          title="Rounds"
          subtitle={`${rounds.length} round${rounds.length !== 1 ? 's' : ''} configured`}
        />

        {rounds.map((round, index) => (
          <RoundCard
            key={round.id}
            round={round}
            index={index}
            isExpanded={expandedId === round.id}
            onToggle={() => setExpandedId(expandedId === round.id ? null : round.id)}
            onUpdate={(key, val) => updateRound(round.id, key, val)}
            onRemove={() => removeRound(round.id)}
            onApplyAll={() => applyToAll(round.id)}
            canRemove={rounds.length > 1}
          />
        ))}

        {/* ── Add round ── */}
        <TouchableOpacity style={styles.addRoundBtn} onPress={addRound} activeOpacity={0.8}>
          <Text style={styles.addRoundText}>+ Add Round</Text>
        </TouchableOpacity>

        {/* ── Ad placeholder ── */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Advertisement</Text>
        </View>
      </ScrollView>

      {/* ── Fixed footer start button ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnLabel}>START SESSION</Text>
          <Text style={styles.startBtnSub}>
            {rounds.length} round{rounds.length !== 1 ? 's' : ''}
            {warmupDuration > 0 ? ` · ${formatDuration(warmupDuration)} warm-up` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Round card ───────────────────────────────────────────────────────────────
function RoundCard({ round, index, isExpanded, onToggle, onUpdate, onRemove, onApplyAll, canRemove }) {
  return (
    <View style={styles.roundCard}>
      {/* ── Collapsed header ── */}
      <TouchableOpacity style={styles.roundHeader} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeNum}>{index + 1}</Text>
        </View>
        <View style={styles.roundMeta}>
          <Text style={styles.roundTitle}>
            {round.name ? round.name : `Round ${index + 1}`}
          </Text>
          <Text style={styles.roundSummary}>
            ⚡ {formatDuration(round.roundDuration)}  ·  💤 {formatDuration(round.restDuration)} rest
          </Text>
        </View>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* ── Expanded body ── */}
      {isExpanded && (
        <View style={styles.roundBody}>

          {/* ── Optional workout name ── */}
          <View style={styles.nameInputWrap}>
            <Text style={styles.nameInputLabel}>WORKOUT NAME (optional)</Text>
            <TextInput
              style={styles.nameInput}
              value={round.name}
              onChangeText={(v) => onUpdate('name', v)}
              placeholder="Name of workout"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={40}
              returnKeyType="done"
              clearButtonMode="while-editing"
            />
            {round.name.length > 0 && (
              <Text style={styles.nameInputCount}>{round.name.length}/40</Text>
            )}
          </View>

          <TimeControl
            label="Round Duration"
            value={round.roundDuration}
            onChange={(v) => onUpdate('roundDuration', v)}
            min={10}
            max={600}
            step={5}
          />
          <TimeControl
            label="Rest After This Round"
            value={round.restDuration}
            onChange={(v) => onUpdate('restDuration', v)}
            min={0}
            max={300}
            step={5}
          />

          {/* ── Actions ── */}
          <View style={styles.roundActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onApplyAll} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>↗ Apply to all rounds</Text>
            </TouchableOpacity>
            {canRemove && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={onRemove}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnDangerText}>🗑 Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

function SummaryPill({ emoji, label }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <Text style={styles.summaryPillText}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 10 },

  // Top
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  appTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  totalChip: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.primary,
  },
  totalChipLabel: { color: COLORS.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
  totalChipValue: { color: COLORS.primary, fontSize: 14, fontWeight: '600', letterSpacing: -0.3 },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 22,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 4,
  },
  summaryEmoji: { fontSize: 12 },
  summaryPillText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },

  // Section heading
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionSub: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  hint: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: -6,
    marginBottom: 14,
    paddingHorizontal: 2,
    lineHeight: 16,
  },

  // Round card
  roundCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  roundBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBadgeNum: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  roundMeta: { flex: 1 },
  roundTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  roundSummary: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  chevron: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },

  // Expanded body
  roundBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  roundActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },

  // ── Workout name input ────────────────────────────────────────────────────
  nameInputWrap: {
    marginBottom: 12,
  },
  nameInputLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '400',
  },
  nameInputCount: {
    color: COLORS.textTertiary,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtnDanger: {
    borderColor: 'rgba(230,57,70,0.35)',
    backgroundColor: 'rgba(230,57,70,0.07)',
  },
  actionBtnDangerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },

  // Add round
  addRoundBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addRoundText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Ad
  adBanner: {
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adText: { color: COLORS.textTertiary, fontSize: 11, letterSpacing: 1 },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startBtnLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  startBtnSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.4,
  },
});