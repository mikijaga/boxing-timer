/**
 * theme.js — RoundMaster colour palette
 *
 * Source colours:
 *   #29305E  — deep navy        → background
 *   #476485  — steel blue       → surfaces, borders, secondary text
 *   #80E4E9  — electric cyan    → primary accent (buttons, highlights, rings)
 *   #5E6DC1  — periwinkle blue  → rest phase, secondary accent
 *   #FDF2AD  — warm cream       → primary text, warmup colour
 */

export const COLORS = {
  // ── Backgrounds ─────────────────────────────────────────────────────────────
  bg:          '#1C2247',   // darker navy — easier on eyes than pure #29305E
  surface:     '#29305E',   // card & tab bar backgrounds
  card:        '#323A6E',   // slightly lighter for elevated cards
  border:      '#3D4878',   // subtle borders
  borderLight: '#476485',   // more visible borders

  // ── Primary accent — electric cyan ──────────────────────────────────────────
  primary:     '#80E4E9',
  primaryDark: '#56C8CE',
  primaryDim:  'rgba(128,228,233,0.15)',

  // ── Text ────────────────────────────────────────────────────────────────────
  white:         '#FFFFFF',
  textPrimary:   '#FDF2AD',   // warm cream — readable on navy, unique feel
  textSecondary: '#A8BDD0',   // muted blue-grey
  textTertiary:  '#476485',   // steel blue — for hints and placeholders

  // ── Phase colours ───────────────────────────────────────────────────────────
  success:  '#80E4E9',         // cyan — session complete
  warning:  '#FDF2AD',         // warm cream — warmup
  rest:     '#5E6DC1',         // periwinkle — rest phase
  restDim:  'rgba(94,109,193,0.18)',

  // ── Extra palette refs ───────────────────────────────────────────────────────
  navy:      '#29305E',
  steel:     '#476485',
  cyan:      '#80E4E9',
  periwinkle:'#5E6DC1',
  cream:     '#FDF2AD',
};

export const FONTS = {
  thin:     '300',
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
};

export const INCREMENT_OPTIONS = [5, 10, 15, 20, 25, 30];
export const WARMUP_MAX        = 60;
export const MIN_ROUND_DURATION = 10;
export const MAX_ROUND_DURATION = 600;
export const MIN_REST_DURATION  = 5;
export const MAX_REST_DURATION  = 300;
export const MAX_CONTENT_WIDTH  = 600;