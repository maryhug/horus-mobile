import React, { useRef, useState, useEffect } from 'react';
import type { ComponentProps } from 'react';
import {
  View, Text, StyleSheet, useWindowDimensions, Animated,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../constants/fonts';
import { useAppTheme } from '../hooks/useAppTheme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// ── Palette ────────────────────────────────────────────────────────────────
export const RING_COLORS = {
  pink:   '#FAB2D3',
  yellow: '#FAD957',
  blue:   '#A5CCF4',
  green:  '#96C979',
};

/** Claves de icono válidas para métricas de salud */
export type MetricIcon = 'heart' | 'footprints' | 'flame' | 'activity';

const ICONS: Record<MetricIcon, IoniconsName> = {
  heart:      'heart-outline',
  footprints: 'footsteps-outline',
  flame:      'flame',
  activity:   'pulse-outline',
};

// ── Geometry helpers ───────────────────────────────────────────────────────
function polar(angleDeg: number, r: number, cx: number, cy: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(startDeg: number, endDeg: number, r: number, cx: number, cy: number) {
  const s     = polar(startDeg, r, cx, cy);
  const e     = polar(endDeg,   r, cx, cy);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

// ── Types ──────────────────────────────────────────────────────────────────
export type HealthMetric = {
  key:   string;
  label: string;
  value: string | number;
  unit:  string;
  icon:  MetricIcon;
  color: keyof typeof RING_COLORS;
};

// ── HealthRing ─────────────────────────────────────────────────────────────
export function HealthRing({
  metrics,
  score = '—',
  selectedKey,
  onSelectKey,
}: {
  metrics: HealthMetric[];
  score?: string;
  selectedKey?: string | null;
  onSelectKey?: (key: string | null) => void;
}) {
  const { PRIMARY, MUTED, isDark } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const size     = Math.min(screenWidth - 40 - 32, 280);
  const center   = size / 2;
  const radius   = size * 0.369;
  const base     = size * 0.112;
  const expanded = size * 0.148;

  const n        = metrics.length;
  const GAP_DEG  = 3;
  const segAngle = (360 - n * GAP_DEG) / n;

  const [strokeWidths, setStrokeWidths] = useState<number[]>(
    () => metrics.map(() => base)
  );
  useEffect(() => {
    setStrokeWidths(metrics.map((_, i) =>
      selectedKey === metrics[i].key ? expanded : base
    ));
  }, [base]);

  const animRef = useRef<Animated.Value>(new Animated.Value(0));

  const selectSegment = (idx: number) => {
    const key    = metrics[idx].key;
    const already = selectedKey === key;
    const next   = already ? null : key;
    onSelectKey?.(next);

    const anim = animRef.current;
    anim.stopAnimation();

    if (!already) {
      anim.setValue(0);
      const id = anim.addListener(({ value }) =>
        setStrokeWidths(metrics.map((_, i) =>
          i === idx ? base + (expanded - base) * value : base
        ))
      );
      Animated.spring(anim, { toValue: 1, useNativeDriver: false, tension: 200, friction: 18 })
        .start(() => anim.removeListener(id));
    } else {
      anim.setValue(1);
      const id = anim.addListener(({ value }) =>
        setStrokeWidths(metrics.map(() => base + (expanded - base) * value))
      );
      Animated.spring(anim, { toValue: 0, useNativeDriver: false, tension: 200, friction: 18 })
        .start(() => anim.removeListener(id));
    }
  };

  const handleTouch = (lx: number, ly: number) => {
    const dx   = lx - center;
    const dy   = ly - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inner = radius - expanded * 0.85;
    const outer = radius + expanded * 0.85;
    if (dist < inner || dist > outer) return;
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    const idx = metrics.findIndex((_, i) => {
      const start = i * (segAngle + GAP_DEG) + GAP_DEG / 2;
      const end   = start + segAngle;
      return angle >= start && angle <= end;
    });
    if (idx !== -1) selectSegment(idx);
  };

  // Track del anillo: sutil en ambos modos
  const trackColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      <View
        style={{ width: size, height: size, position: 'relative' }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={evt => handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY)}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <Circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={trackColor} strokeWidth={expanded}
          />
          {/* Segments */}
          {metrics.map((m, i) => {
            const start = i * (segAngle + GAP_DEG) + GAP_DEG / 2;
            const end   = start + segAngle;
            return (
              <Path
                key={m.key}
                d={arcPath(start, end, radius, center, center)}
                fill="none"
                stroke={RING_COLORS[m.color]}
                strokeWidth={strokeWidths[i] ?? base}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>

        {/* Icons en medio de cada segmento */}
        {metrics.map((m, i) => {
          const mid = i * (segAngle + GAP_DEG) + GAP_DEG / 2 + segAngle / 2;
          const pos = polar(mid, radius, center, center);
          const isSelected = selectedKey === m.key;
          return (
            <View
              key={m.key}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: pos.x - 14, top: pos.y - 14,
                width: 28, height: 28,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons
                name={ICONS[m.icon]}
                size={isSelected ? 24 : 20}
                color="#1A1512"
              />
            </View>
          );
        })}

        {/* Center score */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[{ fontFamily: FONT.displayBold, letterSpacing: -2, color: PRIMARY }, { fontSize: size * 0.2 }]}>
              {score}
            </Text>
            <Text style={{ fontSize: 11, color: MUTED, fontFamily: FONT.sansMedium, marginTop: 4 }}>
              tu puntaje de salud  ⓘ
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── MetricChips ────────────────────────────────────────────────────────────
export function MetricChips({ metrics, selectedKey }: { metrics: HealthMetric[]; selectedKey?: string | null }) {
  const { CARD, PRIMARY, MUTED } = useAppTheme();
  return (
    <View style={ch.grid}>
      {metrics.map(m => {
        const active = selectedKey === m.key;
        return (
          <View
            key={m.key}
            style={[
              ch.chip,
              { backgroundColor: CARD },
              active && { borderWidth: 1.5, borderColor: RING_COLORS[m.color] },
            ]}
          >
            <View style={[ch.iconBox, { backgroundColor: RING_COLORS[m.color] }]}>
              <Ionicons name={ICONS[m.icon]} size={16} color="#1A1512" />
            </View>
            <View style={ch.textCol}>
              <Text style={[ch.label, { color: MUTED }]} numberOfLines={1}>{m.label}</Text>
              <Text style={[ch.value, { color: PRIMARY }]}>
                {m.value}<Text style={[ch.unit, { color: MUTED }]}> {m.unit}</Text>
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const ch = StyleSheet.create({
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  chip: {
    flexBasis: '47%', flexGrow: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, padding: 12,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textCol: { flex: 1, minWidth: 0 },
  label:   { fontSize: 11, fontFamily: FONT.sansMedium },
  value:   { fontSize: 15, fontFamily: FONT.sansBold, lineHeight: 20 },
  unit:    { fontSize: 10, fontFamily: FONT.sansRegular },
});
