/**
 * HistoryScreen.js
 *
 * Shows all completed workout sessions stored on the device.
 * Each card shows a timestamp, total duration, round summary,
 * a "Repeat Session" button, and a delete button.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { loadHistory, deleteSession, clearHistory } from '../utils/HistoryManager';
import { formatDuration } from '../utils/format';
import { COLORS } from '../utils/theme';

// ─── Timestamp formatter ──────────────────────────────────────────────────────
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const dayNames  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monNames  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day   = dayNames[date.getDay()];
  const d     = date.getDate();
  const mon   = monNames[date.getMonth()];
  const year  = date.getFullYear();
  const hrs   = date.getHours();
  const mins  = String(date.getMinutes()).padStart(2, '0');
  const ampm  = hrs >= 12 ? 'PM' : 'AM';
  const hour  = hrs % 12 || 12;
  return `${day}, ${d} ${mon} ${year}  ·  ${hour}:${mins} ${ampm}`;
}

// ─── Elapsed seconds → human string e.g. "11m 20s" ──────────────────────────
function formatElapsedShort(secs) {
  secs = Math.round(secs);   // guard against floating point e.g. 45.382...
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Single session card ──────────────────────────────────────────────────────
function SessionCard({ session, onRepeat, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const allSame = session.roundConfigs.every(
    r => r.roundDuration === session.roundConfigs[0].roundDuration &&
         r.restDuration  === session.roundConfigs[0].restDuration
  );

  const summary = allSame
    ? `${session.totalRounds} round${session.totalRounds !== 1 ? 's' : ''} · ${formatDuration(session.roundConfigs[0].roundDuration)}/round · ${formatDuration(session.roundConfigs[0].restDuration)} rest`
    : `${session.totalRounds} round${session.totalRounds !== 1 ? 's' : ''} · Mixed durations`;

  return (
    <View style={styles.card}>

      {/* ── Timestamp row ── */}
      <View style={styles.cardHeader}>
        <Text style={styles.timestamp}>{formatTimestamp(session.completedAt)}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatChip emoji="⏱" label={formatElapsedShort(session.elapsedTotal)} />
        <StatChip emoji="🔄" label={`${session.totalRounds} rounds`} />
        {session.warmupDuration > 0 && (
          <StatChip emoji="🔥" label={`${formatDuration(session.warmupDuration)} warm-up`} />
        )}
      </View>

      {/* ── Round summary ── */}
      <Text style={styles.summaryText}>{summary}</Text>

      {/* ── Expandable round list ── */}
      {expanded && (
        <View style={styles.roundList}>
          {session.roundConfigs.map((r, i) => (
            <View key={i} style={styles.roundRow}>
              <View style={styles.roundBadge}>
                <Text style={styles.roundBadgeNum}>{i + 1}</Text>
              </View>
              <Text style={styles.roundRowText}>
                {r.name ? `${r.name}  ·  ` : ''}{formatDuration(r.roundDuration)}
                {r.restDuration > 0 ? `  ·  ${formatDuration(r.restDuration)} rest` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Toggle rounds ── */}
      {session.roundConfigs.length > 0 && (
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleBtnText}>
            {expanded ? '▲ Hide rounds' : '▼ Show rounds'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Repeat button ── */}
      <TouchableOpacity style={styles.repeatBtn} onPress={onRepeat} activeOpacity={0.85}>
        <Text style={styles.repeatBtnText}>▶  REPEAT SESSION</Text>
      </TouchableOpacity>

    </View>
  );
}

function StatChip({ emoji, label }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const insets = useSafeAreaInsets();

  // Reload history every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, [])
  );

  const handleDelete = (id) => {
    Alert.alert('Delete session?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          setHistory(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear all history?', 'Every saved session will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const handleRepeat = (session) => {
    navigation.navigate('Timer', {
      roundConfigs:   session.roundConfigs,
      warmupDuration: session.warmupDuration,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingRight: Math.max(insets.right + 18, 18) }]}>
        <Text style={styles.headerTitle}>🕐 History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content ── */}
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🥊</Text>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a session and it will appear here so you can repeat it anytime.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingRight: Math.max(insets.right + 16, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          {history.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onRepeat={() => handleRepeat(session)}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
          <Text style={styles.storageNote}>
            Sessions are saved on this device. Clearing app storage will remove them.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 18,
    paddingTop:     10,
    paddingBottom:  14,
  },
  headerTitle: {
    color:      COLORS.textPrimary,
    fontSize:   20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  clearAllText: {
    color:      COLORS.textTertiary,
    fontSize:   13,
    fontWeight: '500',
  },

  list: {
    padding:      16,
    paddingBottom: 32,
  },

  // Session card
  card: {
    backgroundColor: COLORS.card,
    borderRadius:    14,
    borderWidth:     0.5,
    borderColor:     COLORS.border,
    padding:         14,
    marginBottom:    12,
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   10,
  },
  timestamp: {
    color:      COLORS.textSecondary,
    fontSize:   12,
    fontWeight: '500',
    letterSpacing: 0.2,
    flex: 1,
  },
  deleteIcon: { fontSize: 16 },

  statsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
    marginBottom:  10,
  },
  statChip: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.surface,
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical:  4,
    borderWidth:     0.5,
    borderColor:     COLORS.border,
    gap:             4,
  },
  statEmoji: { fontSize: 11 },
  statLabel: {
    color:      COLORS.textSecondary,
    fontSize:   11,
    fontWeight: '500',
  },

  summaryText: {
    color:        COLORS.textTertiary,
    fontSize:     12,
    marginBottom: 10,
    lineHeight:   17,
  },

  // Round list (expanded)
  roundList: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop:     10,
    marginBottom:   8,
    gap:            8,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  roundBadge: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: COLORS.surface,
    borderWidth:     1,
    borderColor:     COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  roundBadgeNum: {
    color:      COLORS.primary,
    fontSize:   11,
    fontWeight: '700',
  },
  roundRowText: {
    color:      COLORS.textSecondary,
    fontSize:   12,
    flex:       1,
  },

  // Toggle
  toggleBtn: {
    alignSelf:    'flex-start',
    marginBottom: 10,
  },
  toggleBtnText: {
    color:      COLORS.textTertiary,
    fontSize:   11,
    fontWeight: '500',
  },

  // Repeat button
  repeatBtn: {
    backgroundColor: COLORS.primary,
    borderRadius:    12,
    paddingVertical: 11,
    alignItems:      'center',
  },
  repeatBtnText: {
    color:         '#28305E',
    fontSize:      13,
    fontWeight:    '700',
    letterSpacing: 1.5,
  },

  // Empty state
  emptyState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom:  60,
  },
  emptyEmoji:    { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    color:        COLORS.textPrimary,
    fontSize:     18,
    fontWeight:   '600',
    marginBottom: 10,
  },
  emptySubtitle: {
    color:      COLORS.textTertiary,
    fontSize:   13,
    textAlign:  'center',
    lineHeight: 20,
  },

  storageNote: {
    color:      COLORS.textTertiary,
    fontSize:   10,
    textAlign:  'center',
    marginTop:  8,
    lineHeight: 16,
  },
});